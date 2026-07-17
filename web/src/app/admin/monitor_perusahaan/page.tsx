"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Home,
  Loader2,
  TrendingUp,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";
import { useTheme } from "@/context/ThemeContext";

const metricOptions = [
  { value: "present", label: "Hadir" },
  { value: "late", label: "Terlambat" },
  { value: "wfh", label: "WFH" },
  { value: "visit", label: "Kunjungan" },
  { value: "cuti", label: "Cuti" },
] as const;

const displayModeOptions = [
  { value: "chart", label: "Grafik Bar" },
  { value: "numbers", label: "Angka Ringkas" },
] as const;

type MetricValue = (typeof metricOptions)[number]["value"];
type DisplayMode = (typeof displayModeOptions)[number]["value"];

type Summary = {
  activeEmployees: number;
  todayRecords: number;

  present: number;
  late: number;
  wfh: number;
  visit: number;
  cuti: number;
  pending: number;

  presentPercentage: number;
  latePercentage: number;
  wfhPercentage: number;
  visitPercentage: number;
  cutiPercentage: number;
  pendingPercentage: number;

  totalLateMinutesMonth: number;
  totalWorkMinutesMonth: number;
};

type DailyChartPoint = {
  label: string;
  date: string;
  present: number;
  late: number;
  wfh: number;
  visit: number;
  cuti: number;
  pending: number;
  active: number;
  todayRecords: number;
};

type AlertItem = {
  id: string;
  employeeName: string;
  mode: string;
  checkIn: string;
};

type LateReasonItem = {
  id: string;
  employeeName: string;
  date: string;
  checkIn: string;
  lateMinutes: number;
  reason?: string;
};

type VisitItem = {
  id: string;
  date: string;
  employeeName: string;
  title: string;
  clientName: string | null;
  address: string | null;
  startTime: string;
  note: string | null;
  hasPhoto: boolean;
};

type MonitorResponse = {
  month: number;
  year: number;
  today: string;
  generatedAt: string;
  summary: Summary;
  dailyChart: DailyChartPoint[];
  alerts: AlertItem[];
  lateReasons: LateReasonItem[];
  visits: VisitItem[];
};

type AdminLeaveRequest = {
  id: string;
  employeeName?: string;
  employeeCode?: string | null;
  leaveType?: string;
  leaveTypeLabel?: string;
  startDate: string;
  endDate: string;
  startDateRaw?: string | null;
  endDateRaw?: string | null;
  totalDays?: number;
  reason?: string;
  status: string;
  statusLabel?: string;
  adminNote?: string | null;
  createdAt?: string | null;
};

type LeaveEndpointResponse = {
  success: boolean;
  message?: string;
  error?: string;
  requests?: AdminLeaveRequest[];
};

type LeaveChartPoint = {
  label: string;
  value: number;
};

type FlexibleModeKey = "wfh" | "visit";

type FlexibleModeTotals = Record<FlexibleModeKey, number>;

type FlexibleModeCardItem = {
  key: FlexibleModeKey;
  label: string;
  value: number;
  percentage: number;
  description: string;
};

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

const indonesianMonthMap: Record<string, number> = {
  januari: 0,
  februari: 1,
  maret: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  agustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  desember: 11,
};

function getMetricValue(point: DailyChartPoint, metric: MetricValue) {
  if (metric === "cuti") return 0;
  return Number(point[metric] || 0);
}

function getMetricLabel(metric: MetricValue) {
  return (
    metricOptions.find((option) => option.value === metric)?.label || "Kategori"
  );
}

function formatWorkMode(mode: string) {
  if (mode === "wfh") return "WFH";
  if (mode === "visit") return "Kunjungan";
  if (mode === "office") return "Kantor";

  return "Lainnya";
}

function formatMinutes(minutes: number) {
  if (!minutes || minutes <= 0) return "0 menit";

  if (minutes < 60) return `${minutes} menit`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (restMinutes === 0) return `${hours} jam`;

  return `${hours} jam ${restMinutes} menit`;
}

function normalizeDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateValue(value?: string | null) {
  if (!value) return null;

  const cleanValue = String(value).trim();

  if (!cleanValue || cleanValue === "-") return null;

  const normalDate = new Date(cleanValue);

  if (!Number.isNaN(normalDate.getTime())) {
    return normalizeDateOnly(normalDate);
  }

  const parts = cleanValue
    .replace(",", "")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    const day = Number(parts[0]);
    const monthName = parts[1].toLowerCase();
    const year = Number(parts[2]);
    const monthIndex = indonesianMonthMap[monthName];

    if (
      !Number.isNaN(day) &&
      !Number.isNaN(year) &&
      typeof monthIndex === "number"
    ) {
      return new Date(year, monthIndex, day);
    }
  }

  return null;
}

function isApprovedLeave(status: string) {
  return String(status || "").toLowerCase() === "approved";
}

