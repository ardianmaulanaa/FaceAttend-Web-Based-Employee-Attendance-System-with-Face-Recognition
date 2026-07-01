import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getUserIdFromRequest(req: NextRequest) {
  const token = req.cookies.get("faceattend_token")?.value;

  if (!token) {
    throw new Error("Token login tidak ditemukan. Silakan login ulang.");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET belum ada di file .env");
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);

  const userId =
    (payload.id as string | undefined) ||
    (payload.userId as string | undefined) ||
    (payload.sub as string | undefined);

  if (!userId) {
    throw new Error("User ID tidak ditemukan di token login.");
  }

  return userId;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User tidak ditemukan. Silakan login ulang." },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const photo = formData.get("photo") as File | null;
    const latitude = formData.get("latitude") as string | null;
    const longitude = formData.get("longitude") as string | null;

    if (!photo) {
      return NextResponse.json(
        { message: "Foto check-in wajib ada." },
        { status: 400 }
      );
    }

    if (!latitude || !longitude) {
      return NextResponse.json(
        { message: "Lokasi GPS wajib diaktifkan." },
        { status: 400 }
      );
    }

    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        status: "CHECKED_IN",
        checkOutTime: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (activeAttendance) {
      return NextResponse.json(
        { message: "Kamu sudah check-in dan belum check-out." },
        { status: 400 }
      );
    }

    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "attendance"
    );

    await mkdir(uploadDir, { recursive: true });

    const filename = `checkin-${userId}-${randomUUID()}.jpg`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const photoPath = `/uploads/attendance/${filename}`;

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        checkInTime: new Date(),
        checkInPhoto: photoPath,
        checkInLatitude: Number(latitude),
        checkInLongitude: Number(longitude),
        status: "CHECKED_IN",
      },
    });

    return NextResponse.json({
      message: "Check-in berhasil.",
      attendance,
    });
  } catch (error) {
    console.error("CHECK_IN_ERROR:", error);

    return NextResponse.json(
      {
        message: "Terjadi kesalahan saat check-in.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}