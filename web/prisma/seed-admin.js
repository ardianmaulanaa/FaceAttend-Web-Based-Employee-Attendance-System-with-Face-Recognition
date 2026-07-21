import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "127.0.0.1",
  port: Number(process.env.DATABASE_PORT || 3306),
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || undefined,
  database: process.env.DATABASE_NAME || "faceattend_db",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const password_hash = await bcrypt.hash("123456", 10);

  // Clear existing items in reverse dependency order
  await prisma.position.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.shift.deleteMany({});

  // Seed Users
  await prisma.user.upsert({
    where: { email: "owner@creativemu.my.id" },
    update: {
      name: "Owner Creativemu",
      password_hash,
      role: "owner",
      status: "active",
    },
    create: {
      name: "Owner Creativemu",
      email: "owner@creativemu.my.id",
      password_hash,
      role: "owner",
      status: "active",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@creativemu.my.id" },
    update: {
      name: "Admin Creativemu",
      password_hash,
      role: "admin",
      status: "active",
    },
    create: {
      name: "Admin Creativemu",
      email: "admin@creativemu.my.id",
      password_hash,
      role: "admin",
      status: "active",
    },
  });

  await prisma.user.upsert({
    where: { email: "cs@creativemu.my.id" },
    update: {
      name: "CS Creativemu",
      password_hash,
      role: "cs",
      status: "active",
    },
    create: {
      name: "CS Creativemu",
      email: "cs@creativemu.my.id",
      password_hash,
      role: "cs",
      status: "active",
    },
  });

  await prisma.user.upsert({
    where: { email: "employee@creativemu.my.id" },
    update: {
      name: "Karyawan Creativemu",
      password_hash,
      role: "employee",
      status: "active",
    },
    create: {
      name: "Karyawan Creativemu",
      email: "employee@creativemu.my.id",
      password_hash,
      role: "employee",
      status: "active",
    },
  });

  // Seed Shift
  await prisma.shift.upsert({
    where: { name: "Jam Kerja Utama" },
    update: { tolerance_minutes: 15, status: "active" },
    create: { id: "shift-1", name: "Jam Kerja Utama", tolerance_minutes: 15, status: "active" },
  });

  // --- SEED DEPARTMENTS (Divisi) under Creativemu Academy (office-2) ---
  const officeId = "office-2"; // Creativemu Academy

  const divisions = [
    { id: "dept-mkt", name: "Marketing" },
    { id: "dept-fin", name: "Keuangan / HRD" },
    { id: "dept-adm", name: "Admin" },
    { id: "dept-it", name: "IT" },
    { id: "dept-log", name: "Logistik" }
  ];

  for (const div of divisions) {
    await prisma.department.upsert({
      where: { id: div.id },
      update: { name: div.name, office_id: officeId, shift_id: "shift-1", status: "active" },
      create: { id: div.id, name: div.name, office_id: officeId, shift_id: "shift-1", status: "active" },
    });
  }

  // --- SEED UNITS (Posisi) ---
  const units = [
    // Marketing
    { id: "unit-sosmed", name: "Sosmed", department_id: "dept-mkt" },
    { id: "unit-website", name: "Website", department_id: "dept-mkt" },
    // Keuangan/HRD
    { id: "unit-keu-masuk", name: "Keuangan Masuk", department_id: "dept-fin" },
    { id: "unit-keu-keluar", name: "Keuangan Keluar", department_id: "dept-fin" },
    // Admin
    { id: "unit-reguler", name: "Reguler", department_id: "dept-adm" },
    { id: "unit-corporate", name: "Corporate", department_id: "dept-adm" },
    // IT
    { id: "unit-webdev", name: "Web Dev", department_id: "dept-it" },
    { id: "unit-webdesigner", name: "Web Designer", department_id: "dept-it" }
  ];

  for (const u of units) {
    await prisma.unit.upsert({
      where: { id: u.id },
      update: { name: u.name, department_id: u.department_id, status: "active" },
      create: { id: u.id, name: u.name, department_id: u.department_id, status: "active" },
    });
  }

  // --- SEED POSITIONS (Jabatan) for each unit (Manajer, SPV, Staff) ---
  for (const u of units) {
    const roles = [
      { roleId: "mgr", label: "Manajer" },
      { roleId: "spv", label: "SPV" },
      { roleId: "staff", label: "Staff" }
    ];

    for (const r of roles) {
      const posId = `pos-${r.roleId}-${u.id}`;
      await prisma.position.upsert({
        where: { id: posId },
        update: { name: r.label, unit_id: u.id, status: "active" },
        create: { id: posId, name: r.label, unit_id: u.id, status: "active" },
      });
    }
  }

  console.log("Akun owner, admin, CS, serta data Shift, Divisi, Unit, dan Jabatan baru berhasil dibuat");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
