import API from "../services/api";

/**
 * Checks whether the currently logged-in MANAGER can log out.
 *
 * Returns:
 *  {
 *    canLogout: boolean,
 *    date: string,
 *    pendingEaTasks: Array,          // tasks assigned by EA not yet done today
 *    pendingMarketingReports: Array, // marketing projects missing today's report
 *  }
 */
export const refreshManagerLogoutStatus = async () => {
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  const isManager =
    String(user?.role || "").trim().toUpperCase() === "MANAGER";

  if (!isManager) {
    return { canLogout: true, skipped: true };
  }

  try {
    const response = await API.get("/api/manager/logout-status");
    const payload = response?.data?.data || {};

    const status = {
      ...payload,
      pendingEaTasks: payload.pendingEaTasks ?? payload.assignedActions ?? [],
      pendingMarketingReports: payload.pendingMarketingReports ?? payload.metaAdsProjects ?? [],
      canLogout: payload.canLogout ?? true,
    };

    // Dispatch event so other components can react
    window.dispatchEvent(
      new CustomEvent("manager-logout-status", {
        detail: status,
      })
    );

    return status;
  } catch (error) {
    console.error("Failed to fetch manager logout status", error);
    return { canLogout: true, error: true };
  }
};
