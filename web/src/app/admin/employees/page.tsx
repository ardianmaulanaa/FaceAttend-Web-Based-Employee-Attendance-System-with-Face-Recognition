import { Briefcase, Pencil, Search, Trash2, UsersRound } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

const employees = [
  {
    id: "EMP001",
    name: "Muhammad Ardian Maulana",
    role: "owner",
    department: "Operasional",
    position: "Manager",
    status: "active",
  },
  {
    id: "EMP002",
    name: "Budi Santoso",
    role: "admin",
    department: "HR",
    position: "Staff",
    status: "active",
  },
  {
    id: "EMP003",
    name: "Siti Rahma",
    role: "cs",
    department: "Support",
    position: "Agent",
    status: "inactive",
  },
];

export default function AdminEmployeesPage() {
  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Employee Management"
        subtitle="Ringkasan data karyawan"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-slate-300/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
                Employee Center
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                Daftar karyawan
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                Halaman ringkas untuk presentasi dan pengecekan data karyawan
                saat demo.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-slate-500">
              <Search size={16} className="text-[#123c8c]" />
              Pencarian dinonaktifkan pada mode demo.
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Total
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">3</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Aktif
            </p>
            <p className="mt-3 text-3xl font-black text-emerald-700">2</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Nonaktif
            </p>
            <p className="mt-3 text-3xl font-black text-amber-700">1</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
              <UsersRound size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-950">
                Data Karyawan
              </h3>
              <p className="text-sm font-semibold text-slate-500">
                Tampilan ringkas, cukup aman untuk demo presentasi.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-blue-100">
            <div className="hidden grid-cols-[0.8fr_1.4fr_0.8fr_0.9fr_0.8fr_0.8fr] bg-[#eaf1ff] px-5 py-3 text-xs font-black uppercase tracking-wide text-[#123c8c] md:grid">
              <p>ID</p>
              <p>Nama</p>
              <p>Divisi</p>
              <p>Jabatan</p>
              <p>Status</p>
              <p>Aksi</p>
            </div>

            <div className="divide-y divide-blue-100 bg-white">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[0.8fr_1.4fr_0.8fr_0.9fr_0.8fr_0.8fr] md:items-center"
                >
                  <p className="font-black text-[#123c8c]">{employee.id}</p>
                  <div>
                    <p className="font-bold text-slate-950">{employee.name}</p>
                    <p className="text-xs text-slate-500">
                      Role: {employee.role}
                    </p>
                  </div>
                  <p className="text-slate-500">{employee.department}</p>
                  <p className="text-slate-500">{employee.position}</p>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-black ${employee.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {employee.status}
                  </span>
                  <div className="flex items-center gap-2 text-[#123c8c]">
                    <button
                      type="button"
                      className="rounded-xl bg-[#f6f8ff] p-2"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-[#f6f8ff] p-2"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-[#f6f8ff] p-2"
                    >
                      <Briefcase size={14} />
                    </button>
                  </div>
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
