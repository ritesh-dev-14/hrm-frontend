import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  CalendarDays,
  Clock3,
  TimerReset,
  Filter,
  CircleDot,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

import { useNavigate } from "react-router-dom";
import api from "../../services/api";

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

export default function HrAttendance() {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [attendanceRes, dashboardRes] = await Promise.all([
        api.get("/api/attendance"),
        api.get("/api/attendance/dashboard"),
      ]);
      setAttendance(attendanceRes.data?.data || []);
      setDashboard(dashboardRes.data?.data || {});
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // FILTERED DATA
  const filteredAttendance = useMemo(() => {
    let filtered = [...attendance];
    const searchValue = search.toLowerCase();

    // SEARCH FILTER
    filtered = filtered.filter((item) => {
      const employeeName = item.user?.name?.toLowerCase?.() || "";
      const employeeId = item.user?.employeeId?.toLowerCase?.() || "";
      const department = item.user?.department?.name?.toLowerCase?.() || "";
      const position = item.user?.position?.toLowerCase?.() || "";

      return (
        employeeName.includes(searchValue) ||
        employeeId.includes(searchValue) ||
        department.includes(searchValue) ||
        position.includes(searchValue)
      );
    });

    // DATE FILTER
    const now = new Date();
    if (selectedFilter !== "all") {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date);
        
        if (selectedFilter === "day") {
          return itemDate.getDate() === now.getDate() &&
                 itemDate.getMonth() === now.getMonth() &&
                 itemDate.getFullYear() === now.getFullYear();
        }

        if (selectedFilter === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return itemDate >= weekAgo;
        }

        if (selectedFilter === "month") {
          return (
            itemDate.getMonth() === now.getMonth() &&
            itemDate.getFullYear() === now.getFullYear()
          );
        }

        return true;
      });
    }

    return filtered;
  }, [attendance, search, selectedFilter]);

  // DYNAMIC DASHBOARD STATS
  const dynamicStats = useMemo(() => {
    if (!attendance.length && !dashboard) return null;

    let present = 0;
    let halfDay = 0;
    let absent = 0;

    const totalEmployees = dashboard?.totalEmployees || 0;

    if (selectedFilter === "all" || selectedFilter === "day") {
      // For a single day (or all, which doesn't make much sense but we fallback to today), count unique users
      const uniqueUsersPresent = new Set();
      const uniqueUsersHalf = new Set();
      
      filteredAttendance.forEach(r => {
        if (r.status === "PRESENT") uniqueUsersPresent.add(r.userId);
        if (r.status === "HALF_DAY") uniqueUsersHalf.add(r.userId);
      });

      present = uniqueUsersPresent.size;
      halfDay = uniqueUsersHalf.size;
      absent = Math.max(0, totalEmployees - (present + halfDay));
    } else {
      // For week/month, tally total occurrences
      filteredAttendance.forEach(r => {
        if (r.status === "PRESENT") present++;
        else if (r.status === "HALF_DAY") halfDay++;
      });
      
      // Calculate workdays in the period to estimate absences
      let workdays = 0;
      const now = new Date();
      if (selectedFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        for (let d = weekAgo; d <= now; d.setDate(d.getDate() + 1)) {
          if (d.getDay() !== 0 && d.getDay() !== 6) workdays++;
        }
      } else if (selectedFilter === "month") {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        for (let d = firstDay; d <= now; d.setDate(d.getDate() + 1)) {
          if (d.getDay() !== 0 && d.getDay() !== 6) workdays++;
        }
      }
      
      const expectedTotalRecords = workdays * totalEmployees;
      absent = Math.max(0, expectedTotalRecords - (present + halfDay));
    }

    return { totalEmployees, present, halfDay, absent };
  }, [filteredAttendance, dashboard, selectedFilter]);

  // SEARCH STATS (Mini badge)
  const searchStats = useMemo(() => {
    if (!search.trim()) return null;

    const present = filteredAttendance.filter(r => r.status === "PRESENT").length;
    const halfDay = filteredAttendance.filter(r => r.status === "HALF_DAY").length;
    // Just show raw missing records based on the filter timeframe
    const absent = Math.max(0, (dynamicStats?.absent || 0));

    return { present, halfDay, absent };
  }, [filteredAttendance, search, dynamicStats]);

  // FORMAT TIME
  const formatTime = (time) => {
    if (!time) return "--";
    return new Date(time).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // FORMAT HOURS
  const formatHours = (hours) => {
    if (hours === null || hours === undefined) return "--";
    return `${Number(hours).toFixed(1)} hrs`;
  };

  // FORMAT DATE
  const formatDate = (date) => {
    if (!date) return "--";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans relative overflow-hidden pb-12">
      {/* Background ambient glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-indigo-500 mb-1 block">HR Management</span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Attendance Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium max-w-xl">
              Monitor employee attendance, track daily/monthly work sessions, and filter records instantly.
            </p>
          </div>

          {/* SEARCH */}
          <div className="relative w-full lg:w-[320px] group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by name, ID, or position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
            />
          </div>
        </motion.div>

        {/* STATS */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: "Total Employees", value: dynamicStats?.totalEmployees || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
            { label: selectedFilter === 'day' || selectedFilter === 'all' ? "Present Today" : "Total Present", value: dynamicStats?.present || 0, icon: CalendarDays, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: selectedFilter === 'day' || selectedFilter === 'all' ? "Half Day Today" : "Total Half Days", value: dynamicStats?.halfDay || 0, icon: TimerReset, color: "text-amber-500", bg: "bg-amber-50" },
            { label: selectedFilter === 'day' || selectedFilter === 'all' ? "Absent Today" : "Total Absences", value: dynamicStats?.absent || 0, icon: Clock3, color: "text-rose-500", bg: "bg-rose-50" },
          ].map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center ${item.color} group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                  <item.icon size={22} />
                </div>
              </div>
              <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-1">{item.label}</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{item.value}</h2>
            </motion.div>
          ))}
        </motion.div>

        {/* TABLE SECTION */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/60 overflow-hidden flex flex-col min-h-[500px]">
          
          {/* HEADER & FILTERS */}
          <div className="p-6 md:p-8 border-b border-slate-100/70 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/50">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex flex-wrap items-center gap-3">
                All Records
                <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{filteredAttendance.length} matches</span>
              </h2>
              {searchStats && (
                <div className="flex gap-3 mt-3">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    {searchStats.present} Present
                  </span>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                    {searchStats.halfDay} Half Day
                  </span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                    {searchStats.absent} Absent
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full xl:w-auto">
              {/* DATE FILTER */}
              <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/50 w-full md:w-auto overflow-x-auto custom-scrollbar">
                <Filter size={14} className="text-slate-400 ml-2" />
                {["all", "day", "week", "month"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-300 whitespace-nowrap ${
                      selectedFilter === filter
                        ? "text-indigo-600 bg-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    }`}
                  >
                    {filter === 'day' ? 'Today' : filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="flex-1 bg-slate-50/30 overflow-x-auto">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center">
                <p className="text-indigo-900 font-semibold text-sm tracking-wide animate-pulse">Loading employee records...</p>
              </div>
            ) : filteredAttendance.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-center px-4">
                <CircleDot size={40} className="text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">No Records Found</h3>
                <p className="text-sm font-medium text-slate-500 max-w-sm">
                  We couldn't find any attendance records matching your search or filters.
                </p>
              </div>
            ) : (
              <div className="min-w-[1000px] w-full">
                {/* TABLE HEADER */}
                <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                  <div className="col-span-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Employee</div>
                  <div className="col-span-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Date</div>
                  <div className="col-span-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Check In</div>
                  <div className="col-span-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Check Out</div>
                  <div className="col-span-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Hours</div>
                  <div className="col-span-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">Status</div>
                </div>

                {/* TABLE ROWS */}
                <div className="divide-y divide-slate-100">
                  {filteredAttendance.map((item, index) => {
                    let statusBadge = "";
                    if (item.status === "PRESENT") statusBadge = "bg-emerald-50 text-emerald-600 border-emerald-200";
                    else if (item.status === "HALF_DAY") statusBadge = "bg-amber-50 text-amber-600 border-amber-200";
                    else statusBadge = "bg-rose-50 text-rose-600 border-rose-200";

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => navigate(`/hr/employee-attendance/${item.user?.employeeId}`)}
                        className="grid grid-cols-12 gap-4 items-center px-8 py-4 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      >
                        {/* EMPLOYEE INFO */}
                        <div className="col-span-3 flex flex-col justify-center pr-4">
                          <h3 className="text-sm font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                            {item.user?.name || "Unknown"}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">
                              {item.user?.employeeId || "No ID"}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">
                              {item.user?.department?.name || "Dept"}
                            </span>
                          </div>
                        </div>

                        {/* DATE */}
                        <div className="col-span-2 flex items-center text-sm font-bold text-slate-700">
                          {formatDate(item.date)}
                        </div>

                        {/* CHECK IN */}
                        <div className="col-span-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                          <Clock size={14} className="text-slate-400" />
                          {formatTime(item.startTime)}
                        </div>

                        {/* CHECK OUT */}
                        <div className="col-span-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                          <Clock size={14} className="text-slate-400" />
                          {formatTime(item.endTime)}
                        </div>

                        {/* HOURS */}
                        <div className="col-span-1 flex items-center text-sm font-black text-slate-800">
                          {formatHours(item.totalHours)}
                        </div>

                        {/* STATUS */}
                        <div className="col-span-2 flex justify-end">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                            {item.status.replace("_", " ")}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}