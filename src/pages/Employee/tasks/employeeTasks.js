import API from "../../../services/api";

// GET ALL EMPLOYEE TASKS
export const fetchEmployeeTasks =
  async () => {
    try {
      const response = await API.get(
        "/api/task-item-submission/my-items",
      );

      if (response.data?.success) {
        return (
          response.data.data || []
        );
      }

      return [];
    } catch (error) {
      console.error(
        error?.response?.data
          ?.message || error.message,
      );

      throw error;
    }
  };