"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Clock3, UserCheck, UsersRound } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";
import { getAdminRoleLabel, type AdminRole } from "@/lib/adminAccess";

type Employee = {
  id: string;
  name: string;
  role: "admin" | "employee";
  position: string | null;
};

type LateRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  checkInTime: string;
  scheduledCheckIn: string;
  lateReason: string;
  lateMinutes: number;
  lateSeconds: number;
  isLate: boolean;
};

type HistogramBucket = {
  bucket: string;
  count: number;
};

type LateAnalytics = {
  totalEmployees: number;
  lateCount: number;
  latePercentage: number;
  rows: LateRow[];
  histogram: HistogramBucket[];
};

function parseTimeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function resolveStatusLabel(checkIn: string): "Presence" | "Late" | "Absent" {
  if (checkIn === "-" || !checkIn) return "Absent";

  const checkInMinutes = parseTimeToMinutes(checkIn);
  if (checkInMinutes === null) return "Absent";

  return checkInMinutes <= 8 * 60 ? "Presence" : "Late";
}

export default function AdminDashboardPage() {
  const { state } = useAppData();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sessionRole, setSessionRole] = useState<AdminRole>("admin");
  const [lateAnalytics, setLateAnalytics] = useState<LateAnalytics | null>(
    null,
  );

  const todayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    async function loadSessionRole() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();
        if (!response.ok || !result.user?.role) return;

        if (
          result.user.role === "owner" ||
          result.user.role === "admin" ||
          result.user.role === "cs"
        ) {
          setSessionRole(result.user.role);
        }
      } catch {
        // Keep default role.
      }
    }

    void loadSessionRole();
  }, []);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const response = await fetch("/api/employees", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) return;

        const result = await response.json();
        setEmployees(result.data || []);
      } catch {
        // Keep UI functional with context-only data.
      }
    }

    void loadEmployees();
  }, []);

  useEffect(() => {
    async function loadLateAnalytics() {
      try {
        const response = await fetch(
          "/api/attendance/late-reason?scope=admin",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result = await response.json();
        if (!response.ok || !result.success) return;

        setLateAnalytics(result.data as LateAnalytics);
      } catch {
        // Keep dashboard usable without analytics data.
      }
    }

    void loadLateAnalytics();
  }, []);

  const totalEmployees = useMemo(() => {
    return employees.filter((item) => item.role === "employee").length;
  }, [employees]);

  const todayAttendance = useMemo(() => {
    return state.attendance.filter((item) => item.date === todayKey);
  }, [state.attendance, todayKey]);

  const presentToday = useMemo(() => {
    return todayAttendance.filter((item) => Boolean(item.checkIn)).length;
  }, [todayAttendance]);

  const lateToday = useMemo(() => {
    if (lateAnalytics) {
      return lateAnalytics.lateCount;
    }

    return todayAttendance.filter((item) => item.status === "Late").length;
  }, [lateAnalytics, todayAttendance]);

  const absentToday = useMemo(() => {
    return Math.max(totalEmployees - presentToday, 0);
  }, [totalEmployees, presentToday]);

  const histogramMax = useMemo(() => {
    const values = lateAnalytics?.histogram.map((item) => item.count) || [0];
    return Math.max(...values, 1);
  }, [lateAnalytics]);

  const dashboardRows = useMemo(() => {
    return employees
      .filter((item) => item.role === "employee")
      .map((employee) => {
        const attendanceByEmployee = state.attendance.filter(
          (record) =>
            record.employeeId === employee.id && Boolean(record.checkIn),
        );

        const todayAttendance = attendanceByEmployee.find(
          (record) => record.date === todayKey,
        );

        return {
          id: employee.id,
          name: employee.name,
          position: employee.position || "-",
          scheduledHours: "08:00 - 17:00",
          totalWorkDays: attendanceByEmployee.length,
          status: resolveStatusLabel(todayAttendance?.checkIn || "-"),
        };
      });
  }, [employees, state.attendance, todayKey]);

  const dashboardTitle =
    sessionRole === "owner"
      ? "Owner Dashboard"
      : sessionRole === "cs"
        ? "CS Dashboard"
        : "Admin Dashboard";

  const dashboardSubtitle =
    sessionRole === "owner"
      ? "Ringkasan bisnis, absensi, dan kendali operasional"
      : sessionRole === "cs"
        ? "Pantau keluhan, panggilan, dan respons layanan"
        : "Ringkasan karyawan dan status absensi harian";

  const roleFocusItems =
    sessionRole === "owner"
      ? [
          "Pantau performa karyawan dan tingkat kehadiran.",
          "Validasi kebutuhan operasional lintas divisi.",
          "Pastikan keputusan bisnis berdasarkan data aktual.",
        ]
      : sessionRole === "cs"
        ? [
            "Prioritaskan tindak lanjut keluhan dan panggilan masuk.",
            "Lacak ketersediaan tim untuk respons cepat.",
            "Koordinasikan eskalasi layanan dengan admin/owner.",
          ]
        : [
            "Kelola data karyawan aktif dan absensi harian.",
            "Pantau keterlambatan dan potensi ketidakhadiran.",
            "Siapkan data operasional untuk laporan owner.",
          ];

  return (
    <MobileShell variant="admin">
      <AppHeader
        title={dashboardTitle}
        subtitle={dashboardSubtitle}
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-slate-300/30">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
            {getAdminRoleLabel(sessionRole)} Control Center
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            Selamat datang di dashboard {getAdminRoleLabel(sessionRole)}
            Creativemu
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
            Halaman ini menyesuaikan fokus kerja{" "}
            {getAdminRoleLabel(sessionRole)}
            supaya perpindahan page lebih relevan dengan bidang tugas.
          </p>

          <div className="mt-4 grid gap-2 rounded-2xl bg-[#f6f8ff] p-4 md:grid-cols-3">
            {roleFocusItems.map((item) => (
              <p key={item} className="text-xs font-bold text-slate-600">
                {item}
              </p>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Total Karyawan
              </p>
              <UsersRound size={18} className="text-[#123c8c]" />
            </div>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {totalEmployees}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Presensi Hari Ini
              </p>
              <UserCheck size={18} className="text-emerald-700" />
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-700">
              {presentToday}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Telat Hari Ini
              </p>
              <Clock3 size={18} className="text-amber-700" />
            </div>
            <p className="mt-3 text-3xl font-black text-amber-700">
              {lateToday}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {lateAnalytics
                ? `${lateAnalytics.latePercentage.toFixed(2)}% dari total karyawan`
                : "Persentase telat dimuat otomatis"}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Absen Hari Ini
              </p>
              <CalendarCheck size={18} className="text-rose-700" />
            </div>
            <p className="mt-3 text-3xl font-black text-rose-700">
              {absentToday}
            </p>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-amber-100 bg-white/95 p-5 shadow-xl shadow-slate-300/30">
            <h3 className="text-xl font-black text-slate-950">
              Karyawan Terlambat Hari Ini
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Menampilkan nama, alasan telat, jam check-in, dan durasi
              keterlambatan.
            </p>

            {!lateAnalytics || lateAnalytics.rows.length === 0 ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Tidak ada data keterlambatan hari ini.
              </p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-amber-100">
                <div className="hidden grid-cols-[1.1fr_1.5fr_0.8fr_0.9fr] bg-amber-50/70 px-4 py-3 text-xs font-black uppercase tracking-wide text-amber-800 md:grid">
                  <p>Nama</p>
                  <p>Alasan</p>
                  <p>Check-in</p>
                  <p>Keterlambatan</p>
                </div>
                <div className="divide-y divide-amber-100 bg-white">
                  {lateAnalytics.rows.map((row) => (
                    <div
                      key={`late-row-${row.id}`}
                      className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.1fr_1.5fr_0.8fr_0.9fr] md:items-center"
                    >
                      <div>
                        <p className="font-black text-slate-950">
                          {row.employeeName}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {row.employeeId}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-600">
                        {row.lateReason}
                      </p>
                      <p className="font-black text-amber-700">
                        {row.checkInTime}
                      </p>
                      <p className="font-black text-amber-700">
                        {row.lateMinutes}m {row.lateSeconds}s
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white/95 p-5 shadow-xl shadow-slate-300/30">
            <h3 className="text-xl font-black text-slate-950">
              Histogram Keterlambatan
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Distribusi jumlah karyawan telat berdasarkan rentang menit.
            </p>

            <div className="mt-5 space-y-3">
              {(lateAnalytics?.histogram || []).map((bucket) => {
                const widthPercent = Math.max(
                  8,
                  Math.round((bucket.count / histogramMax) * 100),
                );

                return (
                  <div key={`hist-${bucket.bucket}`}>
                    <div className="mb-1 flex items-center justify-between text-xs font-black text-slate-600">
                      <span>{bucket.bucket}</span>
                      <span>{bucket.count}</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-blue-100">
                      <div
                        className="h-3 rounded-full bg-[#123c8c] transition-all"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!lateAnalytics || lateAnalytics.histogram.length === 0) && (
                <p className="text-sm font-semibold text-slate-500">
                  Histogram belum tersedia.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
          <h3 className="text-xl font-black text-slate-950">
            Data Karyawan & Status
          </h3>

          {dashboardRows.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Belum ada data karyawan.
            </p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-blue-100">
              <div className="hidden grid-cols-[1.2fr_1fr_0.8fr_0.9fr_0.8fr] bg-[#eaf1ff] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#123c8c] md:grid">
                <p>Karyawan</p>
                <p>Posisi</p>
                <p>Jam Kerja</p>
                <p>Total Hari Kerja</p>
                <p>Status</p>
              </div>

              <div className="divide-y divide-blue-100 bg-white">
                {dashboardRows.map((item) => (
                  <div
                    key={`dashboard-row-${item.id}`}
                    className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.2fr_1fr_0.8fr_0.9fr_0.8fr] md:items-center"
                  >
                    <div>
                      <p className="font-black text-slate-950">{item.name}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {item.id}
                      </p>
                    </div>

                    <p className="font-semibold text-slate-600">
                      {item.position}
                    </p>

                    <p className="font-semibold text-slate-600">
                      {item.scheduledHours}
                    </p>

                    <p className="font-black text-slate-700">
                      {item.totalWorkDays} hari
                    </p>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${
                        item.status === "Presence"
                          ? "bg-emerald-50 text-emerald-700"
                          : item.status === "Late"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
