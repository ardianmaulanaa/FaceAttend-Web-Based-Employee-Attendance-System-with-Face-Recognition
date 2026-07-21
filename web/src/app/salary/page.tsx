"use client";

import { useEffect, useState } from "react";
import { Coins, CheckCircle, AlertTriangle, Printer, Loader2, FileText, Calendar, Scale, Info } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type ProfileData = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  employment_status: "kartap" | "kontrak" | "magang" | "pkl" | null;
  contract_start_date: string | null;
  base_salary: number | string | null;
  department?: { name: string } | null;
  position?: { name: string } | null;
};

type SalaryRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  amount: number;
  note: string;
  createdAt: string;
};

export default function EmployeeSalaryPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Attendance stats for current month
  const [attendanceStats, setAttendanceStats] = useState({
    hadir: 0,
    telat: 0,
    izin: 0,
    sakit: 0,
    cuti: 0,
    alpa: 0,
    totalDays: 30,
    recommendedSalary: 0,
  });

  const fetchStats = async (email: string, baseSalary: number) => {
    try {
      const today = new Date();
      const monthNum = today.getMonth() + 1;
      const yearNum = today.getFullYear();
      
      const res = await fetch(`/api/admin/attendance-reports?search=${encodeURIComponent(email)}&month=${monthNum}&year=${yearNum}`);
      const data = await res.json();
      
      if (data.success && data.reports) {
        const reports = data.reports;
        const hadir = reports.filter((a: any) => {
          const s = String(a.statusLabel || a.status || "").toLowerCase();
          return s.includes("hadir") || s.includes("present") || s.includes("on_time") || s === "on_time";
        }).length;
        const telat = reports.filter((a: any) => {
          const s = String(a.statusLabel || a.status || "").toLowerCase();
          return s.includes("lambat") || s.includes("late");
        }).length;
        const izin = reports.filter((a: any) => {
          const s = String(a.statusLabel || a.status || "").toLowerCase();
          return s.includes("izin") || s.includes("permission");
        }).length;
        const sakit = reports.filter((a: any) => {
          const s = String(a.statusLabel || a.status || "").toLowerCase();
          return s.includes("sakit");
        }).length;
        const cuti = reports.filter((a: any) => {
          const s = String(a.statusLabel || a.status || "").toLowerCase();
          return s.includes("cuti");
        }).length;

        const totalDays = new Date(yearNum, monthNum, 0).getDate();
        const activeCount = hadir + telat + izin + sakit + cuti;
        const alpa = 0;

        const recommended = baseSalary;

        setAttendanceStats({
          hadir,
          telat,
          izin,
          sakit,
          cuti,
          alpa,
          totalDays,
          recommendedSalary: recommended,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [profileRes, salRes] = await Promise.all([
          fetch("/api/profile", { cache: "no-store" }),
          fetch("/api/salary", { cache: "no-store" }),
        ]);

        const profileData = await profileRes.json();
        const salData = await salRes.json();

        if (profileData.success && profileData.user) {
          setProfile(profileData.user);
          const base = Number(profileData.user.base_salary || 0);
          void fetchStats(profileData.user.email, base);
        }
        if (salData.success && salData.records) {
          setRecords(salData.records);
        }
      } catch (err) {
        console.error("Gagal memuat data payroll karyawan:", err);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchData();
  }, []);

  return (
    <MobileShell variant="employee">
      <AppHeader
        title="Payroll & Slip Gaji"
        subtitle="Slip gaji bulanan dan status rincian prorata Kemnaker"
        variant="employee"
      />

      <main className="min-h-screen bg-[#f8fbff] dark:bg-[#161b22] pb-24">
        <div className="mx-auto max-w-7xl px-5 py-6 md:px-10 lg:px-16 space-y-6">
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-[#123c8c]" size={36} />
            </div>
          ) : !profile ? (
            <p className="text-center text-sm font-semibold text-slate-500 py-6">Profil tidak ditemukan.</p>
          ) : (
            <>
              {/* KEMNAKER LAWS INFO CARD */}
              <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-r from-blue-500 to-[#123c8c] p-6 text-white shadow-xl shadow-blue-900/10">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <Scale size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-black">Informasi Transparansi Penggajian (Kemnaker)</h3>
                    <p className="mt-1.5 text-xs text-white/80 leading-relaxed">
                      Sesuai peraturan Kemnaker RI, perhitungan slip gaji Anda diproses secara proporsional. Izin sakit/resmi & Cuti terdaftar adalah hak berbayar penuh.
                    </p>
                  </div>
                </div>
              </div>

              {/* ESTIMASI KEMNAKER BULAN INI */}
              <div className="rounded-[2rem] border border-blue-100 bg-white dark:bg-[#0d1117] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <h3 className="text-lg font-black text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-5 flex items-center gap-2">
                  <Calendar size={18} className="text-[#123c8c] dark:text-blue-400" />
                  Estimasi Kehadiran & Prorata Bulan Ini
                </h3>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold text-slate-600 dark:text-slate-350">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="block text-[10px] text-slate-400">Hadir + Telat</span>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{attendanceStats.hadir + attendanceStats.telat}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="block text-[10px] text-slate-400">Sakit / Izin</span>
                      <span className="text-base font-black text-yellow-600 dark:text-yellow-400">{attendanceStats.sakit + attendanceStats.izin}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="block text-[10px] text-slate-400">Cuti</span>
                      <span className="text-base font-black text-blue-600 dark:text-blue-400">{attendanceStats.cuti}</span>
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Gaji Pokok Terdaftar</p>
                    <p className="text-base font-black text-slate-800 dark:text-white">
                      {profile.base_salary ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(profile.base_salary)) : "-"}
                    </p>

                    <div className="mt-3">
                      <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-450 uppercase">Rekomendasi Prorata (Est.)</p>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-450 mt-0.5">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(attendanceStats.recommendedSalary)}
                      </p>
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-450 mt-1 font-bold">
                        * Kehadiran terpenuhi penuh
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIST SLIP GAJI */}
              <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/50">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                  <FileText className="text-[#123c8c]" />
                  Riwayat Slip Gaji Anda
                </h3>

                {records.length === 0 ? (
                  <p className="text-center text-sm font-semibold text-slate-500 py-6">Belum ada slip gaji yang diterbitkan.</p>
                ) : (
                  <div className="space-y-4">
                    {records.map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between p-4 rounded-2xl border border-blue-50 bg-[#f8fbff] hover:bg-slate-50 transition gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#123c8c]">
                            <FileText size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">Periode: {rec.month}</h4>
                            <p className="text-xs font-semibold text-slate-500">{rec.note || "Gaji bulanan reguler"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-400">Diterima</p>
                            <p className="text-base font-black text-emerald-600">
                              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(rec.amount)}
                            </p>
                          </div>

                          <button
                            onClick={() => window.print()}
                            className="p-2.5 rounded-xl border border-slate-200 hover:bg-white text-slate-600 transition active:scale-95"
                            title="Cetak Slip Gaji"
                          >
                            <Printer size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </main>

      <BottomNav variant="employee" />
    </MobileShell>
  );
}
