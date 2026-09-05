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
    // Fire both checks in parallel:
    // 1. Backend logout-status (checks manager-assigned tasks only)
    // 2. EA coordinator-assignments assigned to this employee
    const requests = [API.get("/api/employee/logout-status")];
    if (user?.id) {
      requests.push(
        API.get(`/api/coordinator-assignments/assigned-to/${user.id}`)
      );
    }

    const [response, eaResponse] = await Promise.all(requests);

    const payload = response?.data?.data || {};
    const pendingTasks = Array.isArray(payload.pendingTasks) ? payload.pendingTasks : [];

    // Parse EA assignments - handle 2-3 levels of nesting
    const eaRaw = eaResponse?.data?.data;
    const eaList = Array.isArray(eaRaw)
      ? eaRaw
      : Array.isArray(eaRaw?.data)
        ? eaRaw.data
        : Array.isArray(eaResponse?.data)
          ? eaResponse.data
          : [];

    // EA task is pending if not yet submitted or completed
    const pendingEaAssignments = eaList.filter(
      (t) => !["SUBMITTED", "COMPLETED"].includes(String(t?.status || "").toUpperCase())
    );

    const hasEaPending = pendingEaAssignments.length > 0;
    const backendCanLogout = payload.canLogout === true;

    const status = {
      ...payload,
      // Block logout if manager tasks OR EA tasks are still pending
      canLogout: backendCanLogout && !hasEaPending,
      pendingTasks,
      pendingEaAssignments,
    };

    window.dispatchEvent(
      new CustomEvent("employee-logout-status", {
        detail: status,
      }),
    );

    return status;
  } catch (error) {
    console.error("Failed to fetch employee logout status", error);
    const status = {
      canLogout: false,
      error: true,
      errorMessage: "Unable to verify logout status right now. Please try again.",
      pendingTasks: [],
      pendingEaAssignments: [],
    };
    window.dispatchEvent(new CustomEvent("employee-logout-status", { detail: status }));
    return status;
  }
};
