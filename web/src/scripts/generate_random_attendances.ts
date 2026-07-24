import { prisma } from "../lib/prisma";

async function run() {
  console.log("Starting office update and random attendance generation...");

  // 1. Update office-1 name to "CV Creativemu Agency"
  const officeAgency = await prisma.officeLocation.upsert({
    where: { id: "office-1" },
    update: {
      name: "CV Creativemu Agency",
      address: "Jl. Creative Agency No. 12, Jakarta Selatan",
      status: "active",
    },
    create: {
      id: "office-1",
      name: "CV Creativemu Agency",
      address: "Jl. Creative Agency No. 12, Jakarta Selatan",
      latitude: -6.917464,
      longitude: 107.619123,
      radius_meters: 100,
      status: "active",
    },
  });

  const officeAcademy = await prisma.officeLocation.findUnique({
    where: { id: "office-2" },
  });

  console.log("Offices ready:", officeAgency.name, "&", officeAcademy?.name);

  // 2. Fetch all employees
  const employees = await prisma.user.findMany({
    where: { role: "employee" },
  });

  if (employees.length === 0) {
    console.log("No employees found.");
    return;
  }

  // 3. Distribute employees between "CV Creativemu Agency" (office-1) and "Creativemu Academy" (office-2)
  for (let i = 0; i < employees.length; i++) {
    const targetOfficeId = i % 2 === 0 ? "office-1" : "office-2";
    await prisma.user.update({
      where: { id: employees[i].id },
      data: { registered_office_id: targetOfficeId },
    });
  }
  console.log("Distributed employees across both offices evenly.");

  // 4. Generate random attendances and leave requests for July 2026
  const empIds = employees.map((e) => e.id);
  await prisma.attendance.deleteMany({ where: { user_id: { in: empIds } } });
  await prisma.leaveRequest.deleteMany({ where: { user_id: { in: empIds } } });
  await prisma.attendanceMonthlySummary.deleteMany({
    where: { user_id: { in: empIds } },
  });

  // July 2026 work days (Mon - Fri)
  const workDaysInJuly: Date[] = [];
  const year = 2026;
  const month = 6; // July (0-indexed)

  for (let day = 1; day <= 23; day++) {
    const d = new Date(year, month, day);
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workDaysInJuly.push(d);
    }
  }

  console.log(`Generating data for ${workDaysInJuly.length} work days...`);

  for (const emp of employees) {
    let presentDays = 0;
    let lateDays = 0;
    let sickDays = 0;
    let leaveDays = 0;
    let wfhDays = 0;
    let wfcDays = 0;
    let visitDays = 0;
    let totalLateMinutes = 0;

    for (let idx = 0; idx < workDaysInJuly.length; idx++) {
      const date = workDaysInJuly[idx];
      const officeId = emp.registered_office_id || "office-1";

      const rand = Math.random();

      if (rand < 0.6) {
        // Hadir Tepat Waktu
        presentDays++;
        const checkIn = new Date(date);
        checkIn.setHours(8, 40 + Math.floor(Math.random() * 18), 0, 0);

        const checkOut = new Date(date);
        checkOut.setHours(17, Math.floor(Math.random() * 20), 0, 0);

        await prisma.attendance.create({
          data: {
            user_id: emp.id,
            attendance_date: date,
            scheduled_check_in: new Date(date.setHours(9, 0, 0, 0)),
            scheduled_check_out: new Date(date.setHours(17, 0, 0, 0)),
            check_in_time: checkIn,
            check_out_time: checkOut,
            work_mode: "office",
            registered_office_id: officeId,
            check_in_office_id: officeId,
            check_out_office_id: officeId,
            check_in_within_radius: true,
            check_out_within_radius: true,
            status: "PRESENT",
            check_in_status: "ON_TIME",
            check_out_status: "NORMAL",
            work_minutes: 480,
          },
        });
      } else if (rand < 0.8) {
        // Hadir Telat
        presentDays++;
        lateDays++;
        const lateMins = 10 + Math.floor(Math.random() * 35);
        totalLateMinutes += lateMins;

        const checkIn = new Date(date);
        checkIn.setHours(9, lateMins, 0, 0);

        const checkOut = new Date(date);
        checkOut.setHours(17, 10 + Math.floor(Math.random() * 20), 0, 0);

        await prisma.attendance.create({
          data: {
            user_id: emp.id,
            attendance_date: date,
            scheduled_check_in: new Date(date.setHours(9, 0, 0, 0)),
            scheduled_check_out: new Date(date.setHours(17, 0, 0, 0)),
            check_in_time: checkIn,
            check_out_time: checkOut,
            work_mode: "office",
            registered_office_id: officeId,
            check_in_office_id: officeId,
            check_out_office_id: officeId,
            check_in_within_radius: true,
            check_out_within_radius: true,
            late_minutes: lateMins,
            is_over_tolerance: lateMins > 15,
            late_reason: "Macet di jalan",
            status: "LATE",
            check_in_status: "LATE",
            check_out_status: "NORMAL",
            work_minutes: 480 - lateMins,
          },
        });
      } else if (rand < 0.9) {
        // WFH / WFC / Visit
        presentDays++;
        const isWfh = Math.random() > 0.5;
        if (isWfh) wfhDays++;
        else visitDays++;

        const checkIn = new Date(date);
        checkIn.setHours(8, 50, 0, 0);
        const checkOut = new Date(date);
        checkOut.setHours(17, 5, 0, 0);

        await prisma.attendance.create({
          data: {
            user_id: emp.id,
            attendance_date: date,
            scheduled_check_in: new Date(date.setHours(9, 0, 0, 0)),
            scheduled_check_out: new Date(date.setHours(17, 0, 0, 0)),
            check_in_time: checkIn,
            check_out_time: checkOut,
            work_mode: isWfh ? "wfh" : "visit",
            is_wfh: isWfh,
            is_visit: !isWfh,
            registered_office_id: officeId,
            status: "PRESENT",
            check_in_status: "ON_TIME",
            check_out_status: "NORMAL",
            work_minutes: 480,
            activity_note: isWfh
              ? "WFH pengerjaan tugas tim"
              : "Kunjungan ke klien",
          },
        });
      } else {
        // Sakit atau Cuti
        const isSick = Math.random() > 0.4;
        if (isSick) sickDays++;
        else leaveDays++;

        const leaveType = isSick ? "sick" : "annual";

        await prisma.leaveRequest.create({
          data: {
            user_id: emp.id,
            leave_type: leaveType,
            requested_work_mode: "flexible",
            start_date: date,
            end_date: date,
            total_days: 1,
            reason: isSick ? "Sakit flu / demam" : "Acara keluarga",
            status: "approved",
            admin_note: "Disetujui otomatis",
          },
        });

        await prisma.attendance.create({
          data: {
            user_id: emp.id,
            attendance_date: date,
            work_mode: "office",
            registered_office_id: officeId,
            status: isSick ? "SICK" : "PERMISSION",
            note: isSick ? "Izin Sakit (Demam)" : "Cuti Tahunan",
          },
        });
      }
    }

    // Create Monthly Summary for July 2026
    await prisma.attendanceMonthlySummary.create({
      data: {
        user_id: emp.id,
        period_month: 7,
        period_year: 2026,
        total_present_days: presentDays,
        total_late_days: lateDays,
        total_absent_days: 0,
        total_leave_days: leaveDays,
        total_sick_days: sickDays,
        total_late_minutes: totalLateMinutes,
        total_work_minutes: presentDays * 450,
        total_wfh_days: wfhDays,
        total_wfc_days: wfcDays,
        total_visit_days: visitDays,
      },
    });

    console.log(
      `[${emp.name}] Office: ${
        emp.registered_office_id === "office-1"
          ? "CV Creativemu Agency"
          : "Creativemu Academy"
      } | Hadir: ${presentDays}, Telat: ${lateDays}, Sakit: ${sickDays}, Cuti: ${leaveDays}`,
    );
  }

  console.log(
    "SUCCESS: Generated random attendance, late, sick, leave data & assigned offices!",
  );
}

run().catch(console.error);
