import {
  CalendarCheck,
  Clock3,
  LayoutDashboard,
  UserCheck,
  UsersRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

const stats = [
  {
    label: "Total Employees",
    value: "24",
    description: "Karyawan terdaftar",
    icon: UsersRound,
  },
  {
    label: "Present Today",
    value: "18",
    description: "Sudah melakukan absensi",
    icon: UserCheck,
  },
  {
    label: "Late Today",
    value: "3",
    description: "Terlambat masuk",
    icon: Clock3,
  },
  {
    label: "Absent Today",
    value: "3",
    description: "Belum hadir",
    icon: CalendarCheck,
  },
];

const recentAttendance = [
  {
    id: "EMP001",
    name: "Muhammad Ardian Maulana",
    checkIn: "08:02",
    checkOut: "17:04",
    status: "Present",
  },
  {
    id: "EMP002",
    name: "Budi Santoso",
    checkIn: "08:21",
    checkOut: "17:10",
    status: "Late",
  },
  {
    id: "EMP003",
    name: "Siti Rahma",
    checkIn: "-",
    checkOut: "-",
    status: "Absent",
  },
];

export default function AdminDashboardPage() {
  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Admin Dashboard"
        subtitle="Ringkasan operasional presensi"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-slate-300/30">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
            Control Center
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            Ringkasan dashboard admin
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
            Halaman ini menampilkan statistik ringkas agar presentasi dan
            pengecekan operasional tetap berjalan.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-blue-100 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    {item.label}
                  </p>
                  <Icon size={18} className="text-[#123c8c]" />
                </div>
                <p className="mt-3 text-3xl font-black text-slate-950">
                  {item.value}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
              <LayoutDashboard size={22} />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-950">
                Karyawan Terakhir
              </h3>
              <p className="text-sm font-semibold text-slate-500">
                Daftar singkat presensi terbaru.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-blue-100">
            <div className="hidden grid-cols-[0.8fr_1.4fr_0.8fr_0.8fr_0.8fr] bg-[#eaf1ff] px-5 py-3 text-xs font-black uppercase tracking-wide text-[#123c8c] md:grid">
              <p>ID</p>
              <p>Employee</p>
              <p>Check-in</p>
              <p>Check-out</p>
              <p>Status</p>
            </div>

            <div className="divide-y divide-blue-100 bg-white">
              {recentAttendance.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[0.8fr_1.4fr_0.8fr_0.8fr_0.8fr] md:items-center"
                >
                  <p className="font-black text-[#123c8c]">{item.id}</p>
                  <p className="font-bold text-slate-950">{item.name}</p>
                  <p className="text-slate-500">{item.checkIn}</p>
                  <p className="text-slate-500">{item.checkOut}</p>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-black ${item.status === "Present" ? "bg-[#eaf1ff] text-[#123c8c]" : item.status === "Late" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
