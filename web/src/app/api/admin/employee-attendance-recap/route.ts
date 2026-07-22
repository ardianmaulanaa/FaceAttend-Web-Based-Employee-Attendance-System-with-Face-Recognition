import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/api-auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type LeaveType = "annual" | "permission" | "sick" | "other";

type WorkDayName =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

const workDayByUtcDay: WorkDayName[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function parseDateParam(value: string, label: string) {
  const dateText = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    throw new Error(`${label} tidak valid.`);
  }

  const date = new Date(`${dateText}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} tidak valid.`);
  }

  return date;
}

function parseOptionalDateParam(value: string | null, label: string) {
  const dateText = String(value || "").trim();

  if (!dateText) return null;

  return parseDateParam(dateText, label);
}

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getDefaultMonthStartDate() {
  const date = new Date();

  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(1);

  return date;
}

function getDefaultTodayDate() {
  const date = new Date();

  date.setUTCHours(0, 0, 0, 0);

  return date;
}

function minDate(first: Date, second: Date) {
  return first.getTime() <= second.getTime() ? first : second;
}

function clampDate(value: Date, min: Date, max: Date) {
  if (value.getTime() < min.getTime()) return min;
  if (value.getTime() > max.getTime()) return max;

  return value;
}

function eachDateKey(startDate: Date, endDate: Date) {
  const dates: string[] = [];
  const current = new Date(startDate);

  while (current.getTime() <= endDate.getTime()) {
    dates.push(toDateKey(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function getWorkDayKeys(
  startDate: Date,
  endDate: Date,
  workSchedules?: { day_of_week: string; is_work_day: boolean }[],
) {
  const configuredWorkDays = new Set(
    (workSchedules || [])
      .filter((schedule) => schedule.is_work_day)
      .map((schedule) => schedule.day_of_week),
  );
  const hasSchedule = (workSchedules || []).length > 0;
  const workDayKeys = new Set<string>();
  const current = new Date(startDate);

  while (current.getTime() <= endDate.getTime()) {
    const dayName = workDayByUtcDay[current.getUTCDay()];

    if (!hasSchedule || configuredWorkDays.has(dayName)) {
      workDayKeys.add(toDateKey(current));
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return workDayKeys;
}

function createEmptySummary() {
  return {
    totalHariKerja: 0,
    totalPresensi: 0,
    hadir: 0,
    terlambat: 0,
    menunggu: 0,
    izin: 0,
    sakit: 0,
    cuti: 0,
    lainnya: 0,
    gajiPokok: 0,
    potonganPerHari: 0,
    estimasiPotonganTidakMasuk: 0,
    estimasiSalary: 0,
  };
}

function normalizeLeaveType(type: string): LeaveType {
  const normalized = type.toLowerCase();

  if (normalized === "permission") return "permission";
  if (normalized === "sick") return "sick";
  if (normalized === "annual" || normalized === "annual_leave") {
    return "annual";
  }

  return "other";
}

export async function GET(req: NextRequest) {
  try {
    await requireOwner(req);

    const { searchParams } = new URL(req.url);
    const employeeId = String(searchParams.get("employeeId") || "").trim();
    const requestedStartDate = parseOptionalDateParam(
      searchParams.get("startDate"),
      "Tanggal mulai",
    );
    const requestedEndDate = parseOptionalDateParam(
      searchParams.get("endDate"),
      "Tanggal akhir",
    );

    const employees = await prisma.user.findMany({
      where: {
        role: "employee",
        ...(employeeId ? { id: employeeId } : {}),
      },
      select: {
        id: true,
        name: true,
        employee_code: true,
        employment_start_date: true,
        employment_end_date: true,
        base_salary: true,
        employment_status: true,
        status: true,
        shift: {
          select: {
            name: true,
            work_schedules: {
              select: {
                day_of_week: true,
                is_work_day: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    if (employeeId && employees.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Karyawan tidak ditemukan.",
          employees: [],
        },
        { status: 404 },
      );
    }

    const selectedEmployee = employeeId ? employees[0] : null;
    const todayDate = getDefaultTodayDate();
    const defaultStartDate =
      selectedEmployee?.employment_start_date || getDefaultMonthStartDate();
    const defaultEndDate = selectedEmployee?.employment_end_date
      ? minDate(selectedEmployee.employment_end_date, todayDate)
      : todayDate;
    const startDate = requestedStartDate || defaultStartDate;
    const endDate = requestedEndDate || defaultEndDate;

    if (startDate.getTime() > endDate.getTime()) {
      throw new Error("Tanggal mulai tidak boleh melewati tanggal akhir.");
    }

    const employeeSummaries = new Map(
      employees.map((employee) => {
        const summary = createEmptySummary();
        const workDayKeys = getWorkDayKeys(
          startDate,
          endDate,
          employee.shift?.work_schedules,
        );

        summary.totalHariKerja = workDayKeys.size;

        return [employee.id, summary];
      }),
    );
    const employeeWorkDayKeys = new Map(
      employees.map((employee) => [
        employee.id,
        getWorkDayKeys(startDate, endDate, employee.shift?.work_schedules),
      ]),
    );
    const attendances = await prisma.attendance.findMany({
      where: {
        attendance_date: {
          gte: startDate,
          lte: endDate,
        },
        user: {
          role: "employee",
          ...(employeeId ? { id: employeeId } : {}),
        },
      },
      select: {
        user_id: true,
        attendance_date: true,
        status: true,
        check_in_status: true,
        late_minutes: true,
        check_in_time: true,
      },
    });

    for (const attendance of attendances) {
      const summary = employeeSummaries.get(attendance.user_id);

      if (!summary) continue;

      summary.totalPresensi += 1;

      const hasCheckedIn =
        Boolean(attendance.check_in_time) ||
        attendance.status === "PRESENT" ||
        attendance.status === "LATE" ||
        attendance.check_in_status === "LATE";
      if (
        attendance.check_in_status === "LATE" ||
        Number(attendance.late_minutes || 0) > 0 ||
        attendance.status === "LATE"
      ) {
        summary.terlambat += Number(attendance.late_minutes || 0);
      }

      if (hasCheckedIn) {
        summary.hadir += 1;
      } else {
        summary.menunggu += 1;
      }
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        status: "approved",
        start_date: {
          lte: endDate,
        },
        end_date: {
          gte: startDate,
        },
        user: {
          role: "employee",
          ...(employeeId ? { id: employeeId } : {}),
        },
      },
      select: {
        user_id: true,
        leave_type: true,
        start_date: true,
        end_date: true,
      },
    });

    for (const leaveRequest of leaveRequests) {
      const summary = employeeSummaries.get(leaveRequest.user_id);

      if (!summary) continue;

      const overlapStart = clampDate(leaveRequest.start_date, startDate, endDate);
      const overlapEnd = clampDate(leaveRequest.end_date, startDate, endDate);
      const leaveType = normalizeLeaveType(leaveRequest.leave_type);
      const workDayKeys =
        employeeWorkDayKeys.get(leaveRequest.user_id) || new Set();
      const leaveDateKeys = eachDateKey(overlapStart, overlapEnd).filter(
        (dateKey) => workDayKeys.has(dateKey),
      );
      const days = leaveDateKeys.length;

      if (leaveType === "permission") {
        summary.izin += days;
      } else if (leaveType === "sick") {
        summary.sakit += days;
      } else if (leaveType === "annual") {
        summary.cuti += days;
      } else {
        summary.lainnya += days;
      }
    }

    for (const employee of employees) {
      const summary = employeeSummaries.get(employee.id);

      if (!summary) continue;

      const baseSalary = Number(employee.base_salary || 0);
      const deductionPerDay =
        summary.totalHariKerja > 0 ? baseSalary / summary.totalHariKerja : 0;
      const deduction = deductionPerDay * (summary.cuti + summary.sakit);

      summary.gajiPokok = baseSalary;
      summary.potonganPerHari = Math.round(deductionPerDay);
      summary.estimasiPotonganTidakMasuk = Math.round(deduction);
      summary.estimasiSalary = Math.max(Math.round(baseSalary - deduction), 0);
    }

    return NextResponse.json({
      success: true,
      startDate: toDateKey(startDate),
      endDate: toDateKey(endDate),
      employees: employees.map((employee) => ({
        id: employee.id,
        name: employee.name,
        employeeCode: employee.employee_code,
        employmentStartDate: employee.employment_start_date,
        employmentEndDate: employee.employment_end_date,
        employmentStatus: employee.employment_status,
        status: employee.status,
        shiftName: employee.shift?.name || null,
        summary: employeeSummaries.get(employee.id) || createEmptySummary(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: getApiErrorMessage(
          error,
          "Gagal mengambil rekap kehadiran karyawan.",
        ),
        employees: [],
      },
      {
        status: getApiErrorStatus(error),
      },
    );
  }
}
