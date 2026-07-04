import { api } from "./api";

//
// 🔥 GET ALL PENDING ESCALATIONS FOR CURRENT USER
//
export const getPendingEscalations = async () => {
  try {
    const response = await api.get("/escalations/pending");
    return response.data;
  } catch (error) {
    console.error("Error fetching pending escalations:", error);
    throw error;
  }
};

//
// 🔥 GET ESCALATION HISTORY FOR SPECIFIC MANAGER
//
export const getManagerEscalationHistory = async (managerId) => {
  try {
    const response = await api.get(
      `/escalations/manager/${managerId}/history`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching manager escalations:", error);
    throw error;
  }
};

//
// 🔥 GET ESCALATION STATISTICS (HR/ADMIN ONLY)
//
export const getEscalationStats = async () => {
  try {
    const response = await api.get("/escalations/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching escalation statistics:", error);
    throw error;
  }
};

//
// 🔥 GET ESCALATION DETAIL
//
export const getEscalationDetail = async (escalationId) => {
  try {
    const response = await api.get(`/escalations/${escalationId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching escalation detail:", error);
    throw error;
  }
};

//
// 🔥 RESOLVE ESCALATION (Mark as resolved when task is assigned)
//
export const resolveEscalation = async (escalationId) => {
  try {
    const response = await api.post(`/escalations/${escalationId}/resolve`);
    return response.data;
  } catch (error) {
    console.error("Error resolving escalation:", error);
    throw error;
  }
};

//
// 🔥 MANUAL CHECK FOR MISSING TASKS (ADMIN ONLY)
//
export const triggerManualCheck = async () => {
  try {
    const response = await api.post("/escalations/check/manual");
    return response.data;
  } catch (error) {
    console.error("Error triggering manual check:", error);
    throw error;
  }
};

export default {
  getPendingEscalations,
  getManagerEscalationHistory,
  getEscalationStats,
  getEscalationDetail,
  resolveEscalation,
  triggerManualCheck,
};
