import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const offices = await prisma.officeLocation.findMany({
      where: {
        status: "active",
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
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      offices: offices.map((office) => ({
        id: office.id,
        name: office.name,
        address: office.address,
        latitude: Number(office.latitude),
        longitude: Number(office.longitude),
        radius_meters: Number(office.radius_meters),
        status: office.status,
      })),
    });
  } catch (error) {
    console.error("GET_OFFICE_LOCATIONS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data kantor.",
      },
      {
        status: 500,
      }
    );
  }
}