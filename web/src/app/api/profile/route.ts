import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getCurrentUserId(req: NextRequest) {
  const token =
    req.cookies.get("faceattend_token")?.value ||
    req.cookies.get("token")?.value ||
    req.cookies.get("auth_token")?.value ||
    req.cookies.get("authToken")?.value ||
    "";

  if (!token) {
    throw new Error("Token login tidak ditemukan.");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET belum ada di file .env.");
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);

  const userId =
    (payload.id as string | undefined) ||
    (payload.userId as string | undefined) ||
    (payload.user_id as string | undefined) ||
    (payload.sub as string | undefined);

  if (!userId) {
    throw new Error("User ID tidak ditemukan di token.");
  }

  return userId;
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    const body = await req.json();

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama lengkap wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama lengkap minimal 2 karakter.",
        },
        {
          status: 400,
        }
      );
    }

    if (phone && phone.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Nomor telepon minimal 8 karakter.",
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Akun tidak aktif.",
        },
        {
          status: 403,
        }
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
        phone: phone || null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profil berhasil diperbarui.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PATCH /api/profile error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui profil.",
      },
      {
        status: 500,
      }
    );
  }
}