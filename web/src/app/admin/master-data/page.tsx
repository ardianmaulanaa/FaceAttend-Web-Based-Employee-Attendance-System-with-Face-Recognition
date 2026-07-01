"use client";

import { useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type MasterTab = "shift" | "divisi" | "jabatan";

const shiftRows = [
  { name: "Magang", tolerance: 0, active: true },
  { name: "Utama", tolerance: 0, active: true },
];

const divisionRows = [
  { name: "Creativemu Academy", shift: "Utama" },
  { name: "Digital Marketing Agency", shift: "Utama" },
  { name: "Magang - Digital Marketing Agency", shift: "Magang" },
  { name: "Manajemen", shift: "Utama" },
];

const positionRows = [
  "Admin Sosmed",
  "Administrasi",
  "Customer Service",
  "Konten Kreator",
  "Live Host",
  "Manajer",
  "Marketplace",
  "PIC Project",
  "Web Developer",
];

export default function AdminMasterDataPage() {
  const [tab, setTab] = useState<MasterTab>("shift");
  const [shiftList, setShiftList] = useState(shiftRows);
  const [divisionList, setDivisionList] = useState(divisionRows);
  const [positionList, setPositionList] = useState(positionRows);

  const [newShiftName, setNewShiftName] = useState("");
  const [newShiftTolerance, setNewShiftTolerance] = useState("0");
  const [newDivisionName, setNewDivisionName] = useState("");
  const [newDivisionShift, setNewDivisionShift] = useState("Utama");
  const [newPositionName, setNewPositionName] = useState("");

  const tabTitle = useMemo(() => {
    if (tab === "shift") return "Master Shift";
    if (tab === "divisi") return "Master Divisi";
    return "Master Jabatan";
  }, [tab]);

  function handleAddShift() {
    const name = newShiftName.trim();
    if (!name) return;

    setShiftList((prev) => {
      if (prev.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        return prev;
      }

      return [
        ...prev,
        {
          name,
          tolerance: Number(newShiftTolerance || 0),
          active: true,
        },
      ];
    });

    setNewShiftName("");
    setNewShiftTolerance("0");
  }

  function handleAddDivision() {
    const name = newDivisionName.trim();
    if (!name) return;

    setDivisionList((prev) => {
      if (prev.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        return prev;
      }

      return [...prev, { name, shift: newDivisionShift }];
    });

    setNewDivisionName("");
    setNewDivisionShift("Utama");
  }

  function handleAddPosition() {
    const name = newPositionName.trim();
    if (!name) return;

    setPositionList((prev) => {
      if (prev.some((item) => item.toLowerCase() === name.toLowerCase())) {
        return prev;
      }

      return [...prev, name];
    });

    setNewPositionName("");
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Master Data"
        subtitle="Satu menu untuk shift, divisi, dan jabatan"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-slate-300/30">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
            Admin Master
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            Kelola Shift, Divisi, dan Jabatan
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Halaman ini menggabungkan tiga menu master data dalam satu navbar,
            sesuai kebutuhan operasional admin.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {(
            [
              ["shift", "Shift"],
              ["divisi", "Divisi"],
              ["jabatan", "Jabatan"],
            ] as Array<[MasterTab, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                tab === value
                  ? "bg-[#123c8c] text-white"
                  : "border border-blue-100 bg-white text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
          <h3 className="text-xl font-black text-slate-950">{tabTitle}</h3>

          {tab === "shift" && (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 rounded-2xl border border-blue-100 bg-[#f6f8ff] p-3 md:grid-cols-[1fr_0.6fr_auto]">
                <input
                  value={newShiftName}
                  onChange={(event) => setNewShiftName(event.target.value)}
                  placeholder="Nama shift"
                  className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                />
                <input
                  value={newShiftTolerance}
                  onChange={(event) => setNewShiftTolerance(event.target.value)}
                  placeholder="Toleransi (menit)"
                  className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddShift}
                  className="rounded-xl bg-[#123c8c] px-4 py-2 text-sm font-black text-white"
                >
                  Tambah Shift
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-blue-100">
                <div className="grid grid-cols-[1fr_1fr_1fr] bg-[#eaf1ff] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#123c8c]">
                  <p>Shift</p>
                  <p>Toleransi Telat</p>
                  <p>Status</p>
                </div>
                <div className="divide-y divide-blue-100 bg-white">
                  {shiftList.map((item) => (
                    <div
                      key={`shift-${item.name}`}
                      className="grid grid-cols-[1fr_1fr_1fr] px-4 py-3 text-sm"
                    >
                      <p className="font-black text-slate-900">{item.name}</p>
                      <p className="font-semibold text-slate-600">
                        {item.tolerance} menit
                      </p>
                      <p className="font-semibold text-emerald-700">
                        {item.active ? "Aktif" : "Tidak Aktif"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "divisi" && (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 rounded-2xl border border-blue-100 bg-[#f6f8ff] p-3 md:grid-cols-[1fr_0.7fr_auto]">
                <input
                  value={newDivisionName}
                  onChange={(event) => setNewDivisionName(event.target.value)}
                  placeholder="Nama divisi"
                  className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                />
                <select
                  value={newDivisionShift}
                  onChange={(event) => setNewDivisionShift(event.target.value)}
                  className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                >
                  {shiftList.map((item) => (
                    <option key={`shift-opt-${item.name}`} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddDivision}
                  className="rounded-xl bg-[#123c8c] px-4 py-2 text-sm font-black text-white"
                >
                  Tambah Divisi
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-blue-100">
                <div className="grid grid-cols-[1.5fr_1fr] bg-[#eaf1ff] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#123c8c]">
                  <p>Nama Divisi</p>
                  <p>Shift Divisi</p>
                </div>
                <div className="divide-y divide-blue-100 bg-white">
                  {divisionList.map((item) => (
                    <div
                      key={`division-${item.name}`}
                      className="grid grid-cols-[1.5fr_1fr] px-4 py-3 text-sm"
                    >
                      <p className="font-black text-slate-900">{item.name}</p>
                      <p className="font-semibold text-slate-600">
                        {item.shift}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "jabatan" && (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 rounded-2xl border border-blue-100 bg-[#f6f8ff] p-3 md:grid-cols-[1fr_auto]">
                <input
                  value={newPositionName}
                  onChange={(event) => setNewPositionName(event.target.value)}
                  placeholder="Nama jabatan"
                  className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPosition}
                  className="rounded-xl bg-[#123c8c] px-4 py-2 text-sm font-black text-white"
                >
                  Tambah Jabatan
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-blue-100">
                <div className="bg-[#eaf1ff] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#123c8c]">
                  Nama Jabatan
                </div>
                <div className="divide-y divide-blue-100 bg-white">
                  {positionList.map((name) => (
                    <div key={`position-${name}`} className="px-4 py-3 text-sm">
                      <p className="font-black text-slate-900">{name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
