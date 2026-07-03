import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [],
    units: [],
    departments: [],
    positions: [],
    shifts: [],
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  return NextResponse.json({
    success: true,
    message: "Employee endpoint is in simplified mode.",
    payload: body,
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  return NextResponse.json({
    success: true,
    message: "Employee update endpoint is in simplified mode.",
    payload: body,
  });
}

export async function DELETE() {
  return NextResponse.json({
    success: true,
    message: "Employee delete endpoint is in simplified mode.",
  });
}
