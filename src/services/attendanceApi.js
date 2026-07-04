import API from "./api";

// START WORK
export const startAttendance = async () => {
  const response = await API.post("/api/attendance/start");
  return response.data;
};

// START BREAK
export const startBreak = async () => {
  const response = await API.post("/api/attendance/break/start");
  return response.data;
};

// END BREAK
export const endBreak = async () => {
  const response = await API.post("/api/attendance/break/end");
  return response.data;
};

// CLOCK OUT
export const stopAttendance = async () => {
  const response = await API.post("/api/attendance/stop");
  return response.data;
};

export const getTodayAttendance = async () => {
  return API.get("/api/attendance/today");
};

export const getAttendanceHistory = async () => {
  return API.get("/api/attendance/history");
};
