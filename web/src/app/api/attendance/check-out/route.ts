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
    return null;
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  const { payload } = await jwtVerify(token, secret);

  return (
    (payload.id as string) ||
    (payload.userId as string) ||
    (payload.sub as string) ||
    null
  );
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const photo = formData.get("photo") as File | null;
    const latitude = formData.get("latitude") as string | null;
    const longitude = formData.get("longitude") as string | null;

    if (!photo) {
      return NextResponse.json(
        { message: "Foto check-out wajib diunggah" },
        { status: 400 }
      );
    }

    if (!latitude || !longitude) {
      return NextResponse.json(
        { message: "Lokasi GPS wajib diaktifkan" },
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
        checkInTime: "desc",
      },
    });

    if (!activeAttendance) {
      return NextResponse.json(
        { message: "Kamu belum check-in atau sudah check-out" },
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

    const ext = photo.name.split(".").pop() || "jpg";
    const filename = `checkout-${userId}-${randomUUID()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const photoPath = `/uploads/attendance/${filename}`;

    const attendance = await prisma.attendance.update({
      where: {
        id: activeAttendance.id,
      },
      data: {
        checkOutTime: new Date(),
        checkOutPhoto: photoPath,
        checkOutLatitude: Number(latitude),
        checkOutLongitude: Number(longitude),
        status: "CHECKED_OUT",
      },
    });

    return NextResponse.json({
      message: "Check-out berhasil",
      attendance,
    });
  } catch (error) {
    console.error("CHECK_OUT_ERROR", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan saat check-out" },
      { status: 500 }
    );
  }
}