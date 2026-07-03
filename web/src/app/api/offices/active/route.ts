import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const db = prisma as any;

export async function GET() {
  try {
    const offices = await db.officeLocation.findMany({
      where: {
        status: "active",
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        radius_meters: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      offices,
    });
  } catch (error) {
    console.error("GET_ACTIVE_OFFICES_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data kantor.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
