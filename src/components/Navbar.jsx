import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutGrid,
  CalendarDays,
  FileText,
  LogOut,
  Menu,
  X,
  Users,
  ShieldCheck,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  BellRing,
  Zap,
  Camera,
  Keyboard,
  CreditCard,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import API, { API_URL } from "../services/api";
import MainLogo from "../assets/logo.jpeg";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const NAV_CONFIG = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
    path: "/dashboard",
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE", "COORDINATOR"],
  },
  {
    id: "reports-hr",
    label: "Reports",
    icon: FileText,
    path: "/reports/hr",
    roles: ["ADMIN", "HR"],
  },
  {
    id: "reports-emp",
    label: "Reports",
    icon: FileText,
    path: "/reports/employee",
    roles: ["EMPLOYEE"],
  },
  {
    id: "project",
    label: "Projects",
    icon: BriefcaseBusiness,
    path: "/projects",
    roles: ["ADMIN", "HR", "MANAGER", "COORDINATOR"],
  },
  {
    id: "shoots",
    label: "Shoots",
    icon: Camera,
    path: "/shoot", 
    roles: ["MANAGER", "EMPLOYEE"],
  },
  {
    id: "editor",
    label: "Creative and Editors",
    icon: Keyboard,
    path: "/editor", 
    roles: ["MANAGER"],
  },
  {
    id: "tasks-emp",
    label: "Tasks",
    icon: BriefcaseBusiness,
    path: "/projects", 
    roles: ["EMPLOYEE"],
  },
  {
    id: "tasks-cor",
    label: "My Tasks",
    icon: BriefcaseBusiness,
    path: "/tasks", 
    roles: ["COORDINATOR"],
  },
  {
    id: "priority-actions",
    label: "Priority Actions",
    icon: Zap,
    path: "/priority-actions",
    roles: ["COORDINATOR"],
    notificationCount: 4,
  },
  {
    id: "assigned-actions",
    label: "Assigned Actions",
    icon: BellRing,
    path: "/assigned-actions",
    roles: ["EMPLOYEE", "MANAGER", "HR"],
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: CalendarDays,
    path: "/attendance",
    roles: ["EMPLOYEE", "MANAGER", "HR", "COORDINATOR"],
  },
  {
    id: "employee-attendance",
    label: "Employee Attendance",
    icon: CalendarDays,
    path: "/hr/employees-attendance",
    roles: ["HR"],
  },
  {
    id: "employee-leaves",
    label: "Employee Leaves",
    icon: FileText,
    path: "/hr/employees-leaves",
    roles: ["HR"],
  },
  {
    id: "team",
    label: "Team",
    icon: Users,
    path: "/hr/team",
    roles: ["HR", "ADMIN"],
  },
  {
    id: "leave",
    label: "Leave",
    icon: FileText,
    path: "/leave",
    roles: ["HR", "MANAGER", "EMPLOYEE", "COORDINATOR"],
  },
  {
    id: "payslips",
    label: "Payslips",
    icon: CreditCard,
    path: "/payslips",
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE", "COORDINATOR"],
  },
  {
    id: "admin-panel",
    label: "Admin",
    icon: ShieldCheck,
    path: "/admin/settings",
    roles: ["ADMIN"],
  },
];

const WIDE = 260;
const COLLAPSED = 80;

