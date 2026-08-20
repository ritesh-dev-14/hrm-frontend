import API from "./api";

// Get messages with filters
export const getWhatsappMessages = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.projectId) params.append("projectId", filters.projectId);
  if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.append("dateTo", filters.dateTo);
  if (filters.status) params.append("status", filters.status);
  if (filters.managerId) params.append("managerId", filters.managerId);
  if (filters.limit) params.append("limit", filters.limit);
  if (filters.offset) params.append("offset", filters.offset);

  const response = await API.get("/api/whatsapp-messages", { params });
  return response.data;
};

// Get single message details
export const getWhatsappMessageById = async (messageId) => {
  const response = await API.get(`/api/whatsapp-messages/${messageId}`);
  return response.data;
};

// Get message statistics
export const getWhatsappStatistics = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.projectId) params.append("projectId", filters.projectId);
  if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.append("dateTo", filters.dateTo);
  if (filters.managerId) params.append("managerId", filters.managerId);

  const response = await API.get("/api/whatsapp-messages/stats/summary", {
    params,
  });
  return response.data;
};

// Send message manually
export const sendWhatsappMessageManually = async (projectId) => {
  const response = await API.post("/api/whatsapp-messages/send-manual", {
    projectId,
  });
  return response.data;
};

// Trigger job manually (Admin/HR only)
export const triggerWhatsappJob = async () => {
  const response = await API.post("/api/whatsapp-messages/trigger-job");
  return response.data;
};
