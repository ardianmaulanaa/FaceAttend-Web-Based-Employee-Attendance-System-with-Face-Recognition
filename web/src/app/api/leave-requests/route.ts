import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getLeaveTypeLabel(type: string | null | undefined) {
  const normalized = String(type || "").toLowerCase();

  if (normalized === "annual") return "Cuti Tahunan";
  if (normalized === "permission") return "Izin";
  if (normalized === "sick") return "Sakit";
  if (normalized === "other") return "Lainnya";

  return type || "Cuti";
}

function getStatusLabel(status: string | null | undefined) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "approved") return "Disetujui";
  if (normalized === "rejected") return "Ditolak";
  if (normalized === "pending") return "Menunggu";

  return status || "Menunggu";
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function normalizeStatus(value: unknown) {
  const status = String(value || "").trim().toLowerCase();

  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "pending") return "pending";

  return "";
}

export async function GET() {
  try {
    const requests = await prisma.leaveRequest.findMany({
      select: {
        id: true,
        leave_type: true,
        start_date: true,
        end_date: true,
        total_days: true,
        reason: true,
        status: true,
        admin_note: true,
        created_at: true,
        user: {
          select: {
            id: true,
            employee_code: true,
            name: true,
            department: {
              select: {
                name: true,
              },
            },
            position: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      requests: requests.map((item) => ({
        id: item.id,
        employeeName: item.user?.name || "-",
        employeeCode: item.user?.employee_code || null,
        employeePosition: item.user?.position?.name || null,
        employeeDepartment: item.user?.department?.name || null,
        leaveType: item.leave_type,
        leaveTypeLabel: getLeaveTypeLabel(item.leave_type),
        startDate: formatDate(item.start_date),
        endDate: formatDate(item.end_date),
        startDateRaw: toIsoDate(item.start_date),
        endDateRaw: toIsoDate(item.end_date),
        totalDays: Number(item.total_days || 0),
        reason: item.reason,
        status: item.status,
        statusLabel: getStatusLabel(item.status),
        adminNote: item.admin_note || null,
        createdAt: toIsoDate(item.created_at),
      })),
    });
  } catch (error) {
    console.error("GET_ADMIN_LEAVE_REQUESTS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil laporan cuti.",
        requests: [],
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    const id = String(body.id || "").trim();
    const status = normalizeStatus(body.status);
    const adminNote = String(body.adminNote || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID pengajuan cuti wajib dikirim.",
        },
        {
          status: 400,
        }
      );
    }

    if (!status || status === "pending") {
      return NextResponse.json(
        {
          success: false,
          message: "Status hanya boleh approved atau rejected.",
        },
        {
          status: 400,
        }
      );
    }

    const existingRequest = await prisma.leaveRequest.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Pengajuan cuti tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    const updatedRequest = await prisma.leaveRequest.update({
      where: {
        id,
      },
      data: {
        status,
        admin_note:
          adminNote ||
          (status === "approved"
            ? "Pengajuan cuti disetujui oleh admin."
            : "Pengajuan cuti ditolak oleh admin."),
      },
      select: {
        id: true,
        status: true,
        admin_note: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Status pengajuan cuti berhasil diperbarui.",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("PATCH_ADMIN_LEAVE_REQUESTS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal memperbarui status pengajuan cuti.",
      },
      {
        status: 500,
      }
    );
  }
}