import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password minimal 8 karakter.",
        },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("faceattend_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Session tidak ditemukan. Silakan login ulang.",
        },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    const existingUser = await prisma.user.findUnique({
      where: {
        id: payload.id,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    if (existingUser.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Akun kamu sedang tidak aktif.",
        },
        { status: 403 }
      );
    }

    const password_hash = await hashPassword(newPassword);

    const user = await prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        password_hash,
        must_change_password: false,
      },
      select: {
        role: true,
      },
    });

    const redirectTo = user.role === "admin" ? "/admin/dashboard" : "/home";

    return NextResponse.json({
      success: true,
      message: "Password berhasil diganti.",
      redirectTo,
    });
  } catch (error) {
    console.error("CHANGE_PASSWORD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server saat mengganti password.",
      },
      { status: 500 }
    );
  }
}