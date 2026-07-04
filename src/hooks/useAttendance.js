import { useEffect, useState } from "react";

import {
  getAttendanceHistory,
  getTodayAttendance,
} from "../services/attendanceApi";

export default function useAttendance() {
  const [records, setRecords] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      const [todayRes, historyRes] = await Promise.all([
        getTodayAttendance(),
        getAttendanceHistory(),
      ]);

      if (todayRes.data.success) {
        setTodayAttendance(todayRes.data.data);
      }

      if (historyRes.data.success) {
        setRecords(historyRes.data.data || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  return {
    records,
    todayAttendance,
    loading,
    refetchAttendance: fetchAttendance,
  };
}