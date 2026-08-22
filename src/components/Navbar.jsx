// import { useState, useEffect, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { AnimatePresence, motion } from "framer-motion";
// import {
//   LayoutGrid,
//   CalendarDays,
//   FileText,
//   LogOut,
//   Menu,
//   X,
//   Users,
//   ShieldCheck,
//   BriefcaseBusiness,
//   ChevronLeft,
//   ChevronRight,
//   BellRing,
//   Zap,
//   Camera,
//   Keyboard,
//   CreditCard,
//   FolderOpen,
//   Layers,
//   TrendingUp,
//   Megaphone,
//   BarChart2,
// } from "lucide-react";

// import { useAuth } from "../context/AuthContext";
// import API, { API_URL } from "../services/api";
// import MainLogo from "../assets/logo.jpeg";
// import { io } from "socket.io-client";
// import { toast } from "react-toastify";
// import TodayUploadPopup from "./TodayUploadPopup";

// const NAV_CONFIG = [
//   {
//     id: "dashboard",
//     label: "Dashboard",
//     icon: LayoutGrid,
//     path: "/dashboard",
//     roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE", "COORDINATOR", "EA"],
//   },
//   {
//     id: "reports-hr",
//     label: "Employee Reports",
//     icon: FileText,
//     path: "/reports/hr",
//     roles: ["ADMIN", "HR"],
//   },
//   {
//     id: "reports-emp",
//     label: "Reports",
//     icon: FileText,
//     path: "/reports/employee",
//     roles: ["EMPLOYEE"],
//   },
//   {
//     id: "project",
//     label: "Projects",
//     icon: BriefcaseBusiness,
//     path: "/projects",
//     roles: ["ADMIN", "HR", "MANAGER", "COORDINATOR", "EA"],
//   },
//   {
//     id: "shoots",
//     label: "Shoots",
//     icon: Camera,
//     path: "/shoot",
//     roles: ["MANAGER", "EMPLOYEE"],
//   },
//   {
//     id: "editor",
//     label: "Creative and Editors",
//     icon: Keyboard,
//     path: "/editor",
//     roles: ["MANAGER"],
//   },
//   {
//     id: "tasks-emp",
//     label: "Tasks",
//     icon: BriefcaseBusiness,
//     path: "/projects",
//     roles: ["EMPLOYEE"],
//   },
//   {
//     id: "daily-reports",
//     label: "Daily Reports",
//     icon: FileText,
//     path: "/employee-daily-reports",
//     roles: ["EMPLOYEE"],
//   },
//   {
//     id: "tasks-cor",
//     label: "My Tasks",
//     icon: BriefcaseBusiness,
//     path: "/tasks",
//     roles: ["COORDINATOR", "EA"],
//   },
//   {
//     id: "priority-actions",
//     label: "Priority Actions",
//     icon: Zap,
//     path: "/priority-actions",
//     roles: ["COORDINATOR", "EA"],
//     notificationCount: 4,
//   },
//   {
//     id: "assigned-actions",
//     label: "Assigned Actions",
//     icon: BellRing,
//     path: "/assigned-actions",
//     roles: ["EMPLOYEE", "MANAGER", "HR"],
//   },
//   {
//     id: "attendance",
//     label: "Attendance",
//     icon: CalendarDays,
//     path: "/attendance",
//     roles: ["EMPLOYEE", "MANAGER", "HR", "COORDINATOR", "EA"],
//   },
//   {
//     id: "employee-attendance",
//     label: "Employee Attendance",
//     icon: CalendarDays,
//     path: "/hr/employees-attendance",
//     roles: ["HR"],
//   },
//   {
//     id: "employee-leaves",
//     label: "Employee Leaves",
//     icon: FileText,
//     path: "/hr/employees-leaves",
//     roles: ["HR"],
//   },
//   {
//     id: "team",
//     label: "Team",
//     icon: Users,
//     path: "/hr/team",
//     roles: ["HR", "ADMIN"],
//   },
//   {
//     id: "leave",
//     label: "Leave",
//     icon: FileText,
//     path: "/leave",
//     roles: ["HR", "MANAGER", "EMPLOYEE", "COORDINATOR", "EA"],
//   },
//   {
//     id: "payslips",
//     label: "Payslips",
//     icon: CreditCard,
//     path: "/payslips",
//     roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE", "COORDINATOR", "EA"],
//   },
//   {
//     id: "uploads",
//     label: "Uploads",
//     icon: FolderOpen,
//     path: "/uploads",
//     roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE", "EA", "COORDINATOR"],
//   },
//   {
//     id: "marketing",
//     label: "Marketing",
//     icon: TrendingUp,
//     path: "/marketing",
//     roles: ["MANAGER"],
//     departments: ["marketing", "marketing department", "performance marketing"],
//   },
//   {
//     id: "marketing-projects",
//     label: "Meta Ads",
//     icon: Megaphone,
//     path: "/marketing-projects",
//     roles: ["ADMIN", "HR", "EA", "MANAGER"],
//   },
//   {
//     id: "social-media-projects",
//     label: "Social Media",
//     icon: Megaphone,
//     path: "/social-media-projects",
//     roles: ["ADMIN", "HR", "EA", "MANAGER"],
//   },
//   {
//     id: "seo-projects",
//     label: "SEO",
//     icon: Megaphone,
//     path: "/seo-projects",
//     roles: ["ADMIN", "HR", "EA", "MANAGER"],
//   },
//   {
//     id: "daily-reports",
//     label: "Daily Reports",
//     icon: Megaphone,
//     path: "/daily-reports",
//     roles: ["ADMIN", "HR", "EA", "MANAGER"],
//   },
//   {
//     id: "reports-overview",
//     label: "Reports",
//     icon: BarChart2,
//     path: "/reports/overview",
//     roles: ["ADMIN", "HR"],
//   },
//   {
//     id: "complete-details",
//     label: "Complete Details",
//     icon: Layers,
//     path: "/admin/complete-details",
//     roles: ["ADMIN"],
//   },
//   {
//     id: "admin-panel",
//     label: "Admin",
//     icon: ShieldCheck,
//     path: "/admin/settings",
//     roles: ["ADMIN"],
//   },
// ];

