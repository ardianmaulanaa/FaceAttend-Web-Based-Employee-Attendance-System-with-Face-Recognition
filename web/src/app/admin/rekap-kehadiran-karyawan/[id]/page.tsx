"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Loader2,
  UserRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";

type EmployeeAttendanceSummary = {
  totalHariKerja: number;
  totalPresensi: number;
  hadir: number;
  terlambat: number;
  menunggu: number;
  izin: number;
  sakit: number;
  cuti: number;
  lainnya: number;
  gajiPokok: number;
  potonganPerHari: number;
  estimasiPotonganTidakMasuk: number;
  estimasiSalary: number;
};

type EmployeeRecap = {
  id: string;
  name: string;
  employeeCode?: string | null;
  employmentStartDate?: string | null;
  employmentEndDate?: string | null;
  employmentStatus?: string | null;
  status?: string | null;
  shiftName?: string | null;
  summary: EmployeeAttendanceSummary;
};

type EmployeeAttendanceRecapResponse = {
  success?: boolean;
  message?: string;
  employees?: EmployeeRecap[];
};

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function getDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDefaultStartDate() {
  const date = new Date();

  date.setDate(1);

  return getDateInputValue(date);
}

function getDefaultEndDate() {
  return getDateInputValue(new Date());
}

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Rentang tanggal belum dipilih";
  }

  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function formatOptionalDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatEmploymentPeriod(employee?: EmployeeRecap | null) {
  const startDate = formatOptionalDate(employee?.employmentStartDate);
  const endDate = formatOptionalDate(employee?.employmentEndDate);

  if (startDate && endDate) return `${startDate} - ${endDate}`;
  if (startDate) return `Mulai ${startDate}`;
  if (endDate) return `Sampai ${endDate}`;

  return "-";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getInitialDate(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key) || "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  return key === "startDate" ? getDefaultStartDate() : getDefaultEndDate();
}

