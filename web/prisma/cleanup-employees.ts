/**
 * Script pembersihan data karyawan lama.
 * Menghapus SEMUA user dengan role "employee" beserta data terkait mereka
 * (attendance, leave_requests, payroll, notifikasi, dll).
 * 
 * Data admin/owner TIDAK akan dihapus.
 * Data master (Shift, Divisi, Unit, Jabatan, Lokasi) TIDAK akan dihapus.
 * 
 * Jalankan: npx tsx prisma/cleanup-employees.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("========================================");
  console.log("  PEMBERSIHAN DATA KARYAWAN LAMA");
  console.log("========================================\n");

  // 1. Cari semua user employee
  const employees = await prisma.user.findMany({
    where: { role: "employee" },
    select: { id: true, name: true, email: true },
  });

  console.log(`Ditemukan ${employees.length} karyawan untuk dihapus:\n`);
  employees.forEach((e, i) => {
    console.log(`  ${i + 1}. ${e.name} (${e.email})`);
  });

  if (employees.length === 0) {
    console.log("\n✅ Tidak ada data karyawan lama untuk dihapus.");
    return;
  }

  const employeeIds = employees.map((e) => e.id);

  // 2. Hapus data terkait karyawan (cascade dari schema sudah menangani sebagian)
  // Tapi kita hapus secara eksplisit untuk kepastian dan logging

  // Hapus PayrollItems via Payroll (cascade)
  const deletedPayrolls = await prisma.payroll.deleteMany({
    where: { user_id: { in: employeeIds } },
  });
  console.log(`\n🗑️  Payroll dihapus: ${deletedPayrolls.count}`);

  // Hapus AdminNotification
  const deletedAdminNotif = await prisma.adminNotification.deleteMany({
    where: { user_id: { in: employeeIds } },
  });
  console.log(`🗑️  AdminNotification dihapus: ${deletedAdminNotif.count}`);

  // Hapus LeaveRequest
  const deletedLeaves = await prisma.leaveRequest.deleteMany({
    where: { user_id: { in: employeeIds } },
  });
  console.log(`🗑️  LeaveRequest dihapus: ${deletedLeaves.count}`);

  // Hapus WfhRequest (yang diajukan karyawan)
  const deletedWfh = await prisma.wfhRequest.deleteMany({
    where: { user_id: { in: employeeIds } },
  });
  console.log(`🗑️  WfhRequest dihapus: ${deletedWfh.count}`);

  // Hapus EmployeeVisit
  const deletedVisits = await prisma.employeeVisit.deleteMany({
    where: { user_id: { in: employeeIds } },
  });
  console.log(`🗑️  EmployeeVisit dihapus: ${deletedVisits.count}`);

  // Hapus AttendanceMonthlySummary
  const deletedSummaries = await prisma.attendanceMonthlySummary.deleteMany({
    where: { user_id: { in: employeeIds } },
  });
  console.log(`🗑️  AttendanceMonthlySummary dihapus: ${deletedSummaries.count}`);

  // Hapus Attendance
  const deletedAttendance = await prisma.attendance.deleteMany({
    where: { user_id: { in: employeeIds } },
  });
  console.log(`🗑️  Attendance dihapus: ${deletedAttendance.count}`);

  // 3. Hapus user karyawan itu sendiri
  const deletedUsers = await prisma.user.deleteMany({
    where: { role: "employee" },
  });
  console.log(`🗑️  User (employee) dihapus: ${deletedUsers.count}`);

  // 4. Hapus juga semua Announcement lama (opsional - bersihkan semua)
  const deletedAnnouncements = await prisma.announcement.deleteMany({});
  console.log(`🗑️  Announcement dihapus: ${deletedAnnouncements.count}`);

  // 5. Hapus LoginRateLimit lama
  const deletedRateLimits = await prisma.loginRateLimit.deleteMany({});
  console.log(`🗑️  LoginRateLimit dihapus: ${deletedRateLimits.count}`);

  console.log("\n========================================");
  console.log("  ✅ PEMBERSIHAN SELESAI!");
  console.log("  Data admin/owner tetap aman.");
  console.log("  Data master (Shift, Divisi, dll) tetap ada.");
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Error saat membersihkan data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
