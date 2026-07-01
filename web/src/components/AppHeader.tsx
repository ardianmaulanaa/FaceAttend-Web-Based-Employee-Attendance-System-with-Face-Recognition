"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, LogOut, Search, UserCircle2 } from "lucide-react";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  rightLabel?: string;
  variant?: "employee" | "admin";
};

const employeeNav = [
  { href: "/home", label: "Home" },
  { href: "/attendance", label: "Attendance" },
  { href: "/salary", label: "Salary" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
];

const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/master-data", label: "Master Data" },
  { href: "/admin/reports", label: "Reports" },
];

export default function AppHeader({
  title,
  subtitle,
  variant = "employee",
}: AppHeaderProps) {
  const pathname = usePathname();
  const menus = variant === "admin" ? adminNav : employeeNav;

  const activeAdminMenu = useMemo(() => {
    return adminNav.find((menu) => pathname.startsWith(menu.href));
  }, [pathname]);

  if (variant === "admin") {
    return (
      <>
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-blue-100 bg-white md:block">
          <div className="flex h-full flex-col p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-[#f6f8ff] p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
                <Image
                  src="/images/creativemu-logo/creativemu.png"
                  alt="Creativemu Logo"
                  width={40}
                  height={40}
                  className="h-9 w-9 object-contain"
                  priority
                />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#123c8c]">
                  FaceAttend
                </p>
                <p className="text-sm font-black text-slate-900">Admin Panel</p>
              </div>
            </div>

            <nav className="mt-6 space-y-2">
              {adminNav.map((menu) => {
                const active = pathname === menu.href;

                return (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition-all duration-200 ${
                      active
                        ? "bg-[#123c8c] text-white"
                        : "text-slate-500 hover:bg-[#f2f6ff] hover:text-[#123c8c]"
                    }`}
                  >
                    <span>{menu.label}</span>
                    <ChevronRight size={16} />
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-4">
              <Link
                href="/login"
                className="flex items-center justify-between rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-black text-[#123c8c] transition hover:bg-[#eaf1ff]"
              >
                <span>Logout</span>
                <LogOut size={16} />
              </Link>
            </div>
          </div>
        </aside>

        <header className="sticky top-0 z-30 border-b border-white/60 bg-white/90 px-4 py-3 shadow-sm shadow-slate-200/50 backdrop-blur-2xl md:px-6">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="hidden flex-1 items-center gap-2 rounded-2xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 md:flex">
              <Search size={16} className="text-slate-400" />
              <input
                aria-label="Cari data admin"
                placeholder="Search karyawan, laporan, atau status..."
                className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                aria-label="Notifikasi admin"
                className="relative hidden h-10 w-10 items-center justify-center rounded-2xl border border-blue-100 bg-[#f6f8ff] text-[#123c8c] transition hover:bg-[#eaf1ff] md:flex"
              >
                <Bell size={17} />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>

              <div className="hidden items-center gap-2 rounded-2xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 md:flex">
                <UserCircle2 size={18} className="text-[#123c8c]" />
                <div>
                  <p className="text-xs font-black text-slate-800">
                    Admin Creativemu
                  </p>
                  <p className="text-[10px] font-semibold text-slate-500">
                    {activeAdminMenu?.label || "Dashboard"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 md:hidden">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#123c8c]">
              FaceAttend
            </p>
            <h1 className="text-xl font-black text-slate-900">{title}</h1>
            {subtitle && (
              <p className="text-xs font-semibold text-slate-500">{subtitle}</p>
            )}
          </div>
        </header>
      </>
    );
  }

  return (
    <header className="sticky top-0 z-30 overflow-hidden border-b border-white/60 bg-white/85 px-5 py-4 shadow-sm shadow-slate-200/40 backdrop-blur-2xl md:px-10 lg:px-16">
      <Image
        src="/images/creativemu-logo/creativemu.png"
        alt="Creativemu Background Logo"
        width={190}
        height={190}
        className="pointer-events-none absolute right-10 top-1/2 hidden h-auto -translate-y-1/2 opacity-[0.04] md:block"
        priority
      />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg shadow-slate-300/50">
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
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#123c8c]">
              FaceAttend
            </p>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-1 max-w-[320px] text-sm leading-5 text-slate-500 md:max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <nav className="hidden items-center justify-center gap-2 md:flex">
          {menus.map((menu) => {
            const active = pathname === menu.href;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`rounded-2xl px-4 py-2 text-sm font-black transition-all duration-300 ${
                  active
                    ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                    : "text-slate-500 hover:bg-slate-100 hover:text-[#123c8c]"
                }`}
              >
                {menu.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center justify-end md:flex">
          <Link
            href="/login"
            className="rounded-2xl bg-[#eaf1ff] px-5 py-2.5 text-xs font-black text-[#123c8c] transition hover:bg-[#dceaff] active:scale-[0.98]"
          >
            Logout
          </Link>
        </div>
      </div>
    </header>
  );
}
