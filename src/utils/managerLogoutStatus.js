import API from "../services/api";

const getErrorMessage = (error, fallback) => {
  if (error?.response?.status === 403) return "You are not allowed to perform this action.";
  if (error?.response?.status === 404) return "This task could not be found.";
  return error?.response?.data?.message || fallback;
};

const firstArray = (...values) => values.find(Array.isArray) || [];
let managerStatusPromise = null;
let managerStatusCache = null;
let managerStatusCachedAt = 0;

export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isMonday = (date) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 1;
};

export const getManagerPendingCategories = (status = {}) => {
  const allVoice = firstArray(status.pendingWeeklyVoiceReports);
  const isMatchDept = (r, keyword) => {
    const dept = (r.department || r.departmentName || "").toLowerCase();
    return dept.includes(keyword);
  };

  return {
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
    voiceReports: allVoice,
    voiceMetaAds: allVoice.filter(
      (r) =>
        isMatchDept(r, "market") ||
        isMatchDept(r, "meta") ||
        (!isMatchDept(r, "seo") && !isMatchDept(r, "social") && !isMatchDept(r, "smm"))
    ),
    voiceSeo: allVoice.filter((r) => isMatchDept(r, "seo")),
    voiceSocialMedia: allVoice.filter((r) => isMatchDept(r, "social") || isMatchDept(r, "smm")),
  };
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

export const submitMarketingUnableReason = async ({ projectId, clientName, reason, date }) => {
  const response = await API.post("/api/marketing-reports", {
    projectId,
    clientName: clientName || null,
    date,
    unableToSubmitReason: reason,
  });
  return response?.data?.data || response?.data;
};

export const getManagerPendingSeoProjects = async (date = getLocalDateString()) => {
  if (!isMonday(date)) return [];

  const [projectsResponse, reportResponse] = await Promise.all([
    API.get("/api/projects/assigned"),
    API.get("/api/daily-report", { params: { date, department: "seo" } }),
  ]);
  const assignedProjects = Array.isArray(projectsResponse?.data?.data)
    ? projectsResponse.data.data
    : [];
  const assignedSeoIds = new Set(
    assignedProjects
      .filter((project) => String(project.department?.name || "").toLowerCase().includes("seo"))
      .map((project) => String(project.id)),
  );
  const seoProjects = reportResponse?.data?.data?.seo;
  return (Array.isArray(seoProjects) ? seoProjects : [])
    .filter((project) => !project.report?.hasReport && assignedSeoIds.has(String(project.projectId)))
    .map((project) => ({
      ...project,
      projectId: project.projectId,
      status: "PENDING",
      date,
    }));
};

export const refreshManagerLogoutStatus = async () => {
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  const isManager =
    String(user?.role || "").trim().toUpperCase() === "MANAGER";

  if (!isManager) {
    return { canLogout: true, skipped: true };
  }

  if (managerStatusCache && Date.now() - managerStatusCachedAt < 5000) {
    return managerStatusCache;
  }

  if (managerStatusPromise) {
    return managerStatusPromise;
  }

  managerStatusPromise = (async () => {
    try {
    const [response, pendingSeo] = await Promise.all([
      API.get("/api/manager/logout-status"),
      getManagerPendingSeoProjects(getLocalDateString()),
    ]);
    const payload = response?.data?.data || {};

    const status = {
      ...payload,
      role: "MANAGER",
      pendingEaTasks: payload.pendingEaTasks ?? payload.assignedActions ?? [],
      pendingMarketingReports: payload.pendingMarketingReports ?? payload.metaAdsProjects ?? [],
      pendingWeeklyVoiceReports: payload.pendingWeeklyVoiceReports ?? [],
      pendingUploads: payload.pendingUploads ?? [],
      pendingUploadsCount: payload.pendingUploads?.length ?? 0,
      pendingSeo,
      canLogout: payload.canLogout ?? true,
    };

    const categories = getManagerPendingCategories(status);
    status.pendingMetaAds = categories.metaAds;
    status.pendingSeo = categories.seo;
    status.pendingSocialMedia = categories.socialMedia;
    status.pendingWebDevelopment = categories.webDevelopment;
    status.pendingWeeklyVoiceReports = categories.voiceReports;
    status.pendingVoiceMetaAds = categories.voiceMetaAds;
    status.pendingVoiceSeo = categories.voiceSeo;
    status.pendingVoiceSocialMedia = categories.voiceSocialMedia;

    status.canLogout = status.canLogout
      && Object.values(getManagerPendingCategories(status)).every((items) => items.length === 0)
      && status.pendingWeeklyVoiceReports.length === 0
      && status.pendingUploads.length === 0;

    // Dispatch event so other components can react
    window.dispatchEvent(
      new CustomEvent("manager-logout-status", {
        detail: status,
      })
    );

      managerStatusCache = status;
      managerStatusCachedAt = Date.now();
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
      pendingUploads: [],
      pendingUploadsCount: 0,
    };
    window.dispatchEvent(new CustomEvent("manager-logout-status", { detail: status }));
      return status;
    } finally {
      managerStatusPromise = null;
    }
  })();

  return managerStatusPromise;
};

export { getErrorMessage };
