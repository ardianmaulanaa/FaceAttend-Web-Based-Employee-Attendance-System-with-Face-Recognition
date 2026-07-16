"use client";

import { Construction, Award } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

export default function AdminRewardsPage() {
  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Rewards Karyawan"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl px-5 py-24 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-20 w-20 bg-blue-50 dark:bg-blue-950/20 text-[#123c8c] dark:text-blue-400 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-blue-100 dark:shadow-none animate-bounce">
          <Award size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Fitur Mendatang!</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">
          Halaman Rewards Karyawan sedang dalam tahap pengembangan untuk integrasi sistem leaderboard dan manajemen performa yang lebih baik. Silakan kembali lagi nanti.
        </p>
        <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-2xl">
          <Construction size={14} />
          <span>Coming Soon</span>
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
