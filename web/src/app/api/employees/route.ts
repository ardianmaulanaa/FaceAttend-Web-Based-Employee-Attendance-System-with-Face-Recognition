import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const employees = await prisma.user.findMany({
      where: {
        role: "employee",
      },
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        status: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Gagal mengambil data karyawan" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      temporaryPassword,
      department,
      position,
      phone,
      status,
    } = body;

    if (!name || !email || !temporaryPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama, email, dan temporary password wajib diisi",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    const password_hash = await hashPassword(temporaryPassword);

    const employee = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role: "employee",
        department: department || null,
        position: position || null,
        phone: phone || null,
        status: status || "active",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        status: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Karyawan berhasil ditambahkan",
        data: employee,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Gagal menambahkan karyawan" },
      { status: 500 }
    );
  }
}