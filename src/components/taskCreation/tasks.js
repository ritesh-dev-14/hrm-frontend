import API from "../../services/api";

export const fetchAllTasks = async () => {
  try {
    const response = await API.get(
      "/api/manager/tasks"
    );

    if (response.data?.success) {
      return response.data.data || [];
    }

    return [];
  } catch (error) {
    console.error(
      "Error fetching tasks:",
      error?.response?.data?.message ||
        error.message
    );

    throw error;
  }
};