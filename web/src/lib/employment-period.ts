import { prisma } from "@/lib/prisma";

type EmploymentPeriodUser = {
  id: string;
  role: string | null;
  status: string | null;
  employment_end_date: Date | string | null;
};

function getJakartaDateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function normalizeDateKey(value: Date | string | null) {
  if (!value) return "";

  if (value instanceof Date) {
    return getJakartaDateKey(value);
  }

  const text = String(value).trim();

  if (!text) return "";

  return text.slice(0, 10);
}

export function isEmploymentExpired(
  employmentEndDate: Date | string | null,
  now = new Date(),
) {
  const endDateKey = normalizeDateKey(employmentEndDate);

  if (!endDateKey) return false;

  return getJakartaDateKey(now) > endDateKey;
}

export async function deactivateExpiredEmployee(user: EmploymentPeriodUser) {
  if (
    String(user.role || "").toLowerCase() !== "employee" ||
    String(user.status || "").toLowerCase() !== "active" ||
    !isEmploymentExpired(user.employment_end_date)
  ) {
    return false;
  }

  await prisma.user.updateMany({
    where: {
      id: user.id,
      status: "active",
    },
    data: {
      status: "inactive",
    },
  });

  return true;
}
