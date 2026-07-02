import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import {
  isDatabaseUnavailable,
  setDemoAttendanceLateReason,
} from "@/lib/demoStore";

export async function POST(req: Request) {
  let reason = "";

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("faceattend_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Belum login" },
        { status: 401 },
      );
    }

    const payload = await verifyToken(token);

    if (payload.role !== "employee") {
      return NextResponse.json(
        {
          success: false,
          message: "Hanya karyawan yang dapat mengirim alasan telat",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    reason = String(body.reason || "").trim();

    if (!reason) {
      return NextResponse.json(
        { success: false, message: "Alasan keterlambatan wajib diisi" },
        { status: 400 },
      );
    }

    const todayDate = new Date(new Date().toISOString().slice(0, 10));

    const target = await prisma.attendance.findUnique({
      where: {
        employee_id_attendance_date: {
          employee_id: payload.id,
          attendance_date: todayDate,
        },
      },
      select: {
        id: true,
        check_in_time: true,
        late_minutes: true,
        status: true,
        notes: true,
      },
    });

    if (!target?.check_in_time) {
      return NextResponse.json(
        { success: false, message: "Belum ada data check-in hari ini" },
        { status: 400 },
      );
    }

    const isLate =
      Number(target.late_minutes || 0) > 0 ||
      String(target.status || "").toLowerCase() === "late";

    if (!isLate) {
      return NextResponse.json(
        { success: false, message: "Hari ini tidak tercatat terlambat" },
        { status: 400 },
      );
    }

    const baseNotes = String(target.notes || "")
      .split(" | ")
      .filter((part) => !part.startsWith("late_reason="));

    baseNotes.push(`late_reason=${reason.slice(0, 180)}`);

    await prisma.attendance.update({
      where: { id: target.id },
      data: {
        notes: baseNotes.join(" | ").slice(0, 255),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Alasan telat tersimpan. Aturan: kantor dulu baru kunjungan, jam kerja tetap mengikuti jam karyawan.",
    });
  } catch (error) {
    console.error(error);

    if (isDatabaseUnavailable(error)) {
      const cookieStore = await cookies();
      const token = cookieStore.get("faceattend_token")?.value;

      if (!token) {
        return NextResponse.json(
          { success: false, message: "Belum login" },
          { status: 401 },
        );
      }

      const payload = await verifyToken(token);
      const demoResult = setDemoAttendanceLateReason({
        employeeId: payload.id,
        reason,
      });

      if (!demoResult.ok) {
        return NextResponse.json(
          {
            success: false,
            message: "Gagal menyimpan alasan telat (demo mode)",
          },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "Alasan telat tersimpan (demo mode). Aturan: kantor dulu baru kunjungan, jam kerja tetap mengikuti jam karyawan.",
      });
    }

    return NextResponse.json(
      { success: false, message: "Gagal menyimpan alasan telat" },
      { status: 500 },
    );
  }
}
