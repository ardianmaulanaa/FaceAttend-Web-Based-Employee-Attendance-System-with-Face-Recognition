"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  FileDown,
  Loader2,
  TrendingUp,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";

type Employee = {
  id: string;
  name: string;
  email: string;
  employment_status: "kartap" | "kontrak" | "magang" | "pkl" | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
};

type AttendanceReport = {
  employeeName: string;
  employeeCode: string | null;
  date: string;
  status: string;
  statusLabel: string;
};

export default function HRAnalyticsPage() {
  const getStartOfCurrentMonthStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  };

  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const toLocalYYYYMMDD = (dVal: any) => {
    if (!dVal) return "";
    const clean = String(dVal).trim();
    const d = new Date(clean);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    const parts = clean.split(" ");
    if (parts.length >= 3) {
      const day = parts[0].padStart(2, '0');
      const indonesianMonths = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
      const englishMonths = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
      const mName = parts[1].toLowerCase();
      let mIdx = indonesianMonths.indexOf(mName);
      if (mIdx === -1) {
        mIdx = englishMonths.indexOf(mName);
      }
      if (mIdx !== -1) {
        const m = String(mIdx + 1).padStart(2, '0');
        const y = parts[2];
        return `${y}-${m}-${day}`;
      }
    }
    return "";
  };

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [startDate, setStartDate] = useState(getStartOfCurrentMonthStr());
  const [endDate, setEndDate] = useState(getTodayStr());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  // Column definitions for drag and drop reordering
  const [columns, setColumns] = useState<Array<{ id: string; label: string; align: "left" | "center" }>>([
    { id: "hadir", label: "Hadir", align: "center" },
    { id: "telat", label: "Telat", align: "center" },
    { id: "izinSakit", label: "Izin/Sakit", align: "center" },
    { id: "cuti", label: "Cuti", align: "center" },
    { id: "sisaKontrak", label: "Sisa Kontrak", align: "left" },
    { id: "statusPosisi", label: "Status Posisi", align: "left" }
  ]);
  const [draggedColId, setDraggedColId] = useState<string | null>(null);

  const handleColDragStart = (id: string) => {
    setDraggedColId(id);
  };

  const handleColDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleColDrop = (targetId: string) => {
    if (!draggedColId || draggedColId === targetId) return;
    const newCols = [...columns];
    const draggedIdx = newCols.findIndex(c => c.id === draggedColId);
    const targetIdx = newCols.findIndex(c => c.id === targetId);
    
    // Rearrange columns array
    const [removed] = newCols.splice(draggedIdx, 1);
    newCols.splice(targetIdx, 0, removed);
    setColumns(newCols);
    setDraggedColId(null);
  };

  // Load all employees and their reports
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        // Load employees
        const empRes = await fetch("/api/employees");
        const empData = await empRes.json();
        if (empData.success && empData.employees) {
          setEmployees(empData.employees);
        }

        // Load attendance reports for the current and previous months if range spans
        const today = new Date();
        const repRes = await fetch(`/api/admin/attendance-reports?month=${today.getMonth() + 1}&year=${today.getFullYear()}`);
        const repData = await repRes.json();
        if (repData.success && repData.reports) {
          setReports(repData.reports);
        }
      } catch (err) {
        console.error("Gagal memuat data", err);
        setErrorMessage("Gagal memuat data analitik HR.");
      } finally {
        setIsLoading(false);
      }
    }
    void loadData();
  }, []);

  // Sort state
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (colId: string) => {
    if (sortColumn === colId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(colId);
      // Default to desc for metric counts/sisaKontrak so highest/longest shows first
      setSortDirection(colId === "name" || colId === "statusPosisi" ? "asc" : "desc");
    }
  };

  // Filter employees based on selected dropdown
  const filteredEmployees = useMemo(() => {
    if (!selectedEmployeeId) return employees;
    return employees.filter(e => e.id === selectedEmployeeId);
  }, [employees, selectedEmployeeId]);

  const sortedFilteredEmployees = useMemo(() => {
    const list = [...filteredEmployees];

    const getEmpStats = (emp: Employee) => {
      const empReports = reports.filter(r => {
        return String(r.employeeName || "").toLowerCase() === String(emp.name || "").toLowerCase() ||
               String(r.employeeCode || "").toLowerCase() === String(emp.email || "").toLowerCase();
      }).filter(r => {
        const dateStr = toLocalYYYYMMDD(r.date);
        return dateStr && dateStr >= startDate && dateStr <= endDate;
      });

      const hadir = empReports.filter(a => {
        const s = String(a.statusLabel || a.status || "").toLowerCase();
        return s.includes("hadir") || s.includes("present") || s.includes("on_time") || s === "on_time";
      }).length;

      const telat = empReports.filter(a => {
        const s = String(a.statusLabel || a.status || "").toLowerCase();
        return s.includes("lambat") || s.includes("late");
      }).length;

      const izin = empReports.filter(a => {
        const s = String(a.statusLabel || a.status || "").toLowerCase();
        return s.includes("izin") || s.includes("permission");
      }).length;

      const sakit = empReports.filter(a => {
        const s = String(a.statusLabel || a.status || "").toLowerCase();
        return s.includes("sakit");
      }).length;

      const cuti = empReports.filter(a => {
        const s = String(a.statusLabel || a.status || "").toLowerCase();
        return s.includes("cuti");
      }).length;

      let remainingDays = -99999;
      if (emp.contract_end_date && emp.employment_status !== "kartap") {
        const end = new Date(emp.contract_end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        remainingDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }

      return { hadir, telat, izin, sakit, cuti, izinSakit: izin + sakit, remainingDays };
    };

    return list.sort((a, b) => {
      const statsA = getEmpStats(a);
      const statsB = getEmpStats(b);

      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortColumn) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "statusPosisi":
          valA = (a.employment_status || "").toLowerCase();
          valB = (b.employment_status || "").toLowerCase();
          break;
        case "sisaKontrak":
          valA = statsA.remainingDays;
          valB = statsB.remainingDays;
          break;
        case "hadir":
          valA = statsA.hadir;
          valB = statsB.hadir;
          break;
        case "telat":
          valA = statsA.telat;
          valB = statsB.telat;
          break;
        case "izinSakit":
          valA = statsA.izinSakit;
          valB = statsB.izinSakit;
          break;
        case "cuti":
          valA = statsA.cuti;
          valB = statsB.cuti;
          break;
        default:
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredEmployees, reports, startDate, endDate, sortColumn, sortDirection]);

  return (
    <MobileShell variant="admin">
      <AppHeader title="Analitik HR" variant="admin" />

      <main className="min-h-screen bg-slate-50/50 dark:bg-[#0d1117] pb-24 text-slate-900 dark:text-slate-100">
        <section className="mx-auto max-w-7xl px-4 py-6">
          <div className="rounded-[2rem] border border-blue-100 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 shadow-xl shadow-slate-300/30">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-850 pb-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20 text-[#123c8c] dark:text-blue-400">
                <TrendingUp size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#123c8c] dark:text-white">
                  Analitik Kehadiran & Status Kontrak
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">Kelola dan pantau rekap kontrak magang, PKL, dan karyawan</p>
              </div>
            </div>

            {/* Filters panel */}
            <div className="grid gap-6 md:grid-cols-[1fr_2fr] mb-8">
              <div className="rounded-2xl border border-blue-50 dark:border-slate-800 bg-[#f8fbff] dark:bg-[#0d1117] p-5">
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-450">
                  Pilih Karyawan
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full rounded-xl border border-blue-100 dark:border-slate-800 bg-white dark:bg-[#161b22] py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none transition focus:border-[#123c8c] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950"
                >
                  <option value="">-- Semua Karyawan --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employment_status === "kartap" ? "Tetap" : emp.employment_status || "Lainnya"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-blue-50 dark:border-slate-800 bg-[#f8fbff] dark:bg-[#0d1117] p-5 flex flex-col justify-between">
                <div>
                  <label className="mb-3 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-450">
                    Pilih Rentang Tanggal Rekapan
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-black text-slate-500 dark:text-slate-450">TANGGAL MULAI</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-xl border border-blue-100 dark:border-slate-800 bg-white dark:bg-[#161b22] py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none transition focus:border-[#123c8c] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-black text-slate-500 dark:text-slate-450">TANGGAL SELESAI</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-blue-100 dark:border-slate-800 bg-white dark:bg-[#161b22] py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none transition focus:border-[#123c8c] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950"
                      />
                    </div>
                  </div>
                </div>

                {startDate && endDate && (
                  <div className="mt-3 flex items-center justify-between bg-blue-50/70 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100 dark:border-slate-800">
                    <span className="text-[11px] font-black text-blue-900 dark:text-blue-400 uppercase">Rentang Waktu:</span>
                    <span className="text-xs font-black text-blue-700 dark:text-blue-300 bg-white dark:bg-[#161b22] px-2.5 py-1 rounded-lg shadow-sm border border-blue-100 dark:border-slate-800">
                      {Math.ceil(Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} Hari
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Large Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-[#123c8c] dark:text-blue-400 mr-2" />
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Memuat data analitik...</span>
              </div>
            ) : (
              <div>
                {/* Mobile quick sort dropdown */}
                <div className="mb-4 flex items-center gap-2 md:hidden">
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400 whitespace-nowrap">Urutkan:</span>
                  <select
                    value={`${sortColumn}-${sortDirection}`}
                    onChange={(e) => {
                      const parts = e.target.value.split("-");
                      const dir = parts.pop() as "asc" | "desc";
                      const col = parts.join("-");
                      setSortColumn(col);
                      setSortDirection(dir);
                    }}
                    className="w-full rounded-2xl border border-blue-100 dark:border-slate-800 bg-[#f8fbff] dark:bg-[#0d1117] py-2.5 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                  >
                    <option value="name-asc">Nama Karyawan (A - Z)</option>
                    <option value="name-desc">Nama Karyawan (Z - A)</option>
                    <option value="telat-desc">Telat Terbanyak</option>
                    <option value="telat-asc">Telat Tersedikit</option>
                    <option value="hadir-desc">Hadir Terbanyak</option>
                    <option value="hadir-asc">Hadir Tersedikit</option>
                    <option value="sisaKontrak-desc">Sisa Kontrak Terlama</option>
                    <option value="sisaKontrak-asc">Sisa Kontrak Tercepat</option>
                    <option value="cuti-desc">Cuti Terbanyak</option>
                    <option value="izinSakit-desc">Izin/Sakit Terbanyak</option>
                  </select>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#161b22]">
                  <table className="w-full border-collapse text-xs text-left text-slate-600 dark:text-slate-300 select-none">
                  <thead>
                    <tr className="bg-[#f8fbff] dark:bg-[#0d1117] text-slate-500 dark:text-slate-450 font-black uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th
                        onClick={() => handleSort("name")}
                        className="px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-150 whitespace-nowrap"
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <span className={sortColumn === "name" ? "text-[#123c8c] dark:text-blue-400 font-black" : ""}>Nama Karyawan</span>
                          {sortColumn === "name" ? (
                            sortDirection === "asc" ? (
                              <ArrowUp size={13} className="text-[#123c8c] dark:text-blue-400 stroke-[3]" />
                            ) : (
                              <ArrowDown size={13} className="text-[#123c8c] dark:text-blue-400 stroke-[3]" />
                            )
                          ) : (
                            <ArrowUpDown size={11} className="opacity-30 hover:opacity-100" />
                          )}
                        </div>
                      </th>
                      {columns.map((col) => {
                        const active = sortColumn === col.id;
                        return (
                          <th
                            key={col.id}
                            draggable
                            onDragStart={() => handleColDragStart(col.id)}
                            onDragOver={handleColDragOver}
                            onDrop={() => handleColDrop(col.id)}
                            onClick={() => handleSort(col.id)}
                            className={`px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-150 whitespace-nowrap ${col.align === "center" ? "text-center" : "text-left"}`}
                            title="Klik untuk urutkan / Tarik untuk memindah kolom"
                          >
                            <div className={`inline-flex items-center gap-1.5 ${col.align === "center" ? "justify-center" : ""}`}>
                              <span className={active ? "text-[#123c8c] dark:text-blue-400 font-black" : ""}>{col.label}</span>
                              {active ? (
                                sortDirection === "asc" ? (
                                  <ArrowUp size={13} className="text-[#123c8c] dark:text-blue-400 stroke-[3]" />
                                ) : (
                                  <ArrowDown size={13} className="text-[#123c8c] dark:text-blue-400 stroke-[3]" />
                                )
                              ) : (
                                <ArrowUpDown size={11} className="opacity-30 hover:opacity-100" />
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800 font-semibold">
                    {sortedFilteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={1 + columns.length} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500 font-bold">Tidak ada data karyawan</td>
                      </tr>
                    ) : (
                      sortedFilteredEmployees.map((emp) => {
                        // Compute stats dynamically for this employee
                        const empReports = reports.filter(r => {
                          return String(r.employeeName || "").toLowerCase() === String(emp.name || "").toLowerCase() ||
                                 String(r.employeeCode || "").toLowerCase() === String(emp.email || "").toLowerCase();
                        }).filter(r => {
                          const dateStr = toLocalYYYYMMDD(r.date);
                          return dateStr && dateStr >= startDate && dateStr <= endDate;
                        });

                        const hadir = empReports.filter(a => {
                          const s = String(a.statusLabel || a.status || "").toLowerCase();
                          return s.includes("hadir") || s.includes("present") || s.includes("on_time") || s === "on_time";
                        }).length;

                        const telat = empReports.filter(a => {
                          const s = String(a.statusLabel || a.status || "").toLowerCase();
                          return s.includes("lambat") || s.includes("late");
                        }).length;

                        const izin = empReports.filter(a => {
                          const s = String(a.statusLabel || a.status || "").toLowerCase();
                          return s.includes("izin") || s.includes("permission");
                        }).length;

                        const sakit = empReports.filter(a => {
                          const s = String(a.statusLabel || a.status || "").toLowerCase();
                          return s.includes("sakit");
                        }).length;

                        const cuti = empReports.filter(a => {
                          const s = String(a.statusLabel || a.status || "").toLowerCase();
                          return s.includes("cuti");
                        }).length;

                        const getRemainingDaysText = () => {
                          if (emp.employment_status === "kartap" || !emp.contract_end_date) {
                            return "-";
                          }
                          const end = new Date(emp.contract_end_date);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          end.setHours(0, 0, 0, 0);
                          const diffMs = end.getTime() - today.getTime();
                          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                          if (diffDays > 0) {
                            return `Sisa ${diffDays} hari`;
                          }
                          if (diffDays === 0) {
                            return "Selesai hari ini";
                          }
                          return "Telah selesai";
                        };

                        const typeMap: Record<string, string> = {
                          kartap: "Tetap (Kartap)",
                          kontrak: "Kontrak",
                          magang: "Magang",
                          pkl: "PKL"
                        };

                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{emp.name}</td>
                            {columns.map((col) => {
                              if (col.id === "hadir") {
                                return (
                                  <td key={col.id} className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-450 font-bold">
                                    {hadir}
                                  </td>
                                );
                              }
                              if (col.id === "telat") {
                                return (
                                  <td key={col.id} className="px-4 py-3 text-center text-amber-600 dark:text-amber-450 font-bold">
                                    {telat}
                                  </td>
                                );
                              }
                              if (col.id === "izinSakit") {
                                return (
                                  <td key={col.id} className="px-4 py-3 text-center text-yellow-600 dark:text-yellow-450 font-bold">
                                    {izin + sakit}
                                  </td>
                                );
                              }
                              if (col.id === "cuti") {
                                return (
                                  <td key={col.id} className="px-4 py-3 text-center text-blue-600 dark:text-blue-450 font-bold">
                                    {cuti}
                                  </td>
                                );
                              }
                              if (col.id === "sisaKontrak") {
                                return (
                                  <td key={col.id} className="px-4 py-3 whitespace-nowrap">
                                    <span className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-black ${getRemainingDaysText().includes("hari") ? "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300" : getRemainingDaysText() === "-" ? "text-slate-500 dark:text-slate-400" : "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300"}`}>
                                      {getRemainingDaysText()}
                                    </span>
                                  </td>
                                );
                              }
                              if (col.id === "statusPosisi") {
                                return (
                                  <td key={col.id} className="px-4 py-3 font-black text-slate-700 dark:text-slate-300 capitalize">
                                    {typeMap[emp.employment_status || ""] || emp.employment_status || "-"}
                                  </td>
                                );
                              }
                              return null;
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </MobileShell>
  );
}
