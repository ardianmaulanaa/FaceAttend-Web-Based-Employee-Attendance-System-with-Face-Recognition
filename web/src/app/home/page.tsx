"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  FileText,
  History,
  Megaphone,
  ScanFace,
  UserRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type AttendanceToday = {
  checkIn: string;
  checkOut: string;
  status: string;
  description: string;
  schedule?: string;
};

type CurrentUser = {
  id?: string;
  name: string;
  email?: string;
  role?: string;
  profile_photo?: string | null;
  position?: {
    id?: string;
    name: string;
  } | null;
  department?: {
    id?: string;
    name: string;
  } | null;
  unit?: {
    id?: string;
    name: string;
  } | null;
  shift?: {
    id?: string;
    name: string;
  } | null;
};

type Announcement = {
  id: string;
  title: string;
  content?: string;
  status?: string;
  created_at?: string;
  createdAt?: string;
};

const quickMenus = [
  {
    href: "/history",
    label: "Laporan\nPresensi",
    title: "Laporan Presensi",
    description: "Lihat riwayat absensi dan detail kehadiran.",
    icon: History,
  },
  {
    href: "/attendance",
    label: "Presensi",
    title: "Face Attendance",
    description: "Lakukan check-in atau check-out dengan verifikasi wajah.",
    icon: ScanFace,
  },
  {
    href: "/profile",
    label: "Profil",
    title: "Profil Saya",
    description: "Lihat data akun, unit, divisi, jabatan, dan shift.",
    icon: UserRound,
  },
  {
    href: "/cuti",
    label: "Izin/Cuti",
    title: "Izin / Cuti",
    description: "Ajukan cuti, izin, sakit, atau keperluan lainnya.",
    icon: FileText,
  },
];

function getFirstName(name: string) {
  return name.split(" ").filter(Boolean)[0] || name;
}

