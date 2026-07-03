import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import {
  canDeleteAdminData,
  canEditAdminData,
  canViewAdminPanel,
} from "@/lib/adminAccess";

type Level = "unit" | "department" | "position";

type UnitRow = {
  id: string;
  name: string;
  status: string;
};

type DepartmentRow = {
  id: string;
  name: string;
  unit_id: string | null;
  status: string;
};

type PositionRow = {
  id: string;
  name: string;
  department_id: string | null;
  status: string;
};

function isSchemaMigrationMissing(error: unknown) {
  const message = String(error || "").toLowerCase();
  return (
    message.includes("unknown column") || message.includes("doesn't exist")
  );
}

async function getRoleFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("faceattend_token")?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  return String(payload.role || "").toLowerCase();
}

async function readHierarchy() {
  const [units, departments] = await Promise.all([
    prisma.$queryRaw<UnitRow[]>`
      SELECT id, name, status
      FROM Unit
      ORDER BY name ASC
    `,
    prisma.$queryRaw<DepartmentRow[]>`
      SELECT id, name, unit_id, status
      FROM Department
      ORDER BY name ASC
    `,
  ]);

  let positions: PositionRow[] = [];

  try {
    positions = await prisma.$queryRaw<PositionRow[]>`
      SELECT id, name, department_id, status
      FROM Position
      ORDER BY name ASC
    `;
  } catch (error) {
    if (!isSchemaMigrationMissing(error)) {
      throw error;
    }

    positions = await prisma.$queryRaw<PositionRow[]>`
      SELECT id, name, NULL AS department_id, status
      FROM Position
      ORDER BY name ASC
    `;
  }

  return { units, departments, positions };
}

export async function GET() {
  try {
    const role = await getRoleFromSession();

    if (!role) {
      return NextResponse.json(
        { success: false, message: "Belum login" },
        { status: 401 },
      );
    }

    if (!canViewAdminPanel(role)) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak" },
        { status: 403 },
      );
    }

    const data = await readHierarchy();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Gagal mengambil data hirarki master" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const role = await getRoleFromSession();

    if (!role) {
      return NextResponse.json(
        { success: false, message: "Belum login" },
        { status: 401 },
      );
    }

    if (!canEditAdminData(role)) {
      return NextResponse.json(
        { success: false, message: "Role Anda hanya dapat melihat data." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const level = String(body.level || "") as Level;
    const name = String(body.name || "").trim();
    const status = String(body.status || "active").trim() || "active";
    const unitId = String(body.unitId || "").trim();
    const departmentId = String(body.departmentId || "").trim();

    if (!name || !["unit", "department", "position"].includes(level)) {
      return NextResponse.json(
        { success: false, message: "Payload tidak valid" },
        { status: 400 },
      );
    }

    const id = randomUUID();

    if (level === "unit") {
      await prisma.$executeRaw`
        INSERT INTO Unit (id, name, status, created_at, updated_at)
        VALUES (${id}, ${name}, ${status}, NOW(3), NOW(3))
      `;
    }

    if (level === "department") {
      if (!unitId) {
        return NextResponse.json(
          { success: false, message: "Unit wajib dipilih untuk divisi" },
          { status: 400 },
        );
      }

      await prisma.$executeRaw`
        INSERT INTO Department (id, name, unit_id, status, salary_calculation, created_at, updated_at)
        VALUES (${id}, ${name}, ${unitId}, ${status}, 'monthly', NOW(3), NOW(3))
      `;
    }

    if (level === "position") {
      if (!departmentId) {
        return NextResponse.json(
          { success: false, message: "Divisi wajib dipilih untuk jabatan" },
          { status: 400 },
        );
      }

      try {
        await prisma.$executeRaw`
          INSERT INTO Position (id, name, department_id, status, created_at, updated_at)
          VALUES (${id}, ${name}, ${departmentId}, ${status}, NOW(3), NOW(3))
        `;
      } catch (error) {
        if (!isSchemaMigrationMissing(error)) {
          throw error;
        }

        await prisma.$executeRaw`
          INSERT INTO Position (id, name, status, created_at, updated_at)
          VALUES (${id}, ${name}, ${status}, NOW(3), NOW(3))
        `;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data berhasil ditambahkan",
      data: await readHierarchy(),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Gagal menambah data" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const role = await getRoleFromSession();

    if (!role) {
      return NextResponse.json(
        { success: false, message: "Belum login" },
        { status: 401 },
      );
    }

    if (!canEditAdminData(role)) {
      return NextResponse.json(
        { success: false, message: "Role Anda hanya dapat melihat data." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const level = String(body.level || "") as Level;
    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const status = String(body.status || "active").trim() || "active";
    const unitId = String(body.unitId || "").trim();
    const departmentId = String(body.departmentId || "").trim();

    if (!id || !["unit", "department", "position"].includes(level)) {
      return NextResponse.json(
        { success: false, message: "Payload tidak valid" },
        { status: 400 },
      );
    }

    if (level === "unit") {
      await prisma.$executeRaw`
        UPDATE Unit
        SET name = ${name}, status = ${status}, updated_at = NOW(3)
        WHERE id = ${id}
      `;
    }

    if (level === "department") {
      await prisma.$executeRaw`
        UPDATE Department
        SET
          name = ${name},
          unit_id = ${unitId || null},
          status = ${status},
          updated_at = NOW(3)
        WHERE id = ${id}
      `;
    }

    if (level === "position") {
      try {
        await prisma.$executeRaw`
          UPDATE Position
          SET
            name = ${name},
            department_id = ${departmentId || null},
            status = ${status},
            updated_at = NOW(3)
          WHERE id = ${id}
        `;
      } catch (error) {
        if (!isSchemaMigrationMissing(error)) {
          throw error;
        }

        await prisma.$executeRaw`
          UPDATE Position
          SET
            name = ${name},
            status = ${status},
            updated_at = NOW(3)
          WHERE id = ${id}
        `;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data berhasil diperbarui",
      data: await readHierarchy(),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Gagal memperbarui data" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const role = await getRoleFromSession();

    if (!role) {
      return NextResponse.json(
        { success: false, message: "Belum login" },
        { status: 401 },
      );
    }

    if (!canDeleteAdminData(role)) {
      return NextResponse.json(
        { success: false, message: "Hanya owner yang dapat menghapus data." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const level = String(body.level || "") as Level;
    const id = String(body.id || "").trim();

    if (!id || !["unit", "department", "position"].includes(level)) {
      return NextResponse.json(
        { success: false, message: "Payload tidak valid" },
        { status: 400 },
      );
    }

    if (level === "position") {
      await prisma.$executeRaw`DELETE FROM Position WHERE id = ${id}`;
    }

    if (level === "department") {
      try {
        await prisma.$executeRaw`
          UPDATE Position
          SET department_id = NULL, updated_at = NOW(3)
          WHERE department_id = ${id}
        `;
      } catch (error) {
        if (!isSchemaMigrationMissing(error)) {
          throw error;
        }
      }

      await prisma.$executeRaw`DELETE FROM Department WHERE id = ${id}`;
    }

    if (level === "unit") {
      await prisma.$executeRaw`
        UPDATE Department
        SET unit_id = NULL, updated_at = NOW(3)
        WHERE unit_id = ${id}
      `;

      await prisma.$executeRaw`DELETE FROM Unit WHERE id = ${id}`;
    }

    return NextResponse.json({
      success: true,
      message: "Data berhasil dihapus",
      data: await readHierarchy(),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Gagal menghapus data" },
      { status: 500 },
    );
  }
}
