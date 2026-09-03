import { useState, useEffect, useMemo, useRef } from "react";
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
  Code2,
  Database,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import API, { API_URL } from "../services/api";
import MainLogo from "../assets/logo.jpeg";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import TodayUploadPopup from "./TodayUploadPopup";
import { refreshEmployeeLogoutStatus } from "../utils/employeeLogoutStatus";

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
      { id: "web-development-projects", label: "Web Development", icon: Code2, path: "/web-development-projects" },
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
  { id: "marketing-monthly-reports", label: "Meeta Ads Calander", icon: BarChart2, path: "/marketing-monthly-reports", roles: ["ADMIN", "HR"] },
  { id: "daily-reports", label: "Daily Reports", icon: Megaphone, path: "/daily-reports", roles: ["ADMIN", "HR", "EA", "MANAGER"] },
  { id: "data", label: "Data", icon: Database, path: "/data", roles: ["ADMIN", "HR", "EA"] },
  { id: "reports-overview", label: "Reports", icon: BarChart2, path: "/reports/overview", roles: ["ADMIN", "HR"] },
  { id: "complete-details", label: "Complete Details", icon: Layers, path: "/admin/complete-details", roles: ["ADMIN"] },
  { id: "admin-panel", label: "Admin", icon: ShieldCheck, path: "/admin/settings", roles: ["ADMIN"] },
];

const WIDE = 260;
const COLLAPSED = 80;

const getDepartmentBadgeKey = (data) => {
  const department = String(
    data?.departmentName || data?.department?.name || data?.department || data?.projectDepartment || "",
  ).toLowerCase();
  if (department.includes("social")) return "socialMedia";
  if (department.includes("seo")) return "seo";
  if (department.includes("web") || department.includes("development") || department === "it") return "webDevelopment";
  if (department.includes("marketing") || department.includes("meta")) return "marketing";
  return null;
};

