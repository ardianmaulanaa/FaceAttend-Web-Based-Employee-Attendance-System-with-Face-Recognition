import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function run() {
  // 1. Delete the 2 broken dummy users
  const deleteEmails = ["rina@creativemu.my.id", "budi@creativemu.my.id"];

  const toDelete = await prisma.user.findMany({
    where: { email: { in: deleteEmails } },
  });

  const idsToDelete = toDelete.map((u) => u.id);

  if (idsToDelete.length > 0) {
    await prisma.attendance.deleteMany({
      where: { user_id: { in: idsToDelete } },
    });
    await prisma.leaveRequest.deleteMany({
      where: { user_id: { in: idsToDelete } },
    });
    await prisma.user.deleteMany({ where: { id: { in: idsToDelete } } });
    console.log("Deleted broken dummy employees:", deleteEmails);
  }

  // 2. Fetch active shift and office
  const defaultShift = await prisma.shift.findFirst({
    where: { status: "active" },
  });
  const defaultOffice = await prisma.officeLocation.findFirst({
    where: { status: "active" },
  });

  const shiftId = defaultShift?.id || "shift-1";
  const officeId = defaultOffice?.id || "office-2";

  // Fetch valid positions with unit and department
  const positions = await prisma.position.findMany({
    where: { status: "active" },
    include: {
      unit: {
        include: {
          department: true,
        },
      },
    },
  });

  const hashPassword = await bcrypt.hash("123456", 10);

  const newEmployees = [
    {
      name: "Ahmad Rizky Pratama",
      email: "ahmad.rizky@creativemu.co.id",
      phone: "081298760001",
      employment_status: "kartap",
      base_salary: 5500000,
      nik: "3171012301900001",
      npwp_number: "91.234.567.8-012.001",
      ptkp_status: "TK/0",
    },
    {
      name: "Siti Nurhaliza",
      email: "siti.nurhaliza@creativemu.co.id",
      phone: "081298760002",
      employment_status: "kartap",
      base_salary: 6000000,
      nik: "3171012301900002",
      npwp_number: "91.234.567.8-012.002",
      ptkp_status: "K/0",
    },
    {
      name: "Bagas Dwi Cahyono",
      email: "bagas.cahyono@creativemu.co.id",
      phone: "081298760003",
      employment_status: "kontrak",
      base_salary: 7500000,
      nik: "3171012301900003",
      npwp_number: "91.234.567.8-012.003",
      ptkp_status: "TK/0",
    },
    {
      name: "Dewi Sartika",
      email: "dewi.sartika@creativemu.co.id",
      phone: "081298760004",
      employment_status: "kartap",
      base_salary: 6500000,
      nik: "3171012301900004",
      npwp_number: "91.234.567.8-012.004",
      ptkp_status: "TK/1",
    },
    {
      name: "Fajar Ramadhan",
      email: "fajar.ramadhan@creativemu.co.id",
      phone: "081298760005",
      employment_status: "magang",
      base_salary: 3000000,
      nik: "3171012301900005",
      npwp_number: "91.234.567.8-012.005",
      ptkp_status: "TK/0",
    },
    {
      name: "Indah Permatasari",
      email: "indah.permatasari@creativemu.co.id",
      phone: "081298760006",
      employment_status: "kartap",
      base_salary: 4800000,
      nik: "3171012301900006",
      npwp_number: "91.234.567.8-012.006",
      ptkp_status: "K/1",
    },
    {
      name: "Kevin Hendrawan",
      email: "kevin.hendrawan@creativemu.co.id",
      phone: "081298760007",
      employment_status: "kontrak",
      base_salary: 7000000,
      nik: "3171012301900007",
      npwp_number: "91.234.567.8-012.007",
      ptkp_status: "TK/0",
    },
    {
      name: "Nadia Putri Utami",
      email: "nadia.utami@creativemu.co.id",
      phone: "081298760008",
      employment_status: "kartap",
      base_salary: 5800000,
      nik: "3171012301900008",
      npwp_number: "91.234.567.8-012.008",
      ptkp_status: "TK/0",
    },
    {
      name: "Reza Rahardian",
      email: "reza.rahardian@creativemu.co.id",
      phone: "081298760009",
      employment_status: "kontrak",
      base_salary: 5000000,
      nik: "3171012301900009",
      npwp_number: "91.234.567.8-012.009",
      ptkp_status: "K/2",
    },
    {
      name: "Tania Putri Ananda",
      email: "tania.ananda@creativemu.co.id",
      phone: "081298760010",
      employment_status: "magang",
      base_salary: 3500000,
      nik: "3171012301900010",
      npwp_number: "91.234.567.8-012.010",
      ptkp_status: "TK/0",
    },
  ];

  let createdCount = 0;
  for (let i = 0; i < newEmployees.length; i++) {
    const emp = newEmployees[i];

    // Pick position safely
    const pos = positions[i % positions.length];
    const unitId = pos.unit_id;
    const deptId = pos.unit?.department_id || null;
    const finalOfficeId = pos.unit?.department?.office_id || officeId;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 10));
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    await prisma.user.upsert({
      where: { email: emp.email },
      update: {
        name: emp.name,
        phone: emp.phone,
        role: "employee",
        status: "active",
        employment_status: emp.employment_status,
        base_salary: emp.base_salary,
        nik: emp.nik,
        npwp_number: emp.npwp_number,
        ptkp_status: emp.ptkp_status,
        registered_office_id: finalOfficeId,
        department_id: deptId,
        unit_id: unitId,
        position_id: pos.id,
        shift_id: shiftId,
        contract_start_date: startDate,
        contract_end_date: emp.employment_status === "kartap" ? null : endDate,
      },
      create: {
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        password_hash: hashPassword,
        role: "employee",
        status: "active",
        employment_status: emp.employment_status,
        base_salary: emp.base_salary,
        nik: emp.nik,
        npwp_number: emp.npwp_number,
        ptkp_status: emp.ptkp_status,
        registered_office_id: finalOfficeId,
        department_id: deptId,
        unit_id: unitId,
        position_id: pos.id,
        shift_id: shiftId,
        contract_start_date: startDate,
        contract_end_date: emp.employment_status === "kartap" ? null : endDate,
      },
    });
    createdCount++;
  }

  console.log(
    "SUCCESS: Deleted broken dummy accounts and seeded",
    createdCount,
    "clean dummy employees!",
  );
}

run().catch(console.error);
