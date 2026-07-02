"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Building2, Clock3, Users2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

const metricOptions = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "wfh", label: "WFH" },
  { value: "cuti", label: "Cuti" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Karyawan Aktif" },
  { value: "today-records", label: "Rekaman Absensi Hari Ini" },
  { value: "department", label: "Komposisi Divisi" },
] as const;

type MetricValue = (typeof metricOptions)[number]["value"];
type DisplayMode = "chart" | "numbers";

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default function AdminCompanyMonitorPage() {
  const { state } = useAppData();
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const [displayMode, setDisplayMode] = useState<DisplayMode>("chart");
  const [selectedMetric, setSelectedMetric] = useState<MetricValue>("present");

  const employees = useMemo(
    () => state.employees.filter((employee) => employee.role === "employee"),
    [state.employees],
  );

  const todayRecords = useMemo(
    () => state.attendance.filter((record) => record.date === today),
    [state.attendance, today],
  );

  const monthRecords = useMemo(() => {
    return state.attendance.filter((record) => {
      const date = parseDateKey(record.date);
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    });
  }, [now, state.attendance]);

  const totalLateMinutesMonth = useMemo(() => {
    return monthRecords.reduce(
      (sum, record) => sum + Number(record.lateMinutes || 0),
      0,
    );
  }, [monthRecords]);

  const summary = useMemo(() => {
    const present = todayRecords.filter((record) => record.checkIn).length;
    const late = todayRecords.filter(
      (record) => record.status === "Late",
    ).length;
    const wfh = todayRecords.filter(
      (record) => record.workMode === "wfh",
    ).length;
    const cuti = todayRecords.filter(
      (record) => record.workMode === "cuti",
    ).length;
    const pending = Math.max(employees.length - present - cuti, 0);

    return { present, late, wfh, cuti, pending };
  }, [todayRecords, employees.length]);

  const departmentStats = useMemo(() => {
    const bucket = new Map<string, number>();

    for (const employee of employees) {
      const key = employee.department || "Tanpa Divisi";
      bucket.set(key, (bucket.get(key) || 0) + 1);
    }

    return Array.from(bucket.entries())
      .map(([department, total]) => ({ department, total }))
      .sort((a, b) => b.total - a.total);
  }, [employees]);

  const metricChart = useMemo(() => {
    const totalDays = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();

    if (selectedMetric === "department") {
      const maxValue = Math.max(
        ...departmentStats.map((item) => item.total),
        1,
      );

      return {
        unit: "orang",
        points: departmentStats.map((item) => ({
          label: item.department,
          value: item.total,
        })),
        maxValue,
      };
    }

    const points = Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const records = monthRecords.filter((record) => record.date === dayKey);

      const present = records.filter((record) =>
        Boolean(record.checkIn),
      ).length;
      const late = records.filter((record) => record.status === "Late").length;
      const wfh = records.filter((record) => record.workMode === "wfh").length;
      const cuti = records.filter(
        (record) => record.workMode === "cuti",
      ).length;
      const pending = Math.max(employees.length - present - cuti, 0);

      const valueByMetric: Record<
        Exclude<MetricValue, "department">,
        number
      > = {
        present,
        late,
        wfh,
        cuti,
        pending,
        active: employees.length,
        "today-records": dayKey === today ? todayRecords.length : 0,
      };

      return {
        label: String(day),
        value: valueByMetric[selectedMetric],
      };
    });

    const maxValue = Math.max(...points.map((item) => item.value), 1);

    return {
      unit: "data",
      points,
      maxValue,
    };
  }, [
    departmentStats,
    employees.length,
    monthRecords,
    now,
    selectedMetric,
    today,
    todayRecords.length,
  ]);

  const alerts = useMemo(() => {
    return todayRecords
      .filter(
        (record) =>
          record.checkIn && !record.checkOut && record.workMode !== "cuti",
      )
      .slice(0, 8)
      .map((record) => ({
        id: record.id,
        employeeName: record.employeeName,
        mode: record.workMode || "onsite",
        checkIn: record.checkIn || "-",
      }));
  }, [todayRecords]);

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Monitor Perusahaan"
        subtitle="Pantau kondisi operasional harian secara ringkas"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-slate-300/30">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
            Operasional Harian
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            Snapshot Perusahaan Hari Ini
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Modul ini membantu admin melihat status hadir, WFH, cuti, serta
            potensi masalah check-out yang belum selesai.
          </p>

          <div className="mt-4 max-w-xs">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Mode Tampilan
            </p>
            <select
              value={displayMode}
              onChange={(event) =>
                setDisplayMode(event.target.value as DisplayMode)
              }
              className="mt-2 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-2.5 text-sm font-black text-slate-700 outline-none"
            >
              <option value="chart">Grafik Bar (1 halaman)</option>
              <option value="numbers">Angka (1 halaman)</option>
            </select>
          </div>
        </div>

        {displayMode === "chart" ? (
          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
                  Analitik Monitor Perusahaan
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-950">
                  Grafik Bar Berdasarkan Kategori
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Total waktu terlambat bulan ini: {totalLateMinutesMonth} menit
                </p>
              </div>

              <select
                value={selectedMetric}
                onChange={(event) =>
                  setSelectedMetric(event.target.value as MetricValue)
                }
                className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-2.5 text-sm font-black text-slate-700 outline-none md:w-72"
              >
                {metricOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 overflow-x-auto">
              <div className="flex min-w-[820px] items-end gap-2">
                {metricChart.points.map((point) => {
                  const height = Math.max(
                    (point.value / metricChart.maxValue) * 220,
                    point.value > 0 ? 8 : 2,
                  );

                  return (
                    <div
                      key={`${selectedMetric}-${point.label}`}
                      className="w-6 text-center"
                    >
                      <div className="mx-auto flex h-[230px] items-end">
                        <div
                          className="w-full rounded-t-md bg-[#123c8c]"
                          style={{ height }}
                          title={`${point.label}: ${point.value} ${metricChart.unit}`}
                        />
                      </div>
                      <p className="mt-1 truncate text-[10px] font-bold text-slate-500">
                        {point.label}
                      </p>
                      <p className="text-[10px] font-black text-slate-700">
                        {point.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                {
                  label: "Present",
                  value: summary.present,
                },
                {
                  label: "Late",
                  value: summary.late,
                },
                {
                  label: "WFH",
                  value: summary.wfh,
                },
                {
                  label: "Cuti",
                  value: summary.cuti,
                },
                {
                  label: "Pending",
                  value: summary.pending,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-blue-100 bg-white p-4"
                >
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
                <div className="flex items-center gap-2 text-[#123c8c]">
                  <Building2 size={18} />
                  <h3 className="text-lg font-black text-slate-950">
                    Komposisi Divisi
                  </h3>
                </div>
                <div className="mt-4 space-y-2">
                  {departmentStats.map((item) => (
                    <div
                      key={item.department}
                      className="flex items-center justify-between rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2"
                    >
                      <p className="text-sm font-semibold text-slate-700">
                        {item.department}
                      </p>
                      <p className="text-sm font-black text-[#123c8c]">
                        {item.total} orang
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle size={18} />
                  <h3 className="text-lg font-black text-slate-950">
                    Perlu Tindak Lanjut
                  </h3>
                </div>
                {alerts.length === 0 ? (
                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Tidak ada alert hari ini.
                  </p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2"
                      >
                        <p className="text-sm font-black text-slate-900">
                          {alert.employeeName}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-600">
                          Check-in {alert.checkIn} • mode {alert.mode} • belum
                          check-out
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <div className="flex items-center gap-2 text-[#123c8c]">
                  <Users2 size={18} />
                  <p className="text-sm font-black text-slate-900">
                    Total Karyawan Aktif
                  </p>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {employees.length}
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <div className="flex items-center gap-2 text-[#123c8c]">
                  <Clock3 size={18} />
                  <p className="text-sm font-black text-slate-900">
                    Rekaman Absensi Hari Ini
                  </p>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {todayRecords.length}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-white p-4 sm:col-span-2">
                <div className="flex items-center gap-2 text-amber-700">
                  <Clock3 size={18} />
                  <p className="text-sm font-black text-slate-900">
                    Total Waktu Terlambat Sebulan
                  </p>
                </div>
                <p className="mt-2 text-2xl font-black text-amber-700">
                  {totalLateMinutesMonth} menit
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
