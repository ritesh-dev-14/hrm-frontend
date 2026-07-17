import { useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  CircleDot,
  Filter,
  Activity
} from "lucide-react";

import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function AttendanceView({
  stats,
  records,
  loading,
}) {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const getIcon = (label) => {
    if (label.includes("Present")) {
      return <Calendar size={20} />;
    }
    if (label.includes("Absent")) {
      return <CircleDot size={20} />;
    }
    return <Clock size={20} />;
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
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans relative overflow-hidden pb-12">
      {/* Background ambient glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-indigo-500 mb-1 block">Attendance</span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Attendance History
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium max-w-xl">
              View your complete attendance records, check-ins, and total working hours.
            </p>
          </div>
        </motion.div>

        {/* STATS */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all flex items-center justify-between group"
            >
              <div>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-1">
                  {stat.label}
                </p>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  {stat.value}
                </h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                {getIcon(stat.label)}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* DEDICATED ATTENDANCE ROSTER SECTION */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/60 overflow-hidden flex flex-col min-h-[500px]">
          
          {/* List Header & Filters */}
          <div className="p-6 md:p-8 border-b border-slate-100/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/50">
                <Activity size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  Attendance Records
                </h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">Daily check-in logs and aggregate hours</p>
              </div>
            </div>

            {/* FILTERS */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
              {/* DATE FILTER */}
              <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/50">
                <Filter size={14} className="text-slate-400 ml-2" />
                {["all", "month"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-300 relative overflow-hidden ${
                      selectedFilter === filter
                        ? "text-indigo-600 bg-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* STATUS FILTER */}
              <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/50">
                {["ALL", "PRESENT", "ABSENT"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-300 relative overflow-hidden ${
                      selectedStatus === status
                        ? "text-blue-600 bg-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 p-6 md:p-8 bg-slate-50/30">
            {/* DESKTOP TABLE */}
            <div className="hidden lg:block bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6 font-semibold">Date</th>
                      <th className="py-4 px-6 font-semibold">Clock In</th>
                      <th className="py-4 px-6 font-semibold">Clock Out</th>
                      <th className="py-4 px-6 font-semibold">Working Hours</th>
                      <th className="py-4 px-6 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="py-24 text-center">
                          <p className="text-indigo-900 font-semibold text-sm tracking-wide">Loading attendance...</p>
                        </td>
                      </tr>
                    ) : filteredRecords?.length > 0 ? (
                      filteredRecords.map((r, i) => {
                        let statusBadge = "";
                        if (r.status === "PRESENT") statusBadge = "bg-emerald-50 text-emerald-600 border-emerald-200";
                        else statusBadge = "bg-rose-50 text-rose-600 border-rose-200";

                        return (
                          <motion.tr
                            key={r.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className="hover:bg-slate-50/50 transition-colors group"
                          >
                            <td className="py-4 px-6">
                              <span className="font-bold text-slate-900">{formatDate(r.date)}</span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2 text-slate-600 font-semibold">
                                <Clock size={14} className="text-slate-400" /> {formatTime(r.startTime)}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2 text-slate-600 font-semibold">
                                <Clock size={14} className="text-slate-400" /> {formatTime(r.endTime)}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-bold text-slate-800 text-sm">
                                {formatHours(r.totalHours)}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                                {r.status}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-24 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <CircleDot size={32} className="text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-700 mb-1">No Records Found</h3>
                            <p className="text-sm font-medium text-slate-500 max-w-sm">
                              No attendance records were found matching your current filters.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE + TABLET LIST */}
            <div className="lg:hidden space-y-4">
              {loading ? (
                <div className="py-12 text-center bg-white border border-slate-200 rounded-[28px] shadow-sm">
                  <p className="text-indigo-900 font-semibold text-sm tracking-wide">Loading attendance...</p>
                </div>
              ) : filteredRecords?.length > 0 ? (
                filteredRecords.map((r, i) => {
                  let statusBadge = "";
                  if (r.status === "PRESENT") statusBadge = "bg-emerald-50 text-emerald-600 border-emerald-200";
                  else statusBadge = "bg-rose-50 text-rose-600 border-rose-200";

                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-white border border-slate-200 rounded-[28px] p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                            Date
                          </p>
                          <h3 className="text-sm font-black text-slate-900">
                            {formatDate(r.date)}
                          </h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                          {r.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">
                            Clock In
                          </p>
                          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-400" /> {formatTime(r.startTime)}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">
                            Clock Out
                          </p>
                          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-400" /> {formatTime(r.endTime)}
                          </p>
                        </div>

                        <div className="col-span-2 bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50 flex justify-between items-center">
                          <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-400">
                            Total Working Hours
                          </p>
                          <p className="text-sm font-black text-indigo-700">
                            {formatHours(r.totalHours)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-16 text-center bg-white border border-slate-200 rounded-[28px] shadow-sm flex flex-col items-center">
                  <CircleDot size={32} className="text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 mb-1">No Records Found</h3>
                  <p className="text-sm font-medium text-slate-500 max-w-[200px] text-center">
                    No attendance records were found matching your current filters.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}