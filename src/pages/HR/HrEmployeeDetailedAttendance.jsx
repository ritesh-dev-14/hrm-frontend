import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  Clock3,
  TimerReset,
  Filter,
  ArrowLeft,
  CircleDot,
  User,
  Briefcase
} from "lucide-react";
import { motion } from "framer-motion";
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

export default function HrEmployeeDetailedAttendance() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  
  const [employee, setEmployee] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("month");

  useEffect(() => {
    fetchEmployeeAttendance();
  }, [employeeId]);

  const fetchEmployeeAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/attendance/employee/${employeeId}`);
      if (res.data?.data) {
        setEmployee(res.data.data.employee);
        setRecords(res.data.data.records || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // FILTERED DATA
  const filteredRecords = useMemo(() => {
    let filtered = [...records];
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
  }, [records, selectedFilter]);

  // CALCULATE STATS
  const stats = useMemo(() => {
    let totalHours = 0;
    let present = 0;
    let halfDay = 0;

    filteredRecords.forEach(r => {
      totalHours += r.totalHours || 0;
      if (r.status === "PRESENT") present++;
      if (r.status === "HALF_DAY") halfDay++;
    });

    // Calculate absent days based on elapsed workdays in the selected timeframe
    let absent = 0;
    const now = new Date();
    
    // Simple logic for elapsed days:
    // If 'month', how many workdays have elapsed this month?
    // If 'week', how many workdays have elapsed this week?
    // For simplicity, we just count unique days in the records. But since absent means NO record,
    // we approximate: Elapsed Days - (Present + HalfDay). 
    // A better approach is to calculate actual workdays (Mon-Fri) in the filter period.
    
    let workdaysInPeriod = 0;
    
    if (selectedFilter === "month") {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      for (let d = firstDayOfMonth; d <= now; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0 && d.getDay() !== 6) workdaysInPeriod++; // Exclude weekends
      }
    } else if (selectedFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      for (let d = weekAgo; d <= now; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0 && d.getDay() !== 6) workdaysInPeriod++;
      }
    } else if (selectedFilter === "day") {
      workdaysInPeriod = (now.getDay() !== 0 && now.getDay() !== 6) ? 1 : 0;
    } else {
      // For 'all', we don't have a specific timeframe, so absent is hard to determine precisely without hire date.
      // We'll just show N/A or 0 for 'all'.
      workdaysInPeriod = present + halfDay; // Fallback
    }

    absent = Math.max(0, workdaysInPeriod - (present + halfDay));

    return {
      totalHours: totalHours.toFixed(1),
      present,
      halfDay,
      absent: selectedFilter === 'all' ? '--' : absent
    };
  }, [filteredRecords, selectedFilter]);

  // FORMAT TIME
  const formatTime = (time) => {
    if (!time) return "--";
    return new Date(time).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // FORMAT DATE
  const formatDate = (date) => {
    if (!date) return "--";
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: 'short',
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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
          <button 
            onClick={() => navigate('/hr/employees-attendance')}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors max-w-fit px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200"
          >
            <ArrowLeft size={16} />
            Back to All Employees
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <User size={40} />
              </div>
              <div>
                <span className="text-xs font-bold tracking-widest uppercase text-indigo-500 mb-1 block">Employee Profile</span>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                  {employee?.name || "Loading..."}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                    <Briefcase size={14} className="text-slate-400" />
                    {employee?.employeeId || "--"}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                    {employee?.department?.name || "Department"}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                    {employee?.position || "Position"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* STATS */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: "Total Hours", value: stats.totalHours, icon: Clock, color: "text-blue-500", bg: "bg-blue-50", suffix: "hrs" },
            { label: "Days Present", value: stats.present, icon: CalendarDays, color: "text-emerald-500", bg: "bg-emerald-50", suffix: "days" },
            { label: "Half Days", value: stats.halfDay, icon: TimerReset, color: "text-amber-500", bg: "bg-amber-50", suffix: "days" },
            { label: "Days Absent", value: stats.absent, icon: Clock3, color: "text-rose-500", bg: "bg-rose-50", suffix: "days" },
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
              <div className="flex items-baseline gap-1.5">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{item.value}</h2>
                {item.value !== '--' && <span className="text-sm font-bold text-slate-400">{item.suffix}</span>}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* TABLE SECTION */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/60 overflow-hidden flex flex-col min-h-[500px]">
          
          {/* HEADER & FILTERS */}
          <div className="p-6 md:p-8 border-b border-slate-100/70 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/50">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex flex-wrap items-center gap-3">
                Attendance Log
                <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{filteredRecords.length} records</span>
              </h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">Detailed daily log of check-ins and working hours.</p>
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
            ) : filteredRecords.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-center px-4">
                <CircleDot size={40} className="text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">No Records Found</h3>
                <p className="text-sm font-medium text-slate-500 max-w-sm">
                  There are no attendance records for this period.
                </p>
              </div>
            ) : (
              <div className="min-w-[800px] w-full">
                {/* TABLE HEADER */}
                <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                  <div className="col-span-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Date</div>
                  <div className="col-span-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Check In</div>
                  <div className="col-span-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Check Out</div>
                  <div className="col-span-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Break Hours</div>
                  <div className="col-span-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Total</div>
                  <div className="col-span-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">Status</div>
                </div>

                {/* TABLE ROWS */}
                <div className="divide-y divide-slate-100">
                  {filteredRecords.map((item, index) => {
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
                        className="grid grid-cols-12 gap-4 items-center px-8 py-4 hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* DATE */}
                        <div className="col-span-3 flex items-center text-sm font-bold text-slate-700">
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

                        {/* BREAK HOURS */}
                        <div className="col-span-2 flex items-center text-sm font-semibold text-slate-500">
                          {item.breakHours ? `${item.breakHours.toFixed(1)} hrs` : "--"}
                        </div>

                        {/* HOURS */}
                        <div className="col-span-1 flex items-center text-sm font-black text-slate-800">
                          {item.totalHours ? `${item.totalHours.toFixed(1)} hrs` : "--"}
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
