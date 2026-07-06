"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Boxes,
  Bell,
  CalendarDays,
  Briefcase,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Layers3,
  Monitor,
  Search,
  UserCircle2,
  UserCog,
  UsersRound,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileImage,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Network,
  ScanFace,
  Settings,
  UserPlus,
  UserRound,
  UserRoundCog,
  X,
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import {
  canAccessAdminPath,
  canViewAdminPanel,
  getAdminNotificationTitle,
  getAdminRoleLabel,
  isAdminPanelRole,
  type AdminRole,
} from "@/lib/adminAccess";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  rightLabel?: string;
  variant?: "employee" | "admin";
};

const employeeNav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/attendance", label: "Attendance", icon: ScanFace },
  { href: "/announcements", label: "Pengumuman", icon: Megaphone },
  { href: "/salary", label: "Salary", icon: FileText },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const adminMainNav: Array<{
  href: string;
  label: string;
  icon: typeof Monitor;
  roles: AdminRole[];
}> = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["owner", "admin", "cs"],
    },
    {
      href: "/admin/monitor_perusahaan",
      label: "Monitor Perusahaan",
      icon: BarChart3,
      roles: ["owner", "admin"],
    },
    {
      href: "/admin/pengumuman",
      label: "Pengumuman",
      icon: Megaphone,
      roles: ["owner", "admin", "cs"],
    },
  ];

const masterDataMenus = [
  {
    href: "/admin/master-data?tab=shift",
    label: "Shift",
    icon: Clock3,
    tab: "shift",
  },
  {
    href: "/admin/master-data?tab=jam-kerja",
    label: "Jam Kerja",
    icon: CalendarClock,
    tab: "jam-kerja",
  },
  {
    href: "/admin/master-data?tab=unit",
    label: "Unit",
    icon: Building2,
    tab: "unit",
  },
  {
    href: "/admin/master-data?tab=divisi",
    label: "Divisi",
    icon: Network,
    tab: "divisi",
  },
  {
    href: "/admin/master-data?tab=jabatan",
    label: "Jabatan",
    icon: UserRoundCog,
    tab: "jabatan",
  },
  {
    href: "/admin/master-data?tab=lokasi-presensi",
    label: "Lokasi Presensi",
    icon: Building2,
    tab: "lokasi-presensi",
  },
  {
    href: "/admin/master-data?tab=istilah",
    label: "Daftar Istilah",
    icon: ClipboardList,
    tab: "istilah",
  },
];

const operationalMenus = [
  {
    href: "/admin/employees",
    label: "Register Employee",
    icon: UserPlus,
  },
  {
    href: "/admin/laporan-kehadiran",
    label: "Laporan Kehadiran",
    icon: FileImage,
  },
  {
    href: "/admin/cuti",
    label: "Laporan Cuti",
    icon: CalendarDays,
  },
];

type AdminSessionUser = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "cs" | "employee";
  phone?: string | null;
  profile_photo_url?: string | null;
};

type AttendanceNotification = {
  id: string;
  type: "check-in" | "check-out" | "absent" | "complaint" | "call";
  employeeName: string;
  happenedAt: string;
  message: string;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/history") {
    return pathname === "/history" || pathname.startsWith("/history/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppHeader(props: AppHeaderProps) {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/90 px-5 py-4 shadow-sm shadow-slate-200/40 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#123c8c]">FaceAttend</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{props.title}</h1>
          </div>
        </div>
      </header>
    }>
      <AppHeaderContent {...props} />
    </Suspense>
  );
}

