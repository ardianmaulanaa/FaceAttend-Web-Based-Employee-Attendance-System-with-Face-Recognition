import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET belum diatur di .env");
  }

  return new TextEncoder().encode(secret);
}

async function getTokenFromCookie() {
  const cookieStore = await cookies();

  return (
    cookieStore.get("token")?.value ||
    cookieStore.get("auth_token")?.value ||
    cookieStore.get("authToken")?.value ||
    cookieStore.get("faceattend_token")?.value ||
    ""
  );
}

async function getUserIdFromToken() {
  const token = await getTokenFromCookie();

  if (!token) {
    return null;
  }

  const { payload } = await jwtVerify(token, getJwtSecret());

  const userId =
    payload.id ||
    payload.userId ||
    payload.user_id ||
    payload.sub ||
    null;

  if (!userId) {
    return null;
  }

  return String(userId);
}

function serializeOffice(
  office:
    | {
        id: string;
        name: string;
        address: string | null;
        latitude: unknown;
        longitude: unknown;
        radius_meters: number;
      }
    | null
    | undefined
) {
  if (!office) return null;

  return {
    id: office.id,
    name: office.name,
    address: office.address,
    latitude: Number(office.latitude),
    longitude: Number(office.longitude),
    radius_meters: Number(office.radius_meters),
  };
}

export async function GET() {
  try {
    const userId = await getUserIdFromToken();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          error: "Token tidak ditemukan atau tidak valid.",
        },
        {
          status: 401,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        employee_code: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
        profile_photo: true,

        unit: {
          select: {
            id: true,
            name: true,
          },
        },

        department: {
          select: {
            id: true,
            name: true,
          },
        },

        position: {
          select: {
            id: true,
            name: true,
          },
        },

        shift: {
          select: {
            id: true,
            name: true,
            tolerance_minutes: true,
            work_schedules: {
              select: {
                day_of_week: true,
                is_work_day: true,
                check_in_time: true,
                check_out_time: true,
              },
            },
          },
        },

        registered_office: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            radius_meters: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User tidak ditemukan.",
          error: "User tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        employee_code: user.employee_code,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
        profile_photo: user.profile_photo,

        unit: user.unit,
        department: user.department,
        position: user.position,
        shift: user.shift,

        registered_office: serializeOffice(user.registered_office),
      },
    });
  } catch (error) {
    console.error("AUTH_ME_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data user.",
        error: "Gagal mengambil data user.",
      },
      {
        status: 500,
      }
    );
  }
}