function getLeaveChartData(
  monitorData: MonitorResponse | null,
  leaveRequests: AdminLeaveRequest[],
  month: number,
  year: number,
) {
  const fallbackPoints = monitorData?.dailyChart || [];

  const approvedRequests = leaveRequests.filter((item) =>
    isApprovedLeave(item.status),
  );

  const approvedRequestsInMonth = approvedRequests.filter((request) => {
    const submittedDate = parseDateValue(request.createdAt);

    if (!submittedDate) return false;

    return (
      submittedDate.getFullYear() === year &&
      submittedDate.getMonth() === month - 1
    );
  });

  const dailyPoints: LeaveChartPoint[] = fallbackPoints.map((point) => {
    const labelDay = Number(point.label);

    const totalSubmissionOnDay = approvedRequestsInMonth.filter((request) => {
      const submittedDate = parseDateValue(request.createdAt);

      if (!submittedDate || Number.isNaN(labelDay)) return false;

      return submittedDate.getDate() === labelDay;
    }).length;

    return {
      label: point.label,
      value: totalSubmissionOnDay,
    };
  });

  return {
    dailyPoints,
    approvedRequestsInMonth,
    totalApprovedRequests: approvedRequestsInMonth.length,
  };
}

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

function getDailyChartModeTotals(
  dailyChart: DailyChartPoint[] = [],
): FlexibleModeTotals {
  return dailyChart.reduce<FlexibleModeTotals>(
    (total, point) => {
      total.wfh += toSafeNumber(point.wfh);
      total.visit += toSafeNumber(point.visit);

      return total;
    },
    {
      wfh: 0,
      visit: 0,
    },
  );
}

function getSummaryModeValue(
  summary: Summary,
  key: FlexibleModeKey,
  dailyTotals?: FlexibleModeTotals,
) {
  const summaryValue =
    key === "wfh" ? toSafeNumber(summary.wfh) : toSafeNumber(summary.visit);

  const dailyValue = dailyTotals ? toSafeNumber(dailyTotals[key]) : 0;

  return Math.max(summaryValue, dailyValue);
}

function getMonitoringBase(summary: Summary, dailyTotals?: FlexibleModeTotals) {
  const todayRecords = toSafeNumber(summary.todayRecords);
  const activeEmployees = toSafeNumber(summary.activeEmployees);
  const flexibleSummaryTotal =
    toSafeNumber(summary.wfh) + toSafeNumber(summary.visit);

  const flexibleDailyTotal = dailyTotals
    ? toSafeNumber(dailyTotals.wfh) + toSafeNumber(dailyTotals.visit)
    : 0;

  if (todayRecords > 0) return todayRecords;
  if (activeEmployees > 0) return activeEmployees;
  if (flexibleSummaryTotal > 0) return flexibleSummaryTotal;
  if (flexibleDailyTotal > 0) return flexibleDailyTotal;

  return 0;
}

function getSummaryModePercentage(
  summary: Summary,
  key: FlexibleModeKey,
  dailyTotals?: FlexibleModeTotals,
) {
  const value = getSummaryModeValue(summary, key, dailyTotals);
  const base = getMonitoringBase(summary, dailyTotals);

  if (base <= 0 || value <= 0) return 0;

  return Math.min(Number(((value / base) * 100).toFixed(1)), 100);
}

