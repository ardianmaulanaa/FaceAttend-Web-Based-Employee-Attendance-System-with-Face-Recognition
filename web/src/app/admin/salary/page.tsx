"use client";

import { useEffect, useState } from "react";
import { Coins, CheckCircle, AlertTriangle, Printer, Loader2, Search, FileText, Calendar, Scale, Info } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive";
  created_at: string;
  employment_status: "kartap" | "kontrak" | "magang" | "pkl" | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
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

export default function AdminSalaryPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Pay Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMonth, setPayMonth] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payError, setPayError] = useState("");

  // Dynamic Attendance Stats for selected employee
  const [isStatsLoading, setIsStatsLoading] = useState(false);
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

  const fetchSalaryData = async () => {
    try {
      setIsLoading(true);
      const [empRes, salRes] = await Promise.all([
        fetch("/api/employees", { cache: "no-store" }),
        fetch("/api/salary", { cache: "no-store" }),
      ]);
      
      const empData = await empRes.json();
      const salData = await salRes.json();
      
      if (empData.success && empData.employees) {
        setEmployees(empData.employees.filter((e: any) => e.role === "employee"));
      }
      if (salData.success && salData.records) {
        setRecords(salData.records);
      }
    } catch (error) {
      console.error("Gagal memuat data gaji:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSalaryData();
  }, []);

  // Fetch stats when selectedEmployee changes or when period changes
  const fetchEmployeeStats = async (emp: Employee, monthName: string) => {
    try {
      setIsStatsLoading(true);
      // Map Indonesian month name to number
      const monthsMap: Record<string, number> = {
        januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
        juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12
      };
      const cleanMonth = monthName.toLowerCase().split(" ")[0] || "";
      const monthNum = monthsMap[cleanMonth] || (new Date().getMonth() + 1);
      const yearNum = Number(monthName.split(" ")[1]) || new Date().getFullYear();

      const res = await fetch(`/api/admin/attendance-reports?search=${encodeURIComponent(emp.email)}&month=${monthNum}&year=${yearNum}`);
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

        const base = Number(emp.base_salary || 2000000);
        const recommended = totalDays > 0 ? Math.round(base * (activeCount / totalDays)) : base;

        setAttendanceStats({
          hadir,
          telat,
          izin,
          sakit,
          cuti,
          alpa: 0,
          totalDays,
          recommendedSalary: recommended,
        });
      }
    } catch (err) {
      console.error("Gagal memuat statistik kehadiran karyawan:", err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const openPayModal = (emp: Employee) => {
    setSelectedEmp(emp);
    setPayAmount(emp.base_salary ? String(emp.base_salary) : "");
    const date = new Date();
    const currentPeriod = date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    setPayMonth(currentPeriod);
    setPayNote("Gaji bulanan reguler");
    setPayError("");
    setShowPayModal(true);
    void fetchEmployeeStats(emp, currentPeriod);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPayMonth(newPeriod);
    if (selectedEmp) {
      void fetchEmployeeStats(selectedEmp, newPeriod);
    }
  };

  const handleProcessPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    
    const amount = Number(payAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      setPayError("Nominal gaji harus berupa angka positif.");
      return;
    }

    try {
      setIsSubmitting(true);
      setPayError("");
      const res = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          month: payMonth,
          amount,
          note: payNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPayModal(false);
        void fetchSalaryData();
      } else {
        setPayError(data.message || "Gagal memproses gaji.");
      }
    } catch (err) {
      setPayError("Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.department?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Gaji & Slip Payroll"
        subtitle="Manajemen penggajian karyawan dan kalkulasi prorata Kemnaker"
        variant="admin"
      />

      <main className="min-h-screen bg-[#f8fbff] dark:bg-[#0d1117] pb-24 text-slate-900 dark:text-slate-100">
        <div className="mx-auto max-w-7xl px-5 py-6 md:px-10 lg:px-16 space-y-8">
          
          {/* Kemnaker Regulation Card */}
          <div className="rounded-[2rem] border border-blue-100 dark:border-slate-800 bg-gradient-to-r from-blue-600 to-[#123c8c] p-6 text-white shadow-xl shadow-blue-900/10">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Scale size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  Kalkulasi Gaji Prorata (Kemnaker)
                </h3>
                <p className="mt-2 text-xs text-white/80 leading-relaxed max-w-3xl">
                  Berdasarkan UU Ketenagakerjaan, pemotongan gaji diberlakukan secara adil bagi karyawan berdasarkan hari kerja aktif mereka. Rumus perhitungan prorata Kemnaker:
                  <span className="block mt-2 font-mono bg-black/20 p-2 rounded-lg text-emerald-300 font-bold w-fit">
                    Gaji Pokok × (Hari Kerja Aktif / Total Hari Periode)
                  </span>
                  Hari Masuk, Sakit, Izin resmi, dan Cuti dihitung sebagai hari kerja aktif yang dibayar penuh.
                </p>
              </div>
            </div>
          </div>

          {/* DAFTAR KARYAWAN */}
          <div className="rounded-[2rem] border border-blue-100 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 shadow-xl shadow-slate-200/50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-5 mb-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Coins className="text-[#123c8c] dark:text-blue-400" />
                Daftar Karyawan & Penggajian
              </h3>
              
              <div className="relative rounded-2xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 md:w-80">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari karyawan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent py-2.5 pl-11 pr-4 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-[#123c8c] dark:text-blue-400" size={36} />
              </div>
            ) : filteredEmployees.length === 0 ? (
              <p className="text-center text-sm font-semibold text-slate-500 py-6">Karyawan tidak ditemukan.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0d1117] text-slate-500 dark:text-slate-450 font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3">Nama Karyawan</th>
                      <th className="px-4 py-3">Status / Divisi</th>
                      <th className="px-4 py-3">Mulai Kerja</th>
                      <th className="px-4 py-3">Gaji Pokok</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredEmployees.map((emp) => {
                      const isInternOrPkl = emp.employment_status === "magang" || emp.employment_status === "pkl";
                      
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{emp.name}</td>
                          <td className="px-4 py-3">
                            <span className="font-black text-slate-700 dark:text-slate-300 capitalize">
                              {emp.employment_status === "kartap" ? "Tetap" : emp.employment_status || "-"}
                            </span>
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold">{emp.department?.name || "-"}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {new Date(emp.contract_start_date || emp.created_at).toLocaleDateString("id-ID", {
                              day: "numeric", month: "long", year: "numeric"
                            })}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(emp.base_salary || 2000000))}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => openPayModal(emp)}
                              className="inline-flex h-8 items-center justify-center rounded-xl bg-[#123c8c] dark:bg-blue-600 px-4 text-xs font-black text-white shadow-md shadow-blue-200 dark:shadow-none transition hover:bg-[#1b4da4] dark:hover:bg-blue-700 active:scale-[0.98]"
                            >
                              Hitung & Bayar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RIWAYAT GAJI */}
          <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/50">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-5 mb-6">
              <FileText className="text-[#123c8c]" />
              Riwayat Pembayaran Gaji
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-[#123c8c]" size={24} />
              </div>
            ) : records.length === 0 ? (
              <p className="text-center text-sm font-semibold text-slate-500 py-6">Belum ada riwayat pembayaran gaji.</p>
            ) : (
              <div className="space-y-4">
                {records.map((rec) => (
                  <div key={rec.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border border-blue-50 bg-[#f8fbff] hover:bg-slate-50 transition gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#123c8c]">
                        <Coins size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{rec.employeeName}</h4>
                        <p className="text-xs font-semibold text-slate-500">Periode: {rec.month}</p>
                        <p className="text-xs font-bold text-[#123c8c] mt-1">{rec.note || "Gaji Bulanan"}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400">Nominal Transfer</p>
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
        </div>
      </main>

      {/* PAY MODAL */}
      {showPayModal && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-2xl rounded-[2rem] border border-blue-100 bg-white p-6 shadow-2xl my-8">
            <h3 className="text-lg font-black text-[#123c8c] mb-4">Proses Kalkulasi & Gaji Karyawan</h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Form Input */}
              <form onSubmit={handleProcessPay} className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Penerima Gaji</p>
                  <p className="text-base font-black text-slate-800">{selectedEmp.name}</p>
                  <p className="text-xs text-slate-500">
                    {selectedEmp.department?.name || "-"} / {selectedEmp.position?.name || "-"}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase text-slate-400">
                    Periode / Bulan Gaji
                  </label>
                  <input
                    type="text"
                    value={payMonth}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] py-2.5 px-4 text-xs font-bold text-slate-700 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase text-slate-400">
                    Nominal Transfer (Rp)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] py-2.5 px-4 text-xs font-bold text-slate-700 outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setPayAmount(String(attendanceStats.recommendedSalary))}
                      className="px-3 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black shrink-0 hover:bg-emerald-600 transition"
                      title="Gunakan rekomendasi kemnaker"
                    >
                      Prorata
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase text-slate-400">
                    Catatan / Keterangan Slip
                  </label>
                  <textarea
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] py-2.5 px-4 text-xs font-bold text-slate-700 outline-none"
                    rows={2}
                  />
                </div>

                {payError && (
                  <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-bold text-red-600">
                    {payError}
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-600 hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 rounded-xl bg-[#123c8c] px-5 text-xs font-black text-white hover:bg-[#1b4da4] transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : null}
                    Proses Gaji
                  </button>
                </div>
              </form>

              {/* Rincian Kehadiran & Rekomendasi Gaji */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0d1117] p-4 space-y-4">
                <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Info size={16} className="text-[#123c8c] dark:text-blue-400" />
                  Rincian Kehadiran Periode Ini
                </h4>

                {isStatsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-[#123c8c] dark:text-blue-400" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                      <div className="bg-white dark:bg-[#161b22] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <span className="block text-[10px] text-slate-450">Hadir + Telat</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{attendanceStats.hadir + attendanceStats.telat}</span>
                      </div>
                      <div className="bg-white dark:bg-[#161b22] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <span className="block text-[10px] text-slate-455">Sakit / Izin</span>
                        <span className="text-sm font-black text-yellow-600 dark:text-yellow-400">{attendanceStats.sakit + attendanceStats.izin}</span>
                      </div>
                      <div className="bg-white dark:bg-[#161b22] p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <span className="block text-[10px] text-slate-450">Cuti</span>
                        <span className="text-sm font-black text-blue-600 dark:text-blue-400">{attendanceStats.cuti}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Rekomendasi Kemnaker</p>
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(attendanceStats.recommendedSalary)}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Dihitung berdasarkan proporsi hari kerja aktif (hadir, cuti, sakit, izin) sebanyak <b>{attendanceStats.hadir + attendanceStats.telat + attendanceStats.sakit + attendanceStats.izin + attendanceStats.cuti} hari</b> dari total <b>{attendanceStats.totalDays} hari periode</b>.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
