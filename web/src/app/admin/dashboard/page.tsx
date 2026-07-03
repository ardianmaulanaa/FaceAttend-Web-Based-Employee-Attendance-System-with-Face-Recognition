"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Clock3,
  LayoutDashboard,
  Loader2,
  RefreshCcw,
  UserCheck,
  UsersRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type DashboardStats = {
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
};

type RecentAttendance = {
  id: string;
  name: string;
  checkIn: string;
  checkOut: string;
  status: string;
  workMode: string;
};

type DashboardResponse = {
  stats: DashboardStats;
  recentAttendance: RecentAttendance[];
};

function getStatusClass(status: string) {
  if (status === "Present") {
    return "bg-[#eaf1ff] text-[#123c8c]";
  }

  if (status === "Late") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "Cuti") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-slate-100 text-slate-600";
}

function formatWorkMode(mode: string) {
  if (mode === "wfh") return "WFH";
  if (mode === "visit") return "Kunjungan";
  if (mode === "office") return "Kantor";

  return mode;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/admin/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "Gagal mengambil data dashboard admin.",
        );
      }

      setData(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengambil data dashboard.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const stats = useMemo(() => {
    const dashboardStats = data?.stats;

    return [
      {
        label: "Total Employees",
        value: String(dashboardStats?.totalEmployees ?? 0),
        description: "Karyawan aktif terdaftar",
        icon: UsersRound,
      },
      {
        label: "Present Today",
        value: String(dashboardStats?.presentToday ?? 0),
        description: "Sudah melakukan absensi",
        icon: UserCheck,
      },
      {
        label: "Late Today",
        value: String(dashboardStats?.lateToday ?? 0),
        description: "Terlambat masuk",
        icon: Clock3,
      },
      {
        label: "Absent Today",
        value: String(dashboardStats?.absentToday ?? 0),
        description: "Belum hadir / belum absen",
        icon: CalendarCheck,
      },
    ];
  }, [data]);

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Admin Dashboard"
        subtitle="Monitoring absensi karyawan Creativemu"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="bg-[#123c8c] p-6 text-white md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <LayoutDashboard size={25} strokeWidth={2.6} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                    Admin Control Center
                  </p>

                  <h2 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                    Attendance Overview
                  </h2>
                </div>
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100">
                Pantau status kehadiran karyawan, keterlambatan, cuti, dan
                absensi harian melalui dashboard admin yang terhubung langsung
                dengan database.
              </p>

              <button
                type="button"
                onClick={loadDashboardData}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#123c8c] shadow-lg shadow-blue-950/20 transition hover:bg-blue-50"
              >
                <RefreshCcw size={16} />
                Refresh Data
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-5 md:p-6">
              {stats.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-slate-500">
                        {item.label}
                      </p>

                      <Icon
                        size={20}
                        strokeWidth={2.5}
                        className="text-[#123c8c]"
                      />
                    </div>

                    {isLoading ? (
                      <div className="mt-4 h-8 w-16 animate-pulse rounded-xl bg-blue-100" />
                    ) : (
                      <h3 className="mt-3 text-3xl font-black text-[#123c8c]">
                        {item.value}
                      </h3>
                    )}

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                Today Report
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Recent Attendance
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-slate-500">
              Ringkasan absensi terbaru dari karyawan Creativemu hari ini.
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-blue-100">
            <div className="hidden grid-cols-[0.8fr_1.4fr_0.8fr_0.8fr_0.8fr_0.8fr] bg-[#eaf1ff] px-5 py-3 text-xs font-black uppercase tracking-wide text-[#123c8c] md:grid">
              <p>ID</p>
              <p>Employee</p>
              <p>Check-in</p>
              <p>Check-out</p>
              <p>Mode</p>
              <p>Status</p>
            </div>

            <div className="divide-y divide-blue-100 bg-white">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm font-bold text-slate-500">
                  <Loader2 size={18} className="animate-spin" />
                  Mengambil data absensi...
                </div>
              ) : data?.recentAttendance.length ? (
                data.recentAttendance.map((item) => (
                  <div
                    key={`${item.id}-${item.name}`}
                    className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[0.8fr_1.4fr_0.8fr_0.8fr_0.8fr_0.8fr] md:items-center"
                  >
                    <p className="font-black text-[#123c8c]">{item.id}</p>
                    <p className="font-bold text-slate-950">{item.name}</p>
                    <p className="text-slate-500">{item.checkIn}</p>
                    <p className="text-slate-500">{item.checkOut}</p>
                    <p className="font-semibold text-slate-500">
                      {formatWorkMode(item.workMode)}
                    </p>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-5 py-10 text-center text-sm font-bold text-slate-500">
                  Belum ada data karyawan atau absensi hari ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}