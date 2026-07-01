"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function parseTimeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function resolveStatusLabel(checkIn: string): "Presence" | "Late" | "Absent" {
  if (checkIn === "-" || !checkIn) return "Absent";

  const checkInMinutes = parseTimeToMinutes(checkIn);
  if (checkInMinutes === null) return "Absent";

  return checkInMinutes <= 8 * 60 ? "Presence" : "Late";
}

function classifyEmploymentCategory(
  employee: Employee,
): "intern" | "permanent" {
  const joined =
    `${employee.position || ""} ${employee.department || ""}`.toLowerCase();
  const isIntern = /magang|intern|trainee|prakerin|apprentice/.test(joined);
  return isIntern ? "intern" : "permanent";
}

type Employee = {
  id: string;
  role: "admin" | "employee";
  department: string | null;
  position: string | null;
};

export default function ReportsPage() {
  const { state } = useAppData();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "intern" | "permanent"
  >("all");

  const todayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    async function loadData() {
      try {
        const employeeResponse = await fetch("/api/employees", {
          method: "GET",
          cache: "no-store",
        });

        const employeeResult = await employeeResponse.json();

        if (employeeResponse.ok) {
          setEmployees(employeeResult.data || []);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const reportItems = useMemo(() => {
    const employeeOnly = employees.filter(
      (employee) => employee.role === "employee",
    );

    return employeeOnly.map((employee) => {
      const attendanceByEmployee = state.attendance.filter(
        (record) =>
          record.employeeId === employee.id && Boolean(record.checkIn),
      );

      const todayAttendance = attendanceByEmployee.find(
        (record) =>
          record.employeeId === employee.id && record.date === todayKey,
      );

      const checkInTime = todayAttendance?.checkIn || "-";
      const attendanceStatus = resolveStatusLabel(checkInTime);
      const employeeCategory = classifyEmploymentCategory(employee);

      return {
        id: employee.id,
        employeeCategory,
        attendanceStatus,
      };
    });
  }, [employees, state.attendance, todayKey]);

  const filteredReportItems = useMemo(() => {
    if (categoryFilter === "all") return reportItems;
    return reportItems.filter(
      (item) => item.employeeCategory === categoryFilter,
    );
  }, [categoryFilter, reportItems]);

  const summary = useMemo(() => {
    const total = filteredReportItems.length;

    const presence = filteredReportItems.filter(
      (item) => item.attendanceStatus === "Presence",
    ).length;

    const late = filteredReportItems.filter(
      (item) => item.attendanceStatus === "Late",
    ).length;

    const absent = filteredReportItems.filter(
      (item) => item.attendanceStatus === "Absent",
    ).length;

    return { total, presence, late, absent };
  }, [filteredReportItems]);

  const employeeIdSet = useMemo(() => {
    return new Set(filteredReportItems.map((item) => item.id));
  }, [filteredReportItems]);

  const dailyPresenceChart = useMemo(() => {
    const points = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);

      const value = state.attendance.filter(
        (record) =>
          record.date === key &&
          Boolean(record.checkIn) &&
          employeeIdSet.has(record.employeeId),
      ).length;

      return {
        label: date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
        }),
        value,
      };
    });

    return {
      points,
      maxValue: Math.max(...points.map((item) => item.value), 1),
    };
  }, [employeeIdSet, state.attendance]);

  const monthlyPresenceChart = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const points = monthLabels.map((label, monthIndex) => {
      const value = state.attendance.filter((record) => {
        if (!record.checkIn || !employeeIdSet.has(record.employeeId)) {
          return false;
        }

        const date = parseDateKey(record.date);
        return (
          date.getFullYear() === thisYear && date.getMonth() === monthIndex
        );
      }).length;

      return { label, value };
    });

    return {
      points,
      maxValue: Math.max(...points.map((item) => item.value), 1),
    };
  }, [employeeIdSet, state.attendance]);

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Reports"
        subtitle="Grafik laporan absensi harian dan bulanan"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-300/30">
          <p className="text-sm font-black text-[#123c8c]">Admin Monitoring</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Laporan Harian & Bulanan
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Jam kerja standar diset dari 08:00 sampai 17:00. Label status hari
            ini ditampilkan otomatis sebagai Presence, Late, atau Absent untuk
            persiapan aturan toleransi keterlambatan.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
            Filter Kategori
          </p>
          <div className="mt-3 w-full sm:w-72">
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value as "all" | "intern" | "permanent",
                )
              }
              className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-sm font-black text-slate-700 outline-none"
            >
              <option value="all">Semua</option>
              <option value="intern">Magang</option>
              <option value="permanent">Karyawan Tetap</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
              Total Karyawan
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {summary.total}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              Presence
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {summary.presence}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
              Late
            </p>
            <p className="mt-2 text-3xl font-black text-amber-700">
              {summary.late}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">
              Absent
            </p>
            <p className="mt-2 text-3xl font-black text-rose-700">
              {summary.absent}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-950">
                Grafik Harian (7 Hari)
              </h3>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Minimal
              </p>
            </div>

            {loading ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Memuat data...
              </p>
            ) : (
              <div className="mt-5 grid grid-cols-7 items-end gap-3">
                {dailyPresenceChart.points.map((item) => (
                  <div key={`daily-bar-${item.label}`} className="text-center">
                    <div className="mx-auto flex h-36 w-full max-w-10 items-end rounded-lg bg-slate-100/80 p-1">
                      <div
                        className="w-full rounded-md bg-[#123c8c]"
                        style={{
                          height: `${Math.max(
                            (item.value / dailyPresenceChart.maxValue) * 100,
                            8,
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] font-bold text-slate-500">
                      {item.label}
                    </p>
                    <p className="text-xs font-black text-slate-800">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-950">
                Grafik Bulanan
              </h3>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Tahun Ini
              </p>
            </div>

            {loading ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Memuat data...
              </p>
            ) : (
              <div className="mt-5 grid grid-cols-6 gap-3 sm:grid-cols-12">
                {monthlyPresenceChart.points.map((item) => (
                  <div
                    key={`monthly-bar-${item.label}`}
                    className="text-center"
                  >
                    <div className="mx-auto flex h-32 w-full max-w-8 items-end rounded-md bg-slate-100/80 p-1">
                      <div
                        className="w-full rounded-sm bg-emerald-600"
                        style={{
                          height: `${Math.max(
                            (item.value / monthlyPresenceChart.maxValue) * 100,
                            6,
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-[10px] font-bold text-slate-500">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
