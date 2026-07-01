"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

const monthOptions = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
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

function getWorkDaysInMonth(year: number, month: number) {
  const totalDays = new Date(year, month, 0).getDate();
  let workDays = 0;

  for (let day = 1; day <= totalDays; day += 1) {
    const weekDay = new Date(year, month - 1, day).getDay();
    if (weekDay !== 0 && weekDay !== 6) {
      workDays += 1;
    }
  }

  return workDays;
}

function inferGender(
  name: string,
  rawGender?: string | null,
): "male" | "female" {
  const normalized = (rawGender || "").toLowerCase();

  if (
    normalized === "male" ||
    normalized === "laki-laki" ||
    normalized === "pria" ||
    normalized === "l"
  ) {
    return "male";
  }

  if (
    normalized === "female" ||
    normalized === "perempuan" ||
    normalized === "wanita" ||
    normalized === "p"
  ) {
    return "female";
  }

  const lowerName = name.toLowerCase();
  const femaleHints = [
    "siti",
    "nur",
    "fitri",
    "putri",
    "dewi",
    "anisa",
    "rahma",
    "nisa",
    "ayu",
    "widya",
  ];

  if (femaleHints.some((hint) => lowerName.includes(hint))) {
    return "female";
  }

  return "male";
}

function resolveAttendanceKind(record: {
  status: string;
  checkIn: string | null;
}): "on-time" | "late" | "leave" {
  if (!record.checkIn) {
    return "leave";
  }

  const normalizedStatus = record.status.toLowerCase();
  if (normalizedStatus === "late") return "late";
  if (normalizedStatus === "absent") return "leave";

  const minute = parseTimeToMinutes(record.checkIn);
  if (minute !== null && minute > 8 * 60) return "late";

  return "on-time";
}

function getDeltaPercent(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Math.round(((current - previous) / previous) * 100);
}

type Employee = {
  id: string;
  name: string;
  role: "admin" | "employee";
  employee_category?: "magang" | "tetap";
  department: string | null;
  position: string | null;
  gender?: string | null;
};

type EmployeeMonthlyStat = {
  id: string;
  name: string;
  gender: "male" | "female";
  onTime: number;
  late: number;
  leave: number;
  totalPresence: number;
  performancePercent: number;
  score: number;
  category: "magang" | "tetap";
};

