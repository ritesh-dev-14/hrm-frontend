import API from "../services/api";

export const isEmployeeRole = (role) =>
  String(role || "").trim().toUpperCase() === "EMPLOYEE";

export const refreshEmployeeLogoutStatus = async () => {
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  if (!isEmployeeRole(user?.role)) {
    return { canLogout: true, skipped: true };
  }

  try {
    const response = await API.get("/api/employee/logout-status");
    const payload = response?.data?.data || {};
    const status = {
      ...payload,
      canLogout: payload.canLogout ?? true,
    };

    window.dispatchEvent(
      new CustomEvent("employee-logout-status", {
        detail: status,
      }),
    );

    return status;
  } catch (error) {
    console.error("Failed to fetch employee logout status", error);
    return { canLogout: true, error: true };
  }
};
