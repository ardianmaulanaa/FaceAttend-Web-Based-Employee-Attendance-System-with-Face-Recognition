export type AdminRole = "owner" | "admin" | "cs";

export function isAdminPanelRole(role: string): role is AdminRole {
  return role === "owner" || role === "admin" || role === "cs";
}

export function canViewAdminPanel(role: string) {
  return isAdminPanelRole(role);
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
