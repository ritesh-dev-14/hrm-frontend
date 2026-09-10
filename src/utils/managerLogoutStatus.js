import API from "../services/api";

const getErrorMessage = (error, fallback) => {
  if (error?.response?.status === 403) return "You are not allowed to perform this action.";
  if (error?.response?.status === 404) return "This task could not be found.";
  return error?.response?.data?.message || fallback;
};

const firstArray = (...values) => values.find(Array.isArray) || [];

export const getManagerPendingCategories = (status = {}) => ({
  ea: firstArray(status.pendingEaTasks, status.assignedActions),
  metaAds: firstArray(
    status.pendingMetaAds,
    status.pendingMarketingReports,
    status.metaAdsProjects,
  ),
  seo: firstArray(status.pendingSeo, status.pendingSEO, status.seoProjects),
  socialMedia: firstArray(
    status.pendingSocialMedia,
    status.pendingSocial,
    status.socialMediaProjects,
  ),
  webDevelopment: firstArray(
    status.pendingWebDevelopment,
    status.pendingWeb,
    status.webDevelopmentProjects,
  ),
});

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

export const submitMarketingUnableReason = async ({ projectId, clientName, reason, date }) => {
  const response = await API.post("/api/marketing-reports", {
    projectId,
    clientName: clientName || null,
    date,
    unableToSubmitReason: reason,
  });
  return response?.data?.data || response?.data;
};

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
      role: "MANAGER",
      pendingEaTasks: pendingAssignments.length > 0
        ? pendingAssignments
        : payload.pendingEaTasks ?? payload.assignedActions ?? [],
      pendingMarketingReports: payload.pendingMarketingReports ?? payload.metaAdsProjects ?? [],
      canLogout: payload.canLogout ?? true,
    };

    const categories = getManagerPendingCategories(status);
    status.pendingMetaAds = categories.metaAds;
    status.pendingSeo = categories.seo;
    status.pendingSocialMedia = categories.socialMedia;
    status.pendingWebDevelopment = categories.webDevelopment;

    status.canLogout = status.canLogout
      && Object.values(getManagerPendingCategories(status)).every((items) => items.length === 0);

    // Dispatch event so other components can react
    window.dispatchEvent(
      new CustomEvent("manager-logout-status", {
        detail: status,
      })
    );

    return status;
  } catch (error) {
    console.error("Failed to fetch manager logout status", error);
    const status = {
      role: "MANAGER",
      canLogout: false,
      error: true,
      errorMessage: getErrorMessage(error, "Unable to verify logout status right now. Please try again."),
      pendingEaTasks: [],
      pendingMarketingReports: [],
      pendingMetaAds: [],
      pendingSeo: [],
      pendingSocialMedia: [],
      pendingWebDevelopment: [],
    };
    window.dispatchEvent(new CustomEvent("manager-logout-status", { detail: status }));
    return status;
  }
};

export { getErrorMessage };
