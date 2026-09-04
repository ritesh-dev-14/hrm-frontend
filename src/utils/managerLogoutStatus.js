import API from "../services/api";

const getErrorMessage = (error, fallback) => {
  if (error?.response?.status === 403) return "You are not allowed to perform this action.";
  if (error?.response?.status === 404) return "This task could not be found.";
  return error?.response?.data?.message || fallback;
};

export const getManagerAssignedTasks = async (managerId) => {
  const response = await API.get(`/api/coordinator-assignments/assigned-to/${managerId}`);
  const data = response?.data?.data;
  return Array.isArray(data) ? data : data?.data || [];
};

export const getManagerAssignment = async (assignmentId) => {
  const response = await API.get(`/api/coordinator-assignments/${assignmentId}`);
  return response?.data?.data || response?.data;
};

export const submitManagerTask = async (assignmentId) => {
  const response = await API.patch(
    `/api/coordinator-assignments/${assignmentId}/status`,
    { status: "SUBMITTED" },
  );
  return response?.data;
};

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
    const [response, assignmentsResponse] = await Promise.all([
      API.get("/api/manager/logout-status"),
      API.get(`/api/coordinator-assignments/assigned-to/${user.id}`),
    ]);
    const payload = response?.data?.data || {};
    const assignmentsPayload = assignmentsResponse?.data?.data;
    const assignments = Array.isArray(assignmentsPayload)
      ? assignmentsPayload
      : assignmentsPayload?.data || assignmentsPayload?.items || [];
    const pendingAssignments = assignments.filter(
      (assignment) => !["SUBMITTED", "VERIFIED"].includes(String(assignment.status || "").toUpperCase()),
    );

    const status = {
      ...payload,
      pendingEaTasks: pendingAssignments.length > 0
        ? pendingAssignments
        : payload.pendingEaTasks ?? payload.assignedActions ?? [],
      pendingMarketingReports: payload.pendingMarketingReports ?? payload.metaAdsProjects ?? [],
      canLogout: payload.canLogout ?? true,
    };

    status.canLogout = status.canLogout
      && status.pendingEaTasks.length === 0
      && status.pendingMarketingReports.length === 0;

    // Dispatch event so other components can react
    window.dispatchEvent(
      new CustomEvent("manager-logout-status", {
        detail: status,
      })
    );

    return status;
  } catch (error) {
    console.error("Failed to fetch manager logout status", error);
    return {
      canLogout: false,
      error: true,
      errorMessage: getErrorMessage(error, "Unable to verify logout status right now. Please try again."),
    };
  }
};

export { getErrorMessage };
