export type AdminRole = "owner" | "admin" | "cs";
export type AdminFeatureKey =
  | "dashboard"
  | "employees"
  | "employee-requests"
  | "announcements"
  | "company-monitor"
  | "master-data"
  | "inventory";

const ADMIN_FEATURES_BY_ROLE: Record<AdminRole, AdminFeatureKey[]> = {
  owner: [
    "dashboard",
    "employees",
    "employee-requests",
    "announcements",
    "company-monitor",
    "master-data",
    "inventory",
  ],
  admin: ["dashboard", "employees"],
  cs: ["dashboard", "employee-requests"],
};

const ADMIN_PATHS_BY_FEATURE: Record<AdminFeatureKey, string[]> = {
  dashboard: ["/admin/dashboard"],
  employees: ["/admin/employees"],
  "employee-requests": ["/admin/employee-requests"],
  announcements: ["/admin/announcements", "/admin/pengumuman"],
  "company-monitor": ["/admin/company-monitor", "/admin/monitor_perusahaan"],
  "master-data": [
    "/admin/master-data",
    "/admin/shifts",
    "/admin/work-schedules",
    "/admin/departments",
    "/admin/jabatan",
  ],
  inventory: ["/admin/inventory"],
};

export function isAdminPanelRole(role: string): role is AdminRole {
  return role === "owner" || role === "admin" || role === "cs";
}

export function canViewAdminPanel(role: string) {
  return isAdminPanelRole(role);
}

export function canAccessAdminFeature(role: string, feature: AdminFeatureKey) {
  if (!isAdminPanelRole(role)) return false;
  return ADMIN_FEATURES_BY_ROLE[role].includes(feature);
}

export function getAdminFeatures(role: string) {
  if (!isAdminPanelRole(role)) return [];
  return ADMIN_FEATURES_BY_ROLE[role];
}

export function getAllowedAdminPathPrefixes(role: string) {
  if (!isAdminPanelRole(role)) return [];

  const basePaths = ["/admin", "/admin/profile", "/admin/register"];
  const featurePaths = ADMIN_FEATURES_BY_ROLE[role].flatMap(
    (feature) => ADMIN_PATHS_BY_FEATURE[feature],
  );

  return [...basePaths, ...featurePaths];
}

export function canAccessAdminPath(role: string, pathname: string) {
  const normalizedPath = pathname.split("?")[0];
  return getAllowedAdminPathPrefixes(role).some((pathPrefix) =>
    normalizedPath.startsWith(pathPrefix),
  );
}

export function canEditAdminData(role: string) {
  return role === "owner" || role === "admin";
}

export function canDeleteAdminData(role: string) {
  return role === "owner";
}

export function getAdminRoleLabel(role: string) {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  if (role === "cs") return "Customer Service";
  return role;
}

export function getAdminNotificationTitle(role: string) {
  if (role === "owner") return "Notifikasi Owner";
  if (role === "admin") return "Notifikasi Admin Karyawan";
  if (role === "cs") return "Notifikasi CS";
  return "Notifikasi";
}