export default function ReportsPage() {
  const { state } = useAppData();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [nameFilter, setNameFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">(
    "all",
  );

  const yearOptions = useMemo(() => {
    const base = now.getFullYear();
    return [base - 2, base - 1, base, base + 1];
  }, [now]);

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

  const monthAttendance = useMemo(() => {
    return state.attendance.filter((record) => {
      const date = parseDateKey(record.date);
      return (
        date.getFullYear() === selectedYear &&
        date.getMonth() + 1 === selectedMonth
      );
    });
  }, [selectedMonth, selectedYear, state.attendance]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      if (employee.role !== "employee") return false;

      if (
        nameFilter &&
        !employee.name.toLowerCase().includes(nameFilter.toLowerCase())
      ) {
        return false;
      }

      if (genderFilter !== "all") {
        const gender = inferGender(employee.name, employee.gender);
        if (gender !== genderFilter) return false;
      }

      return true;
    });
  }, [employees, genderFilter, nameFilter]);

  const allEmployeeStats = useMemo<EmployeeMonthlyStat[]>(() => {
    const totalWorkDays = getWorkDaysInMonth(selectedYear, selectedMonth);

    return filteredEmployees.map((employee) => {
      const records = monthAttendance.filter(
        (record) => record.employeeId === employee.id,
      );

      let onTime = 0;
      let late = 0;
      let leave = 0;

      for (const record of records) {
        const kind = resolveAttendanceKind(record);
        if (kind === "on-time") onTime += 1;
        if (kind === "late") late += 1;
        if (kind === "leave") leave += 1;
      }

      const totalPresence = onTime + late;
      const performancePercent =
        totalWorkDays === 0
          ? 0
          : Math.min(100, Math.round((totalPresence / totalWorkDays) * 100));
      const score = onTime * 3 + late - leave * 2;

      return {
        id: employee.id,
        name: employee.name,
        gender: inferGender(employee.name, employee.gender),
        onTime,
        late,
        leave,
        totalPresence,
        performancePercent,
        score,
        category: employee.employee_category === "magang" ? "magang" : "tetap",
      };
    });
  }, [filteredEmployees, monthAttendance, selectedMonth, selectedYear]);

  const scopedEmployeeStats = allEmployeeStats;

  const scopedEmployeeIds = useMemo(() => {
    return new Set(scopedEmployeeStats.map((item) => item.id));
  }, [scopedEmployeeStats]);

  const dailyAttendanceChart = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();

    const points = Array.from({ length: totalDays }, (_, idx) => {
      const day = idx + 1;
      const dayLabel = String(day);
      const prefix = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const dayRecords = monthAttendance.filter(
        (record) =>
          record.date === prefix && scopedEmployeeIds.has(record.employeeId),
      );

      let onTime = 0;
      let late = 0;
      let leave = 0;

      for (const record of dayRecords) {
        const kind = resolveAttendanceKind(record);
        if (kind === "on-time") onTime += 1;
        if (kind === "late") late += 1;
        if (kind === "leave") leave += 1;
      }

      return { day: dayLabel, onTime, late, leave };
    });

    const maxValue = Math.max(
      ...points.map((item) => item.onTime + item.late + item.leave),
      1,
    );

    return { points, maxValue };
  }, [monthAttendance, scopedEmployeeIds, selectedMonth, selectedYear]);

  const previousPeriod = useMemo(() => {
    if (selectedMonth === 1) {
      return { year: selectedYear - 1, month: 12 };
    }

    return { year: selectedYear, month: selectedMonth - 1 };
  }, [selectedMonth, selectedYear]);

  const previousMonthAttendance = useMemo(() => {
    return state.attendance.filter((record) => {
      const date = parseDateKey(record.date);
      return (
        date.getFullYear() === previousPeriod.year &&
        date.getMonth() + 1 === previousPeriod.month
      );
    });
  }, [previousPeriod.month, previousPeriod.year, state.attendance]);

  const summary = useMemo(() => {
    const totalOnTime = scopedEmployeeStats.reduce(
      (sum, item) => sum + item.onTime,
      0,
    );
    const totalLate = scopedEmployeeStats.reduce(
      (sum, item) => sum + item.late,
      0,
    );
    const totalLeave = scopedEmployeeStats.reduce(
      (sum, item) => sum + item.leave,
      0,
    );

    return {
      totalOnTime,
      totalLate,
      totalLeave,
    };
  }, [scopedEmployeeStats]);

  const previousSummary = useMemo(() => {
    const employeeIds = new Set(
      filteredEmployees.map((employee) => employee.id),
    );

    let totalOnTime = 0;
    let totalLate = 0;
    let totalLeave = 0;

    for (const record of previousMonthAttendance) {
      if (!employeeIds.has(record.employeeId)) continue;

      const kind = resolveAttendanceKind(record);
      if (kind === "on-time") totalOnTime += 1;
      if (kind === "late") totalLate += 1;
      if (kind === "leave") totalLeave += 1;
    }

    return { totalOnTime, totalLate, totalLeave };
  }, [filteredEmployees, previousMonthAttendance]);

  const trendCards = useMemo(() => {
    const currentValues = {
      "on-time": summary.totalOnTime,
      late: summary.totalLate,
      leave: summary.totalLeave,
    };

    const previousValues = {
      "on-time": previousSummary.totalOnTime,
      late: previousSummary.totalLate,
      leave: previousSummary.totalLeave,
    };

    return [
      {
        key: "on-time",
        label: "On Time",
        color: "text-emerald-700",
      },
      {
        key: "late",
        label: "Late",
        color: "text-rose-700",
      },
      {
        key: "leave",
        label: "Leave",
        color: "text-amber-700",
      },
    ].map((item) => {
      const current = currentValues[item.key as keyof typeof currentValues];
      const previous = previousValues[item.key as keyof typeof previousValues];
      const delta = current - previous;
      const deltaPercent = getDeltaPercent(current, previous);

      return {
        ...item,
        current,
        previous,
        delta,
        deltaPercent,
      };
    });
  }, [
    previousSummary.totalLate,
    previousSummary.totalLeave,
    previousSummary.totalOnTime,
    summary.totalLate,
    summary.totalLeave,
    summary.totalOnTime,
  ]);

  function resetFilters() {
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
    setNameFilter("");
    setGenderFilter("all");
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Reports"
        subtitle="Laporan absensi karyawan dengan filter lengkap"
        variant="admin"
      />

      <section className="mx-auto max-h-[calc(100dvh-82px)] max-w-7xl space-y-4 overflow-y-auto px-5 py-6 pb-24 md:max-h-[calc(100dvh-76px)] md:px-10 md:pb-10 lg:px-16">
        <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
            Admin Panel
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Monitor Perusahaan
          </h2>

          <div className="mt-4 rounded-lg bg-white p-2 md:p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <p className="text-lg font-black leading-6 text-slate-900">
                Laporan Absen Semua Karyawan
              </p>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-black text-slate-600">
                    Filter Tahun
                  </p>
                  <select
                    value={selectedYear}
                    onChange={(event) =>
                      setSelectedYear(Number(event.target.value))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                  >
                    {yearOptions.map((year) => (
                      <option key={`year-${year}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-xs font-black text-slate-600">
                    Filter Bulan
                  </p>
                  <select
                    value={selectedMonth}
                    onChange={(event) =>
                      setSelectedMonth(Number(event.target.value))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                  >
                    {monthOptions.map((month) => (
                      <option key={`month-${month.value}`} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-xs font-black text-slate-600">Gender</p>
                  <select
                    value={genderFilter}
                    onChange={(event) =>
                      setGenderFilter(
                        event.target.value as "all" | "male" | "female",
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                  >
                    <option value="all">Semua</option>
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>

                <div>
                  <p className="text-xs font-black text-slate-600">
                    Reset Filter
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-1 inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-[#123c8c]"
                  >
                    <RefreshCcw size={15} />
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={nameFilter}
                  onChange={(event) => setNameFilter(event.target.value)}
                  placeholder="Filter nama karyawan"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-4 text-xs font-black">
                <span className="inline-flex items-center gap-2 text-emerald-700">
                  <span className="h-2.5 w-5 rounded-full bg-emerald-500" />
                  Tepat Waktu
                </span>
                <span className="inline-flex items-center gap-2 text-rose-700">
                  <span className="h-2.5 w-5 rounded-full bg-rose-500" />
                  Terlambat
                </span>
                <span className="inline-flex items-center gap-2 text-amber-700">
                  <span className="h-2.5 w-5 rounded-full bg-amber-400" />
                  Izin / Absen
                </span>
              </div>

              {loading ? (
                <p className="mt-4 text-sm font-semibold text-slate-500">
                  Memuat data...
                </p>
              ) : (
                <div className="mt-4 pb-1">
                  <div className="flex items-end gap-1.5 overflow-x-auto">
                    {dailyAttendanceChart.points.map((point) => {
                      const total = point.onTime + point.late + point.leave;
                      const normalized =
                        total === 0
                          ? { onTime: 0, late: 0, leave: 0 }
                          : {
                              onTime: (point.onTime / total) * 100,
                              late: (point.late / total) * 100,
                              leave: (point.leave / total) * 100,
                            };

                      const height = Math.max(
                        (total / dailyAttendanceChart.maxValue) * 220,
                        8,
                      );

                      return (
                        <div
                          key={`day-chart-${point.day}`}
                          className="flex flex-col items-center"
                        >
                          <div
                            className="relative w-4 overflow-hidden rounded-sm bg-slate-200"
                            style={{ height }}
                          >
                            <div
                              className="absolute bottom-0 w-full bg-amber-400"
                              style={{ height: `${normalized.leave}%` }}
                            />
                            <div
                              className="absolute w-full bg-rose-500"
                              style={{
                                bottom: `${normalized.leave}%`,
                                height: `${normalized.late}%`,
                              }}
                            />
                            <div
                              className="absolute w-full bg-emerald-500"
                              style={{
                                bottom: `${normalized.leave + normalized.late}%`,
                                height: `${normalized.onTime}%`,
                              }}
                            />
                          </div>

                          <p className="mt-1 text-[10px] font-bold text-slate-500">
                            {point.day}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {!loading && (
              <div className="mt-5 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Tren Bulan Ini vs Bulan Lalu
                  </p>
                  <p className="text-[11px] font-bold text-slate-500">
                    Dibanding {previousPeriod.year}/
                    {String(previousPeriod.month).padStart(2, "0")}
                  </p>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {trendCards.map((item) => {
                    const directionClass =
                      item.delta > 0
                        ? "text-emerald-700"
                        : item.delta < 0
                          ? "text-rose-700"
                          : "text-slate-600";
                    const deltaSign = item.delta > 0 ? "+" : "";
                    const percentSign = item.deltaPercent > 0 ? "+" : "";

                    return (
                      <div
                        key={`trend-${item.key}`}
                        className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                      >
                        <p
                          className={`text-xs font-black uppercase tracking-[0.14em] ${item.color}`}
                        >
                          {item.label}
                        </p>

                        <p className="mt-2 text-2xl font-black text-slate-900">
                          {item.current}
                        </p>

                        <p className="mt-1 text-xs font-bold text-slate-500">
                          Bulan lalu: {item.previous}
                        </p>

                        <p
                          className={`mt-1 text-xs font-black ${directionClass}`}
                        >
                          {deltaSign}
                          {item.delta} ({percentSign}
                          {item.deltaPercent}%)
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
