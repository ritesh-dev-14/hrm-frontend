import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Briefcase, ClipboardList, TrendingUp, Mail, CalendarDays,
  CheckCircle2, Clock3, XCircle, Loader2, Search, ChevronRight,
  UserCheck, Layers, CheckSquare, Activity
} from "lucide-react";

import API from "../../services/api";
import { notifyError } from "../../utils/toast";
import AttendanceCard from "../../components/attendece/AttendenceCard";
import { useAuth } from "../../context/AuthContext";

const statusStyles = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  ASSIGNED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SUBMITTED: "bg-violet-50 text-violet-700 border-violet-200",
  VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const HrHomePage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedManager, setSelectedManager] = useState(null);
  const [managerSearch, setManagerSearch] = useState("");
  const { user } = useAuth();
  
  const [activeSegment, setActiveSegment] = useState("EMPLOYEES");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/hr/dashboard/overview");

      if (response?.data?.success) {
        const data = response.data.data;
        setDashboardData(data);
      }
    } catch (error) {
      console.error(error);
      notifyError("Failed to load dashboard parameters");
    } finally {
      setLoading(false);
    }
  };

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoadingAttendance(true);
        const res = await API.get("/api/attendance");
        const data = res.data || res;
        if (data.success) {
          const allRecords = data.data || [];
          const filteredRecords = allRecords.filter(r => {
             const rDate = new Date(r.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
             return rDate === selectedDate;
          });
          setAttendanceRecords(filteredRecords);
        }
      } catch (err) {
        console.error("Error fetching attendance data:", err);
      } finally {
        setLoadingAttendance(false);
      }
    };
    fetchAttendance();
  }, [selectedDate]);

  const rosterData = useMemo(() => {
    if (!dashboardData?.allUsers) return [];
    return dashboardData.allUsers.map(user => {
      const record = attendanceRecords.find(r => r.userId === user.id || r.user?.employeeId === user.employeeId);
      return {
        ...user,
        attendance: record || null
      };
    });
  }, [dashboardData?.allUsers, attendanceRecords]);

  useEffect(() => {
    fetchDashboard();
  }, []);



  const attendanceStats = useMemo(() => {
    if (!rosterData || rosterData.length === 0) {
      return { present: 0, absent: 0, leave: 0 };
    }

    let present = 0;
    let absent = 0;
    let leave = 0;

    rosterData.forEach((u) => {
      const status = u.attendance?.status;
      if (status === "PRESENT" || status === "HALF_DAY") {
        present++;
      } else if (status === "LEAVE" || status === "HOLIDAY" || status === "ON_LEAVE") {
        leave++;
      } else {
        absent++;
      }
    });

    return { present, absent, leave };
  }, [rosterData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!dashboardData) return null;

  const { globalStats } = dashboardData;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans relative overflow-hidden pb-12">
      {/* Background ambient glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-indigo-500 mb-1 block">Overview</span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              Welcome back, {user?.name || "HR"}
            </h1>
          </div>
        </motion.div>

        {/* ATTENDANCE CARD METRIC BLOCK */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-4 shadow-sm relative overflow-hidden">
             <AttendanceCard />
          </div>
        </motion.div>

        {/* TOP LEVEL GLOBAL DIRECTORY METRICS METADATA */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
          <StatsMiniRow title="Total Managers" value={globalStats.totalManagers} icon={Users} color="indigo" link="/hr/team?role=MANAGER" />
          <StatsMiniRow title="Total Employees" value={globalStats.totalEmployees} icon={Users} color="emerald" link="/hr/team?role=EMPLOYEE" />
          <StatsMiniRow title="Today Present" value={attendanceStats.present} icon={UserCheck} color="emerald" link="/hr/employees-attendance" />
          <StatsMiniRow title="Today Absent" value={attendanceStats.absent} icon={XCircle} color="rose" link="/hr/employees-attendance" />
          <StatsMiniRow title="Today On Leave" value={attendanceStats.leave} icon={CalendarDays} color="amber" link="/hr/employees-leaves" />
        </motion.div>

        {/* DEDICATED ATTENDANCE ROSTER SECTION */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/60 overflow-hidden flex flex-col min-h-[500px]">
          
          {/* List Header & Date Filter */}
          <div className="p-6 md:p-8 border-b border-slate-100/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/50">
                <Activity size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  Company Attendance Roster
                  <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-bold">
                    {rosterData.length} Users
                  </span>
                </h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">Tracking attendance for all organizational roles</p>
              </div>
            </div>

            {/* Date Filter Input */}
            <div className="relative flex items-center">
              <div className="absolute left-3 text-indigo-500 pointer-events-none">
                <CalendarDays size={18} />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-indigo-100 rounded-xl text-sm font-semibold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 p-6 md:p-8 bg-slate-50/30">
            {loadingAttendance ? (
              <div className="flex flex-col items-center justify-center h-64 opacity-50">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"
                />
                <p className="text-indigo-900 font-semibold text-sm tracking-wide">Fetching Attendance Records...</p>
              </div>
            ) : rosterData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center bg-white/50 rounded-3xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                  <Search size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">No Records Found</h3>
                <p className="text-slate-500 text-sm max-w-sm">No employees found in the system for this date.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-4 px-6 font-semibold">Employee</th>
                        <th className="py-4 px-6 font-semibold">Role & Dept</th>
                        <th className="py-4 px-6 font-semibold">Status</th>
                        <th className="py-4 px-6 font-semibold">Punch In</th>
                        <th className="py-4 px-6 font-semibold">Punch Out</th>
                        <th className="py-4 px-6 font-semibold">Total Work Done</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rosterData.map((user, i) => {
                        const status = user.attendance?.status || "ABSENT";
                        const inTime = user.attendance?.startTime ? new Date(user.attendance.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
                        const outTime = user.attendance?.endTime ? new Date(user.attendance.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
                        const totalWork = user.attendance?.totalHours ? `${user.attendance.totalHours} hrs` : "--";
                        
                        let statusBadge = "";
                        if (status === "PRESENT") statusBadge = "bg-emerald-50 text-emerald-600 border-emerald-200";
                        else if (status === "HALF_DAY") statusBadge = "bg-amber-50 text-amber-600 border-amber-200";
                        else statusBadge = "bg-red-50 text-red-600 border-red-200";

                        return (
                          <motion.tr 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            key={user.id} 
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-900">{user.name}</div>
                              <div className="text-xs text-indigo-500 font-semibold">{user.employeeId}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-sm font-medium text-slate-700">{user.role}</div>
                              <div className="text-xs text-slate-400">{user.department?.name || user.department || "N/A"}</div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${statusBadge}`}>
                                {status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2 text-slate-600 font-semibold">
                                <Clock3 size={14} className="text-slate-400" /> {inTime}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2 text-slate-600 font-semibold">
                                <Clock3 size={14} className="text-slate-400" /> {outTime}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-800">
                                {totalWork}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

/* INLINE WORKSPACE SEGREGATION SEGMENT CONTROL BUTTON SUB-COMPONENT */
const SegmentTab = ({ label, active, onClick, icon: Icon }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl transition-all relative z-10 ${
        active 
          ? "text-indigo-700 shadow-sm" 
          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
      }`}
    >
      {active && (
        <motion.div
          layoutId="activeSegment"
          className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-100"
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        />
      )}
      <Icon size={14} className={`relative z-10 ${active ? "text-indigo-600" : "text-slate-400"}`} />
      <span className="relative z-10">{label}</span>
    </button>
  );
};

/* HEADER TOP MINI STAT ROWS */
const StatsMiniRow = ({ title, value, icon: Icon, color = "indigo", link = "#" }) => {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };
  
  return (
    <Link to={link} className="block h-full">
      <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-5 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer group h-full">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">{title}</span>
          <span className="text-3xl font-black text-slate-900 block">{value}</span>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
      </motion.div>
    </Link>
  );
};

export default HrHomePage;