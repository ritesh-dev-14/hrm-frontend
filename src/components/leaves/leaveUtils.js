import { useEffect, useMemo, useState } from "react";
import API from "../../services/api";

export default function useLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  // FETCH LEAVES
  const fetchLeaves = async () => {
    try {
      const res = await API.get("/api/employee/leaves");
      setLeaves(res.data?.data || []);
    } catch (err) {
      console.error(
        "Error fetching leaves:",
        err?.response?.data || err.message,
      );
    }
  };

  // FETCH LEAVE BALANCE
  const fetchLeaveBalance = async () => {
    try {
      const res = await API.get("/api/employee/leave-balance");
      setBalance(res.data?.data || null);
    } catch (err) {
      console.error(
        "Error fetching leave balance:",
        err?.response?.data || err.message,
      );
    }
  };

  // FETCH BOTH ON MOUNT
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchLeaves(), fetchLeaveBalance()]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // STATS - COMBINE LEAVES USED AND BALANCE
  const stats = useMemo(() => {
    return {
      sick: {
        total: balance?.sickTotal || 0,
        used: balance?.sickUsed || 0,
        left: balance?.sickLeft || 0,
      },
      casual: {
        total: balance?.casualTotal || 0,
        used: balance?.casualUsed || 0,
        left: balance?.casualLeft || 0,
      },
    };
  }, [balance]);

  // APPLY LEAVE
  const applyLeave = async (formData) => {
    try {
      await API.post("/api/employee/leave", {
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim(),
        type: formData.type,
      });

      await Promise.all([fetchLeaves(), fetchLeaveBalance()]);

      return true;
    } catch (err) {
      console.error(
        "Error applying leave:",
        err?.response?.data || err.message,
      );

      alert(err?.response?.data?.message || "Failed to apply leave");

      return false;
    }
  };

  return {
    leaves,
    balance,
    stats,
    loading,
    applyLeave,
    fetchLeaves,
    fetchLeaveBalance,
  };
}
