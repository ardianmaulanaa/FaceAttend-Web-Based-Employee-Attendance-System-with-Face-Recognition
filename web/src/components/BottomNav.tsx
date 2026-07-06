"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Home, ScanFace, UserRound } from "lucide-react";

type BottomNavProps = {
  variant?: "employee" | "admin";
};

const employeeMenus = [
  {
    href: "/home",
    label: "Home",
    icon: Home,
  },
  {
    href: "/attendance",
    label: "Attend",
    icon: ScanFace,
  },
  {
    href: "/history",
    label: "History",
    icon: History,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserRound,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/home") {
    return pathname === "/home" || pathname === "/";
  }

  if (href === "/history") {
    return pathname === "/history" || pathname.startsWith("/history/");
  }

  if (href === "/profile") {
    return pathname === "/profile";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function BottomNav({ variant = "employee" }: BottomNavProps) {
  const pathname = usePathname();

  if (variant === "admin") {
    return null;
  }

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[34rem] -translate-x-1/2 md:hidden">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 px-3 py-3 shadow-2xl shadow-slate-400/30 backdrop-blur-2xl">
        <div className="grid grid-cols-4 gap-2">
          {employeeMenus.map((menu) => {
            const Icon = menu.icon;
            const active = isActivePath(pathname, menu.href);

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`relative flex h-[4.7rem] flex-col items-center justify-center gap-1 rounded-[1.45rem] text-xs font-black transition-all duration-300 active:scale-[0.96] ${
                  active
                    ? "bg-[#123c8c] text-white shadow-xl shadow-blue-900/25"
                    : "text-slate-400 hover:bg-[#f6f8ff] hover:text-[#123c8c]"
                }`}
              >
                {active ? (
                  <span className="absolute -top-2 h-1.5 w-12 rounded-full bg-blue-300" />
                ) : null}

                <Icon
                  size={26}
                  strokeWidth={active ? 2.8 : 2.5}
                  className={active ? "text-white" : "text-slate-400"}
                />

                <span className="leading-none">{menu.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
