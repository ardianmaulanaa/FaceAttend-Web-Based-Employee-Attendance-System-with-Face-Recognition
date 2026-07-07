require("dotenv/config");

const bcrypt = require("bcryptjs");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const { PrismaClient } = require("../src/generated/prisma/client");

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

  await prisma.position.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.shift.deleteMany({});

  await prisma.user.upsert({
    where: {
      email: "owner@creativemu.co.id",
    },
    update: {
      name: "Owner Creativemu",
      password_hash,
      role: "owner",
      status: "active",
    },
    create: {
      name: "Owner Creativemu",
      email: "owner@creativemu.co.id",
      password_hash,
      role: "owner",
      status: "active",
    },
  });

  await prisma.user.upsert({
    where: {
      email: "admin@creativemu.co.id",
    },
    update: {
      name: "Admin Creativemu",
      password_hash,
      role: "admin",
      status: "active",
    },
    create: {
      name: "Admin Creativemu",
      email: "admin@creativemu.co.id",
      password_hash,
      role: "admin",
      status: "active",
    },
  });

  await prisma.user.upsert({
    where: {
      email: "cs@creativemu.co.id",
    },
    update: {
      name: "CS Creativemu",
      password_hash,
      role: "cs",
      status: "active",
    },
    create: {
      name: "CS Creativemu",
      email: "cs@creativemu.co.id",
      password_hash,
      role: "cs",
      status: "active",
    },
  });

  await prisma.shift.upsert({
    where: { name: "Jam Kerja Utama" },
    update: { tolerance_minutes: 15, status: "active" },
    create: { id: "shift-1", name: "Jam Kerja Utama", tolerance_minutes: 15, status: "active" },
  });

  // Seeds for Alfabank Unit
  await prisma.unit.upsert({
    where: { name: "Alfabank" },
    update: { status: "active" },
    create: { id: "unit-1", name: "Alfabank", status: "active" },
  });

  // Seeds for Creativemu Academy Unit
  await prisma.unit.upsert({
    where: { name: "Creativemu Academy" },
    update: { status: "active" },
    create: { id: "unit-2", name: "Creativemu Academy", status: "active" },
  });

  // Seeds for IT Department under Alfabank
  await prisma.department.upsert({
    where: { id: "dept-it-alfabank" },
    update: { name: "IT", unit_id: "unit-1", shift_id: "shift-1" },
    create: { id: "dept-it-alfabank", name: "IT", unit_id: "unit-1", shift_id: "shift-1" },
  });

  // Seeds for IT Department under Creativemu Academy
  await prisma.department.upsert({
    where: { id: "dept-it-creativemu" },
    update: { name: "IT", unit_id: "unit-2", shift_id: "shift-1" },
    create: { id: "dept-it-creativemu", name: "IT", unit_id: "unit-2", shift_id: "shift-1" },
  });

  // Seeds for Digital Marketing Agency under Alfabank
  await prisma.department.upsert({
    where: { id: "dept-dm-alfabank" },
    update: { name: "DIGITAL MARKETING AGENCY", unit_id: "unit-1", shift_id: "shift-1" },
    create: { id: "dept-dm-alfabank", name: "DIGITAL MARKETING AGENCY", unit_id: "unit-1", shift_id: "shift-1" },
  });

  // Seeds for Digital Marketing Agency under Creativemu Academy
  await prisma.department.upsert({
    where: { id: "dept-dm-creativemu" },
    update: { name: "DIGITAL MARKETING AGENCY", unit_id: "unit-2", shift_id: "shift-1" },
    create: { id: "dept-dm-creativemu", name: "DIGITAL MARKETING AGENCY", unit_id: "unit-2", shift_id: "shift-1" },
  });

  // Seeds for Magang-Digital Marketing Agency under Creativemu Academy
  await prisma.department.upsert({
    where: { id: "dept-magang-dm-creativemu" },
    update: { name: "MAGANG-DIGITAL MARKETING AGENCY", unit_id: "unit-2", shift_id: "shift-1" },
    create: { id: "dept-magang-dm-creativemu", name: "MAGANG-DIGITAL MARKETING AGENCY", unit_id: "unit-2", shift_id: "shift-1" },
  });

  // Seeds for Manajemen under Alfabank
  await prisma.department.upsert({
    where: { id: "dept-mgt-alfabank" },
    update: { name: "MANAJEMEN", unit_id: "unit-1", shift_id: "shift-1" },
    create: { id: "dept-mgt-alfabank", name: "MANAJEMEN", unit_id: "unit-1", shift_id: "shift-1" },
  });

  // Seeds for Manajemen under Creativemu Academy
  await prisma.department.upsert({
    where: { id: "dept-mgt-creativemu" },
    update: { name: "MANAJEMEN", unit_id: "unit-2", shift_id: "shift-1" },
    create: { id: "dept-mgt-creativemu", name: "MANAJEMEN", unit_id: "unit-2", shift_id: "shift-1" },
  });

  // --- POSITIONS ---

  // Positions under Alfabank IT
  await prisma.position.upsert({
    where: { id: "pos-webdev-alfabank" },
    update: { name: "Web Dev", department_id: "dept-it-alfabank", status: "active" },
    create: { id: "pos-webdev-alfabank", name: "Web Dev", department_id: "dept-it-alfabank", status: "active" },
  });
  await prisma.position.upsert({
    where: { id: "pos-software-alfabank" },
    update: { name: "Software", department_id: "dept-it-alfabank", status: "active" },
    create: { id: "pos-software-alfabank", name: "Software", department_id: "dept-it-alfabank", status: "active" },
  });

  // Positions under Creativemu IT
  await prisma.position.upsert({
    where: { id: "pos-webdev-creativemu" },
    update: { name: "Web Dev", department_id: "dept-it-creativemu", status: "active" },
    create: { id: "pos-webdev-creativemu", name: "Web Dev", department_id: "dept-it-creativemu", status: "active" },
  });
  await prisma.position.upsert({
    where: { id: "pos-software-creativemu" },
    update: { name: "Software", department_id: "dept-it-creativemu", status: "active" },
    create: { id: "pos-software-creativemu", name: "Software", department_id: "dept-it-creativemu", status: "active" },
  });

  // Positions under Alfabank DM
  await prisma.position.upsert({
    where: { id: "pos-seo-alfabank" },
    update: { name: "SEO Specialist", department_id: "dept-dm-alfabank", status: "active" },
    create: { id: "pos-seo-alfabank", name: "SEO Specialist", department_id: "dept-dm-alfabank", status: "active" },
  });
  await prisma.position.upsert({
    where: { id: "pos-cw-alfabank" },
    update: { name: "Content Writer", department_id: "dept-dm-alfabank", status: "active" },
    create: { id: "pos-cw-alfabank", name: "Content Writer", department_id: "dept-dm-alfabank", status: "active" },
  });

  // Positions under Creativemu DM
  await prisma.position.upsert({
    where: { id: "pos-seo-creativemu" },
    update: { name: "SEO Specialist", department_id: "dept-dm-creativemu", status: "active" },
    create: { id: "pos-seo-creativemu", name: "SEO Specialist", department_id: "dept-dm-creativemu", status: "active" },
  });
  await prisma.position.upsert({
    where: { id: "pos-cw-creativemu" },
    update: { name: "Content Writer", department_id: "dept-dm-creativemu", status: "active" },
    create: { id: "pos-cw-creativemu", name: "Content Writer", department_id: "dept-dm-creativemu", status: "active" },
  });

  // Positions under Creativemu Magang DM
  await prisma.position.upsert({
    where: { id: "pos-intern-dm-creativemu" },
    update: { name: "Intern DM", department_id: "dept-magang-dm-creativemu", status: "active" },
    create: { id: "pos-intern-dm-creativemu", name: "Intern DM", department_id: "dept-magang-dm-creativemu", status: "active" },
  });

  // Positions under Alfabank Manajemen
  await prisma.position.upsert({
    where: { id: "pos-mgr-alfabank" },
    update: { name: "Manager", department_id: "dept-mgt-alfabank", status: "active" },
    create: { id: "pos-mgr-alfabank", name: "Manager", department_id: "dept-mgt-alfabank", status: "active" },
  });
  await prisma.position.upsert({
    where: { id: "pos-staff-alfabank" },
    update: { name: "Staff", department_id: "dept-mgt-alfabank", status: "active" },
    create: { id: "pos-staff-alfabank", name: "Staff", department_id: "dept-mgt-alfabank", status: "active" },
  });

  // Positions under Creativemu Manajemen
  await prisma.position.upsert({
    where: { id: "pos-mgr-creativemu" },
    update: { name: "Manager", department_id: "dept-mgt-creativemu", status: "active" },
    create: { id: "pos-mgr-creativemu", name: "Manager", department_id: "dept-mgt-creativemu", status: "active" },
  });
  await prisma.position.upsert({
    where: { id: "pos-staff-creativemu" },
    update: { name: "Staff", department_id: "dept-mgt-creativemu", status: "active" },
    create: { id: "pos-staff-creativemu", name: "Staff", department_id: "dept-mgt-creativemu", status: "active" },
  });

  console.log("Akun owner, admin, CS, serta data Shift, Unit (Alfabank, Creativemu Academy), Divisi, dan Jabatan berhasil dibuat");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