export default function ProfessionalSidebar({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar") === "collapsed");

  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutModal, setLogoutModal] = useState(null);
  const [assignedActionsCount, setAssignedActionsCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({ projects: 0, shoots: 0, creative: 0, editor: 0 });
  const [departmentUnreadCounts, setDepartmentUnreadCounts] = useState({
    marketing: 0,
    socialMedia: 0,
    seo: 0,
    webDevelopment: 0,
  });
  const [departmentName, setDepartmentName] = useState("");
  const [uploadPopupData, setUploadPopupData] = useState(null);
  const knownProjectIds = useRef(null);
  const knownMetaAdsTaskIds = useRef(null);
  const [projectsOpen, setProjectsOpen] = useState(() =>
    ["/marketing-projects", "/social-media-projects", "/seo-projects", "/web-development-projects", "/projects"].some(
      (path) => window.location.pathname.startsWith(path),
    ),
  );

  const handleLogoutClick = async () => {
    if (role !== "EMPLOYEE") {
      await logout();
      navigate("/login");
      return;
    }

    const result = await logout({ enforceEmployeeCheck: true });

    if (result?.allowed) {
      navigate("/login");
      return;
    }

    if (result?.error) {
      toast.error("Unable to verify logout status right now. Please try again.");
      return;
    }

    setLogoutModal({
      title: "You cannot logout yet.",
      message: "You cannot logout yet. Please submit all of today’s assigned tasks and wait for manager approval.",
      pendingTasks: result?.status?.pendingTasks || [],
    });
  };

  useEffect(() => {
    if (!user?.id) return;
    const socketInstance = io(API_URL);

    socketInstance.on("connect", () => {
      socketInstance.emit("join-user", { userId: user.id });
    });

    const recordDepartmentNotification = (data) => {
      const department = String(
        data?.departmentName || data?.department?.name || data?.department || data?.projectDepartment || "",
      ).toLowerCase();
      const badgeKey = getDepartmentBadgeKey(data);

      if (badgeKey) {
        setDepartmentUnreadCounts((prev) => ({ ...prev, [badgeKey]: prev[badgeKey] + 1 }));
      }
    };

    const handleMetaAdsAssigned = (data = {}) => {
      const task = data.task || data.metaAdsTask || data;
      const assignedToId = String(
        task.assignedToId || task.assignedTo?.id || task.assignedTo?._id || data.assignedToId || "",
      );
      const currentUserId = String(user.id || user._id || "");
      if (assignedToId && currentUserId && assignedToId !== currentUserId) return;

      const taskId = task.id || task._id;
      if (taskId && knownMetaAdsTaskIds.current?.has(String(taskId))) return;
      if (taskId) {
        const assignments = new Map(knownMetaAdsTaskIds.current || []);
        assignments.set(String(taskId), assignedToId);
        knownMetaAdsTaskIds.current = assignments;
      }
      setUnreadCounts((previous) => ({ ...previous, metaAds: (previous.metaAds || 0) + 1 }));
      setUploadPopupData({
        projectName: task.projectName || task.clientName || "Meta Ads Campaign",
        clientName: task.clientName || task.projectName,
        alertTitle: "New Meta Ads Task",
        alertMessage: "A new Meta Ads task has been assigned to you.",
        targetPath: "/marketing-projects",
      });
    };
    const metaAdsEvents = [
      "meta-ads-task-assigned",
      "meta-ads-task-assigned-popup",
      "meta-ads-assigned",
    ];
    metaAdsEvents.forEach((eventName) => socketInstance.on(eventName, handleMetaAdsAssigned));

    socketInstance.on("task-submitted-popup", (data) => {
      recordDepartmentNotification(data);
      setUnreadCounts((prev) => ({ ...prev, projects: (prev.projects || 0) + 1 }));
      toast.info(`New Task Submission on Project: ${data.projectName} by ${data.employeeName}`);
      setUploadPopupData({
        ...data,
        alertTitle: "Task Submission",
        alertMessage: `${data.employeeName || "An employee"} submitted a task`,
        targetPath: data.projectId ? `/project/${data.projectId}` : "/projects",
      });
    });

    socketInstance.on("task-rejected-popup", (data) => {
      recordDepartmentNotification(data);
      setUnreadCounts((prev) => ({ ...prev, projects: (prev.projects || 0) + 1 }));
      toast.error(
        <div>
          <strong>Task Rejected!</strong><br />
          Project: {data.projectName}<br />
          Task: {data.taskTitle}<br />
          Reason: {data.reason}
        </div>,
        { autoClose: false }
      );
      setUploadPopupData({
        ...data,
        alertTitle: "Task Rejected",
        alertMessage: data.reason || "A task was rejected",
        targetPath: data.projectId ? `/project/${data.projectId}` : "/projects",
      });
    });

    socketInstance.on("task-resubmitted-popup", (data) => {
      recordDepartmentNotification(data);
      setUnreadCounts((prev) => ({ ...prev, projects: (prev.projects || 0) + 1 }));
      toast.info(
        <div>
          <strong>Task Resubmitted!</strong><br />
          Project: {data.projectName}<br />
          Task: {data.taskTitle}<br />
          By: {data.employeeName}
        </div>,
        { autoClose: false }
      );
      setUploadPopupData({
        ...data,
        alertTitle: "Task Resubmitted",
        alertMessage: `${data.employeeName || "An employee"} resubmitted a task`,
        targetPath: data.projectId ? `/project/${data.projectId}` : "/projects",
      });
    });

    const handleTaskApproved = async (data) => {
      recordDepartmentNotification(data);
      setUnreadCounts((prev) => ({ ...prev, projects: (prev.projects || 0) + 1 }));
      setUploadPopupData({
        ...data,
        alertTitle: "Task Approved",
        alertMessage: data.message || "A task was approved",
        targetPath: data.projectId ? `/project/${data.projectId}` : "/projects",
      });

      if (role === "EMPLOYEE") {
        await refreshEmployeeLogoutStatus();
      }
    };
    ["task-approved-popup", "task-verified-popup", "task-submission-approved-popup"].forEach((eventName) => {
      socketInstance.on(eventName, handleTaskApproved);
    });

    socketInstance.on("today-upload-popup", (data) => {
      recordDepartmentNotification(data);
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
      metaAdsEvents.forEach((eventName) => socketInstance.off(eventName, handleMetaAdsAssigned));
      ["task-approved-popup", "task-verified-popup", "task-submission-approved-popup"].forEach((eventName) => {
        socketInstance.off(eventName, handleTaskApproved);
      });
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
        const [res, projectsRes] = await Promise.all([
          API.get("/api/sidebar-unread"),
          API.get("/api/projects"),
        ]);
        if (res.data?.success) {
          setUnreadCounts((previous) => ({
            ...res.data.data,
            metaAds: previous.metaAds || 0,
          }));
        }

        const projects = projectsRes.data?.data || [];
        const projectIds = new Set(projects.map((project) => project.id));
        if (knownProjectIds.current) {
          const newProjects = projects.filter((project) => !knownProjectIds.current.has(project.id));
          newProjects.forEach((project) => {
            const badgeKey = getDepartmentBadgeKey(project);
            if (badgeKey) {
              setDepartmentUnreadCounts((prev) => ({ ...prev, [badgeKey]: prev[badgeKey] + 1 }));
              setUploadPopupData({
                projectName: project.projectName,
                projectId: project.id,
                departmentName: project.department?.name,
                clientName: project.clientName,
                alertTitle: "New Project",
                alertMessage: `${project.department?.name || "Department"} project added`,
                targetPath: `/project/${project.id}`,
              });
            }
          });
        }
        knownProjectIds.current = projectIds;
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

    return null;
  }, [location.pathname, allowedNav]);

  const handleNavClick = (item) => {
    navigate(item.path);
    setMobileOpen(false);

    const departmentBadgeKey = {
      "marketing-projects": "marketing",
      "social-media-projects": "socialMedia",
      "seo-projects": "seo",
      "web-development-projects": "webDevelopment",
    }[item.id];
    if (departmentBadgeKey) {
      setDepartmentUnreadCounts((prev) => ({ ...prev, [departmentBadgeKey]: 0 }));
    }
    if (item.id === "meta-ads-tasks") {
      setUnreadCounts((prev) => ({ ...prev, metaAds: 0 }));
    }

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

  const renderSidebarContent = (isMobile = false) => {
    const isCollapsed = !isMobile && collapsed;
    const layoutPrefix = isMobile ? "mobile" : "desktop";

    return (
      <div className="h-full bg-[#090C15] text-slate-300 flex flex-col border-r border-slate-800/60 relative overflow-hidden">
        {/* Subtle glowing background orb */}
        <div className="absolute top-0 left-0 w-full h-[250px] bg-indigo-600/5 rounded-b-[100%] blur-[60px] pointer-events-none" />

        {/* TOP / LOGO AREA */}
        <div className="flex items-center gap-3.5 p-5 border-b border-slate-800/40 relative z-10 mb-2">
          <div className="relative shrink-0">
            <img src={MainLogo} alt="Logo" className="w-10 h-10 rounded-[10px] shadow-sm object-cover border border-white/10" />
            <div className="absolute inset-0 rounded-[10px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] pointer-events-none" />
          </div>

          {(!isCollapsed) && (
            <div className="flex flex-col overflow-hidden whitespace-nowrap animate-in fade-in duration-300">
              <p className="text-[15px] font-bold tracking-tight text-slate-100">We-Promote</p>
              <p className="text-[10px] uppercase tracking-[0.1em] text-indigo-400 font-semibold mt-0.5">{role}</p>
            </div>
          )}
        </div>

        {/* NAV LINKS - Hidden native scrollbar but scrollable */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {allowedNav.map((item) => {
            const hasChildren = item.id === "project" && item.children?.length > 0;
            const activeChild = hasChildren && item.children.some((child) => activeId === child.id);
            const active = activeId === item.id || activeChild;
            
            let badgeCount = 0;
            if (item.id === "assigned-actions") badgeCount = assignedActionsCount;
            if (item.id === "project" || item.id === "tasks-emp") badgeCount = unreadCounts.projects;
            if (item.id === "shoots") badgeCount = unreadCounts.shoots;
            if (item.id === "editor") badgeCount = unreadCounts.creative + unreadCounts.editor;
            if (item.id === "meta-ads-tasks") badgeCount = unreadCounts.metaAds || 0;
            const isUploadBadge = item.id === "uploads" && unreadCounts.projects > 0;

            return (
              <div key={item.id} className="flex flex-col">
                <button
                  onClick={() => {
                    if (hasChildren && !isCollapsed) {
                      setProjectsOpen((open) => !open);
                    } else {
                      handleNavClick(item);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 relative group outline-none ${
                    active ? "text-indigo-50" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId={`${layoutPrefix}-active-bg`}
                      className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  <div className="flex items-center gap-3.5 relative z-10">
                    <div className="relative shrink-0 flex items-center justify-center">
                      <item.icon size={18} strokeWidth={active ? 2.5 : 2} className={`transition-colors ${active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                      {isCollapsed && (badgeCount > 0 || isUploadBadge) && (
                        <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#090C15] block ${isUploadBadge ? 'bg-purple-500' : 'bg-red-500'}`} />
                      )}
                    </div>

                    {(!isCollapsed) && (
                      <span className={`text-[13px] whitespace-nowrap transition-all ${active ? "font-semibold text-white" : "font-medium"}`}>
                        {item.label}
                      </span>
                    )}
                  </div>

                  {(!isCollapsed) && (
                    <div className="relative z-10 flex items-center gap-2">
                      {badgeCount > 0 && (
                        <span className="min-w-[20px] h-[20px] px-1.5 rounded-md bg-red-500/90 text-white text-[10px] flex items-center justify-center font-bold shadow-sm">
                          {badgeCount}
                        </span>
                      )}
                      {isUploadBadge && (
                        <span className="min-w-[22px] h-[20px] px-1.5 rounded-md bg-purple-500/90 text-white text-[10px] flex items-center justify-center font-bold shadow-sm">
                          NEW
                        </span>
                      )}
                      {hasChildren && (
                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${projectsOpen ? "rotate-180" : ""}`} />
                      )}
                    </div>
                  )}
                </button>

                {/* ANIMATED NESTED MENU */}
                <AnimatePresence>
                  {hasChildren && !isCollapsed && projectsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-[22px] mt-1 mb-1 space-y-0.5 border-l border-slate-700/50 pl-2">
                        {item.children.map((child) => {
                          const childActive = activeId === child.id;
                          const childBadgeCount = child.id === "meta-ads-tasks"
                            ? unreadCounts.metaAds || 0
                            : departmentUnreadCounts[
                              {
                                "marketing-projects": "marketing",
                                "social-media-projects": "socialMedia",
                                "seo-projects": "seo",
                                "web-development-projects": "webDevelopment",
                              }[child.id]
                            ] || 0;
                          return (
                            <button
                              key={child.id}
                              onClick={() => handleNavClick(child)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[12px] transition-colors outline-none ${
                                childActive 
                                  ? "bg-indigo-500/10 text-indigo-300 font-semibold" 
                                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                              }`}
                            >
                              <child.icon size={14} strokeWidth={childActive ? 2.5 : 2} className={childActive ? "text-indigo-400" : "text-slate-500"} />
                              {child.label}
                              {childBadgeCount > 0 && (
                                <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                                  {childBadgeCount > 99 ? "99+" : childBadgeCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-800/40 relative z-10 bg-[#090C15]">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors group outline-none"
          >
            <LogOut size={18} strokeWidth={2} className="group-hover:scale-110 transition-transform" />
            {(!isCollapsed) && (
              <span className="text-[13px] font-medium whitespace-nowrap">Logout</span>
            )}
          </button>
        </div>

        <AnimatePresence>
          {logoutModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <LogOut size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900">{logoutModal.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{logoutModal.message}</p>
                  </div>
                </div>

                {logoutModal.pendingTasks?.length > 0 && (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Pending tasks
                    </p>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {logoutModal.pendingTasks.map((task, index) => (
                        <div key={`${task.assignmentId || task.taskItemId || index}`} className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-800">{task.title || "Untitled task"}</p>
                              <p className="text-sm text-slate-500">{task.projectName || "Unknown project"}</p>
                            </div>
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                              {task.status || "PENDING"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setLogoutModal(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLogoutModal(null);
                      navigate("/projects");
                    }}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    View Tasks
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
          className="h-full relative shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
        >
          {renderSidebarContent(false)}
          
          {/* TOGGLE BUTTON */}
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="absolute top-7 -right-3.5 w-7 h-7 bg-white hover:bg-slate-50 text-slate-700 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center justify-center border border-slate-200 z-[100] transition-all hover:scale-110 active:scale-95 outline-none"
          >
            {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
          </button>
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