// const WIDE = 260;
// const COLLAPSED = 80;

// export default function ProfessionalSidebar({ children }) {
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [collapsed, setCollapsed] = useState(
//     () => localStorage.getItem("sidebar") === "collapsed",
//   );

//   const { role, user, logout } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [assignedActionsCount, setAssignedActionsCount] = useState(0);
//   const [unreadCounts, setUnreadCounts] = useState({ projects: 0, shoots: 0, creative: 0, editor: 0 });
//   const [departmentName, setDepartmentName] = useState("");
//   const [uploadPopupData, setUploadPopupData] = useState(null);

//   useEffect(() => {
//     if (!user?.id) return;

//     const socketInstance = io(API_URL);

//     socketInstance.on("connect", () => {
//       socketInstance.emit("join-user", { userId: user.id });
//     });

//     socketInstance.on("task-submitted-popup", (data) => {
//       toast.info(`New Task Submission on Project: ${data.projectName} by ${data.employeeName}`);
//     });

//     socketInstance.on("task-rejected-popup", (data) => {
//       toast.error(
//         <div>
//           <strong>Task Rejected!</strong><br />
//           Project: {data.projectName}<br />
//           Task: {data.taskTitle}<br />
//           Reason: {data.reason}
//         </div>,
//         { autoClose: false }
//       );
//     });

//     socketInstance.on("task-resubmitted-popup", (data) => {
//       toast.info(
//         <div>
//           <strong>Task Resubmitted!</strong><br />
//           Project: {data.projectName}<br />
//           Task: {data.taskTitle}<br />
//           By: {data.employeeName}
//         </div>,
//         { autoClose: false }
//       );
//     });

//     // Today's Upload notification
//     socketInstance.on("today-upload-popup", (data) => {
//       console.log("[Socket] today-upload-popup received:", data);
//       // Show on-screen popup
//       setUploadPopupData(data);
//       // Also bump unread count locally for uploads sidebar badge
//       setUnreadCounts((prev) => ({ ...prev, projects: (prev.projects || 0) + 1 }));
//       // Show a brief toast as well
//       toast.info(
//         <div>
//           <strong>📌 Today's Upload Alert</strong><br />
//           <span style={{ fontSize: 13 }}>{data.projectName} — {data.totalUploads} uploads</span>
//         </div>,
//         { autoClose: 6000 }
//       );
//     });

//     return () => {
//       socketInstance.emit("leave-user", { userId: user.id });
//       socketInstance.disconnect();
//     };
//   }, [user?.id]);

//   useEffect(() => {
//     const checkUserDepartment = async () => {
//       if (!user) return;

//       try {
//         const normalizedRole = role?.toUpperCase();

//         if (user?.name === "shoot2" || user?.email === "shoot2@gmail.com") {
//           setDepartmentName("video production");
//           return;
//         }

//         if (normalizedRole === "HR" || normalizedRole === "ADMIN") {
//           setDepartmentName(normalizedRole);
//           return;
//         }

//         const assignedDepartmentId =
//           user?.departmentId ||
//           user?.department ||
//           user?.deptId ||
//           user?.department_id;

//         if (!assignedDepartmentId) {
//           setDepartmentName("NONE");
//           return;
//         }

//         const res = await API.get("/api/departments");
//         let departmentsList = [];
//         if (Array.isArray(res.data)) {
//           departmentsList = res.data;
//         } else if (res.data?.data && Array.isArray(res.data.data)) {
//           departmentsList = res.data.data;
//         }

//         const department = departmentsList.find((d) => {
//           const systemDeptId = String(d.id || d._id || "");
//           const userDeptId =
//             typeof assignedDepartmentId === "object"
//               ? String(
//                 assignedDepartmentId?.id || assignedDepartmentId?._id || "",
//               )
//               : String(assignedDepartmentId);

//           return systemDeptId === userDeptId;
//         });

//         if (department?.name) {
//           setDepartmentName(department.name.trim().toLowerCase());
//         } else {
//           setDepartmentName("UNKNOWN");
//         }
//       } catch (err) {
//         console.error(
//           "Error setting sidebar navigation department filter flags:",
//           err,
//         );
//         setDepartmentName("ERROR");
//       }
//     };

//     checkUserDepartment();
//   }, [role, user]);

//   useEffect(() => {
//     let interval;

//     const fetchAssignedActionsCount = async () => {
//       try {
//         if (role !== "EMPLOYEE" && role !== "MANAGER" && role !== "HR") {
//           return;
//         }
//         if (!user?.id) return;

//         const res = await API.get(
//           `/api/coordinator-assignments/assigned-to/${user.id}`,
//         );

//         const assignments = res?.data?.data?.data || [];
//         const assignedOnly = assignments.filter(
//           (item) => item.status === "ASSIGNED",
//         );

//         setAssignedActionsCount(assignedOnly.length);
//       } catch (error) {
//         console.log(error);
//       }
//     };

//     fetchAssignedActionsCount();

//     interval = setInterval(() => {
//       fetchAssignedActionsCount();
//     }, 3000);

//     return () => clearInterval(interval);
//   }, [role, user?.id]);

//   useEffect(() => {
//     let interval;
//     const fetchUnreads = async () => {
//       if (!user?.id) return;
//       try {
//         const res = await API.get("/api/sidebar-unread");
//         if (res.data?.success) {
//           setUnreadCounts(res.data.data);
//         }
//       } catch (err) {
//         console.error("Failed to fetch sidebar unread counts:", err);
//       }
//     };

//     fetchUnreads();
//     interval = setInterval(fetchUnreads, 5000);
//     return () => clearInterval(interval);
//   }, [user?.id]);

//   useEffect(() => {
//     localStorage.setItem("sidebar", collapsed ? "collapsed" : "open");
//   }, [collapsed]);

//   useEffect(() => {
//     document.body.style.overflow = mobileOpen ? "hidden" : "auto";
//   }, [mobileOpen]);

//   const allowedNav = useMemo(() => {
//     return NAV_CONFIG.filter((item) => {
//       const handlesRole = item.roles.includes(role?.toUpperCase());
//       if (!handlesRole) return false;

//       if (item.departments) {
//         if (user?.name === "shoot1") return true;

//         const cleanDeptStr = departmentName?.toLowerCase();
//         return item.departments
//           .map((d) => d.toLowerCase())
//           .includes(cleanDeptStr);
//       }

//       return true;
//     });
//   }, [role, departmentName, user]);

//   const activeId = useMemo(() => {
//     const sortedRoutes = [...allowedNav].sort(
//       (a, b) => b.path.length - a.path.length,
//     );

//     const matched = sortedRoutes.find((item) => {
//       if (item.path === "/dashboard") {
//         return location.pathname === "/dashboard";
//       }

//       return (
//         location.pathname === item.path ||
//         location.pathname.startsWith(`${item.path}/`)
//       );
//     });

//     return matched?.id || null;
//   }, [location.pathname, allowedNav]);

//   const Sidebar = ({ mobile = false }) => {
//     const width = mobile ? WIDE : collapsed ? COLLAPSED : WIDE;

//     return (
//       <motion.div
//         initial={false}
//         animate={{ width }}
//         transition={{ type: "spring", stiffness: 300, damping: 30 }}
//         className="h-full bg-slate-950 text-white flex flex-col border-r border-slate-800/50 relative"
//       >
//         {/* Subtle glowing background orb container */}
//         <div className="absolute inset-0 overflow-hidden pointer-events-none">
//           <div className="absolute top-[-10%] left-[-10%] w-[150px] h-[150px] bg-indigo-500/20 rounded-full blur-[60px]" />
//         </div>

//         {/* TOP */}
//         <div className="flex items-center gap-4 p-5 border-b border-slate-800/50 relative z-10">
//           <img src={MainLogo} className="w-10 h-10 rounded-xl shadow-lg shadow-indigo-500/20 object-cover border border-white/10" />

//           {(!collapsed || mobile) && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="flex flex-col overflow-hidden whitespace-nowrap"
//             >
//               <p className="text-sm font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">We-Promote</p>
//               <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mt-0.5">{role}</p>
//             </motion.div>
//           )}
//         </div>

//         {/* NAV */}
//         <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar relative z-10">
//           {allowedNav.map((item) => {
//             const active = activeId !== null && activeId === item.id;

//             return (
//               <button
//                 key={item.id}
//                 onClick={() => {
//                   navigate(item.path);
//                   setMobileOpen(false);

//                   let menuIdToReset = null;
//                   if (item.id === "project" || item.id === "tasks-emp") {
//                     if (unreadCounts.projects > 0) {
//                       setUnreadCounts(prev => ({ ...prev, projects: 0 }));
//                       menuIdToReset = "projects";
//                     }
//                   } else if (item.id === "shoots") {
//                     if (unreadCounts.shoots > 0) {
//                       setUnreadCounts(prev => ({ ...prev, shoots: 0 }));
//                       menuIdToReset = "shoots";
//                     }
//                   } else if (item.id === "editor") {
//                     if (unreadCounts.creative > 0 || unreadCounts.editor > 0) {
//                       setUnreadCounts(prev => ({ ...prev, creative: 0, editor: 0 }));
//                       API.post("/api/sidebar-unread/reset", { menuId: "creative" }).catch(() => { });
//                       API.post("/api/sidebar-unread/reset", { menuId: "editor" }).catch(() => { });
//                     }
//                   } else if (item.id === "uploads") {
//                     // Reset uploads unread on visit (currently uses "projects" key on backend)
//                     if (unreadCounts.uploads > 0) {
//                       setUnreadCounts(prev => ({ ...prev, uploads: 0 }));
//                       menuIdToReset = "projects";
//                     }
//                   }

//                   if (menuIdToReset) {
//                     API.post("/api/sidebar-unread/reset", { menuId: menuIdToReset }).catch(console.error);
//                   }
//                 }}
//                 className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors relative overflow-hidden group ${active ? "text-white" : "text-slate-400 hover:text-white"
//                   }`}
//               >
//                 {active && (
//                   <motion.div
//                     layoutId="sidebar-active"
//                     className="absolute inset-0 bg-indigo-600/20 border border-indigo-500/30 rounded-xl"
//                     transition={{ type: "spring", stiffness: 300, damping: 30 }}
//                   />
//                 )}

//                 {/* Fallback hover effect */}
//                 {!active && (
//                   <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
//                 )}

//                 <div className="flex items-center gap-4 relative z-10">
//                   <div className="relative shrink-0 flex items-center justify-center">
//                     <item.icon size={20} className={`transition-colors ${active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />

//                     {(collapsed && !mobile) && (
//                       <>
//                         {item.id === "assigned-actions" && assignedActionsCount > 0 && (
//                           <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-slate-950 block" />
//                         )}
//                         {(item.id === "project" || item.id === "tasks-emp") && unreadCounts.projects > 0 && (
//                           <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-slate-950 block" />
//                         )}
//                         {item.id === "shoots" && unreadCounts.shoots > 0 && (
//                           <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-slate-950 block" />
//                         )}
//                         {item.id === "editor" && (unreadCounts.creative > 0 || unreadCounts.editor > 0) && (
//                           <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-slate-950 block" />
//                         )}
//                         {item.id === "uploads" && unreadCounts.projects > 0 && (
//                           <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-500 border-2 border-slate-950 block" />
//                         )}
//                       </>
//                     )}
//                   </div>

//                   {(!collapsed || mobile) && (
//                     <motion.span
//                       initial={{ opacity: 0 }}
//                       animate={{ opacity: 1 }}
//                       exit={{ opacity: 0 }}
//                       className="text-sm font-semibold whitespace-nowrap"
//                     >
//                       {item.label}
//                     </motion.span>
//                   )}
//                 </div>

//                 {/* Expanded-mode count badges */}
//                 {(!collapsed || mobile) && (
//                   <div className="relative z-10 flex items-center gap-2">
//                     {item.id === "assigned-actions" && assignedActionsCount > 0 && (
//                       <span className="min-w-6 h-6 px-1.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] flex items-center justify-center font-bold">
//                         {assignedActionsCount}
//                       </span>
//                     )}

//                     {(item.id === "project" || item.id === "tasks-emp") && unreadCounts.projects > 0 && (
//                       <span className="min-w-6 h-6 px-1.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] flex items-center justify-center font-bold">
//                         {unreadCounts.projects}
//                       </span>
//                     )}

//                     {item.id === "shoots" && unreadCounts.shoots > 0 && (
//                       <span className="min-w-6 h-6 px-1.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] flex items-center justify-center font-bold">
//                         {unreadCounts.shoots}
//                       </span>
//                     )}

//                     {item.id === "editor" && (unreadCounts.creative > 0 || unreadCounts.editor > 0) && (
//                       <span className="min-w-6 h-6 px-1.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] flex items-center justify-center font-bold">
//                         {unreadCounts.creative + unreadCounts.editor}
//                       </span>
//                     )}

//                     {item.id === "uploads" && unreadCounts.projects > 0 && (
//                       <span className="min-w-6 h-6 px-1.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[10px] flex items-center justify-center font-bold">
//                         NEW
//                       </span>
//                     )}
//                   </div>
//                 )}
//               </button>
//             );
//           })}
//         </div>


//         {/* FOOTER */}
//         <div className="p-4 border-t border-slate-800/50 relative z-10">
//           <button
//             onClick={() => {
//               logout();
//               navigate("/login");
//             }}
//             className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors group"
//           >
//             <div className="relative shrink-0 flex items-center justify-center">
//               <LogOut size={20} className="group-hover:scale-110 transition-transform" />
//             </div>
//             {(!collapsed || mobile) && (
//               <motion.span
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 className="text-sm font-semibold whitespace-nowrap"
//               >
//                 Logout
//               </motion.span>
//             )}
//           </button>
//         </div>

//         {/* TOGGLE */}
//         {!mobile && (
//           <button
//             onClick={() => setCollapsed((p) => !p)}
//             className="absolute top-7 -right-3.5 w-7 h-7 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center border-2 border-slate-50 z-50 hover:scale-110 transition-transform"
//           >
//             {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
//           </button>
//         )}
//       </motion.div>
//     );
//   };

//   return (
//     <div className="flex min-h-screen bg-slate-50">
//       {/* DESKTOP */}
//       <aside
//         className="hidden lg:block h-screen sticky top-0 shrink-0 z-40"
//       >
//         <Sidebar />
//       </aside>

//       {/* MOBILE TOP */}
//       <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-5 z-50 shadow-sm">
//         <div className="flex items-center gap-3">
//           <img src={MainLogo} className="w-8 h-8 rounded-lg shadow-sm border border-slate-100 object-cover" />
//           <span className="text-base font-black tracking-tight text-slate-900">We-Promote</span>
//         </div>

//         <button
//           onClick={() => setMobileOpen(true)}
//           className="p-2 -mr-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
//         >
//           <Menu size={24} />
//         </button>
//       </div>

//       {/* MOBILE SIDEBAR */}
//       <AnimatePresence>
//         {mobileOpen && (
//           <motion.div
//             key="mobile-sidebar-container"
//             className="fixed inset-0 z-[60] lg:hidden"
//           >
//             <motion.div
//               key="overlay"
//               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
//               onClick={() => setMobileOpen(false)}
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               transition={{ duration: 0.3 }}
//             />

//             <motion.div
//               key="sidebar-drawer"
//               initial={{ x: "-100%" }}
//               animate={{ x: 0 }}
//               exit={{ x: "-100%" }}
//               transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
//               className="absolute left-0 top-0 h-full w-[280px] shadow-2xl"
//             >
//               <Sidebar mobile />
//             </motion.div>

//             <motion.button
//               key="close-btn"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               transition={{ duration: 0.3 }}
//               onClick={() => setMobileOpen(false)}
//               className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
//             >
//               <X size={24} />
//             </motion.button>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* CONTENT */}
//       <main className="flex-1 pt-16 lg:pt-0 relative">{children}</main>

//       {/* TODAY UPLOAD POPUP — shown globally for all roles */}
//       <TodayUploadPopup
//         data={uploadPopupData}
//         onClose={() => setUploadPopupData(null)}
//       />
//     </div>
//   );
// }

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
  ChevronDown,
  BellRing,
  Zap,
  Camera,
  Keyboard,
  CreditCard,
  FolderOpen,
  Layers,
  TrendingUp,
  Megaphone,
  BarChart2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import API, { API_URL } from "../services/api";
import MainLogo from "../assets/logo.jpeg";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import TodayUploadPopup from "./TodayUploadPopup";

const NAV_CONFIG = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, path: "/dashboard", roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE", "COORDINATOR", "EA"] },
  { id: "reports-hr", label: "Employee Reports", icon: FileText, path: "/reports/hr", roles: ["ADMIN", "HR"] },
  { id: "reports-emp", label: "Reports", icon: FileText, path: "/reports/employee", roles: ["EMPLOYEE"] },
  {
    id: "project",
    label: "Projects",
    icon: BriefcaseBusiness,
    path: "/projects",
    roles: ["ADMIN", "HR", "MANAGER", "COORDINATOR", "EA"],
    children: [
      { id: "marketing-projects", label: "Meta Ads", icon: Megaphone, path: "/marketing-projects" },
      { id: "social-media-projects", label: "Social Media", icon: Megaphone, path: "/social-media-projects" },
      { id: "seo-projects", label: "SEO", icon: Megaphone, path: "/seo-projects" },
    ],
  },
  { id: "shoots", label: "Shoots", icon: Camera, path: "/shoot", roles: ["MANAGER", "EMPLOYEE"] },
  { id: "editor", label: "Creative and Editors", icon: Keyboard, path: "/editor", roles: ["MANAGER"] },
  { id: "tasks-emp", label: "Tasks", icon: BriefcaseBusiness, path: "/projects", roles: ["EMPLOYEE"] },
  { id: "daily-reports", label: "Daily Reports", icon: FileText, path: "/employee-daily-reports", roles: ["EMPLOYEE"] },
  { id: "tasks-cor", label: "My Tasks", icon: BriefcaseBusiness, path: "/tasks", roles: ["COORDINATOR", "EA"] },
  { id: "priority-actions", label: "Priority Actions", icon: Zap, path: "/priority-actions", roles: ["COORDINATOR", "EA"], notificationCount: 4 },
  { id: "assigned-actions", label: "Assigned Actions", icon: BellRing, path: "/assigned-actions", roles: ["EMPLOYEE", "MANAGER", "HR"] },
  { id: "attendance", label: "Attendance", icon: CalendarDays, path: "/attendance", roles: ["EMPLOYEE", "MANAGER", "HR", "COORDINATOR", "EA"] },
  { id: "employee-attendance", label: "Employee Attendance", icon: CalendarDays, path: "/hr/employees-attendance", roles: ["HR"] },
  { id: "employee-leaves", label: "Employee Leaves", icon: FileText, path: "/hr/employees-leaves", roles: ["HR"] },
  { id: "team", label: "Team", icon: Users, path: "/hr/team", roles: ["HR", "ADMIN"] },
  { id: "leave", label: "Leave", icon: FileText, path: "/leave", roles: ["HR", "MANAGER", "EMPLOYEE", "COORDINATOR", "EA"] },
  { id: "payslips", label: "Payslips", icon: CreditCard, path: "/payslips", roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE", "COORDINATOR", "EA"] },
  { id: "uploads", label: "Uploads", icon: FolderOpen, path: "/uploads", roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE", "EA", "COORDINATOR"] },
  { id: "marketing", label: "Marketing", icon: TrendingUp, path: "/marketing", roles: ["MANAGER"], departments: ["marketing", "marketing department", "performance marketing"] },
  { id: "daily-reports", label: "Daily Reports", icon: Megaphone, path: "/daily-reports", roles: ["ADMIN", "HR", "EA", "MANAGER"] },
  { id: "reports-overview", label: "Reports", icon: BarChart2, path: "/reports/overview", roles: ["ADMIN", "HR"] },
  { id: "complete-details", label: "Complete Details", icon: Layers, path: "/admin/complete-details", roles: ["ADMIN"] },
  { id: "admin-panel", label: "Admin", icon: ShieldCheck, path: "/admin/settings", roles: ["ADMIN"] },
];

const WIDE = 260;
const COLLAPSED = 80;

export default function ProfessionalSidebar({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar") === "collapsed");

  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [assignedActionsCount, setAssignedActionsCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({ projects: 0, shoots: 0, creative: 0, editor: 0 });
  const [departmentName, setDepartmentName] = useState("");
  const [uploadPopupData, setUploadPopupData] = useState(null);
  const [projectsOpen, setProjectsOpen] = useState(() =>
    ["/marketing-projects", "/social-media-projects", "/seo-projects"].some(
      (path) => window.location.pathname.startsWith(path),
    ),
  );

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

    socketInstance.on("today-upload-popup", (data) => {
      setUploadPopupData(data);
      setUnreadCounts((prev) => ({ ...prev, projects: (prev.projects || 0) + 1 }));
      toast.info(
        <div>
          <strong>📌 Today's Upload Alert</strong><br />
          <span style={{ fontSize: 13 }}>{data.projectName} — {data.totalUploads} uploads</span>
        </div>,
        { autoClose: 6000 }
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
        if (user?.name === "shoot2" || user?.email === "shoot2@gmail.com") return setDepartmentName("video production");
        if (normalizedRole === "HR" || normalizedRole === "ADMIN") return setDepartmentName(normalizedRole);

        const assignedDepartmentId = user?.departmentId || user?.department || user?.deptId || user?.department_id;
        if (!assignedDepartmentId) return setDepartmentName("NONE");

        const res = await API.get("/api/departments");
        const departmentsList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        
        const department = departmentsList.find((d) => String(d.id || d._id) === String(typeof assignedDepartmentId === "object" ? (assignedDepartmentId?.id || assignedDepartmentId?._id) : assignedDepartmentId));
        setDepartmentName(department?.name ? department.name.trim().toLowerCase() : "UNKNOWN");
      } catch (err) {
        setDepartmentName("ERROR");
      }
    };
    checkUserDepartment();
  }, [role, user]);

  useEffect(() => {
    if (role !== "EMPLOYEE" && role !== "MANAGER" && role !== "HR") return;
    if (!user?.id) return;

    const fetchAssignedActionsCount = async () => {
      try {
        const res = await API.get(`/api/coordinator-assignments/assigned-to/${user.id}`);
        const assignments = res?.data?.data?.data || [];
        setAssignedActionsCount(assignments.filter((item) => item.status === "ASSIGNED").length);
      } catch (error) { console.log(error); }
    };

    fetchAssignedActionsCount();
    const interval = setInterval(fetchAssignedActionsCount, 3000);
    return () => clearInterval(interval);
  }, [role, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchUnreads = async () => {
      try {
        const res = await API.get("/api/sidebar-unread");
        if (res.data?.success) setUnreadCounts(res.data.data);
      } catch (err) { console.error("Failed to fetch sidebar unread counts:", err); }
    };

    fetchUnreads();
    const interval = setInterval(fetchUnreads, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    localStorage.setItem("sidebar", collapsed ? "collapsed" : "open");
  }, [collapsed]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "auto";
  }, [mobileOpen]);

  useEffect(() => {
    if (location.pathname !== "/projects") setProjectsOpen(true);
  }, [location.pathname]);

  const allowedNav = useMemo(() => {
    return NAV_CONFIG.filter((item) => {
      if (!item.roles.includes(role?.toUpperCase())) return false;
      if (item.departments) {
        if (user?.name === "shoot1") return true;
        return item.departments.map((d) => d.toLowerCase()).includes(departmentName?.toLowerCase());
      }
      return true;
    });
  }, [role, departmentName, user]);

  const activeId = useMemo(() => {
    const sortedRoutes = [...allowedNav].sort((a, b) => b.path.length - a.path.length);
    const matched = sortedRoutes.find((item) => {
      if (item.path === "/dashboard") return location.pathname === "/dashboard";
      return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
    });
    if (matched) return matched.id;

    const projectItem = allowedNav.find((item) => item.id === "project");
    const activeProject = projectItem?.children?.find(
      (child) => location.pathname === child.path || location.pathname.startsWith(`${child.path}/`),
    );
    if (activeProject) return activeProject.id;

    return matched?.id || null;
  }, [location.pathname, allowedNav]);

  const handleNavClick = (item) => {
    navigate(item.path);
    setMobileOpen(false);

    let menuIdToReset = null;
    if ((item.id === "project" || item.id === "tasks-emp") && unreadCounts.projects > 0) {
      setUnreadCounts(prev => ({ ...prev, projects: 0 }));
      menuIdToReset = "projects";
    } else if (item.id === "shoots" && unreadCounts.shoots > 0) {
      setUnreadCounts(prev => ({ ...prev, shoots: 0 }));
      menuIdToReset = "shoots";
    } else if (item.id === "editor" && (unreadCounts.creative > 0 || unreadCounts.editor > 0)) {
      setUnreadCounts(prev => ({ ...prev, creative: 0, editor: 0 }));
      API.post("/api/sidebar-unread/reset", { menuId: "creative" }).catch(() => { });
      API.post("/api/sidebar-unread/reset", { menuId: "editor" }).catch(() => { });
    } else if (item.id === "uploads" && unreadCounts.uploads > 0) {
      setUnreadCounts(prev => ({ ...prev, uploads: 0 }));
      menuIdToReset = "projects";
    }

    if (menuIdToReset) {
      API.post("/api/sidebar-unread/reset", { menuId: menuIdToReset }).catch(console.error);
    }
  };

  // Render function returning JSX to prevent unmounting/remounting
  const renderSidebarContent = (isMobile = false) => {
    const isCollapsed = !isMobile && collapsed;
    const layoutPrefix = isMobile ? "mobile" : "desktop";

    return (
      <div className="h-full bg-[#0B0F19] text-slate-300 flex flex-col border-r border-slate-800/60 relative overflow-hidden">
        {/* Subtle glowing background orb */}
        <div className="absolute top-[-5%] left-[-10%] w-[200px] h-[200px] bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />

        {/* TOP / LOGO AREA */}
        <div className="flex items-center gap-3.5 p-5 border-b border-slate-800/60 relative z-10">
          <div className="relative shrink-0">
            <img src={MainLogo} alt="Logo" className="w-10 h-10 rounded-lg shadow-md object-cover border border-white/5" />
            <div className="absolute inset-0 rounded-lg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] pointer-events-none" />
          </div>

          {(!isCollapsed) && (
            <div className="flex flex-col overflow-hidden whitespace-nowrap animate-in fade-in duration-300">
              <p className="text-[15px] font-bold tracking-tight text-white">We-Promote</p>
              <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold mt-0.5">{role}</p>
            </div>
          )}
        </div>

        {/* NAV LINKS */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar relative z-10">
          {allowedNav.map((item) => {
            const hasChildren = item.id === "project" && item.children?.length > 0;
            const activeChild = hasChildren && item.children.some((child) => activeId === child.id);
            const active = activeId === item.id || activeChild;
            
            // Calculate Badges
            let badgeCount = 0;
            if (item.id === "assigned-actions") badgeCount = assignedActionsCount;
            if (item.id === "project" || item.id === "tasks-emp") badgeCount = unreadCounts.projects;
            if (item.id === "shoots") badgeCount = unreadCounts.shoots;
            if (item.id === "editor") badgeCount = unreadCounts.creative + unreadCounts.editor;
            const isUploadBadge = item.id === "uploads" && unreadCounts.projects > 0;

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (hasChildren && !isCollapsed) {
                      setProjectsOpen((open) => !open);
                    } else {
                      handleNavClick(item);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 relative group outline-none ${
                  active ? "text-indigo-50" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId={`${layoutPrefix}-active-bg`}
                      className="absolute inset-0 bg-indigo-600/15 border border-indigo-500/20 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  <div className="flex items-center gap-3.5 relative z-10">
                    <div className="relative shrink-0 flex items-center justify-center">
                      <item.icon size={18} strokeWidth={active ? 2.5 : 2} className={`transition-colors ${active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-400"}`} />
                    
                    {/* Collapsed mode indicator dot */}
                    {isCollapsed && (badgeCount > 0 || isUploadBadge) && (
                      <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#0B0F19] block ${isUploadBadge ? 'bg-purple-500' : 'bg-red-500'}`} />
                    )}
                    </div>

                    {(!isCollapsed) && (
                      <span className={`text-[13px] whitespace-nowrap transition-all ${active ? "font-semibold" : "font-medium"}`}>
                        {item.label}
                      </span>
                    )}
                  </div>

                {/* Expanded mode badges */}
                  {(!isCollapsed) && (
                    <div className="relative z-10 flex items-center gap-2">
                      {badgeCount > 0 && (
                      <span className="min-w-[22px] h-[22px] px-1.5 rounded-md bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow-sm">
                        {badgeCount}
                      </span>
                    )}
                      {isUploadBadge && (
                      <span className="min-w-[22px] h-[22px] px-1.5 rounded-md bg-purple-500 text-white text-[10px] flex items-center justify-center font-bold shadow-sm">
                        NEW
                      </span>
                      )}
                      {hasChildren && (
                        <ChevronDown size={15} className={`transition-transform ${projectsOpen ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  )}
                </button>

                {hasChildren && !isCollapsed && projectsOpen && (
                  <div className="ml-5 mt-1 space-y-1 border-l border-slate-700/70 pl-3">
                    {item.children.map((child) => {
                      const childActive = activeId === child.id;
                      return (
                        <button
                          key={child.id}
                          onClick={() => handleNavClick(child)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${childActive ? "bg-indigo-600/15 text-indigo-200 font-semibold" : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-200"}`}
                        >
                          <child.icon size={14} className={childActive ? "text-indigo-400" : "text-slate-600"} />
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-800/60 relative z-10">
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors group outline-none"
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            {(!isCollapsed) && (
              <span className="text-[13px] font-medium whitespace-nowrap">Logout</span>
            )}
          </button>
        </div>

        {/* TOGGLE BUTTON */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="absolute top-8 -right-3.5 w-7 h-7 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg flex items-center justify-center border-[3px] border-[#0B0F19] z-50 transition-transform active:scale-95"
          >
            {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:block h-screen sticky top-0 shrink-0 z-40">
        <motion.div
          initial={false}
          animate={{ width: collapsed ? COLLAPSED : WIDE }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          className="h-full"
        >
          {renderSidebarContent(false)}
        </motion.div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-5 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <img src={MainLogo} className="w-8 h-8 rounded-md shadow-sm border border-slate-100 object-cover" alt="Logo" />
          <span className="text-[15px] font-bold tracking-tight text-slate-900">We-Promote</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -mr-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors outline-none"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* MOBILE SIDEBAR DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="absolute left-0 top-0 h-full w-[280px] shadow-2xl"
            >
              {renderSidebarContent(true)}
            </motion.div>
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md outline-none"
            >
              <X size={20} />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="flex-1 pt-16 lg:pt-0 relative w-full overflow-hidden">
        {children}
      </main>

      {/* GLOBAL POPUP */}
      <TodayUploadPopup data={uploadPopupData} onClose={() => setUploadPopupData(null)} />
    </div>
  );
}
