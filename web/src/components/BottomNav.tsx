"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ClipboardList,
  UserRound,
  LayoutDashboard,
  Layers3,
  UsersRound,
  Wallet,
  Megaphone,
  LogOut,
} from "lucide-react";
import { isAdminPanelRole, type AdminRole } from "@/lib/adminAccess";

type BottomNavProps = {
  variant?: "employee" | "admin";
};

const employeeMenus = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/attendance", label: "Attend", icon: ClipboardList },
  { href: "/salary", label: "Salary", icon: Wallet },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/announcements", label: "Info", icon: Megaphone },
];

const adminMenusByRole: Record<
  AdminRole,
  Array<{ href: string; label: string; icon: typeof LayoutDashboard }>
> = {
  owner: [
    { href: "/admin/dashboard", label: "Dash", icon: LayoutDashboard },
    { href: "/admin/employees", label: "Staff", icon: UsersRound },
    { href: "/admin/master-data", label: "Master", icon: Layers3 },
    { href: "/admin/employee-requests", label: "Layanan", icon: ClipboardList },
    { href: "/login", label: "Logout", icon: LogOut },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dash", icon: LayoutDashboard },
    { href: "/admin/employees", label: "Staff", icon: UsersRound },
    { href: "/login", label: "Logout", icon: LogOut },
  ],
  cs: [
    { href: "/admin/dashboard", label: "Dash", icon: LayoutDashboard },
    { href: "/admin/employee-requests", label: "Layanan", icon: ClipboardList },
    { href: "/login", label: "Logout", icon: LogOut },
  ],
};

export default function BottomNav({ variant = "employee" }: BottomNavProps) {
  const pathname = usePathname();
  const [adminRole, setAdminRole] = useState<AdminRole>("admin");

  useEffect(() => {
    if (variant !== "admin") return;

    let active = true;

    async function loadSessionRole() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });
        const result = await response.json();

        if (!active || !response.ok) return;
        const role = String(result.user?.role || "").toLowerCase();
        if (isAdminPanelRole(role)) {
          setAdminRole(role);
        }
      } catch {
        if (active) {
          setAdminRole("admin");
        }
      }
    }

    void loadSessionRole();

    return () => {
      active = false;
    };
  }, [variant]);

  const menus = useMemo(() => {
    if (variant !== "admin") return employeeMenus;
    return adminMenusByRole[adminRole];
  }, [adminRole, variant]);

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-[2rem] border border-white/70 bg-white/90 px-3 py-3 shadow-2xl shadow-slate-300/60 backdrop-blur-2xl md:hidden">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${menus.length}, minmax(0, 1fr))`,
        }}
      >
        {menus.map((menu) => {
          const Icon = menu.icon;
          const active =
            pathname === menu.href || pathname.startsWith(`${menu.href}/`);

          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-[1.5rem] px-2 py-3 text-xs font-black transition-all duration-300 ${
                active
                  ? "bg-[#123c8c] text-white shadow-xl shadow-blue-900/30"
                  : "text-slate-400 hover:bg-[#eaf1ff] hover:text-[#123c8c]"
              }`}
            >
              {active && (
                <span className="absolute -top-3 h-1.5 w-10 rounded-full bg-[#7dbbff]" />
              )}

              <Icon size={24} strokeWidth={2.7} />
              <span>{menu.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
