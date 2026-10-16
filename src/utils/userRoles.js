export const getUserRoles = (user, fallbackRole) => {
  const assignedRoles = Array.isArray(user?.roles) ? user.roles : [];
  return [...new Set([fallbackRole || user?.role, ...assignedRoles]
    .map((role) => String(role || "").trim().toUpperCase())
    .filter(Boolean))];
};
