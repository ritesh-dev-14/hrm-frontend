
import { useEffect, useState } from "react";
import { LogIn, LogOut, Coffee, Play, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  startAttendance,
  startBreak,
  endBreak,
  stopAttendance,
} from "../../services/attendanceApi";

export default function AttendanceCard() {
  const [status, setStatus] = useState("idle");
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  const today = new Date().toDateString();

  // USER
  const user = JSON.parse(localStorage.getItem("user"));

  // UNIQUE STORAGE KEY FOR EVERY USER
  const attendanceKey = `attendanceData_${user?._id || user?.id}`;

  // GET STORAGE DATA
  const getAttendanceData = () => {
    return JSON.parse(localStorage.getItem(attendanceKey));
  };

  // SET STORAGE DATA
  const setAttendanceData = (data) => {
    localStorage.setItem(attendanceKey, JSON.stringify(data));
  };

  // REMOVE STORAGE DATA
  const removeAttendanceData = () => {
    localStorage.removeItem(attendanceKey);
  };

  // RESTORE SESSION
  useEffect(() => {
    const savedData = getAttendanceData();

    if (!savedData) return;

    // RESET NEXT DAY
    if (savedData.date !== today) {
      removeAttendanceData();
      return;
    }

    setStatus(savedData.status || "idle");

    // COMPLETED DAY
    if (savedData.status === "completed") {
      setSeconds(savedData.finalSeconds || 0);
      return;
    }

    // ACTIVE SESSION
    if (savedData.startTime) {
      updateTimer(savedData);
    }
  }, []);

  // LIVE TIMER
  useEffect(() => {
    let interval;

    if (status === "working") {
      interval = setInterval(() => {
        const savedData = getAttendanceData();

        if (!savedData?.startTime) return;

        updateTimer(savedData);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [status]);

  // UPDATE TIMER
  const updateTimer = (savedData) => {
    const now = Date.now();

    let totalWorked =
      Math.floor((now - savedData.startTime) / 1000) -
      (savedData.breakDuration || 0);

    // CURRENT BREAK
    if (savedData.status === "break" && savedData.breakStartedAt) {
      const currentBreak = Math.floor(
        (now - savedData.breakStartedAt) / 1000,
      );

      totalWorked -= currentBreak;
    }

    setSeconds(Math.max(totalWorked, 0));
  };

  // FORMAT TIME
  const formatTime = (t) => {
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;

    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // CLOCK IN
  const handleClockIn = async () => {
    try {
      setLoading(true);

      const existing = getAttendanceData();

      // PREVENT MULTIPLE CLOCK OUTS
      if (existing?.clockedOut && existing?.date === today) {
        alert("You already completed today's session.");
        return;
      }

      await startAttendance();

      const startTime = Date.now();

      const newData = {
        status: "working",
        startTime,
        breakDuration: 0,
        breakStartedAt: null,
        date: today,
        clockedOut: false,
      };

      setAttendanceData(newData);

      setStatus("working");
      setSeconds(0);
    } catch (error) {
      console.log(error);
      alert("Failed to start attendance");
    } finally {
      setLoading(false);
    }
  };

  // CLOCK OUT
  const handleClockOut = async () => {
    try {
      setLoading(true);

      await stopAttendance();

      const existing = getAttendanceData() || {};

      const updatedData = {
        ...existing,
        status: "completed",
        clockedOut: true,
        endTime: Date.now(),
        finalSeconds: seconds,
      };

      setAttendanceData(updatedData);

      setStatus("completed");
    } catch (error) {
      console.log(error);
      alert("Failed to stop attendance");
    } finally {
      setLoading(false);
    }
  };

  // BREAK / RESUME
  const handleBreakToggle = async () => {
    try {
      setLoading(true);

      const existing = getAttendanceData() || {};

      // START BREAK
      if (status === "working") {
        await startBreak();

        const breakStartedAt = Date.now();

        const updatedData = {
          ...existing,
          status: "break",
          breakStartedAt,
        };

        setAttendanceData(updatedData);

        setStatus("break");
      }

      // END BREAK
      else if (status === "break") {
        await endBreak();

        const now = Date.now();

        const breakSeconds = Math.floor(
          (now - existing.breakStartedAt) / 1000,
        );

        const updatedData = {
          ...existing,
          status: "working",
          breakStartedAt: null,
          breakDuration:
            (existing.breakDuration || 0) + breakSeconds,
        };

        setAttendanceData(updatedData);

        setStatus("working");
      }
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full flex flex-col justify-between"
    >
      {/* HEADER */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              whileHover={{ scale: 1.04 }}
              className="relative w-14 h-14 rounded-2xl bg-linear-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-[0_12px_30px_rgba(15,23,42,0.18)]"
            >
              <Timer size={24} className="text-white" />
            </motion.div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-500 mb-1">
                Work Session
              </p>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Attendance Tracker
              </h2>
            </div>
          </div>

          <p className="text-slate-500 text-[15px] leading-relaxed max-w-md">
            Monitor your work duration, break activity, and attendance status in
            real time.
          </p>
        </div>

        <AnimatePresence>
          {(status === "working" || status === "break") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm
              ${
                status === "working"
                  ? "bg-emerald-50 border-emerald-100"
                  : "bg-amber-50 border-amber-100"
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full animate-pulse
                ${
                  status === "working"
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
              />

              <span
                className={`text-[11px] font-bold uppercase tracking-wider
                ${
                  status === "working"
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                {status === "working" ? "Working" : "On Break"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* TIMER */}
      <div className="relative flex-1 flex flex-col justify-center py-12 border-y border-slate-100 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-indigo-50/40 via-transparent to-violet-50/30 pointer-events-none" />

        <span className="relative text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-5">
          Active Time
        </span>

        <motion.h1
          key={seconds}
          initial={{ opacity: 0.85 }}
          animate={{ opacity: 1 }}
          className="relative text-6xl lg:text-7xl font-bold tracking-[-0.06em] text-slate-900 font-mono leading-none"
        >
          {formatTime(seconds)}
        </motion.h1>

        <div className="relative mt-6 flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full
            ${
              status === "working"
                ? "bg-emerald-500"
                : status === "break"
                  ? "bg-amber-500"
                  : "bg-slate-300"
            }`}
          />

          <p className="text-sm font-medium text-slate-500">
            {status === "idle"
              ? "Shift not started"
              : status === "working"
                ? "Currently working"
                : status === "break"
                  ? "Break in progress"
                  : "Workday completed"}
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-4 mt-8">
        <AnimatePresence mode="wait">
          {/* START */}
          {status === "idle" && (
            <motion.button
              key="clockin"
              disabled={loading}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClockIn}
              className="relative overflow-hidden flex-1 px-6 py-3 rounded-2xl text-sm font-semibold bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-xl hover:shadow-indigo-200 disabled:opacity-50"
            >
              <div className="flex items-center justify-center gap-2">
                <LogIn size={16} />
                {loading ? "Starting..." : "Start Workday"}
              </div>
            </motion.button>
          )}

          {/* WORKING / BREAK */}
          {(status === "working" || status === "break") && (
            <>
              <motion.button
                key="break"
                disabled={loading}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -1 }}
                onClick={handleBreakToggle}
                className={`px-6 py-3 rounded-2xl text-sm font-semibold border transition-all disabled:opacity-50
                ${
                  status === "working"
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-md"
                    : "bg-amber-500 border-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  {status === "working" ? (
                    <Coffee size={16} />
                  ) : (
                    <Play size={16} />
                  )}

                  {loading
                    ? "Please wait..."
                    : status === "working"
                      ? "Take Break"
                      : "Resume Work"}
                </div>
              </motion.button>

              <motion.button
                key="clockout"
                disabled={loading}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClockOut}
                className="flex-1 px-6 py-3 rounded-2xl text-sm font-semibold text-white bg-linear-to-r from-rose-500 to-red-500 shadow-xl hover:shadow-rose-200 disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  <LogOut size={16} />
                  {loading ? "Ending..." : "End Workday"}
                </div>
              </motion.button>
            </>
          )}

          {/* COMPLETED */}
          {status === "completed" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full py-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center"
            >
              <p className="text-sm font-semibold text-emerald-700">
                Workday Completed
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}