function getInitialName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeTime(value?: string) {
  if (!value || value === "--:--") return "--:--";

  return value.replace(".", ":");
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  const [user, setUser] = useState<CurrentUser>({
    name: "",
    role: "",
    profile_photo: null,
    position: null,
    department: null,
    unit: null,
    shift: null,
  });

  const [attendanceToday, setAttendanceToday] = useState<AttendanceToday>({
    checkIn: "--:--",
    checkOut: "--:--",
    status: "Pending",
    description: "Menunggu absensi",
    schedule: "",
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readAnnouncementId, setReadAnnouncementId] = useState<string | null>(
    null
  );

  useEffect(() => {
    function updateTime() {
      const now = new Date();

      const time = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(now)
        .replace(".", ":");

      const date = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(now);

      setCurrentTime(`${time} WIB`);
      setCurrentDate(date);
    }

    updateTime();

    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedReadId = window.localStorage.getItem(
      "faceattend_read_announcement_id"
    );

    setReadAnnouncementId(savedReadId);
  }, []);

  useEffect(() => {
    async function getProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await readJsonResponse(response);
        const payload = data.user || data.data || data;

        setUser({
          id: payload.id,
          name: payload.name || "",
          email: payload.email,
          role: payload.role || "",
          profile_photo: payload.profile_photo || null,
          position: payload.position || null,
          department: payload.department || null,
          unit: payload.unit || null,
          shift: payload.shift || null,
        });
      } catch (error) {
        console.error("Gagal mengambil profil:", error);
      }
    }

    async function getTodayAttendance() {
      try {
        const response = await fetch("/api/attendance/today", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await readJsonResponse(response);

        setAttendanceToday({
          checkIn: normalizeTime(data.checkIn || "--:--"),
          checkOut: normalizeTime(data.checkOut || "--:--"),
          status: data.status || "Pending",
          description: data.description || "Menunggu absensi",
          schedule:
            data.schedule ||
            data.workSchedule ||
            data.shiftSchedule ||
            "",
        });
      } catch (error) {
        console.error("Gagal mengambil data absensi hari ini:", error);
      }
    }

    async function getAnnouncements() {
      try {
        const response = await fetch("/api/announcements?audience=employee", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          setAnnouncements([]);
          return;
        }

        const data = await readJsonResponse(response);
        const list = data.announcements || data.data || [];

        setAnnouncements(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("Gagal mengambil pengumuman:", error);
        setAnnouncements([]);
      }
    }

    getProfile();
    getTodayAttendance();
    getAnnouncements();
  }, []);

  const firstName = user.name ? getFirstName(user.name) : "";
  const hasAnnouncement = announcements.length > 0;
  const latestAnnouncementId = announcements[0]?.id || "";

  const hasUnreadAnnouncement =
    Boolean(latestAnnouncementId) && latestAnnouncementId !== readAnnouncementId;

  function markAnnouncementsAsRead() {
    if (!latestAnnouncementId) return;

    window.localStorage.setItem(
      "faceattend_read_announcement_id",
      latestAnnouncementId
    );

    setReadAnnouncementId(latestAnnouncementId);
  }

  const employeeTitle = useMemo(() => {
    if (user.position?.name) return user.position.name;
    if (user.department?.name) return user.department.name;

    return "";
  }, [user.position?.name, user.department?.name]);

  const mainRoleLabel = useMemo(() => {
    if (user.shift?.name) return user.shift.name;
    if (user.position?.name) return user.position.name;
    if (user.department?.name) return user.department.name;

    return "";
  }, [user.shift?.name, user.position?.name, user.department?.name]);

  const workScheduleText = useMemo(() => {
    if (attendanceToday.schedule) {
      return `Jam kerja kamu pukul ${attendanceToday.schedule}`;
    }

    if (user.shift?.name) {
      return `Shift kamu: ${user.shift.name}`;
    }

    return "Jam kerja mengikuti shift yang terdaftar";
  }, [attendanceToday.schedule, user.shift?.name]);

  const hasCheckedIn = attendanceToday.checkIn !== "--:--";
  const hasCheckedOut = attendanceToday.checkOut !== "--:--";

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <div className="hidden md:block">
        <AppHeader
          title="Home"
          subtitle="Dashboard Absensi"
          rightLabel={mainRoleLabel || undefined}
          variant="employee"
        />
      </div>

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff] pb-28 text-slate-950">
        <section className="mx-auto max-w-7xl px-5 pt-7 md:hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-blue-100">
                <Image
                  src="/images/creativemu-logo/creativemu.png"
                  alt="Creativemu Logo"
                  width={56}
                  height={56}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>

              {user.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt={user.name || "Profile"}
                  className="h-14 w-14 shrink-0 rounded-full object-cover ring-4 ring-white"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#eaf1ff] text-sm font-black text-[#123c8c] ring-4 ring-white">
                  {user.name ? getInitialName(user.name) : ""}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#123c8c]">
                  FaceAttend
                </p>

                <h1 className="mt-1 truncate text-lg font-black text-[#073456]">
                  {user.name || "Memuat profil..."}
                </h1>

                {mainRoleLabel ? (
                  <p className="truncate text-sm font-bold text-slate-500">
                    {mainRoleLabel}
                  </p>
                ) : null}
              </div>
            </div>

            <Link
              href="/pengumuman"
              onClick={markAnnouncementsAsRead}
              className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 transition active:scale-[0.96] ${
                hasUnreadAnnouncement
                  ? "bg-[#123c8c] text-white ring-[#123c8c]"
                  : "bg-white text-slate-400 ring-blue-100"
              }`}
              aria-label="Pengumuman"
            >
              <Bell
                size={24}
                fill={hasUnreadAnnouncement ? "white" : "transparent"}
                strokeWidth={2.2}
              />

              {hasUnreadAnnouncement ? (
                <span className="absolute right-2 top-2 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
              ) : null}
            </Link>
          </div>

          <div className="py-10 text-center">
            <p className="text-sm font-black uppercase tracking-[0.26em] text-[#123c8c]">
              Selamat Datang
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-tight text-[#073456]">
              {firstName ? `Halo, ${firstName}` : "Memuat profil..."}
            </h2>

            <p className="mt-4 text-xl font-bold text-slate-500">
              Semoga harimu produktif.
            </p>
          </div>
        </section>

        <section className="mx-auto hidden max-w-7xl px-10 pt-8 md:block lg:px-16">
          <div className="relative overflow-hidden rounded-[2.2rem] bg-[#123c8c] p-8 text-white">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute bottom-[-7rem] right-24 h-60 w-60 rounded-full bg-blue-300/10" />

            <div className="relative z-10 flex items-center justify-between gap-8">
              <div className="flex items-center gap-5">
                {user.profile_photo ? (
                  <img
                    src={user.profile_photo}
                    alt={user.name || "Profile"}
                    className="h-24 w-24 shrink-0 rounded-full object-cover ring-4 ring-white/70"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl font-black text-white ring-4 ring-white/20">
                    {user.name ? getInitialName(user.name) : ""}
                  </div>
                )}

                <div>
                  <h1 className="text-4xl font-black tracking-tight">
                    {firstName ? `Halo, ${firstName}` : "Memuat profil..."}
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-blue-100">
                    Kelola kehadiran, riwayat presensi, profil, dan pengajuan
                    izin dalam satu dashboard karyawan.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.shift?.name ? (
                      <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
                        {user.shift.name}
                      </span>
                    ) : null}

                    {employeeTitle ? (
                      <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
                        {employeeTitle}
                      </span>
                    ) : null}

                    {user.unit?.name ? (
                      <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
                        {user.unit.name}
                      </span>
                    ) : null}

                    {user.department?.name ? (
                      <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
                        {user.department.name}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <Link
                href="/pengumuman"
                onClick={markAnnouncementsAsRead}
                className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ring-1 transition active:scale-[0.96] ${
                  hasUnreadAnnouncement
                    ? "bg-white text-[#123c8c] ring-white"
                    : "bg-white/10 text-white/70 ring-white/20"
                }`}
                aria-label="Pengumuman"
              >
                <Bell
                  size={28}
                  fill={hasUnreadAnnouncement ? "#123c8c" : "transparent"}
                  strokeWidth={2.2}
                />

                {hasUnreadAnnouncement ? (
                  <span className="absolute right-3 top-3 h-4 w-4 rounded-full bg-red-500 ring-2 ring-white" />
                ) : null}
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl rounded-t-[2.5rem] bg-white px-5 pb-10 pt-8 md:mt-8 md:rounded-[2.5rem] md:px-8 lg:px-10">
          <div className="mb-8">
            <div className="grid grid-cols-4 gap-x-3 gap-y-9 md:grid-cols-4 md:gap-5">
              {quickMenus.map((menu) => {
                const Icon = menu.icon;

                return (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    className="group flex flex-col items-center rounded-3xl text-center transition md:border md:border-blue-100 md:bg-[#f8fbff] md:p-6 md:hover:-translate-y-1"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf1ff] md:h-20 md:w-20">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#123c8c] text-white md:h-14 md:w-14">
                        <Icon size={24} strokeWidth={2.6} />
                      </div>
                    </div>

                    <p className="mt-3 whitespace-pre-line text-[13px] font-bold leading-tight text-slate-600 md:text-base">
                      {menu.label}
                    </p>

                    <p className="mt-2 hidden text-sm leading-6 text-slate-400 md:block">
                      {menu.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-blue-100 bg-white p-5 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
                    {currentTime || "--:-- WIB"}
                  </p>

                  <div className="rounded-full bg-[#eaf1ff] px-3 py-1.5 text-xs font-black text-[#123c8c]">
                    WIB
                  </div>
                </div>

                <p className="mt-3 text-sm font-bold text-slate-500 md:text-base">
                  {currentDate || "Memuat tanggal..."}
                </p>

                <p className="mt-5 text-sm font-semibold text-slate-500 md:text-lg">
                  {workScheduleText}
                </p>

                <p className="mt-3 text-sm font-semibold text-slate-500 md:text-lg">
                  Status hari ini:{" "}
                  <span className="font-black text-[#123c8c]">
                    {attendanceToday.status}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:w-[460px]">
                <Link
                  href={hasCheckedIn ? "#" : "/attendance"}
                  onClick={(event) => {
                    if (hasCheckedIn) event.preventDefault();
                  }}
                  className={`flex h-16 items-center justify-center rounded-2xl text-sm font-black transition active:scale-[0.98] md:h-20 md:text-lg ${
                    hasCheckedIn
                      ? "cursor-not-allowed bg-slate-100 text-slate-300"
                      : "bg-[#123c8c] text-white"
                  }`}
                >
                  Masuk
                </Link>

                <Link
                  href={!hasCheckedIn || hasCheckedOut ? "#" : "/attendance"}
                  onClick={(event) => {
                    if (!hasCheckedIn || hasCheckedOut) event.preventDefault();
                  }}
                  className={`flex h-16 items-center justify-center rounded-2xl border text-sm font-black transition active:scale-[0.98] md:h-20 md:text-lg ${
                    !hasCheckedIn || hasCheckedOut
                      ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300"
                      : "border-blue-100 bg-white text-[#123c8c]"
                  }`}
                >
                  Keluar
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-between md:mt-14">
            <div>
              <h2 className="text-xl font-black text-slate-950 md:text-2xl">
                Pengumuman
              </h2>

              <p className="mt-1 hidden text-sm font-semibold text-slate-500 md:block">
                Informasi terbaru dari perusahaan.
              </p>
            </div>

            <Link
              href="/pengumuman"
              onClick={markAnnouncementsAsRead}
              className="text-sm font-black text-[#123c8c] md:text-base"
            >
              Lihat Lainnya
            </Link>
          </div>

          <div className="mt-6">
            {hasAnnouncement ? (
              <div className="grid gap-4 md:grid-cols-2">
                {announcements.slice(0, 2).map((announcement) => (
                  <Link
                    href="/pengumuman"
                    onClick={markAnnouncementsAsRead}
                    key={announcement.id}
                    className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-5 transition hover:bg-[#eef5ff]"
                  >
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#eaf1ff] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#123c8c]">
                      <Megaphone size={14} />
                      Pengumuman
                    </div>

                    <p className="text-base font-black text-slate-950">
                      {announcement.title}
                    </p>

                    {announcement.content ? (
                      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">
                        {announcement.content}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-blue-100 bg-[#f8fbff] px-5 py-10 text-center md:py-14">
                <p className="text-sm font-bold text-slate-400 md:text-base">
                  Pengumuman Kosong
                </p>
              </div>
            )}
          </div>
        </section>

        <BottomNav />
      </main>
    </MobileShell>
  );
}