function MonitorMotionStyles() {
  return (
    <style>{`
      @keyframes monitorEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes monitorRowEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes monitorBarEnter {
        0% {
          opacity: 0;
          transform: scaleY(0.15);
        }

        100% {
          opacity: 1;
          transform: scaleY(1);
        }
      }

      .monitor-enter {
        animation: monitorEnter 320ms ease-out both;
      }

      .monitor-row-enter {
        opacity: 0;
        animation: monitorRowEnter 300ms ease-out both;
      }

      .monitor-bar-enter {
        transform-origin: bottom;
        animation: monitorBarEnter 420ms ease-out both;
      }

      .monitor-field {
        transition:
          border-color 180ms ease,
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      @media (prefers-reduced-motion: reduce) {
        .monitor-enter,
        .monitor-row-enter,
        .monitor-bar-enter {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

function AnimatedHistogram({
  metricLabel,
  unit,
  points,
  maxValue,
}: {
  metricLabel: string;
  unit: string;
  points: Array<{
    label: string;
    value: number;
  }>;
  maxValue: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mobileShowAll, setMobileShowAll] = useState(false);
  const safeMaxValue = Math.max(maxValue, 1);
  const activePoint =
    activeIndex !== null && points[activeIndex] ? points[activeIndex] : null;

  // Mobile: filter to only non-zero points unless "show all" is toggled
  const nonZeroPoints = points.filter((p) => p.value > 0);
  const mobilePoints = mobileShowAll
    ? points
    : nonZeroPoints.length > 0
      ? nonZeroPoints
      : points;
  const hasHiddenZeros =
    !mobileShowAll &&
    nonZeroPoints.length > 0 &&
    nonZeroPoints.length < points.length;

  return (
    <>
      <style jsx global>{`
        @keyframes histogramTooltipIn {
          from {
            opacity: 0;
            transform: translate(-50%, 8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }

        @keyframes histogramBarGlow {
          0% {
            box-shadow: 0 0 0 rgba(18, 60, 140, 0);
          }
          100% {
            box-shadow: 0 14px 30px rgba(18, 60, 140, 0.22);
          }
        }

        @keyframes mobileBarFill {
          from {
            width: 0%;
          }
        }

        .chart-scroll-container {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        .chart-scroll-container::-webkit-scrollbar {
          height: 6px;
        }
        .chart-scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .chart-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 9999px;
        }
        .chart-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.35);
        }
      `}</style>

      <div className="monitor-row-enter mt-6 w-full rounded-[1.25rem] border border-blue-100 bg-[#123c8c] p-3 text-white shadow-xl shadow-blue-900/15 sm:rounded-[1.65rem] md:rounded-[2rem] md:p-5">
        <div className="w-full">
          <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-100 sm:text-[10px] md:text-xs">
                Histogram Monitor
              </p>

              <h4 className="mt-1 truncate text-lg font-black tracking-tight text-white sm:text-xl md:text-2xl">
                {metricLabel} per Tanggal
              </h4>
            </div>

            <div className="w-fit rounded-xl bg-white/10 px-2.5 py-1.5 text-[10px] font-black text-blue-50 ring-1 ring-white/10 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-xs md:px-4 md:py-3 md:text-sm">
              Maksimum: {safeMaxValue} {unit}
            </div>
          </div>

          {/* ====== MOBILE VIEW: Horizontal bar rows (hidden on md+) ====== */}
          <div className="mt-4 rounded-[1.1rem] border border-white/10 bg-[#0f3578] p-3 shadow-inner md:hidden">
            <div className="space-y-1.5">
              {mobilePoints.map((point, index) => {
                const widthPercent = Math.max(
                  (point.value / safeMaxValue) * 100,
                  point.value > 0 ? 6 : 0,
                );

                return (
                  <div
                    key={`mobile-${metricLabel}-${point.label}`}
                    className="monitor-row-enter flex items-center gap-2"
                    style={{ animationDelay: `${index * 25}ms` }}
                  >
                    {/* Date label */}
                    <span className="w-7 shrink-0 text-right text-[11px] font-black text-blue-100/80">
                      {point.label}
                    </span>

                    {/* Bar track */}
                    <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-white/5">
                      <div
                        className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-blue-300/90 to-blue-200/80 transition-all duration-500 ease-out"
                        style={{
                          width: `${widthPercent}%`,
                          animation: "mobileBarFill 600ms ease-out",
                          animationDelay: `${index * 30}ms`,
                          animationFillMode: "backwards",
                        }}
                      />

                      {/* Value inside bar */}
                      {point.value > 0 ? (
                        <span
                          className="absolute inset-y-0 flex items-center text-[10px] font-black"
                          style={{
                            left:
                              widthPercent > 20
                                ? "8px"
                                : `calc(${widthPercent}% + 6px)`,
                            color: widthPercent > 20 ? "#0f3578" : "#93c5fd",
                          }}
                        >
                          {point.value} {unit}
                        </span>
                      ) : (
                        <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-medium text-blue-200/40">
                          0
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Toggle show all / show active only */}
            {hasHiddenZeros ? (
              <button
                type="button"
                onClick={() => setMobileShowAll(!mobileShowAll)}
                className="mt-3 w-full rounded-lg bg-white/8 px-3 py-2 text-[10px] font-black text-blue-200 ring-1 ring-white/10 transition hover:bg-white/12 active:scale-[0.98]"
              >
                {mobileShowAll
                  ? `Sembunyikan tanggal kosong`
                  : `Tampilkan semua ${points.length} tanggal`}
              </button>
            ) : null}

            {/* Summary info */}
            <div className="mt-3 flex items-center justify-between">
              <div className="rounded-full bg-white/8 px-2.5 py-1 text-[9px] font-black text-blue-50/70 ring-1 ring-white/8">
                {nonZeroPoints.length} dari {points.length} tanggal ada data
              </div>

              <div className="rounded-full bg-white/8 px-2.5 py-1 text-[9px] font-black text-blue-100 ring-1 ring-white/8">
                Total: {points.reduce((s, p) => s + p.value, 0)} {unit}
              </div>
            </div>
          </div>

          {/* ====== DESKTOP VIEW: Cleaner horizontal bars for web (hidden below md) ====== */}
          <div className="relative mt-5 hidden rounded-[1.6rem] border border-white/10 bg-[#0f3578] shadow-inner md:block dark:border-white/15 dark:bg-[#111a2a]">
            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="chart-scroll-container max-h-[360px] overflow-y-auto pr-1">
                <div className="space-y-2.5">
                  {points.map((point, index) => {
                    const widthPercent = Math.max(
                      (point.value / safeMaxValue) * 100,
                      point.value > 0 ? 5 : 0,
                    );
                    const isActive = activeIndex === index;

                    return (
                      <button
                        key={`${metricLabel}-${point.label}`}
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                        onFocus={() => setActiveIndex(index)}
                        onBlur={() => setActiveIndex(null)}
                        onClick={() => setActiveIndex(isActive ? null : index)}
                        className={`monitor-row-enter grid w-full grid-cols-[44px_minmax(0,1fr)_90px] items-center gap-3 rounded-xl px-2 py-2 text-left transition duration-200 ${
                          isActive
                            ? "bg-white/14 ring-1 ring-white/20"
                            : "bg-white/6 hover:bg-white/10"
                        }`}
                        style={{ animationDelay: `${index * 16}ms` }}
                        aria-label={`${metricLabel} tanggal ${point.label}: ${point.value} ${unit}`}
                      >
                        <span className="text-xs font-black text-blue-100">
                          {point.label}
                        </span>

                        <span className="relative h-8 overflow-hidden rounded-lg bg-white/12">
                          <span
                            className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ease-out ${
                              isActive
                                ? "bg-gradient-to-r from-blue-100 to-blue-200"
                                : "bg-gradient-to-r from-blue-300/95 to-blue-200/90"
                            }`}
                            style={{ width: `${widthPercent}%` }}
                          />
                        </span>

                        <span className="truncate text-right text-xs font-black text-white">
                          {point.value} {unit}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-white/12 bg-white/8 p-3 ring-1 ring-white/8">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100/80">
                  Ringkasan Web
                </p>

                <p className="mt-2 text-sm font-black text-white">
                  {points.length} tanggal dipantau
                </p>

                <p className="mt-1 text-xs font-semibold text-blue-100/80">
                  Total: {points.reduce((sum, item) => sum + item.value, 0)}{" "}
                  {unit}
                </p>

                <p className="mt-1 text-xs font-semibold text-blue-100/80">
                  Rata-rata:{" "}
                  {(
                    points.reduce((sum, item) => sum + item.value, 0) /
                    Math.max(points.length, 1)
                  ).toFixed(1)}{" "}
                  {unit}
                </p>

                <div className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-blue-50 ring-1 ring-white/10">
                  {activePoint
                    ? `${metricLabel} tgl ${activePoint.label}: ${activePoint.value} ${unit}`
                    : "Hover bar untuk detail harian"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Number(value) || 0;
    if (start === end) {
      setCount(end);
      return;
    }

    const duration = 800; // 800ms
    const totalSteps = 30;
    const stepTime = duration / totalSteps;
    const increment = (end - start) / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <>{count}</>;
}

function PieProgressCard({
  label,
  value,
  percentage,
  description,
  icon,
}: {
  label: string;
  value: number;
  percentage: number;
  description: string;
  icon: ReactNode;
}) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  const targetValue = toSafeNumber(value);
  const targetPercentage = Math.max(0, Math.min(100, toSafeNumber(percentage)));

  useEffect(() => {
    setAnimatedValue(0);
    setAnimatedPercentage(0);

    const duration = 1000; // 1s duration
    const steps = 40;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeProgress = progress * (2 - progress); // easeOutQuad

      setAnimatedValue(Math.round(targetValue * easeProgress));
      setAnimatedPercentage(targetPercentage * easeProgress);

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedValue(targetValue);
        setAnimatedPercentage(targetPercentage);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [value, percentage]);

  const { theme } = useTheme();

  const visualPercentage =
    animatedValue > 0 && animatedPercentage > 0
      ? Math.max(animatedPercentage, 1.5)
      : animatedPercentage;
  const rest = 100 - animatedPercentage;

  const currentRotation = 360 * (animatedPercentage / 100);

  return (
    <div className="monitor-row-enter rounded-2xl border border-blue-100 bg-white p-3 shadow-lg shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/40 sm:rounded-3xl sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-black text-slate-950 sm:mt-2 sm:text-3xl">
            {animatedValue}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">{description}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f6f8ff] text-[#123c8c] ring-1 ring-blue-100">
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 sm:mt-5 sm:gap-4">
        <div
          className="relative h-20 w-20 shrink-0 rounded-full transition-transform duration-300 sm:h-24 sm:w-24"
          style={{
            background: `conic-gradient(${theme === "dark" ? "#388bfd" : "#123c8c"} 0% ${visualPercentage}%, ${theme === "dark" ? "#30363d" : "#dbeafe"} ${visualPercentage}% 100%)`,
            transform: `rotate(${currentRotation}deg)`,
          }}
        >
          <div
            className="absolute inset-[8px] flex items-center justify-center rounded-full bg-white pie-progress-circle sm:inset-[10px]"
            style={{ transform: `rotate(-${currentRotation}deg)` }}
          >
            <div className="text-center">
              <p className="text-base font-black text-slate-950 sm:text-lg">
                {animatedPercentage.toFixed(1)}%
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                Proporsi
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-[#f8fbff] px-2.5 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-blue-100 pie-capsule-terpakai sm:rounded-2xl sm:px-3 sm:py-2 sm:text-sm">
            <span>Terpakai</span>
            <span className="font-black text-[#123c8c]">
              {animatedPercentage.toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-100 pie-capsule-sisa sm:rounded-2xl sm:px-3 sm:py-2 sm:text-sm">
            <span>Sisa</span>
            <span className="font-black text-slate-700">
              {rest.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCompanyMonitorPage() {
  const now = new Date();

  const [displayMode, setDisplayMode] = useState<DisplayMode>("chart");
  const [selectedMetric, setSelectedMetric] = useState<MetricValue>("present");

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [data, setData] = useState<MonitorResponse | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<AdminLeaveRequest[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadMonitorData() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [monitorResponse, leaveResponse] = await Promise.all([
        fetch(`/api/admin/monitor-perusahaan?month=${month}&year=${year}`, {
          method: "GET",
          cache: "no-store",
        }),
        fetch("/api/admin/leave-requests", {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      const monitorResult = await readJsonResponse(monitorResponse);

      if (!monitorResponse.ok) {
        throw new Error(
          monitorResult?.message || "Gagal mengambil data monitor perusahaan.",
        );
      }

      let leaveResult: LeaveEndpointResponse = {
        success: false,
        requests: [],
      };

      try {
        leaveResult = await readJsonResponse(leaveResponse);
      } catch {
        leaveResult = {
          success: false,
          requests: [],
        };
      }

      setData({
        ...monitorResult,
        summary: {
          ...monitorResult.summary,
          activeEmployees: toSafeNumber(
            monitorResult?.summary?.activeEmployees,
          ),
          todayRecords: toSafeNumber(monitorResult?.summary?.todayRecords),
          present: toSafeNumber(monitorResult?.summary?.present),
          late: toSafeNumber(monitorResult?.summary?.late),
          wfh: toSafeNumber(monitorResult?.summary?.wfh),
          visit: toSafeNumber(monitorResult?.summary?.visit),
          cuti: toSafeNumber(monitorResult?.summary?.cuti),
          pending: toSafeNumber(monitorResult?.summary?.pending),
          presentPercentage: toSafeNumber(
            monitorResult?.summary?.presentPercentage,
          ),
          latePercentage: toSafeNumber(monitorResult?.summary?.latePercentage),
          wfhPercentage: toSafeNumber(monitorResult?.summary?.wfhPercentage),
          visitPercentage: toSafeNumber(
            monitorResult?.summary?.visitPercentage,
          ),
          cutiPercentage: toSafeNumber(monitorResult?.summary?.cutiPercentage),
          pendingPercentage: toSafeNumber(
            monitorResult?.summary?.pendingPercentage,
          ),
          totalLateMinutesMonth: toSafeNumber(
            monitorResult?.summary?.totalLateMinutesMonth,
          ),
          totalWorkMinutesMonth: toSafeNumber(
            monitorResult?.summary?.totalWorkMinutesMonth,
          ),
        },
        dailyChart: Array.isArray(monitorResult?.dailyChart)
          ? monitorResult.dailyChart.map((item: DailyChartPoint) => ({
              ...item,
              present: toSafeNumber(item?.present),
              late: toSafeNumber(item?.late),
              wfh: toSafeNumber(item?.wfh),
              visit: toSafeNumber(item?.visit),
              cuti: toSafeNumber(item?.cuti),
              pending: toSafeNumber(item?.pending),
              active: toSafeNumber(item?.active),
              todayRecords: toSafeNumber(item?.todayRecords),
            }))
          : [],
        alerts: Array.isArray(monitorResult?.alerts)
          ? monitorResult.alerts
          : [],
        lateReasons: Array.isArray(monitorResult?.lateReasons)
          ? monitorResult.lateReasons
          : [],
      });

      setLeaveRequests(
        leaveResponse.ok &&
          leaveResult.success &&
          Array.isArray(leaveResult.requests)
          ? leaveResult.requests
          : [],
      );
    } catch (error) {
      setData(null);
      setLeaveRequests([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengambil data.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadMonitorData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const leaveChartData = useMemo(() => {
    return getLeaveChartData(data, leaveRequests, month, year);
  }, [data, leaveRequests, month, year]);

  const flexibleModeTotals = useMemo<FlexibleModeTotals>(() => {
    return getDailyChartModeTotals(data?.dailyChart || []);
  }, [data]);

  const metricChart = useMemo(() => {
    if (!data) {
      return {
        unit: "data",
        points: [],
        maxValue: 1,
      };
    }

    if (selectedMetric === "cuti") {
      const values = leaveChartData.dailyPoints.map((point) => point.value);

      return {
        unit: "pengajuan",
        points: leaveChartData.dailyPoints,
        maxValue: Math.max(...values, 1),
      };
    }

    const points = data.dailyChart.map((point) => ({
      label: point.label,
      value: getMetricValue(point, selectedMetric),
    }));

    return {
      unit: "data",
      points,
      maxValue: Math.max(...points.map((item) => item.value), 1),
    };
  }, [data, selectedMetric, leaveChartData]);

  const summaryCards = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: "Hadir",
        value: data.summary.present,
        note: `${data.summary.presentPercentage}% dari total karyawan`,
      },
      {
        label: "Terlambat",
        value: data.summary.late,
        note: `${data.summary.latePercentage}% dari total karyawan`,
      },
      {
        label: "WFH",
        value: getSummaryModeValue(data.summary, "wfh", flexibleModeTotals),
        note: `${getSummaryModePercentage(
          data.summary,
          "wfh",
          flexibleModeTotals,
        )}% dari total data`,
      },
      {
        label: "Kunjungan",
        value: getSummaryModeValue(data.summary, "visit", flexibleModeTotals),
        note: `${getSummaryModePercentage(
          data.summary,
          "visit",
          flexibleModeTotals,
        )}% dari total data`,
      },
      {
        label: "Cuti",
        value: leaveChartData.totalApprovedRequests,
        note: "pengajuan cuti disetujui bulan ini",
      },
    ];
  }, [data, leaveChartData, flexibleModeTotals]);

  const flexibleModeCards = useMemo<FlexibleModeCardItem[]>(() => {
    if (!data) return [];

    return [
      {
        key: "wfh",
        label: "WFH",
        value: getSummaryModeValue(data.summary, "wfh", flexibleModeTotals),
        percentage: getSummaryModePercentage(
          data.summary,
          "wfh",
          flexibleModeTotals,
        ),
        description: "Monitoring absensi kerja dari rumah.",
      },
      {
        key: "visit",
        label: "Kunjungan",
        value: getSummaryModeValue(data.summary, "visit", flexibleModeTotals),
        percentage: getSummaryModePercentage(
          data.summary,
          "visit",
          flexibleModeTotals,
        ),
        description: "Monitoring absensi kunjungan lapangan / client.",
      },
    ];
  }, [data, flexibleModeTotals]);

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <MonitorMotionStyles />

      <AppHeader title="Monitor Perusahaan" variant="admin" />

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff]">
        <section className="mx-auto max-w-7xl space-y-4 px-3 py-4 sm:space-y-5 sm:px-4 sm:py-5 md:space-y-6 md:px-10 md:py-6 lg:px-16">
          <div className="monitor-enter overflow-hidden rounded-[1.25rem] border border-blue-100 bg-white shadow-xl shadow-slate-300/30 sm:rounded-[1.5rem] md:rounded-[2rem]">
            <div className="grid gap-0 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="bg-[#123c8c] p-4 text-white sm:p-6 md:p-8">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 sm:h-12 sm:w-12 sm:rounded-2xl">
                    <BarChart3
                      size={22}
                      strokeWidth={2.6}
                      className="sm:hidden"
                    />
                    <BarChart3
                      size={25}
                      strokeWidth={2.6}
                      className="hidden sm:block"
                    />
                  </div>

                  <div>
                    <h2 className="text-xl font-black tracking-tight sm:mt-1 sm:text-3xl md:text-4xl">
                      Snapshot Perusahaan
                    </h2>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-3 sm:space-y-5 sm:p-5 md:p-6">
                <div
                  className="monitor-row-enter"
                  style={{ animationDelay: "60ms" }}
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Mode Tampilan
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-xl bg-[#f6f8ff] p-1 ring-1 ring-blue-100 sm:mt-3 sm:gap-2 sm:rounded-2xl sm:p-1.5">
                    {displayModeOptions.map((option) => {
                      const active = displayMode === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDisplayMode(option.value)}
                          className={`h-9 rounded-lg text-xs font-black transition active:scale-[0.98] sm:h-11 sm:rounded-xl sm:text-sm ${
                            active
                              ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                              : "text-slate-500 hover:bg-white hover:text-[#123c8c]"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="monitor-row-enter grid gap-2 sm:gap-3 md:grid-cols-2"
                  style={{ animationDelay: "100ms" }}
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Bulan
                    </p>

                    <select
                      value={month}
                      onChange={(event) => setMonth(Number(event.target.value))}
                      className="monitor-field mt-1.5 h-10 w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 text-xs font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100 sm:mt-2 sm:h-12 sm:rounded-2xl sm:px-4 sm:text-sm"
                    >
                      {monthOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Tahun
                    </p>

                    <input
                      type="number"
                      value={year}
                      onChange={(event) => setYear(Number(event.target.value))}
                      className="monitor-field mt-1.5 h-10 w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 text-xs font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100 sm:mt-2 sm:h-12 sm:rounded-2xl sm:px-4 sm:text-sm"
                    />
                  </div>
                </div>

                <div
                  className="monitor-row-enter rounded-xl border border-blue-100 bg-[#f8fbff] p-3 sm:rounded-2xl sm:p-4"
                  style={{ animationDelay: "140ms" }}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#123c8c] sm:text-xs sm:tracking-[0.16em]">
                    Kategori Grafik Aktif
                  </p>

                  <p className="mt-1.5 text-xl font-black text-slate-950 sm:mt-2 sm:text-2xl">
                    {getMetricLabel(selectedMetric)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="monitor-enter flex min-h-[240px] items-center justify-center rounded-2xl border border-blue-100 bg-white sm:min-h-[320px] sm:rounded-3xl">
              <div className="text-center">
                <Loader2 className="mx-auto animate-spin text-[#123c8c]" />
                <p className="mt-3 text-sm font-black text-slate-600">
                  Mengambil data monitor perusahaan...
                </p>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="monitor-enter rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-700 sm:rounded-3xl sm:p-5 sm:text-sm">
              {errorMessage}
            </div>
          ) : data ? (
            <>
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                <div
                  className="monitor-row-enter rounded-xl border border-amber-100 bg-white p-3 shadow-lg shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/40 sm:rounded-2xl sm:p-4"
                  style={{ animationDelay: "60ms" }}
                >
                  <div className="flex items-center gap-2 text-amber-700">
                    <Clock3 size={18} />
                    <p className="text-sm font-black text-slate-900">
                      Telat Bulan Ini
                    </p>
                  </div>

                  <p className="mt-1.5 text-xl font-black text-amber-700 sm:mt-2 sm:text-2xl">
                    {formatMinutes(data.summary.totalLateMinutesMonth)}
                  </p>
                </div>

                <div
                  className="monitor-row-enter rounded-xl border border-blue-100 bg-white p-3 shadow-lg shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/40 sm:rounded-2xl sm:p-4"
                  style={{ animationDelay: "100ms" }}
                >
                  <div className="flex items-center gap-2 text-[#123c8c]">
                    <TrendingUp size={18} />
                    <p className="text-sm font-black text-slate-900">
                      Total Jam Kerja
                    </p>
                  </div>

                  <p className="mt-1.5 text-xl font-black text-slate-950 sm:mt-2 sm:text-2xl">
                    {formatMinutes(data.summary.totalWorkMinutesMonth)}
                  </p>
                </div>
              </div>

              <div
                className="monitor-enter rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl shadow-slate-300/30 sm:rounded-3xl sm:p-5"
                style={{ animationDelay: "100ms" }}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[#123c8c]">
                      <BriefcaseBusiness size={18} />
                      <p className="text-xs font-black uppercase tracking-[0.16em]">
                        Monitoring Mode Kerja Fleksibel
                      </p>
                    </div>

                    <h3 className="mt-1.5 text-lg font-black text-slate-950 sm:mt-2 sm:text-2xl">
                      Ringkasan WFH dan Kunjungan
                    </h3>
                  </div>

                  <div className="rounded-xl bg-[#f8fbff] px-3 py-2 text-xs font-black text-[#123c8c] ring-1 ring-blue-100 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    Total data hari ini: {data.summary.todayRecords}
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:mt-5 sm:gap-4 md:grid-cols-2">
                  {flexibleModeCards.map((item, index) => {
                    const icon =
                      item.key === "wfh" ? (
                        <Home size={20} strokeWidth={2.5} />
                      ) : (
                        <BriefcaseBusiness size={20} strokeWidth={2.5} />
                      );

                    return (
                      <div
                        key={item.key}
                        className="monitor-row-enter rounded-xl border border-blue-100 bg-[#f8fbff] p-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60 sm:rounded-2xl sm:p-4"
                        style={{
                          animationDelay: `${index * 70}ms`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                              {item.label}
                            </p>
                            <p className="mt-1.5 text-2xl font-black text-slate-950 sm:mt-2 sm:text-3xl">
                              {item.value}
                            </p>
                          </div>

                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#123c8c] ring-1 ring-blue-100">
                            {icon}
                          </div>
                        </div>

                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-blue-100">
                          <div
                            className="h-full rounded-full bg-[#123c8c] transition-all duration-700 ease-out"
                            style={{
                              width: `${Math.min(item.percentage, 100)}%`,
                            }}
                          />
                        </div>

                        <p className="mt-3 text-sm font-black text-[#123c8c]">
                          {item.percentage.toFixed(1)}% dari total data
                        </p>

                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {displayMode === "chart" ? (
                <div
                  className="monitor-enter rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl shadow-slate-300/30 sm:rounded-3xl sm:p-5"
                  style={{ animationDelay: "140ms" }}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[#123c8c]">
                        <BarChart3 size={18} />

                        <p className="text-xs font-black uppercase tracking-[0.16em]">
                          Analitik Monitor Perusahaan
                        </p>
                      </div>

                      <h3 className="mt-1.5 text-lg font-black text-slate-950 sm:mt-2 sm:text-2xl">
                        Grafik Bar Berdasarkan Kategori
                      </h3>

                      <p className="mt-1.5 text-xs font-semibold text-slate-500 sm:mt-2 sm:text-sm md:text-base">
                        Total waktu terlambat bulan ini:{" "}
                        <span className="font-black text-slate-700">
                          {formatMinutes(data.summary.totalLateMinutesMonth)}
                        </span>
                      </p>

                      {selectedMetric === "cuti" ? (
                        <p className="mt-1 text-xs font-bold text-slate-400">
                          Cuti bulan ini: {leaveChartData.totalApprovedRequests}{" "}
                          pengajuan disetujui.
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-xl bg-[#f8fbff] px-3 py-2 text-xs font-black text-[#123c8c] ring-1 ring-blue-100 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                      {getMetricLabel(selectedMetric)}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {metricOptions.map((option) => {
                      const active = selectedMetric === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSelectedMetric(option.value)}
                          className={`inline-flex h-8 items-center justify-center rounded-full px-3 text-[10px] font-black transition active:scale-[0.98] sm:h-10 sm:px-4 sm:text-xs ${
                            active
                              ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                              : "bg-[#f6f8ff] text-slate-500 ring-1 ring-blue-100 hover:bg-[#eaf1ff] hover:text-[#123c8c]"
                          }`}
                        >
                          {active ? (
                            <CheckCircle2
                              size={14}
                              strokeWidth={2.7}
                              className="mr-1.5"
                            />
                          ) : null}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatedHistogram
                    metricLabel={getMetricLabel(selectedMetric)}
                    unit={metricChart.unit}
                    points={metricChart.points}
                    maxValue={metricChart.maxValue}
                  />
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {summaryCards.map((item, index) => {
                    const isHadir = item.label === "Hadir";
                    const isLateOrCuti =
                      item.label === "Terlambat" || item.label === "Cuti";
                    const valueColor = isHadir
                      ? "text-emerald-600"
                      : isLateOrCuti
                        ? "text-red-600"
                        : "text-slate-950";
                    const noteColor = isHadir
                      ? "text-emerald-600"
                      : isLateOrCuti
                        ? "text-red-600"
                        : "text-[#123c8c]";

                    return (
                      <div
                        key={item.label}
                        className="monitor-row-enter rounded-xl border border-blue-100 bg-white p-3 shadow-lg shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/40 sm:rounded-2xl sm:p-4"
                        style={{
                          animationDelay: `${index * 55}ms`,
                        }}
                      >
                        <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                          {item.label}
                        </p>

                        <p
                          className={`mt-1.5 text-2xl font-black sm:mt-2 sm:text-3xl ${valueColor}`}
                        >
                          <AnimatedCounter value={item.value} />
                        </p>

                        <p className={`mt-1 text-xs font-black ${noteColor}`}>
                          {item.note}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              <div
                className="monitor-enter rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl shadow-slate-300/30 sm:rounded-3xl sm:p-5"
                style={{ animationDelay: "180ms" }}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[#123c8c]">
                      <TrendingUp size={18} />
                      <p className="text-xs font-black uppercase tracking-[0.16em]">
                        Pie Chart Monitoring
                      </p>
                    </div>

                    <h3 className="mt-1.5 text-lg font-black text-slate-950 sm:mt-2 sm:text-2xl">
                      Pie Chart Terpisah per Kategori
                    </h3>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:mt-5 sm:gap-4 md:grid-cols-2">
                  <PieProgressCard
                    label="WFH"
                    value={getSummaryModeValue(
                      data.summary,
                      "wfh",
                      flexibleModeTotals,
                    )}
                    percentage={getSummaryModePercentage(
                      data.summary,
                      "wfh",
                      flexibleModeTotals,
                    )}
                    description="Proporsi absensi WFH pada periode monitor."
                    icon={<Home size={20} strokeWidth={2.5} />}
                  />

                  <PieProgressCard
                    label="Kunjungan"
                    value={getSummaryModeValue(
                      data.summary,
                      "visit",
                      flexibleModeTotals,
                    )}
                    percentage={getSummaryModePercentage(
                      data.summary,
                      "visit",
                      flexibleModeTotals,
                    )}
                    description="Proporsi absensi kunjungan pada periode monitor."
                    icon={<BriefcaseBusiness size={20} strokeWidth={2.5} />}
                  />
                </div>
              </div>

              <div
                className="monitor-enter rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl shadow-slate-300/30 sm:rounded-3xl sm:p-5"
                style={{ animationDelay: "220ms" }}
              >
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle size={18} />

                  <h3 className="text-base font-black text-slate-950 sm:text-lg">
                    Perlu Tindak Lanjut
                  </h3>
                </div>

                {data.alerts.length === 0 ? (
                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Tidak ada alert belum check-out hari ini.
                  </p>
                ) : (
                  <div className="mt-3 grid gap-2 sm:mt-4 md:grid-cols-2">
                    {data.alerts.map((alert, index) => (
                      <div
                        key={alert.id}
                        className="monitor-row-enter rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2"
                        style={{
                          animationDelay: `${index * 55}ms`,
                        }}
                      >
                        <p className="text-sm font-black text-slate-900">
                          {alert.employeeName}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-600">
                          Check-in {alert.checkIn} • mode{" "}
                          {formatWorkMode(alert.mode)} • belum check-out
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="monitor-enter rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl shadow-slate-300/30 sm:rounded-3xl sm:p-5"
                style={{ animationDelay: "260ms" }}
              >
                <div className="flex items-center gap-2 text-amber-700">
                  <Clock3 size={18} />

                  <h3 className="text-base font-black text-slate-950 sm:text-lg">
                    Rekap Karyawan Terlambat
                  </h3>
                </div>

                {data.lateReasons.length === 0 ? (
                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Belum ada data keterlambatan pada periode ini.
                  </p>
                ) : (
                  <div className="-mx-1 mt-3 overflow-x-auto px-1 sm:mt-4">
                    <table className="w-full min-w-[480px] text-left text-xs sm:min-w-[620px] sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs uppercase tracking-[0.14em] text-slate-500">
                          <th className="py-3 pr-4">Tanggal</th>
                          <th className="py-3 pr-4">Karyawan</th>
                          <th className="py-3 pr-4">Check-in</th>
                          <th className="py-3 pr-4">Durasi Telat</th>
                        </tr>
                      </thead>

                      <tbody>
                        {data.lateReasons.map((item, index) => (
                          <tr
                            key={item.id}
                            className="monitor-row-enter border-b border-slate-100 last:border-0"
                            style={{
                              animationDelay: `${index * 45}ms`,
                            }}
                          >
                            <td className="py-3 pr-4 font-bold text-slate-700">
                              {item.date}
                            </td>

                            <td className="py-3 pr-4 font-black text-slate-900">
                              {item.employeeName}
                            </td>

                            <td className="py-3 pr-4 font-semibold text-slate-600">
                              {item.checkIn}
                            </td>

                            <td className="py-3 pr-4 font-black text-amber-700">
                              {formatMinutes(item.lateMinutes)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/90 p-3 shadow-xl shadow-slate-300/30 sm:rounded-3xl sm:p-5">
                <div className="flex items-center gap-2 text-[#123c8c]">
                  <ClipboardList size={18} />
                  <h3 className="text-base font-black text-slate-950 sm:text-lg">
                    Bukti Kunjungan Kerja Lapangan
                  </h3>
                </div>

                {!data.visits || data.visits.length === 0 ? (
                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Belum ada data bukti kunjungan pada periode ini.
                  </p>
                ) : (
                  <div className="-mx-1 mt-3 overflow-x-auto px-1 sm:mt-4">
                    <table className="min-w-[580px] w-full text-left text-xs sm:min-w-[760px] sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs uppercase tracking-[0.14em] text-slate-500">
                          <th className="py-3 pr-4">Tanggal</th>
                          <th className="py-3 pr-4">Karyawan</th>
                          <th className="py-3 pr-4">Nama/Kunjungan</th>
                          <th className="py-3 pr-4">Client / Alamat</th>
                          <th className="py-3 pr-4">Waktu</th>
                          <th className="py-3 pr-4">Catatan</th>
                          <th className="py-3 pr-4">Bukti Foto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.visits.map((item: any) => (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="py-3 pr-4 font-bold text-slate-700">
                              {item.date}
                            </td>
                            <td className="py-3 pr-4 font-black text-slate-900">
                              {item.employeeName}
                            </td>
                            <td className="py-3 pr-4 font-semibold text-slate-800">
                              {item.title}
                            </td>
                            <td className="py-3 pr-4 text-slate-600">
                              {item.clientName ? `${item.clientName} - ` : ""}
                              {item.address || "-"}
                            </td>
                            <td className="py-3 pr-4 text-slate-600">
                              {item.startTime}
                            </td>
                            <td className="py-3 pr-4 text-slate-600 text-xs">
                              {item.note || "-"}
                            </td>
                            <td className="py-3 pr-4">
                              {item.hasPhoto ? (
                                <a
                                  href={`/api/visits/${item.id}/photo`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-black text-[#123c8c] hover:bg-blue-100 transition active:scale-[0.97]"
                                >
                                  Lihat Foto
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  Tidak ada
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </section>
      </main>
    </MobileShell>
  );
}
