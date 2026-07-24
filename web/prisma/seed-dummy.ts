/**
 * Script seed data dummy 2 karyawan lengkap.
 * Membuat data karyawan beserta:
 * - Profil lengkap (NIK, tempat/tanggal lahir, no rekening, status)
 * - Kantor, Divisi, Unit, Jabatan, Shift sudah terhubung
 * - Data kehadiran 15 hari terakhir (hadir, telat, cuti, izin, sakit)
 * - Data pengajuan cuti
 * - Data pengumuman contoh
 * 
 * Jalankan: npx tsx prisma/seed-dummy.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import * as bcryptModule from "bcryptjs";

const bcrypt = bcryptModule;
const prisma = new PrismaClient();

async function main() {
  console.log("========================================");
  console.log("  SEED DATA DUMMY KARYAWAN");
  console.log("========================================\n");

  // ===== 1. Cari atau buat master data =====

  // Cari shift yang sudah ada
  let shift = await prisma.shift.findFirst({ where: { status: "active" } });
  if (!shift) {
    shift = await prisma.shift.create({
      data: {
        name: "Shift Utama",
        tolerance_minutes: 15,
        status: "active",
      },
    });
    // Buat jadwal kerja (Senin-Jumat, 08:00-17:00)
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;
    for (const day of days) {
      await prisma.workSchedule.create({
        data: {
          shift_id: shift.id,
          day_of_week: day,
          is_work_day: true,
          check_in_time: "08:00",
          check_out_time: "17:00",
        },
      });
    }
    console.log("✅ Shift Utama dibuat dengan jadwal Senin-Jumat 08:00-17:00");
  } else {
    console.log(`✅ Shift ditemukan: ${shift.name}`);
  }

  // Cari office yang sudah ada
  let office = await prisma.officeLocation.findFirst({ where: { status: "active" } });
  if (!office) {
    office = await prisma.officeLocation.create({
      data: {
        name: "Kantor Pusat Creativemu",
        address: "Jl. Raya Creativemu No. 10, Jakarta Selatan",
        latitude: -6.2088,
        longitude: 106.8456,
        radius_meters: 150,
        status: "active",
      },
    });
    console.log("✅ Kantor Pusat Creativemu dibuat");
  } else {
    console.log(`✅ Kantor ditemukan: ${office.name}`);
  }

  // Cari atau buat department
  let dept = await prisma.department.findFirst({ where: { status: "active" } });
  if (!dept) {
    dept = await prisma.department.create({
      data: {
        name: "Divisi IT & Engineering",
        office_id: office.id,
        shift_id: shift.id,
        status: "active",
      },
    });
    console.log("✅ Divisi IT & Engineering dibuat");
  } else {
    console.log(`✅ Divisi ditemukan: ${dept.name}`);
  }

  // Cari atau buat unit
  let unit = await prisma.unit.findFirst({ where: { status: "active" } });
  if (!unit) {
    unit = await prisma.unit.create({
      data: {
        name: "Unit Pengembangan Web",
        department_id: dept.id,
        status: "active",
      },
    });
    console.log("✅ Unit Pengembangan Web dibuat");
  } else {
    console.log(`✅ Unit ditemukan: ${unit.name}`);
  }

  // Cari atau buat position
  let posFrontend = await prisma.position.findFirst({ where: { status: "active" } });
  if (!posFrontend) {
    posFrontend = await prisma.position.create({
      data: {
        name: "Frontend Developer",
        unit_id: unit.id,
        status: "active",
      },
    });
    console.log("✅ Jabatan Frontend Developer dibuat");
  } else {
    console.log(`✅ Jabatan ditemukan: ${posFrontend.name}`);
  }

  // Buat posisi Backend jika belum ada
  let posBackend = await prisma.position.findFirst({
    where: { name: { contains: "Backend" }, status: "active" },
  });
  if (!posBackend) {
    posBackend = await prisma.position.create({
      data: {
        name: "Backend Developer",
        unit_id: unit.id,
        status: "active",
      },
    });
    console.log("✅ Jabatan Backend Developer dibuat");
  } else {
    console.log(`✅ Jabatan ditemukan: ${posBackend.name}`);
  }

  // ===== 2. Buat 2 karyawan dummy =====
  const passwordHash = await bcrypt.hash("Password123!", 12);

  // Karyawan 1: Rina Putri
  let emp1 = await prisma.user.findFirst({ where: { email: "rina@creativemu.my.id" } });
  if (!emp1) {
    emp1 = await prisma.user.create({
      data: {
        name: "Rina Putri Anggraini",
        email: "rina@creativemu.my.id",
        password_hash: passwordHash,
        role: "employee",
        employee_type: "utama",
        phone: "081234567890",
        status: "active",
        unit_id: unit.id,
        department_id: dept.id,
        position_id: posFrontend.id,
        shift_id: shift.id,
        registered_office_id: office.id,
        base_salary: 2000000,
        birth_place: "Bandung",
        birth_date: new Date("1998-05-12"),
        nik: "320401120598",
        bank_account_number: "1234567890123",
        employment_status: "kartap",
        contract_start_date: new Date("2024-01-15"),
        npwp_number: "12.345.678.9-012.000",
        ptkp_status: "TK0",
      },
    });
    console.log("\n👩 Karyawan 1 dibuat: Rina Putri Anggraini (rina@creativemu.my.id)");
  } else {
    console.log(`\n👩 Karyawan 1 ditemukan: ${emp1.name}`);
  }

  // Karyawan 2: Budi Santoso
  let emp2 = await prisma.user.findFirst({ where: { email: "budi@creativemu.my.id" } });
  if (!emp2) {
    emp2 = await prisma.user.create({
      data: {
        name: "Budi Santoso Pratama",
        email: "budi@creativemu.my.id",
        password_hash: passwordHash,
        role: "employee",
        employee_type: "utama",
        phone: "087654321098",
        status: "active",
        unit_id: unit.id,
        department_id: dept.id,
        position_id: posBackend.id,
        shift_id: shift.id,
        registered_office_id: office.id,
        base_salary: 2000000,
        birth_place: "Surabaya",
        birth_date: new Date("1996-11-25"),
        nik: "351701251196",
        bank_account_number: "9876543210987",
        employment_status: "kontrak",
        contract_start_date: new Date("2025-03-01"),
        contract_end_date: new Date("2026-12-31"),
        npwp_number: "98.765.432.1-098.000",
        ptkp_status: "K1",
      },
    });
    console.log("👨 Karyawan 2 dibuat: Budi Santoso Pratama (budi@creativemu.my.id)");
  } else {
    console.log(`👨 Karyawan 2 ditemukan: ${emp2.name}`);
  }

  // ===== 3. Buat data kehadiran 15 hari terakhir =====
  console.log("\n📅 Membuat data kehadiran 15 hari terakhir...");

  const today = new Date();
  const employees = [emp1, emp2];

  // Pola kehadiran campuran supaya terisi semua status
  const attendancePatterns = [
    // Karyawan 1 (Rina): 10 hadir, 2 telat, 1 cuti(PERMISSION), 1 izin(PERMISSION), 1 sakit(SICK)
    ["PRESENT", "PRESENT", "LATE", "PRESENT", "PRESENT", "PRESENT", "LATE", "PRESENT", "PERMISSION", "PRESENT", "PERMISSION", "PRESENT", "PRESENT", "SICK", "PRESENT"],
    // Karyawan 2 (Budi): 9 hadir, 3 telat, 1 cuti(PERMISSION), 1 sakit(SICK), 1 izin(PERMISSION)
    ["PRESENT", "LATE", "PRESENT", "PRESENT", "LATE", "PRESENT", "PRESENT", "SICK", "PRESENT", "LATE", "PRESENT", "PERMISSION", "PRESENT", "PRESENT", "PERMISSION"],
  ];

  for (let empIdx = 0; empIdx < employees.length; empIdx++) {
    const emp = employees[empIdx];
    const pattern = attendancePatterns[empIdx];
    let createdCount = 0;

    for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);

      // Skip weekends
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue;

      const patternIdx = 14 - dayOffset;
      const status = pattern[patternIdx % pattern.length];

      // Check if attendance already exists for this date
      const attendanceDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const existing = await prisma.attendance.findFirst({
        where: {
          user_id: emp.id,
          attendance_date: attendanceDate,
        },
      });
      if (existing) continue;

      const scheduledCheckIn = new Date(date);
      scheduledCheckIn.setHours(8, 0, 0, 0);
      const scheduledCheckOut = new Date(date);
      scheduledCheckOut.setHours(17, 0, 0, 0);

      let checkInTime: Date | null = null;
      let checkOutTime: Date | null = null;
      let lateMinutes = 0;
      let workMinutes = 480; // 8 hours
      let checkInStatus: "ON_TIME" | "LATE" | null = null;
      let checkOutStatus: "NORMAL" | "EARLY" | null = null;

      if (status === "PRESENT") {
        // Hadir tepat waktu (07:50 - 08:05 random)
        checkInTime = new Date(date);
        const minBefore = Math.floor(Math.random() * 10);
        checkInTime.setHours(7, 50 + minBefore, 0, 0);
        checkOutTime = new Date(date);
        checkOutTime.setHours(17, Math.floor(Math.random() * 15), 0, 0);
        checkInStatus = "ON_TIME";
        checkOutStatus = "NORMAL";
      } else if (status === "LATE") {
        // Terlambat (08:20 - 08:45)
        checkInTime = new Date(date);
        const lateMin = 20 + Math.floor(Math.random() * 25);
        checkInTime.setHours(8, lateMin, 0, 0);
        lateMinutes = lateMin;
        checkOutTime = new Date(date);
        checkOutTime.setHours(17, Math.floor(Math.random() * 10), 0, 0);
        checkInStatus = "LATE";
        checkOutStatus = "NORMAL";
        workMinutes = 480 - lateMinutes;
      } else if (status === "PERMISSION" || status === "SICK") {
        // Cuti / Sakit / Izin - tidak ada check-in/out
        workMinutes = 0;
      }

      await prisma.attendance.create({
        data: {
          user_id: emp.id,
          attendance_date: attendanceDate,
          scheduled_check_in: scheduledCheckIn,
          scheduled_check_out: scheduledCheckOut,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          work_mode: "office",
          registered_office_id: office.id,
          check_in_office_id: checkInTime ? office.id : null,
          check_out_office_id: checkOutTime ? office.id : null,
          check_in_latitude: checkInTime ? office.latitude : null,
          check_in_longitude: checkInTime ? office.longitude : null,
          check_in_within_radius: !!checkInTime,
          check_out_latitude: checkOutTime ? office.latitude : null,
          check_out_longitude: checkOutTime ? office.longitude : null,
          check_out_within_radius: !!checkOutTime,
          late_minutes: lateMinutes,
          work_minutes: workMinutes,
          is_over_tolerance: lateMinutes > (shift?.tolerance_minutes || 15),
          status: status as any,
          check_in_status: checkInStatus as any,
          check_out_status: checkOutStatus as any,
        },
      });
      createdCount++;
    }

    console.log(`  ✅ ${emp.name}: ${createdCount} record kehadiran dibuat`);
  }

  // ===== 4. Buat pengajuan cuti contoh =====
  console.log("\n📋 Membuat pengajuan cuti contoh...");

  // Cek apakah sudah ada leave request
  const existingLeave = await prisma.leaveRequest.findFirst({
    where: { user_id: emp1.id },
  });

  if (!existingLeave) {
    // Cuti Rina: Approved
    await prisma.leaveRequest.create({
      data: {
        user_id: emp1.id,
        leave_type: "annual",
        start_date: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - 10)),
        end_date: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - 10)),
        total_days: 1,
        reason: "Keperluan keluarga - acara pernikahan saudara di Bandung",
        status: "approved",
        admin_note: "Disetujui. Selamat hadir!",
      },
    });

    // Izin Rina: Approved
    await prisma.leaveRequest.create({
      data: {
        user_id: emp1.id,
        leave_type: "permission",
        start_date: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - 5)),
        end_date: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - 5)),
        total_days: 1,
        reason: "Keperluan pengurusan dokumen pribadi di kantor pemerintah",
        status: "approved",
      },
    });

    // Sakit Budi: Approved
    await prisma.leaveRequest.create({
      data: {
        user_id: emp2.id,
        leave_type: "sick",
        start_date: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - 8)),
        end_date: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - 8)),
        total_days: 1,
        reason: "Demam tinggi dan flu berat. Surat dokter akan menyusul.",
        status: "approved",
        admin_note: "Semoga lekas sembuh.",
      },
    });

    // Cuti pending Budi
    await prisma.leaveRequest.create({
      data: {
        user_id: emp2.id,
        leave_type: "annual",
        start_date: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 5)),
        end_date: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 7)),
        total_days: 3,
        reason: "Liburan keluarga ke Yogyakarta. Mohon izin 3 hari kerja.",
        status: "pending",
      },
    });

    console.log("  ✅ 4 pengajuan cuti/izin/sakit contoh dibuat");
  } else {
    console.log("  ⏭️  Leave requests sudah ada, skip.");
  }

  // ===== 5. Buat pengumuman contoh =====
  const existingAnn = await prisma.announcement.findFirst();
  if (!existingAnn) {
    // Cari admin/owner
    const admin = await prisma.user.findFirst({ where: { role: "owner" } });

    await prisma.announcement.create({
      data: {
        title: "Selamat Datang di FaceAttend - Sistem Presensi Digital",
        content: "Halo semua karyawan Creativemu! Sistem presensi digital FaceAttend kini telah resmi digunakan. Pastikan Anda melakukan check-in dan check-out setiap hari melalui aplikasi. Jika ada kendala, silakan hubungi HRD.\n\nFitur utama:\n• Check-in / Check-out via Verifikasi Wajah\n• Pengajuan Cuti / Izin / Sakit\n• Laporan Kehadiran & Slip Gaji\n• Notifikasi Real-time",
        target: "all",
        status: "published",
        author_id: admin?.id || null,
      },
    });

    await prisma.announcement.create({
      data: {
        title: "Reminder: Toleransi Keterlambatan 15 Menit",
        content: "Diberitahukan kepada seluruh karyawan bahwa batas toleransi keterlambatan check-in adalah 15 menit dari jadwal shift. Keterlambatan di atas 15 menit akan dicatat sebagai pelanggaran dan memengaruhi potongan gaji bulanan.\n\nMohon perhatian dan kedisiplinan semua pihak. Terima kasih.",
        target: "employee",
        status: "published",
        author_id: admin?.id || null,
      },
    });

    console.log("\n📢 2 pengumuman contoh dibuat");
  } else {
    console.log("\n📢 Pengumuman sudah ada, skip.");
  }

  console.log("\n========================================");
  console.log("  ✅ SEED DATA SELESAI!");
  console.log("========================================");
  console.log("\n📌 Akun karyawan dummy:");
  console.log("  1. rina@creativemu.my.id  / Password123!");
  console.log("     Rina Putri Anggraini - Frontend Developer");
  console.log("     NIK: 320401120598 | Rek: 1234567890123");
  console.log("  2. budi@creativemu.my.id  / Password123!");
  console.log("     Budi Santoso Pratama - Backend Developer");
  console.log("     NIK: 351701251196 | Rek: 9876543210987");
  console.log("\n  Data kehadiran, cuti, & pengumuman telah terisi.\n");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seed data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
