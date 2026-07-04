import { useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  CircleDot,
  Filter,
} from "lucide-react";

import { motion } from "framer-motion";

export default function AttendanceView({
  stats,
  records,
  loading,
}) {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const getIcon = (label) => {
    if (label.includes("Present")) {
      return <Calendar size={18} />;
    }

    if (label.includes("Absent")) {
      return <CircleDot size={18} />;
    }

    return <Clock size={18} />;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "--";

    return new Date(time).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatHours = (hours) => {
    if (!hours) return "0h";

    return `${hours.toFixed(1)} hrs`;
  };

  const filteredRecords = useMemo(() => {
    let filtered = [...(records || [])];

    const now = new Date();

    if (selectedFilter !== "all") {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.date);

        if (selectedFilter === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);

          return recordDate >= weekAgo;
        }

        if (selectedFilter === "month") {
          return (
            recordDate.getMonth() === now.getMonth() &&
            recordDate.getFullYear() === now.getFullYear()
          );
        }

        if (selectedFilter === "year") {
          return recordDate.getFullYear() === now.getFullYear();
        }

        return true;
      });
    }

    if (selectedStatus !== "ALL") {
      filtered = filtered.filter(
        (record) => record.status === selectedStatus
      );
    }

    return filtered;
  }, [records, selectedFilter, selectedStatus]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col gap-3 mb-6 sm:mb-8">
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-2">
              Attendance
            </p>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Attendance History
            </h1>

            <p className="text-sm text-slate-500 mt-2 max-w-xl">
              View your attendance records and working hours.
            </p>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6 sm:mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] font-bold text-slate-400 mb-2">
                    {stat.label}
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight wrap-break-words">
                    {stat.value}
                  </h2>
                </div>

                <div className="shrink-0 w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                  {getIcon(stat.label)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* DESKTOP TABLE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="hidden lg:block bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
        >
          {/* TABLE HEADER */}
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Attendance Records
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Daily check-in and working hours
              </p>
            </div>

            {/* FILTERS */}
            <div className="flex flex-wrap items-center gap-3">
              {/* DATE FILTER */}
              <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                <Filter size={16} className="text-slate-500 ml-2" />

                {["all", "week", "month", "year"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase transition-all ${
                      selectedFilter === filter
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* STATUS FILTER */}
              <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                {["ALL", "PRESENT", "ABSENT", "LEAVE"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase transition-all ${
                      selectedStatus === status
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.18em] font-bold text-slate-400">
                    Date
                  </th>

                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.18em] font-bold text-slate-400">
                    Clock In
                  </th>

                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.18em] font-bold text-slate-400">
                    Clock Out
                  </th>

                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.18em] font-bold text-slate-400">
                    Hours
                  </th>

                  <th className="px-6 py-4 text-right text-[11px] uppercase tracking-[0.18em] font-bold text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {!loading && filteredRecords?.length > 0 ? (
                  filteredRecords.map((r, i) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                        {formatDate(r.date)}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatTime(r.startTime)}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {formatTime(r.endTime)}
                      </td>

                      <td className="px-6 py-5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                          {formatHours(r.totalHours)}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            r.status === "PRESENT"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : r.status === "LEAVE"
                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                              : "bg-rose-50 text-rose-600 border border-rose-100"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-20 text-center"
                    >
                      <p className="text-sm font-medium text-slate-400">
                        {loading
                          ? "Loading attendance..."
                          : "No attendance records found."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* MOBILE + TABLET */}
        <div className="lg:hidden">
          {/* MOBILE FILTERS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {["all", "week", "month", "year"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase transition-all ${
                      selectedFilter === filter
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {["ALL", "PRESENT", "ABSENT", "LEAVE"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase transition-all ${
                      selectedStatus === status
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {!loading && filteredRecords?.length > 0 ? (
              filteredRecords.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">
                        Date
                      </p>

                      <h3 className="text-sm font-semibold text-slate-800">
                        {formatDate(r.date)}
                      </h3>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        r.status === "PRESENT"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : r.status === "LEAVE"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-rose-50 text-rose-600 border border-rose-100"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-slate-400 mb-1">
                        Clock In
                      </p>

                      <p className="text-sm font-semibold text-slate-700">
                        {formatTime(r.startTime)}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-slate-400 mb-1">
                        Clock Out
                      </p>

                      <p className="text-sm font-semibold text-slate-700">
                        {formatTime(r.endTime)}
                      </p>
                    </div>

                    <div className="col-span-2 bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-slate-400 mb-1">
                        Working Hours
                      </p>

                      <p className="text-sm font-semibold text-slate-700">
                        {formatHours(r.totalHours)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                <p className="text-sm font-medium text-slate-400">
                  {loading
                    ? "Loading attendance..."
                    : "No attendance records found."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}