function AppHeaderContent({
  title,
  subtitle,
  rightLabel,
  variant = "employee",
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeMasterTab = searchParams.get("tab") || "shift";

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isBellMenuOpen, setIsBellMenuOpen] = useState(false);
  const [attendanceNotifications, setAttendanceNotifications] = useState<
    AttendanceNotification[]
  >([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [employeeNotifCountFromApi, setEmployeeNotifCountFromApi] = useState(0);
  const [sessionUser, setSessionUser] = useState<AdminSessionUser | null>(null);
  const { authUser, state } = useAppData();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const bellMenuRef = useRef<HTMLDivElement | null>(null);

  const resolvedVariant = useMemo(() => {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return "admin";
    }
    return variant;
  }, [pathname, variant]);

  const isAdmin = resolvedVariant === "admin";

  const unreadEmployeeNotifications = useMemo(() => {
    if (!authUser || authUser.role !== "employee") return 0;
    return state.notifications.filter(
      (item) => item.employeeId === authUser.id && !item.read,
    ).length;
  }, [authUser, state.notifications]);

  const employeeUnreadCount = Math.max(
    unreadEmployeeNotifications,
    employeeNotifCountFromApi,
  );

  const activeAdminMenu = useMemo(() => {
    const masterDataActive = pathname.startsWith("/admin/master-data");
    if (masterDataActive) {
      return { label: "Master Data" };
    }
    return adminMainNav.find((menu) => pathname.startsWith(menu.href));
  }, [pathname]);

  const adminNotificationTitle = useMemo(() => {
    return getAdminNotificationTitle(sessionUser?.role || "admin");
  }, [sessionUser?.role]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleScroll() {
      setHasScrolled(window.scrollY > 8);
    }

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (variant !== "admin") return;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();
        if (!response.ok || !result.user) return;

        const user = result.user as AdminSessionUser;
        if (!canViewAdminPanel(user.role)) {
          router.replace("/home");
          return;
        }
        setSessionUser(user);
      } catch {
        // Ignore session read errors in header.
      }
    }

    void loadSession();
  }, [variant, router]);

  useEffect(() => {
    if (variant !== "admin") return;
    if (!sessionUser?.role) return;

    if (!canAccessAdminPath(sessionUser.role, pathname)) {
      router.replace("/admin/dashboard");
    }
  }, [pathname, router, sessionUser?.role, variant]);

  useEffect(() => {
    if (variant !== "admin") return;

    async function loadNotifications() {
      try {
        setIsLoadingNotifications(true);
        const response = await fetch("/api/attendance/notifications", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();
        if (!response.ok || !Array.isArray(result.data)) {
          setAttendanceNotifications([]);
          return;
        }

        setAttendanceNotifications(result.data as AttendanceNotification[]);
      } catch {
        setAttendanceNotifications([]);
      } finally {
        setIsLoadingNotifications(false);
      }
    }

    void loadNotifications();
  }, [pathname, variant]);

  useEffect(() => {
    if (variant !== "employee") return;

    async function loadEmployeeNotifications() {
      try {
        const response = await fetch("/api/attendance/notifications", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();
        if (!response.ok || !Array.isArray(result.data)) {
          setEmployeeNotifCountFromApi(0);
          return;
        }

        setEmployeeNotifCountFromApi(result.data.length);
      } catch {
        setEmployeeNotifCountFromApi(0);
      }
    }

    void loadEmployeeNotifications();
  }, [pathname, variant]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }

      if (
        bellMenuRef.current &&
        !bellMenuRef.current.contains(event.target as Node)
      ) {
        setIsBellMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  function handleNavigate(href: string) {
    setIsSidebarOpen(false);
    router.push(href);
  }

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (!response.ok) {
        alert("Gagal logout.");
        return;
      }
      setIsProfileMenuOpen(false);
      setIsSidebarOpen(false);
      router.replace("/login");
    } catch {
      alert("Terjadi kesalahan saat logout.");
    }
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b px-5 py-4 backdrop-blur-2xl transition-all duration-300 md:px-10 lg:px-16 ${hasScrolled
          ? "border-blue-100/80 bg-white/95 shadow-lg shadow-slate-300/30"
          : "border-white/60 bg-white/90 shadow-sm shadow-slate-200/40"
          }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c] shadow-sm transition active:scale-[0.96]"
              aria-label="Open menu"
            >
              <Menu size={24} strokeWidth={2.8} />
            </button>

            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#123c8c] md:text-[10px]">
                FaceAttend
              </p>

              <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950 md:text-2xl lg:text-3xl">
                {title}
              </h1>

              {subtitle ? (
                <p className="mt-1 line-clamp-1 max-w-xl text-sm font-semibold leading-5 text-slate-500 md:text-sm">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin ? (
              <div ref={bellMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsBellMenuOpen(!isBellMenuOpen)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c] transition active:scale-[0.96]"
                  aria-label="Notifications"
                >
                  <Bell size={20} strokeWidth={2.5} />
                  {attendanceNotifications.length > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                      {attendanceNotifications.length}
                    </span>
                  ) : null}
                </button>

                {isBellMenuOpen ? (
                  <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-blue-100 bg-white p-4 shadow-2xl shadow-slate-300/40">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
                      {adminNotificationTitle}
                    </p>

                    {isLoadingNotifications ? (
                      <p className="mt-3 text-sm font-semibold text-slate-400">Memuat...</p>
                    ) : attendanceNotifications.length === 0 ? (
                      <p className="mt-3 text-sm font-semibold text-slate-400">Tidak ada notifikasi baru.</p>
                    ) : (
                      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                        {attendanceNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="rounded-xl bg-[#f6f8ff] p-3"
                          >
                            <p className="text-xs font-black text-[#123c8c]">{notif.employeeName}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">{notif.message}</p>
                            <p className="mt-1 text-[10px] font-semibold text-slate-400">{notif.happenedAt}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}

            {!isAdmin && rightLabel ? (
              <span className="hidden rounded-2xl bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm ring-1 ring-blue-100 md:block">
                {rightLabel}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className={subtitle ? "h-[105px]" : "h-[88px]"} />

      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-[60] h-dvh w-[82vw] max-w-80 border-r border-blue-100 bg-white shadow-2xl shadow-slate-950/20 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-blue-50 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg shadow-slate-300/50 ring-1 ring-blue-100">
                <Image
                  src="/images/creativemu-logo/creativemu.png"
                  alt="Creativemu Logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#123c8c]">
                  FaceAttend
                </p>

                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                  {isAdmin ? "Admin Panel" : "Employee Menu"}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition active:scale-[0.96]"
              aria-label="Close menu"
            >
              <X size={20} strokeWidth={2.8} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            {isAdmin ? (
              <>
                <p className="px-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Menu Utama
                </p>

                <nav className="mt-3 space-y-2">
                  {adminMainNav.map((menu) => {
                    const Icon = menu.icon;
                    const active = isActivePath(pathname, menu.href);

                    return (
                      <button
                        key={menu.href}
                        type="button"
                        onClick={() => handleNavigate(menu.href)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${active
                          ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                          : "text-slate-600 hover:bg-[#eaf1ff] hover:text-[#123c8c]"
                          }`}
                      >
                        <Icon size={18} strokeWidth={2.5} />
                        {menu.label}
                      </button>
                    );
                  })}
                </nav>

                <div className="mt-6">
                  <div className="flex items-center gap-3 rounded-2xl bg-[#f6f8ff] px-4 py-3 text-sm font-black text-[#123c8c]">
                    <Settings size={18} strokeWidth={2.5} />
                    Master Data
                  </div>

                  <div className="mt-2 space-y-1 border-l-2 border-blue-100 pl-4">
                    {masterDataMenus.map((menu) => {
                      const Icon = menu.icon;
                      const active = pathname.startsWith("/admin/master-data") && activeMasterTab === menu.tab;

                      return (
                        <button
                          key={menu.href}
                          type="button"
                          onClick={() => handleNavigate(menu.href)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${active
                            ? "bg-[#eaf1ff] text-[#123c8c]"
                            : "text-slate-500 hover:bg-slate-50 hover:text-[#123c8c]"
                            }`}
                        >
                          <Icon size={15} strokeWidth={2.5} />
                          {menu.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="px-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Operasional
                  </p>

                  <nav className="mt-3 space-y-2">
                    {operationalMenus.map((menu) => {
                      const Icon = menu.icon;
                      const active = isActivePath(pathname, menu.href);

                      return (
                        <button
                          key={menu.href}
                          type="button"
                          onClick={() => handleNavigate(menu.href)}
                          className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${active
                            ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                            : "text-slate-600 hover:bg-[#eaf1ff] hover:text-[#123c8c]"
                            }`}
                        >
                          <Icon size={18} strokeWidth={2.5} />
                          {menu.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {sessionUser ? (
                  <div className="mt-6 rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                      Signed in as
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {sessionUser.name}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">
                      {getAdminRoleLabel(sessionUser.role)}
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <p className="px-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Menu Karyawan
                </p>

                <nav className="mt-3 space-y-2">
                  {employeeNav.map((menu) => {
                    const Icon = menu.icon;
                    const active = isActivePath(pathname, menu.href);

                    return (
                      <button
                        key={menu.href}
                        type="button"
                        onClick={() => handleNavigate(menu.href)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${active
                          ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                          : "text-slate-600 hover:bg-[#eaf1ff] hover:text-[#123c8c]"
                          }`}
                      >
                        <Icon size={18} strokeWidth={2.5} />
                        {menu.label}
                      </button>
                    );
                  })}
                </nav>
              </>
            )}
          </div>

          <div className="border-t border-blue-50 p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100 active:scale-[0.98]"
            >
              <LogOut size={18} strokeWidth={2.5} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
