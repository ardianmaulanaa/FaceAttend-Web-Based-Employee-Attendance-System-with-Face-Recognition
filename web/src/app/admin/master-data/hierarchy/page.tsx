"use client";

import { useMemo, useState, useEffect } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type UnitItem = {
  id: string;
  name: string;
  status: string;
};

type DepartmentItem = {
  id: string;
  name: string;
  unit_id: string | null;
  status: string;
};

type PositionItem = {
  id: string;
  name: string;
  department_id: string | null;
  status: string;
};

type HierarchyPayload = {
  units: UnitItem[];
  departments: DepartmentItem[];
  positions: PositionItem[];
};

type EditState = {
  level: "unit" | "department" | "position";
  id: string;
  name: string;
};

const emptyHierarchy: HierarchyPayload = {
  units: [],
  departments: [],
  positions: [],
};

export default function MasterHierarchyPage() {
  const [data, setData] = useState<HierarchyPayload>(emptyHierarchy);
  const [isLoading, setIsLoading] = useState(true);
  const [newUnitName, setNewUnitName] = useState("");
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newPositionName, setNewPositionName] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [assignmentUnitId, setAssignmentUnitId] = useState("");
  const [assignmentDepartmentId, setAssignmentDepartmentId] = useState("");
  const [assignmentPositionId, setAssignmentPositionId] = useState("");
  const [editing, setEditing] = useState<EditState | null>(null);

  const departmentsBySelectedUnit = useMemo(() => {
    return data.departments.filter((item) => item.unit_id === selectedUnitId);
  }, [data.departments, selectedUnitId]);

  const departmentsByAssignmentUnit = useMemo(() => {
    return data.departments.filter((item) => item.unit_id === assignmentUnitId);
  }, [data.departments, assignmentUnitId]);

  const positionsBySelectedDepartment = useMemo(() => {
    return data.positions.filter(
      (item) => item.department_id === selectedDepartmentId,
    );
  }, [data.positions, selectedDepartmentId]);

  const positionsByAssignmentDepartment = useMemo(() => {
    return data.positions.filter(
      (item) => item.department_id === assignmentDepartmentId,
    );
  }, [data.positions, assignmentDepartmentId]);

  async function loadHierarchy() {
    try {
      setIsLoading(true);

      const response = await fetch("/api/master/hierarchy", {
        method: "GET",
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Gagal memuat master hirarki");
        return;
      }

      const payload = result.data as HierarchyPayload;
      setData(payload);

      if (!selectedUnitId && payload.units[0]) {
        setSelectedUnitId(payload.units[0].id);
      }

      if (!assignmentUnitId && payload.units[0]) {
        setAssignmentUnitId(payload.units[0].id);
      }
    } catch {
      alert("Terjadi kesalahan saat memuat master hirarki.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadHierarchy();
  }, []);

  useEffect(() => {
    const candidate = departmentsBySelectedUnit[0]?.id || "";
    setSelectedDepartmentId(candidate);
  }, [departmentsBySelectedUnit]);

  useEffect(() => {
    const candidate = departmentsByAssignmentUnit[0]?.id || "";
    setAssignmentDepartmentId(candidate);
  }, [departmentsByAssignmentUnit]);

  useEffect(() => {
    const candidate = positionsByAssignmentDepartment[0]?.id || "";
    setAssignmentPositionId(candidate);
  }, [positionsByAssignmentDepartment]);

  async function createItem(level: "unit" | "department" | "position") {
    const name =
      level === "unit"
        ? newUnitName.trim()
        : level === "department"
          ? newDepartmentName.trim()
          : newPositionName.trim();

    if (!name) {
      alert("Nama wajib diisi.");
      return;
    }

    const body: Record<string, string> = { level, name };

    if (level === "department") {
      body.unitId = selectedUnitId;
    }

    if (level === "position") {
      body.departmentId = selectedDepartmentId;
    }

    const response = await fetch("/api/master/hierarchy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      alert(result.message || "Gagal menambahkan data");
      return;
    }

    setData(result.data as HierarchyPayload);

    if (level === "unit") setNewUnitName("");
    if (level === "department") setNewDepartmentName("");
    if (level === "position") setNewPositionName("");
  }

  async function saveEdit() {
    if (!editing) return;

    const response = await fetch("/api/master/hierarchy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: editing.level,
        id: editing.id,
        name: editing.name.trim(),
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      alert(result.message || "Gagal mengubah data");
      return;
    }

    setData(result.data as HierarchyPayload);
    setEditing(null);
  }

  async function removeItem(
    level: "unit" | "department" | "position",
    id: string,
  ) {
    const confirmed = confirm("Yakin ingin menghapus data ini?");
    if (!confirmed) return;

    const response = await fetch("/api/master/hierarchy", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, id }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      alert(result.message || "Gagal menghapus data");
      return;
    }

    setData(result.data as HierarchyPayload);
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Master Unit/Divisi/Jabatan"
        subtitle="CRUD hirarki untuk dropdown bertingkat"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-xl shadow-slate-300/30">
          <h2 className="text-2xl font-black text-slate-950">
            Tambah Data Hirarki
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Unit
              </p>
              <input
                value={newUnitName}
                onChange={(event) => setNewUnitName(event.target.value)}
                placeholder="Contoh: Operasional"
                className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  void createItem("unit");
                }}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#123c8c] px-3 py-2 text-xs font-black text-white"
              >
                <Plus size={14} /> Tambah Unit
              </button>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Divisi
              </p>
              <select
                value={selectedUnitId}
                onChange={(event) => setSelectedUnitId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
              >
                {data.units.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input
                value={newDepartmentName}
                onChange={(event) => setNewDepartmentName(event.target.value)}
                placeholder="Contoh: Marketing"
                className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  void createItem("department");
                }}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#123c8c] px-3 py-2 text-xs font-black text-white"
              >
                <Plus size={14} /> Tambah Divisi
              </button>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Jabatan
              </p>
              <select
                value={selectedDepartmentId}
                onChange={(event) =>
                  setSelectedDepartmentId(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
              >
                {departmentsBySelectedUnit.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input
                value={newPositionName}
                onChange={(event) => setNewPositionName(event.target.value)}
                placeholder="Contoh: Staff Konten"
                className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  void createItem("position");
                }}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#123c8c] px-3 py-2 text-xs font-black text-white"
              >
                <Plus size={14} /> Tambah Jabatan
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30">
          <h3 className="text-xl font-black text-slate-950">
            Dropdown Bertingkat (Preview)
          </h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <select
              value={assignmentUnitId}
              onChange={(event) => setAssignmentUnitId(event.target.value)}
              className="rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-sm font-semibold text-slate-700"
            >
              {data.units.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <select
              value={assignmentDepartmentId}
              onChange={(event) =>
                setAssignmentDepartmentId(event.target.value)
              }
              className="rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-sm font-semibold text-slate-700"
            >
              {departmentsByAssignmentUnit.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <select
              value={assignmentPositionId}
              onChange={(event) => setAssignmentPositionId(event.target.value)}
              className="rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-sm font-semibold text-slate-700"
            >
              {positionsByAssignmentDepartment.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-xl shadow-slate-300/30">
          <h3 className="text-xl font-black text-slate-950">
            Data Master (CRUD)
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {["unit", "department", "position"].map((level) => {
              const items =
                level === "unit"
                  ? data.units
                  : level === "department"
                    ? data.departments
                    : data.positions;

              return (
                <div
                  key={level}
                  className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-3"
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    {level}
                  </p>
                  <div className="mt-2 space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-blue-100 bg-white p-2"
                      >
                        {editing?.id === item.id && editing.level === level ? (
                          <div>
                            <input
                              value={editing.name}
                              onChange={(event) =>
                                setEditing((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        name: event.target.value,
                                      }
                                    : prev,
                                )
                              }
                              className="w-full rounded-lg border border-blue-100 px-2 py-1 text-sm font-semibold"
                            />
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  void saveEdit();
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-black text-white"
                              >
                                <Save size={12} /> Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditing(null)}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-2 py-1 text-xs font-black text-slate-700"
                              >
                                <X size={12} /> Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-black text-slate-800">
                              {item.name}
                            </p>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditing({
                                    level: level as EditState["level"],
                                    id: item.id,
                                    name: item.name,
                                  })
                                }
                                className="rounded-md bg-blue-50 p-1 text-[#123c8c]"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  void removeItem(
                                    level as "unit" | "department" | "position",
                                    item.id,
                                  );
                                }}
                                className="rounded-md bg-rose-50 p-1 text-rose-600"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {isLoading && (
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Memuat data...
            </p>
          )}
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
