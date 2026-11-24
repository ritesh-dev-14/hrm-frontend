import axios from "axios";

const LOCAL_API_URL = "http://localhost:8000";
const PRODUCTION_API_URL = "https://hrm-oepc.onrender.com";
const configuredApiUrl = import.meta.env.VITE_API_URL;

export const API_URL = import.meta.env.PROD
  ? configuredApiUrl && configuredApiUrl !== LOCAL_API_URL
    ? configuredApiUrl
    : PRODUCTION_API_URL
  : configuredApiUrl || LOCAL_API_URL;

const API = axios.create({
  baseURL: API_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => {
    const requestUrl = String(response.config?.url || "").toLowerCase();
    const isApprovalMutation = ["post", "patch", "put"].includes(
      response.config?.method?.toLowerCase(),
    ) && /(verify|approve|approval|review)/.test(requestUrl);

    if (isApprovalMutation) {
      window.dispatchEvent(new Event("social-media-data-updated"));
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error("Session expired or unauthorized. Logging out...");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default API;