function RecapDetailMotionStyles() {
  return (
    <style>{`
      @keyframes recapDetailEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .recap-detail-enter {
        animation: recapDetailEnter 320ms ease-out both;
      }

      .recap-detail-field {
        transition:
          border-color 180ms ease,
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      @media (prefers-reduced-motion: reduce) {
        .recap-detail-enter {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default function AdminEmployeeAttendanceRecapDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const employeeId = String(params.id || "");

  const [startDate, setStartDate] = useState(() =>
    getInitialDate(searchParams, "startDate"),
  );
  const [endDate, setEndDate] = useState(() =>
    getInitialDate(searchParams, "endDate"),
  );
  const [employee, setEmployee] = useState<EmployeeRecap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const getRecap = useCallback(async () => {
    if (!startDate || !endDate) {
      setEmployee(null);
      setErrorMessage("Pilih tanggal mulai dan tanggal akhir.");
      return;
    }

    if (startDate > endDate) {
      setEmployee(null);
      setErrorMessage("Tanggal mulai tidak boleh melewati tanggal akhir.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const queryParams = new URLSearchParams({
        employeeId,
        startDate,
        endDate,
      });

      const response = await fetch(
        `/api/admin/employee-attendance-recap?${queryParams.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      const data: EmployeeAttendanceRecapResponse =
        await readJsonResponse(response);

      if (!response.ok || !data.success) {
        setEmployee(null);
        setErrorMessage(data.message || "Gagal mengambil rekap karyawan.");
        return;
      }

      setEmployee(data.employees?.[0] || null);
    } catch (error) {
      setEmployee(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil rekap karyawan.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, endDate, startDate]);

  useEffect(() => {
    void getRecap();
  }, [getRecap]);

  const summary = useMemo<EmployeeAttendanceSummary>(() => {
    return (
      employee?.summary || {
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
      }
    );
  }, [employee]);

  const backHref = `/admin/rekap-kehadiran-karyawan?startDate=${startDate}&endDate=${endDate}`;

  const attendanceItems = [
    {
      label: "Hadir",
      value: summary.hadir,
      className: "border-emerald-100 bg-emerald-50 text-emerald-700",
    },
    {
      label: "Terlambat (Menit)",
      value: summary.terlambat,
      className: "border-amber-100 bg-amber-50 text-amber-700",
    },
    {
      label: "Sakit",
      value: summary.sakit,
      className: "border-rose-100 bg-rose-50 text-rose-700",
    },
    {
      label: "Cuti",
      value: summary.cuti,
      className: "border-sky-100 bg-sky-50 text-sky-700",
    },
  ];

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <RecapDetailMotionStyles />

      <AppHeader title="Detail Rekap Kehadiran" variant="admin" />

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff]">
        <section className="mx-auto max-w-7xl space-y-7 px-5 py-6 md:px-10 lg:px-16">
          <Link
            href={backHref}
            className="recap-detail-enter inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#123c8c] shadow-lg shadow-slate-300/30 ring-1 ring-blue-100 transition hover:bg-[#f8fbff]"
          >
            <ArrowLeft size={17} strokeWidth={2.8} />
            Kembali ke daftar
          </Link>

          <div className="recap-detail-enter overflow-hidden rounded-[2.25rem] border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="bg-[#123c8c] p-8 text-white md:p-12">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15">
                    <UserRound size={32} strokeWidth={2.6} />
                  </div>

                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-100">
                      Rekap karyawan
                    </p>
                    <h2 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">
                      {employee?.name || "Memuat..."}
                    </h2>
                    <p className="mt-3 text-base font-semibold text-blue-100">
                      {formatDateRange(startDate, endDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 p-7 sm:grid-cols-2 md:p-10">
                <div className="min-h-36 rounded-3xl border border-blue-100 bg-[#f8fbff] p-6">
                  <p className="text-sm font-bold text-slate-500">
                    Masa Kerja
                  </p>
                  <h3 className="mt-4 text-xl font-black leading-snug text-[#123c8c]">
                    {formatEmploymentPeriod(employee)}
                  </h3>
                </div>

                <div className="min-h-36 rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
                  <p className="text-sm font-bold text-emerald-700">
                    Status Kepegawaian
                  </p>
                  <h3 className="mt-4 text-2xl font-black text-emerald-700">
                    {employee?.employmentStatus || "-"}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div
            className="recap-detail-enter rounded-[2.25rem] border border-white/70 bg-white/95 p-8 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-10"
            style={{ animationDelay: "80ms" }}
          >
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="mb-3 block text-sm font-black uppercase tracking-[0.12em] text-slate-500">
                  Tanggal Mulai
                </span>

                <div className="relative">
                  <CalendarDays
                    size={22}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="recap-detail-field h-16 w-full rounded-3xl border border-blue-100 bg-[#f8fbff] py-4 pl-14 pr-5 text-base font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-3 block text-sm font-black uppercase tracking-[0.12em] text-slate-500">
                  Tanggal Akhir
                </span>

                <div className="relative">
                  <CalendarDays
                    size={22}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="recap-detail-field h-16 w-full rounded-3xl border border-blue-100 bg-[#f8fbff] py-4 pl-14 pr-5 text-base font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </label>
            </div>
          </div>

          {errorMessage ? (
            <div className="recap-detail-enter rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="recap-detail-enter flex min-h-56 flex-col items-center justify-center gap-3 rounded-[2rem] border border-blue-100 bg-white p-8 text-center shadow-xl shadow-slate-300/30">
              <Loader2
                className="h-8 w-8 animate-spin text-[#123c8c]"
                strokeWidth={2.7}
              />
              <p className="text-sm font-bold text-slate-500">
                Menghitung rekap salary...
              </p>
            </div>
          ) : (
            <>
              <div
                className="recap-detail-enter grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
                style={{ animationDelay: "120ms" }}
              >
                {attendanceItems.map((item) => (
                  <div
                    key={item.label}
                    className={`min-h-36 rounded-3xl border p-6 ${item.className}`}
                  >
                    <p className="text-sm font-black">{item.label}</p>
                    <p className="mt-5 text-4xl font-black">{item.value}</p>
                  </div>
                ))}
              </div>

              <div
                className="recap-detail-enter rounded-[2.25rem] border border-blue-100 bg-white p-7 shadow-xl shadow-slate-300/30 md:p-9"
                style={{ animationDelay: "160ms" }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eaf1ff] text-[#123c8c]">
                    <Banknote size={31} strokeWidth={2.6} />
                  </div>

                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-[#123c8c]">
                      Estimasi Salary
                    </p>
                    <h3 className="mt-2 text-3xl font-black text-slate-950">
                      {formatCurrency(summary.estimasiSalary)}
                    </h3>
                  </div>
                </div>

                <div className="mt-7 grid gap-5 md:grid-cols-3">
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                    <p className="text-sm font-black text-slate-500">
                      Gaji Pokok
                    </p>
                    <p className="mt-3 text-xl font-black text-slate-950">
                      {formatCurrency(summary.gajiPokok)}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6">
                    <p className="text-sm font-black text-amber-700">
                      Potongan per Hari
                    </p>
                    <p className="mt-3 text-xl font-black text-amber-700">
                      {formatCurrency(summary.potonganPerHari)}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-red-100 bg-red-50 p-6">
                    <p className="text-sm font-black text-red-700">
                      Potongan Cuti/Sakit
                    </p>
                    <p className="mt-3 text-xl font-black text-red-700">
                      {formatCurrency(summary.estimasiPotonganTidakMasuk)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </MobileShell>
  );
}
