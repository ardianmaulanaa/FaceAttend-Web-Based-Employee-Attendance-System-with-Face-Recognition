import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type AllowedRole = "owner" | "admin" | "cs" | "employee";
const VIEW_ROLES: AllowedRole[] = ["owner", "admin", "cs", "employee"];

async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get("faceattend_token")?.value;
  if (!token) throw new Error("Token login tidak ditemukan.");

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET belum ada di file .env");
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);
  const userId =
    (payload.id as string | undefined) ||
    (payload.userId as string | undefined) ||
    (payload.sub as string | undefined);

  if (!userId) throw new Error("User ID tidak ditemukan di token.");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true, name: true },
  });

  if (!user) throw new Error("User tidak ditemukan.");
  return user;
}

function canAccess(role: string, roles: AllowedRole[]) {
  return roles.includes(role.toLowerCase() as AllowedRole);
}

// In-memory reward store (persists across requests during dev server lifetime)
type ManualReward = {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  points: number;
  note: string;
  givenBy: string;
  createdAt: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __rewardStore: ManualReward[] | undefined;
}

function getRewardStore(): ManualReward[] {
  if (!globalThis.__rewardStore) {
    globalThis.__rewardStore = [];
  }
  return globalThis.__rewardStore;
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (
      currentUser.status !== "active" ||
      !canAccess(currentUser.role, VIEW_ROLES)
    ) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak." },
        { status: 403 }
      );
    }

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Fetch employees, summaries, departments, attendances, and visits
    const [employees, summaries, departments, attendances, visits] = await Promise.all([
      prisma.user.findMany({
        where: { role: "employee" },
        select: {
          id: true,
          name: true,
          email: true,
          employee_code: true,
          profile_photo: true,
          department_id: true,
          position_id: true,
          status: true,
        },
      }),
      prisma.attendanceMonthlySummary.findMany({
        where: {
          period_month: currentMonth,
          period_year: currentYear,
        },
      }),
      prisma.department.findMany({
        select: { id: true, name: true },
      }),
      prisma.attendance.findMany({
        where: {
          attendance_date: {
            gte: firstDayOfMonth,
          },
        },
        select: {
          id: true,
          user_id: true,
          attendance_date: true,
          check_in_status: true,
          status: true,
          late_minutes: true,
          is_visit: true,
        },
      }),
      prisma.employeeVisit.findMany({
        where: {
          visit_date: {
            gte: firstDayOfMonth,
          },
        },
        select: {
          id: true,
          user_id: true,
          visit_date: true,
          title: true,
        },
      }),
    ]);

    // 2. Calculate reward points for each employee based on attendance
    const POINTS_PER_ONTIME = 10;
    const POINTS_PER_VISIT = 15;
    const POINTS_PER_LATE = -5;

    const leaderboard = employees
      .filter((emp) => emp.status === "active")
      .map((emp) => {
        const summary = summaries.find((s) => s.user_id === emp.id);
        const presentDays = summary?.total_present_days || 0;
        const lateDays = summary?.total_late_days || 0;
        const visitDays = summary?.total_visit_days || 0;
        const ontimeDays = presentDays - lateDays;

        const attendancePoints = ontimeDays * POINTS_PER_ONTIME;
        const visitPoints = visitDays * POINTS_PER_VISIT;
        const latePenalty = lateDays * Math.abs(POINTS_PER_LATE);

        // Manual reward points
        const manualRewards = getRewardStore().filter(
          (r) => r.employeeId === emp.id
        );
        const manualPoints = manualRewards.reduce((s, r) => s + r.points, 0);

        const totalPoints =
          attendancePoints + visitPoints - latePenalty + manualPoints;

        const dept = departments.find((d) => d.id === emp.department_id);

        // Compile history logs
        const historyLogs: {
          id: string;
          title: string;
          amount: number;
          message: string;
          createdAt: string;
        }[] = [];

        const empAttendances = attendances.filter((a) => a.user_id === emp.id);
        const empVisits = visits.filter((v) => v.user_id === emp.id);

        empAttendances.forEach((att) => {
          const dateStr = att.attendance_date.toISOString().slice(0, 10);
          const formattedDate = new Date(att.attendance_date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          if (att.check_in_status === "LATE" || att.status === "LATE" || att.late_minutes > 0) {
            historyLogs.push({
              id: `LATE-${att.id}`,
              title: "Keterlambatan Presensi",
              amount: POINTS_PER_LATE,
              message: `Pengurangan poin terlambat presensi pada ${formattedDate} (${att.late_minutes} menit)`,
              createdAt: dateStr + "T09:00:00.000Z",
            });
          } else if (att.status === "PRESENT" || att.check_in_status === "ON_TIME") {
            historyLogs.push({
              id: `ONTIME-${att.id}`,
              title: "Presensi Tepat Waktu",
              amount: POINTS_PER_ONTIME,
              message: `Reward poin karena hadir tepat waktu pada ${formattedDate}`,
              createdAt: dateStr + "T09:00:00.000Z",
            });
          }
        });

        empVisits.forEach((v) => {
          const dateStr = v.visit_date.toISOString().slice(0, 10);
          const formattedDate = new Date(v.visit_date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          historyLogs.push({
            id: `VISIT-${v.id}`,
            title: "Bonus Kunjungan Klien",
            amount: POINTS_PER_VISIT,
            message: `Reward poin kunjungan klien: ${v.title} pada ${formattedDate}`,
            createdAt: dateStr + "T10:00:00.000Z",
          });
        });

        manualRewards.forEach((r) => {
          historyLogs.push({
            id: r.id,
            title: r.title,
            amount: r.points,
            message: r.note || "Bonus dari admin",
            createdAt: r.createdAt,
          });
        });

        historyLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        return {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          code: emp.employee_code || emp.id.slice(0, 8).toUpperCase(),
          profilePhoto: emp.profile_photo,
          department: dept?.name || "Lainnya",
          totalPoints: Math.max(0, totalPoints),
          breakdown: {
            presentDays,
            lateDays,
            ontimeDays: Math.max(0, ontimeDays),
            visitDays,
            attendancePoints: Math.max(0, attendancePoints),
            visitPoints,
            latePenalty,
            manualPoints,
          },
          manualRewards,
          historyLogs,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);

    // 3. Employee of the Month candidate
    const eomCandidate = leaderboard.length > 0 ? leaderboard[0] : null;

    // 4. Reward recommendations (100% on-time, >= 10 days present)
    const rewardRecommendations = leaderboard
      .filter(
        (emp) =>
          emp.breakdown.lateDays === 0 && emp.breakdown.presentDays >= 10
      )
      .slice(0, 10);

    // 5. Summary stats
    const totalActiveEmployees = leaderboard.length;
    const totalPointsGiven = leaderboard.reduce(
      (s, e) => s + e.totalPoints,
      0
    );
    const avgPoints =
      totalActiveEmployees > 0
        ? Math.round(totalPointsGiven / totalActiveEmployees)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        period: {
          month: currentMonth,
          year: currentYear,
        },
        leaderboard: leaderboard.map((emp, idx) => ({
          ...emp,
          rank: idx + 1,
          isEOM: idx === 0 && emp.totalPoints > 0,
        })),
        eomCandidate: eomCandidate
          ? {
              id: eomCandidate.id,
              name: eomCandidate.name,
              department: eomCandidate.department,
              totalPoints: eomCandidate.totalPoints,
            }
          : null,
        rewardRecommendations,
        stats: {
          totalActiveEmployees,
          totalPointsGiven,
          avgPoints,
          totalManualRewards: getRewardStore().length,
        },
        pointRules: {
          ontime: POINTS_PER_ONTIME,
          visit: POINTS_PER_VISIT,
          late: POINTS_PER_LATE,
        },
      },
    });
  } catch (error) {
    console.error("GET_ADMIN_REWARDS_ERROR:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Token login tidak ditemukan")) {
      return NextResponse.json(
        { success: false, message: "Sesi Anda telah berakhir. Silakan login kembali." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memuat data reward." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (
      currentUser.status !== "active" ||
      !canAccess(currentUser.role, ["owner", "admin"])
    ) {
      return NextResponse.json(
        { success: false, message: "Hanya admin yang dapat memberikan reward." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const employeeId = String(body.employeeId || "").trim();
    const title = String(body.title || "").trim();
    const points = Number(body.points);
    const note = String(body.note || "").trim();

    if (!employeeId || !title || !Number.isFinite(points) || points <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee, judul, dan poin wajib diisi.",
        },
        { status: 400 }
      );
    }

    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true, role: true },
    });

    if (!employee || employee.role !== "employee") {
      return NextResponse.json(
        { success: false, message: "Karyawan tidak ditemukan." },
        { status: 404 }
      );
    }

    const reward: ManualReward = {
      id: `RWD-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      employeeId: employee.id,
      employeeName: employee.name,
      title,
      points,
      note,
      givenBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    getRewardStore().unshift(reward);

    // Create a database notification for the employee
    await prisma.adminNotification.create({
      data: {
        user_id: employee.id,
        type: "reward",
        title: "Reward Poin Baru",
        message: `Anda menerima reward "${title}" senilai +${points} poin dari admin ${currentUser.name}.`,
      },
    }).catch((err) => {
      console.error("Gagal membuat notifikasi reward:", err);
    });

    return NextResponse.json(
      {
        success: true,
        message: `Reward "${title}" (+${points} poin) berhasil diberikan kepada ${employee.name}.`,
        reward,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST_ADMIN_REWARDS_ERROR:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Token login tidak ditemukan")) {
      return NextResponse.json(
        { success: false, message: "Sesi Anda telah berakhir. Silakan login kembali." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Gagal memberikan reward." },
      { status: 500 }
    );
  }
}