export default function ProfessionalSidebar({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebar") === "collapsed",
  );

  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [assignedActionsCount, setAssignedActionsCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({ projects: 0, shoots: 0, creative: 0, editor: 0 });
  const [departmentName, setDepartmentName] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    const socketInstance = io(API_URL);

    socketInstance.on("connect", () => {
      socketInstance.emit("join-user", { userId: user.id });
    });

    socketInstance.on("task-submitted-popup", (data) => {
      toast.info(`New Task Submission on Project: ${data.projectName} by ${data.employeeName}`);
    });

    socketInstance.on("task-rejected-popup", (data) => {
      toast.error(
        <div>
          <strong>Task Rejected!</strong><br />
          Project: {data.projectName}<br />
          Task: {data.taskTitle}<br />
          Reason: {data.reason}
        </div>,
        { autoClose: false }
      );
    });

    socketInstance.on("task-resubmitted-popup", (data) => {
      toast.info(
        <div>
          <strong>Task Resubmitted!</strong><br />
          Project: {data.projectName}<br />
          Task: {data.taskTitle}<br />
          By: {data.employeeName}
        </div>,
        { autoClose: false }
      );
    });

    return () => {
      socketInstance.emit("leave-user", { userId: user.id });
      socketInstance.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    const checkUserDepartment = async () => {
      if (!user) return;

      try {
        const normalizedRole = role?.toUpperCase();

        if (user?.name === "shoot2" || user?.email === "shoot2@gmail.com") {
          setDepartmentName("video production");
          return;
        }

        if (normalizedRole === "HR" || normalizedRole === "ADMIN") {
          setDepartmentName(normalizedRole);
          return;
        }

        const assignedDepartmentId =
          user?.departmentId ||
          user?.department ||
          user?.deptId ||
          user?.department_id;

        if (!assignedDepartmentId) {
          setDepartmentName("NONE");
          return;
        }

        const res = await API.get("/api/departments");
        let departmentsList = [];
        if (Array.isArray(res.data)) {
          departmentsList = res.data;
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          departmentsList = res.data.data;
        }

        const department = departmentsList.find((d) => {
          const systemDeptId = String(d.id || d._id || "");
          const userDeptId =
            typeof assignedDepartmentId === "object"
              ? String(
                assignedDepartmentId?.id || assignedDepartmentId?._id || "",
              )
              : String(assignedDepartmentId);

          return systemDeptId === userDeptId;
        });

        if (department?.name) {
          setDepartmentName(department.name.trim().toLowerCase());
        } else {
          setDepartmentName("UNKNOWN");
        }
      } catch (err) {
        console.error(
          "Error setting sidebar navigation department filter flags:",
          err,
        );
        setDepartmentName("ERROR");
      }
    };

    checkUserDepartment();
  }, [role, user]);

  useEffect(() => {
    let interval;

    const fetchAssignedActionsCount = async () => {
      try {
        if (role !== "EMPLOYEE" && role !== "MANAGER" && role !== "HR") {
          return;
        }
        if (!user?.id) return;

        const res = await API.get(
          `/api/coordinator-assignments/assigned-to/${user.id}`,
        );

        const assignments = res?.data?.data?.data || [];
        const assignedOnly = assignments.filter(
          (item) => item.status === "ASSIGNED",
        );

        setAssignedActionsCount(assignedOnly.length);
      } catch (error) {
        console.log(error);
      }
    };

    fetchAssignedActionsCount();

    interval = setInterval(() => {
      fetchAssignedActionsCount();
    }, 3000);

    return () => clearInterval(interval);
  }, [role, user?.id]);

  useEffect(() => {
    let interval;
    const fetchUnreads = async () => {
      if (!user?.id) return;
      try {
        const res = await API.get("/api/sidebar-unread");
        if (res.data?.success) {
          setUnreadCounts(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch sidebar unread counts:", err);
      }
    };

    fetchUnreads();
    interval = setInterval(fetchUnreads, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    localStorage.setItem("sidebar", collapsed ? "collapsed" : "open");
  }, [collapsed]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "auto";
  }, [mobileOpen]);

  const allowedNav = useMemo(() => {
    return NAV_CONFIG.filter((item) => {
      const handlesRole = item.roles.includes(role?.toUpperCase());
      if (!handlesRole) return false;

      if (item.departments) {
        if (user?.name === "shoot1") return true;

        const cleanDeptStr = departmentName?.toLowerCase();
        return item.departments
          .map((d) => d.toLowerCase())
          .includes(cleanDeptStr);
      }

      return true;
    });
  }, [role, departmentName, user]);

  const activeId = useMemo(() => {
    const sortedRoutes = [...allowedNav].sort(
      (a, b) => b.path.length - a.path.length,
    );

    const matched = sortedRoutes.find((item) => {
      if (item.path === "/dashboard") {
        return location.pathname === "/dashboard";
      }

      return (
        location.pathname === item.path ||
        location.pathname.startsWith(`${item.path}/`)
      );
    });

    return matched?.id || null;
  }, [location.pathname, allowedNav]);

  const Sidebar = ({ mobile = false }) => {
    const width = mobile ? WIDE : collapsed ? COLLAPSED : WIDE;

    return (
      <motion.div
        initial={false}
        animate={{ width }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-full bg-slate-950 text-white flex flex-col border-r border-slate-800/50 relative"
      >
        {/* Subtle glowing background orb container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[150px] h-[150px] bg-indigo-500/20 rounded-full blur-[60px]" />
        </div>

        {/* TOP */}
        <div className="flex items-center gap-4 p-5 border-b border-slate-800/50 relative z-10">
          <img src={MainLogo} className="w-10 h-10 rounded-xl shadow-lg shadow-indigo-500/20 object-cover border border-white/10" />

          {(!collapsed || mobile) && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex flex-col overflow-hidden whitespace-nowrap"
            >
              <p className="text-sm font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">We-Promote</p>
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mt-0.5">{role}</p>
            </motion.div>
          )}
        </div>

        {/* NAV */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar relative z-10">
          {allowedNav.map((item) => {
            const active = activeId !== null && activeId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);

                  let menuIdToReset = null;
                  if (item.id === "project" || item.id === "tasks-emp") {
                    if (unreadCounts.projects > 0) {
                      setUnreadCounts(prev => ({ ...prev, projects: 0 }));
                      menuIdToReset = "projects";
                    }
                  } else if (item.id === "shoots") {
                    if (unreadCounts.shoots > 0) {
                      setUnreadCounts(prev => ({ ...prev, shoots: 0 }));
                      menuIdToReset = "shoots";
                    }
                  } else if (item.id === "editor") {
                    if (unreadCounts.creative > 0 || unreadCounts.editor > 0) {
                      setUnreadCounts(prev => ({ ...prev, creative: 0, editor: 0 }));
                      API.post("/api/sidebar-unread/reset", { menuId: "creative" }).catch(() => { });
                      API.post("/api/sidebar-unread/reset", { menuId: "editor" }).catch(() => { });
                    }
                  }

                  if (menuIdToReset) {
                    API.post("/api/sidebar-unread/reset", { menuId: menuIdToReset }).catch(console.error);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors relative overflow-hidden group ${
                  active ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-indigo-600/20 border border-indigo-500/30 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                {/* Fallback hover effect */}
                {!active && (
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                )}

                <div className="flex items-center gap-4 relative z-10">
                  <div className="relative shrink-0 flex items-center justify-center">
                    <item.icon size={20} className={`transition-colors ${active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                    
                    {(collapsed && !mobile) && (
                      <>
                        {item.id === "assigned-actions" && assignedActionsCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-slate-950 block" />
                        )}
                        {(item.id === "project" || item.id === "tasks-emp") && unreadCounts.projects > 0 && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-slate-950 block" />
                        )}
                        {item.id === "shoots" && unreadCounts.shoots > 0 && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-slate-950 block" />
                        )}
                        {item.id === "editor" && (unreadCounts.creative > 0 || unreadCounts.editor > 0) && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-slate-950 block" />
                        )}
                      </>
                    )}
                  </div>
                  
                  {(!collapsed || mobile) && (
                    <motion.span 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="text-sm font-semibold whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </div>

                {/* Expanded-mode count badges */}
                {(!collapsed || mobile) && (
                  <div className="relative z-10 flex items-center gap-2">
                    {item.id === "assigned-actions" && assignedActionsCount > 0 && (
                      <span className="min-w-6 h-6 px-1.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] flex items-center justify-center font-bold">
                        {assignedActionsCount}
                      </span>
                    )}

                    {(item.id === "project" || item.id === "tasks-emp") && unreadCounts.projects > 0 && (
                      <span className="min-w-6 h-6 px-1.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] flex items-center justify-center font-bold">
                        {unreadCounts.projects}
                      </span>
                    )}

                    {item.id === "shoots" && unreadCounts.shoots > 0 && (
                      <span className="min-w-6 h-6 px-1.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] flex items-center justify-center font-bold">
                        {unreadCounts.shoots}
                      </span>
                    )}

                    {item.id === "editor" && (unreadCounts.creative > 0 || unreadCounts.editor > 0) && (
                      <span className="min-w-6 h-6 px-1.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] flex items-center justify-center font-bold">
                        {unreadCounts.creative + unreadCounts.editor}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>


        {/* FOOTER */}
        <div className="p-4 border-t border-slate-800/50 relative z-10">
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors group"
          >
            <div className="relative shrink-0 flex items-center justify-center">
               <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            </div>
            {(!collapsed || mobile) && (
              <motion.span 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="text-sm font-semibold whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </button>
        </div>

        {/* TOGGLE */}
        {!mobile && (
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="absolute top-7 -right-3.5 w-7 h-7 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center border-2 border-slate-50 z-50 hover:scale-110 transition-transform"
          >
            {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* DESKTOP */}
      <aside
        className="hidden lg:block h-screen sticky top-0 shrink-0 z-40"
      >
        <Sidebar />
      </aside>

      {/* MOBILE TOP */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-5 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <img src={MainLogo} className="w-8 h-8 rounded-lg shadow-sm border border-slate-100 object-cover" />
          <span className="text-base font-black tracking-tight text-slate-900">We-Promote</span>
        </div>

        <button 
          onClick={() => setMobileOpen(true)}
          className="p-2 -mr-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            key="mobile-sidebar-container"
            className="fixed inset-0 z-[60] lg:hidden"
          >
            <motion.div
              key="overlay"
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />

            <motion.div
              key="sidebar-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
              className="absolute left-0 top-0 h-full w-[280px] shadow-2xl"
            >
              <Sidebar mobile />
            </motion.div>

            <motion.button
              key="close-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
            >
              <X size={24} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENT */}
      <main className="flex-1 pt-16 lg:pt-0 relative">{children}</main>
    </div>
  );
}
