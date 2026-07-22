"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BarChart3, CalendarDays, Loader2, Users } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";

const histogramSegments = [
  { key: "present", label: "Hadir", color: "#16a34a" },
  { key: "late", label: "Terlambat", color: "#f97316" },
  { key: "visit", label: "Kunjungan", color: "#14b8a6" },
  { key: "cuti", label: "Cuti", color: "#8b5cf6" },
] as const;

type SegmentKey = (typeof histogramSegments)[number]["key"];

type ChartEmployee = {
  id: string;
  name: string;
  employeeCode?: string | null;
  profilePhoto?: string | null;
  profile_photo?: string | null;
};

type DailyChartPoint = {
  label: string;
  date: string;
  present: number;
  late: number;
  visit: number;
  cuti: number;
  employees?: Partial<Record<SegmentKey, ChartEmployee[]>>;
};

type MonitorResponse = {
  month: number;
  year: number;
  dailyChart: DailyChartPoint[];
};

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function toSafeNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getMonthLabel(month: number) {
  const date = new Date(new Date().getFullYear(), Math.max(0, month - 1), 1);

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
  }).format(date);
}

function formatDateLabel(dateValue: string, fallbackDay: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return `Tanggal ${fallbackDay}`;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function normalizeProfilePhotoUrl(photo?: string | null) {
  if (!photo) return "";

  const cleanPhoto = photo.trim();

  if (!cleanPhoto) return "";

  if (
    cleanPhoto.startsWith("http://") ||
    cleanPhoto.startsWith("https://") ||
    cleanPhoto.startsWith("data:") ||
    cleanPhoto.startsWith("/")
  ) {
    return cleanPhoto;
  }

  if (cleanPhoto.startsWith("uploads/")) {
    return `/${cleanPhoto}`;
  }

  return `/uploads/profiles/${cleanPhoto}`;
}

function getInitialName(name?: string | null) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "?";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getEmployeeProfilePhoto(employee: ChartEmployee) {
  return normalizeProfilePhotoUrl(
    employee.profilePhoto || employee.profile_photo || "",
  );
}

function EmployeeAvatar({
  employee,
  color,
}: {
  employee: ChartEmployee;
  color: string;
}) {
  const [imageError, setImageError] = useState(false);
  const profilePhoto = getEmployeeProfilePhoto(employee);

  if (profilePhoto && !imageError) {
    return (
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <img
          src={profilePhoto}
          alt={`Foto profil ${employee.name}`}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white"
      style={{ backgroundColor: color }}
    >
      {getInitialName(employee.name)}
    </div>
  );
}

function HistogramDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = new Date();

  const month = Number(searchParams.get("month")) || now.getMonth() + 1;
  const year = Number(searchParams.get("year")) || now.getFullYear();
  const selectedDate = String(searchParams.get("date") || "");
  const filterParam = String(searchParams.get("filter") || "present");
  const selectedSegment =
    histogramSegments.find((segment) => segment.key === filterParam)?.key ||
    "present";
  const selectedSegmentConfig =
    histogramSegments.find((segment) => segment.key === selectedSegment) ||
    histogramSegments[0];

  const [data, setData] = useState<MonitorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(
          `/api/admin/monitor-perusahaan?month=${month}&year=${year}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(
            result?.message || "Gagal mengambil detail histogram.",
          );
        }

        if (!isMounted) return;

        setData({
          month: toSafeNumber(result?.month) || month,
          year: toSafeNumber(result?.year) || year,
          dailyChart: Array.isArray(result?.dailyChart)
            ? result.dailyChart.map((item: DailyChartPoint) => ({
                ...item,
                present: toSafeNumber(item?.present),
                late: toSafeNumber(item?.late),
                visit: toSafeNumber(item?.visit),
                cuti: toSafeNumber(item?.cuti),
                employees: item?.employees || {},
              }))
            : [],
        });
      } catch (error) {
        if (!isMounted) return;

        setData(null);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Gagal mengambil detail histogram.",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [month, year]);

  const selectedPoint = useMemo(() => {
    if (!data) return null;

    return (
      data.dailyChart.find((point) => point.date === selectedDate) ||
      data.dailyChart.find((point) => point.label === selectedDate) ||
      null
    );
  }, [data, selectedDate]);

  const employees = selectedPoint?.employees?.[selectedSegment] || [];
  const total = selectedPoint ? toSafeNumber(selectedPoint[selectedSegment]) : 0;
  const periodLabel = selectedPoint
    ? formatDateLabel(selectedPoint.date, selectedPoint.label)
    : `${getMonthLabel(month)} ${year}`;

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <AppHeader title="Detail Histogram" variant="admin" />

      <main className="min-h-dvh bg-[#f7f8fb]">
        <section className="mx-auto max-w-7xl space-y-5 px-5 py-6 md:px-8 lg:px-10">
          <button
            type="button"
            onClick={() => router.push("/admin/monitor_perusahaan")}
            className="inline-flex h-11 animate-[detailFadeUp_420ms_ease-out_both] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <ArrowLeft size={18} strokeWidth={2.7} />
            Kembali ke Monitor
          </button>

          <section className="animate-[detailFadeUp_520ms_ease-out_80ms_both] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-300/25">
            <div className="border-b border-slate-100 bg-white p-5 md:p-7">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <BarChart3 size={24} strokeWidth={2.7} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Detail Histogram
                  </p>
                  <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                    {selectedSegmentConfig.label} Karyawan
                  </h1>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {periodLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-3 md:p-5">
              <div className="animate-[detailFadeUp_420ms_ease-out_160ms_both] rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-center gap-2 text-slate-700">
                  <Users size={18} strokeWidth={2.7} />
                  <p className="text-xs font-black uppercase tracking-[0.14em]">
                    Total
                  </p>
                </div>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {total}
                </p>
              </div>

              <div className="animate-[detailFadeUp_420ms_ease-out_220ms_both] rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-center gap-2 text-slate-700">
                  <CalendarDays size={18} strokeWidth={2.7} />
                  <p className="text-xs font-black uppercase tracking-[0.14em]">
                    Tanggal
                  </p>
                </div>
                <p className="mt-2 text-base font-black text-slate-950">
                  {periodLabel}
                </p>
              </div>

              <div className="animate-[detailFadeUp_420ms_ease-out_280ms_both] rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-700">
                  Filter
                </p>
                <p className="mt-2 text-base font-black text-slate-950">
                  {selectedSegmentConfig.label}
                </p>
              </div>
            </div>

            <div className="p-4 md:p-5">
              {isLoading ? (
                <div className="flex min-h-[240px] items-center justify-center rounded-3xl bg-slate-50">
                  <div className="text-center">
                    <Loader2 className="mx-auto animate-spin text-slate-700" />
                    <p className="mt-3 text-sm font-black text-slate-600">
                      Mengambil nama karyawan...
                    </p>
                  </div>
                </div>
              ) : errorMessage ? (
                <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
                  {errorMessage}
                </div>
              ) : !selectedPoint ? (
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8 text-center">
                  <p className="text-sm font-black text-slate-600">
                    Data tanggal ini tidak ditemukan.
                  </p>
                </div>
              ) : employees.length > 0 ? (
                <div className="space-y-2">
                  {employees.map((employee, index) => (
                    <div
                      key={`${employee.id}-${index}`}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                      style={{
                        animation:
                          "detailFadeUp 420ms ease-out both",
                        animationDelay: `${Math.min(index * 55, 420)}ms`,
                      }}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                        style={{ backgroundColor: selectedSegmentConfig.color }}
                        title={`Urutan absen ${index + 1}`}
                      >
                        {index + 1}
                      </div>
                      <EmployeeAvatar
                        employee={employee}
                        color={selectedSegmentConfig.color}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-slate-950">
                          {employee.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-bold text-slate-500">
                          {employee.employeeCode
                            ? `Kode ${employee.employeeCode}`
                            : `Urutan absen #${index + 1}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8 text-center">
                  <p className="text-sm font-black text-slate-600">
                    Belum ada nama karyawan untuk filter ini.
                  </p>
                </div>
              )}
            </div>
          </section>
        </section>
      </main>

      <style jsx global>{`
        @keyframes detailFadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </MobileShell>
  );
}

export default function HistogramDetailPage() {
  return (
    <Suspense fallback={null}>
      <HistogramDetailContent />
    </Suspense>
  );
}
