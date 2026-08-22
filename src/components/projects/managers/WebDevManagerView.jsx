import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../../services/api";
import {
  Globe,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Mail,
  FileText,
  Save,
  Edit3,
  Check,
  X,
  Plus,
  ChevronRight,
  Calendar,
  Briefcase,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  Code2,
  ClipboardList,
  ExternalLink,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  RefreshCw,
  Trash2,
} from "lucide-react";

// ──────────────────────────────────────────────
// Helper: format date string nicely
// ──────────────────────────────────────────────
const fmt = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const WEB_DEV_DEPT_NAMES = [
  "Web Development",
  "Web Development Department",
  "IT",
];

// ──────────────────────────────────────────────
// STATUS STYLES
// ──────────────────────────────────────────────
const taskStatusStyle = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  ASSIGNED: "bg-indigo-50 text-indigo-600 border-indigo-200",
  IN_PROGRESS: "bg-blue-50 text-blue-600 border-blue-200",
  SUBMITTED: "bg-amber-50 text-amber-600 border-amber-200",
  VERIFIED: "bg-emerald-50 text-emerald-600 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-600 border-rose-200",
  COMPLETED: "bg-teal-50 text-teal-600 border-teal-200",
};

// ──────────────────────────────────────────────
// FIELD ROW: for read-only display of a credential
// ──────────────────────────────────────────────
const CredentialRow = ({ label, value, icon: Icon, secret = false }) => {
  const [show, setShow] = useState(false);
  const display = value || "—";
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 gap-4">
      <div className="flex items-center gap-2 min-w-[160px]">
        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span className={`text-sm font-semibold text-slate-800 text-right break-all ${!value ? "text-slate-400 italic" : ""}`}>
          {secret && !show ? (value ? "••••••••" : "—") : display}
        </span>
        {secret && value && (
          <button
            onClick={() => setShow((s) => !s)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition shrink-0"
          >
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// FORM INPUT
// ──────────────────────────────────────────────
const FormInput = ({ label, name, value, onChange, type = "text", placeholder, secret = false, required = false }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={secret && !show ? "password" : type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
        />
        {secret && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────
const WebDevManagerView = ({ projectId }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  // Employees for task item assignment
  const [employees, setEmployees] = useState([]);

  // Task creation form
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM",
    employeeId: "",
  });
  const [taskError, setTaskError] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  // Credentials form
  const [credForm, setCredForm] = useState({
    clientName: "",
    phone: "",
    domainName: "",
    domainPassword: "",
    clientEmail: "",
    clientEmailPassword: "",
    requirements: "",
  });

  // Task Items State
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [taskItems, setTaskItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingAssignmentId, setRejectingAssignmentId] = useState(null);

  // Daily Reports State
  const [dailyReports, setDailyReports] = useState([]);
  const [loadingDailyReports, setLoadingDailyReports] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // ────────────── FETCH PROJECT ──────────────
  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get(`/api/projects/${projectId}`);
      if (res?.data?.success) {
        const p = res.data.data;
        setProject(p);
        setCredForm({
          clientName: p.clientName || "",
          phone: p.phone || "",
          domainName: p.domainName || "",
          domainPassword: p.domainPassword || "",
          clientEmail: p.clientEmail || "",
          clientEmailPassword: p.clientEmailPassword || "",
          requirements: p.requirements || "",
        });
      } else {
        setError("Failed to load project.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // ────────────── FETCH TASKS UNDER THIS PROJECT ──────────────
  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      const res = await API.get("/api/manager/tasks");
      if (res?.data?.data) {
        // Filter tasks linked to this project
        const linked = res.data.data.filter(
          (t) => t.projectId === projectId || t.projectName === project?.projectName
        );
        setTasks(linked);
      }
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setTasksLoading(false);
    }
  };

  // ────────────── FETCH EMPLOYEES ──────────────
  const fetchEmployees = async () => {
    try {
      const res = await API.get("/api/manager/employees");
      setEmployees(res?.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
  };

  // ────────────── FETCH DAILY REPORTS ──────────────
  const fetchDailyReports = async () => {
    try {
      setLoadingDailyReports(true);
      const res = await API.get(`/api/project-reports/${projectId}`);
      setDailyReports(res?.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch daily reports", err);
    } finally {
      setLoadingDailyReports(false);
    }
  };

  // ────────────── UPDATE STATUS ──────────────
  const handleUpdateStatus = async (newStatus) => {
    try {
      setStatusUpdating(true);
      await API.patch(`/api/projects/${projectId}`, { status: newStatus });
      await fetchProject();
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchEmployees();
      fetchDailyReports();
    }
  }, [projectId]);

  useEffect(() => {
    if (project) fetchTasks();
  }, [project]);

  // ────────────── SAVE CREDENTIALS ──────────────
  const handleSaveCredentials = async () => {
    try {
      setSaving(true);
      await API.patch(`/api/projects/${projectId}`, credForm);
      await fetchProject();
      setIsEditingCredentials(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save credentials.");
    } finally {
      setSaving(false);
    }
  };

  const handleCredChange = (e) => {
    const { name, value } = e.target;
    setCredForm((prev) => ({ ...prev, [name]: value }));
  };

  // ────────────── CREATE TASK ITEM ──────────────
  const handleCreateTaskItem = async () => {
    if (!taskForm.title.trim()) {
      setTaskError("Task title is required.");
      return;
    }
    if (!taskForm.employeeId) {
      setTaskError("Please select an employee.");
      return;
    }
    if (!taskForm.dueDate) {
      setTaskError("Due date is required.");
      return;
    }

    try {
      setCreatingTask(true);
      setTaskError("");

      // Step 1: Create the main task linked to this project
      const taskRes = await API.post("/api/manager/tasks", {
        projectName: project.projectName,
        description: taskForm.description || null,
        startDate: project.startDate,
        endDate: taskForm.dueDate,
        projectId: projectId,
      });

      const createdTaskId = taskRes?.data?.data?.id;
      if (!createdTaskId) throw new Error("Task creation failed.");

      // Step 2: Self-assign the task to this manager
      const managerEmpId = localStorage.getItem("employeeId") ||
        sessionStorage.getItem("employeeId");

      // Step 3: Create a task item and assign to employee
      await API.post(`/api/task-items/${createdTaskId}`, {
        title: taskForm.title,
        description: taskForm.description || null,
        dueDate: taskForm.dueDate,
        priority: taskForm.priority,
        employeeId: taskForm.employeeId,
      });

      // Reset form
      setTaskForm({ title: "", description: "", dueDate: "", priority: "MEDIUM", employeeId: "" });
      setShowCreateTask(false);
      fetchTasks();
    } catch (err) {
      setTaskError(err?.response?.data?.message || "Failed to create task.");
    } finally {
      setCreatingTask(false);
    }
  };

  const toggleTaskExpansion = async (taskId) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
      return;
    }
    setExpandedTaskId(taskId);
    setLoadingItems(true);
    try {
      // The task object we have from /api/manager/tasks is a TaskAssignment
      // We need to fetch items using the task.task.id or task.taskId
      const res = await API.get(`/api/task-items/${taskId}`);
      setTaskItems(res?.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleVerifySubmission = async (assignmentId) => {
    try {
      await API.patch(`/api/task-item-submission/${assignmentId}/verify`);
      // Refresh items and tasks
      toggleTaskExpansion(expandedTaskId); 
      toggleTaskExpansion(expandedTaskId); // quick re-toggle to fetch
      fetchTasks();
    } catch (err) {
      alert("Failed to verify submission");
    }
  };

  const handleRejectSubmission = async (assignmentId) => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    try {
      await API.patch(`/api/task-item-submission/${assignmentId}/reject`, { rejectionReason: rejectReason });
      setRejectingAssignmentId(null);
      setRejectReason("");
      // Refresh items and tasks
      toggleTaskExpansion(expandedTaskId);
      toggleTaskExpansion(expandedTaskId);
      fetchTasks();
    } catch (err) {
      alert("Failed to reject submission");
    }
  };


  // ────────────── LOADING / ERROR STATES ──────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-sm text-slate-500 font-medium">Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center p-8">
        <AlertCircle className="w-12 h-12 text-rose-400" />
        <h3 className="text-lg font-bold text-slate-800">Error loading project</h3>
        <p className="text-sm text-slate-500 max-w-sm">{error}</p>
        <button onClick={fetchProject} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition mt-2">Retry</button>
      </div>
    );
  }

  const isWebDev = project?.department?.name && WEB_DEV_DEPT_NAMES.some(
    (n) => project.department.name.toLowerCase().includes(n.toLowerCase().split(" ")[0])
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[50%] h-[50%] bg-violet-500/5 rounded-full blur-[150px] pointer-events-none" />

      <style>{`
        .webdev-scrollbar::-webkit-scrollbar { width: 5px; }
        .webdev-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .webdev-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 9999px; }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Code2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 block mb-0.5">
                Web Development • Project Workspace
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {project?.projectName}
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                {project?.department?.name} Department
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-sm relative">
              <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
              <select
                value={project?.status || "ONGOING"}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                disabled={statusUpdating}
                className={`text-xs font-black uppercase tracking-wider bg-transparent outline-none cursor-pointer ${
                  project?.status === "VERIFIED" ? "text-emerald-600" :
                  project?.status === "SUBMITTED" ? "text-amber-600" : "text-indigo-600"
                }`}
              >
                <option value="ONGOING">ONGOING</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="VERIFIED">VERIFIED</option>
              </select>
              {statusUpdating && <Loader2 className="w-3 h-3 animate-spin text-slate-400 absolute right-1 top-2" />}
            </div>

            <button
              onClick={() => setShowCreateTask((s) => !s)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-200/70 transition-all"
            >
              <Plus className="w-4 h-4" />
              Assign Task to Employee
            </button>
          </div>
        </motion.div>

        {/* ── DATE BADGES ── */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200/60 shadow-sm text-sm font-semibold text-slate-600">
            <Calendar className="w-4 h-4 text-indigo-400" />
            Start: {fmt(project?.startDate)}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200/60 shadow-sm text-sm font-semibold text-slate-600">
            <Calendar className="w-4 h-4 text-rose-400" />
            End: {fmt(project?.endDate)}
          </div>
          {project?.description && (
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm text-sm font-semibold text-indigo-700 max-w-sm truncate">
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">{project.description}</span>
            </div>
          )}
        </div>

        {/* ── CREDENTIAL SECTION ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Lock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Client Credentials</h2>
                <p className="text-xs text-slate-500 font-medium">Domain access, client contact & project requirements</p>
              </div>
            </div>
            {!isEditingCredentials ? (
              <button
                onClick={() => setIsEditingCredentials(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-sm font-bold transition-all border border-slate-200"
              >
                <Edit3 className="w-4 h-4" /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setIsEditingCredentials(false); setCredForm({ clientName: project?.clientName || "", phone: project?.phone || "", domainName: project?.domainName || "", domainPassword: project?.domainPassword || "", clientEmail: project?.clientEmail || "", clientEmailPassword: project?.clientEmailPassword || "", requirements: project?.requirements || "" }); }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={handleSaveCredentials}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          {isEditingCredentials ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput label="Client Name" name="clientName" value={credForm.clientName} onChange={handleCredChange} placeholder="e.g. Acme Corp" />
              <FormInput label="Client Phone" name="phone" value={credForm.phone} onChange={handleCredChange} placeholder="+91 98765 43210" />
              <FormInput label="Domain Name" name="domainName" value={credForm.domainName} onChange={handleCredChange} placeholder="e.g. https://client.com" />
              <FormInput label="Domain Password" name="domainPassword" value={credForm.domainPassword} onChange={handleCredChange} placeholder="Domain/cPanel password" secret />
              <FormInput label="Client Email (optional)" name="clientEmail" value={credForm.clientEmail} onChange={handleCredChange} type="email" placeholder="client@gmail.com" />
              <FormInput label="Client Email Password (optional)" name="clientEmailPassword" value={credForm.clientEmailPassword} onChange={handleCredChange} secret placeholder="Email account password" />
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Requirements & References</label>
                <textarea
                  name="requirements"
                  value={credForm.requirements}
                  onChange={handleCredChange}
                  rows={5}
                  placeholder="Describe project requirements, paste reference URLs, or add notes here..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                <div className="md:pr-6 md:border-r border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Client Info
                  </h3>
                  <CredentialRow label="Client Name" value={project?.clientName} icon={User} />
                  <CredentialRow label="Phone" value={project?.phone} icon={Phone} />
                  <CredentialRow label="Client Email" value={project?.clientEmail} icon={Mail} />
                  <CredentialRow label="Email Password" value={project?.clientEmailPassword} icon={Lock} secret />
                </div>
                <div className="mt-6 md:mt-0 md:pl-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Domain Access
                  </h3>
                  <CredentialRow label="Domain" value={project?.domainName} icon={Globe} />
                  <CredentialRow label="Domain Password" value={project?.domainPassword} icon={Lock} secret />
                </div>
              </div>

              {/* Requirements */}
              {project?.requirements && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <ClipboardList className="w-3.5 h-3.5" /> Requirements & References
                  </h3>
                  <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                    {project.requirements.split(/\s+/).map((word, i) => {
                      if (word.startsWith("http://") || word.startsWith("https://")) {
                        return (
                          <React.Fragment key={i}>
                            <a href={word} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 inline-flex items-center gap-1 transition">
                              {word} <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>{" "}
                          </React.Fragment>
                        );
                      }
                      return word + " ";
                    })}
                  </div>
                </div>
              )}

              {!project?.clientName && !project?.domainName && !project?.requirements && (
                <div className="text-center py-8">
                  <Lock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-medium">No credentials added yet.</p>
                  <button
                    onClick={() => setIsEditingCredentials(true)}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-bold hover:bg-indigo-100 transition"
                  >
                    <Plus className="w-4 h-4" /> Add Credentials
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ── CREATE TASK PANEL ── */}
        <AnimatePresence>
          {showCreateTask && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="bg-white rounded-3xl border border-indigo-200 shadow-lg shadow-indigo-100/50 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-indigo-100 bg-indigo-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">Assign Task to Employee</h2>
                    <p className="text-xs text-slate-500 font-medium">Create a task item linked to this project</p>
                  </div>
                </div>
                <button onClick={() => { setShowCreateTask(false); setTaskError(""); }} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition">
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <FormInput label="Task Title" name="title" value={taskForm.title} onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Build Contact Us Page" required />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Description / Instructions</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    placeholder="Describe what the employee needs to do..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setTaskForm((p) => ({ ...p, dueDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm((p) => ({ ...p, priority: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  >
                    <option value="LOW">🟢 Low</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="HIGH">🔴 High</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                    Assign To Employee <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={taskForm.employeeId}
                    onChange={(e) => setTaskForm((p) => ({ ...p, employeeId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.name} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project credentials preview panel */}
                {(project?.clientName || project?.domainName || project?.requirements) && (
                  <div className="md:col-span-2 bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 flex items-center gap-2 mb-3">
                      <LinkIcon className="w-3.5 h-3.5" /> Project Credentials (visible to employee)
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {project.clientName && <div className="bg-white rounded-xl px-3 py-2 border border-indigo-100"><span className="text-slate-400 block font-bold uppercase tracking-widest text-[10px] mb-0.5">Client</span><span className="font-semibold text-slate-700">{project.clientName}</span></div>}
                      {project.phone && <div className="bg-white rounded-xl px-3 py-2 border border-indigo-100"><span className="text-slate-400 block font-bold uppercase tracking-widest text-[10px] mb-0.5">Phone</span><span className="font-semibold text-slate-700">{project.phone}</span></div>}
                      {project.domainName && <div className="bg-white rounded-xl px-3 py-2 border border-indigo-100"><span className="text-slate-400 block font-bold uppercase tracking-widest text-[10px] mb-0.5">Domain</span><span className="font-semibold text-slate-700 truncate block">{project.domainName}</span></div>}
                      {project.startDate && <div className="bg-white rounded-xl px-3 py-2 border border-indigo-100"><span className="text-slate-400 block font-bold uppercase tracking-widest text-[10px] mb-0.5">Project Start</span><span className="font-semibold text-slate-700">{fmt(project.startDate)}</span></div>}
                      {project.endDate && <div className="bg-white rounded-xl px-3 py-2 border border-indigo-100"><span className="text-slate-400 block font-bold uppercase tracking-widest text-[10px] mb-0.5">Project End</span><span className="font-semibold text-slate-700">{fmt(project.endDate)}</span></div>}
                    </div>
                    {project.requirements && (
                      <div className="mt-3 bg-white rounded-xl px-3 py-2 border border-indigo-100">
                        <span className="text-slate-400 block font-bold uppercase tracking-widest text-[10px] mb-0.5">Requirements</span>
                        <p className="text-xs font-medium text-slate-600 line-clamp-2">{project.requirements}</p>
                      </div>
                    )}
                  </div>
                )}

                {taskError && (
                  <div className="md:col-span-2 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm font-medium text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {taskError}
                  </div>
                )}

                <div className="md:col-span-2 flex justify-end gap-3">
                  <button onClick={() => { setShowCreateTask(false); setTaskError(""); }} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition">Cancel</button>
                  <button
                    onClick={handleCreateTaskItem}
                    disabled={creatingTask}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-60 shadow-sm"
                  >
                    {creatingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {creatingTask ? "Creating..." : "Assign Task"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── DAILY REPORTS ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Employee Daily Reports</h2>
                <p className="text-xs text-slate-500 font-medium">Updates submitted for this project</p>
              </div>
            </div>
            {loadingDailyReports && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
          </div>

          <div className="p-6">
            {!loadingDailyReports && dailyReports.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No daily reports submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 webdev-scrollbar">
                {dailyReports.map((report) => (
                  <div key={report.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-sm text-slate-800">
                        {report.employee?.name || "Unknown"} <span className="text-xs font-medium text-slate-500 ml-1">({report.employee?.role})</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                        {new Date(report.date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {report.content}
                    </p>
                    {(report.lastWorking || report.lastDiscussion || report.nextStep || report.blockers || report.taskProgress != null) && (
                      <div className="mt-4 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                        {report.lastWorking && <div><strong>Last Working:</strong> {report.lastWorking}</div>}
                        {report.lastDiscussion && <div><strong>Last Discussion:</strong> {report.lastDiscussion}</div>}
                        {report.nextStep && <div><strong>Next Step:</strong> {report.nextStep}</div>}
                        {report.blockers && <div className="text-amber-700"><strong>⚠ Blockers:</strong> {report.blockers}</div>}
                        {report.taskProgress != null && <div className="font-bold text-indigo-600">Progress: {report.taskProgress}%</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── TASKS LIST ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Active Tasks</h2>
                <p className="text-xs text-slate-500 font-medium">Tasks created under this project</p>
              </div>
            </div>
            <button onClick={fetchTasks} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition" title="Refresh">
              <RefreshCw className={`w-4 h-4 text-slate-600 ${tasksLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {tasksLoading ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                <p className="text-sm text-slate-500 font-medium">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-12 text-center">
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500">No tasks yet</p>
                <p className="text-xs text-slate-400 mt-1">Use the button above to assign a task to an employee.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="border-b border-slate-100 last:border-0">
                  <div 
                    onClick={() => toggleTaskExpansion(task.task?.id || task.id)}
                    className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{task.task?.title || task.projectName}</h3>
                        {task.task?.description && <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{task.task.description}</p>}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {fmt(task.task?.startDate || task.startDate)} → {fmt(task.task?.endDate || task.endDate)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${taskStatusStyle[task.status] || taskStatusStyle.DRAFT}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right flex items-center gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-500">{task.progress || 0}%</span>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                          <div style={{ width: `${task.progress || 0}%` }} className="h-full bg-indigo-500 rounded-full" />
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedTaskId === (task.task?.id || task.id) ? "rotate-90" : ""}`} />
                    </div>
                  </div>
                  
                  {/* Expanded Task Items */}
                  <AnimatePresence>
                    {expandedTaskId === (task.task?.id || task.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                      >
                        <div className="p-6">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Task Items & Submissions</h4>
                          {loadingItems ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Loader2 className="w-4 h-4 animate-spin" /> Loading items...
                            </div>
                          ) : taskItems.length === 0 ? (
                            <p className="text-sm text-slate-500 font-medium">No items found for this task.</p>
                          ) : (
                            <div className="space-y-4">
                              {taskItems.map(item => (
                                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                  <div className="flex items-center justify-between gap-4 mb-3">
                                    <div>
                                      <h5 className="text-sm font-bold text-slate-800">{item.title}</h5>
                                      <p className="text-xs font-medium text-slate-500 mt-0.5">Assigned to: {item.assignedToEmployee?.name || "Unassigned"}</p>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${taskStatusStyle[item.assignmentStatus] || taskStatusStyle.DRAFT}`}>
                                      {item.assignmentStatus}
                                    </span>
                                  </div>
                                  
                                  {item.description && (
                                    <p className="text-xs text-slate-600 font-medium mb-3 bg-slate-50 p-2 rounded-lg">{item.description}</p>
                                  )}

                                  {item.submission && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                      <h6 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Submission Details</h6>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                                        {item.submission.driveLink && (
                                          <div>
                                            <span className="block text-xs font-semibold text-slate-400 mb-1">Work/Drive Link</span>
                                            <a href={item.submission.driveLink} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium text-xs break-all">
                                              {item.submission.driveLink} <ExternalLink className="w-3 h-3" />
                                            </a>
                                          </div>
                                        )}
                                        {item.submission.remarks && (
                                          <div>
                                            <span className="block text-xs font-semibold text-slate-400 mb-1">Remarks</span>
                                            <span className="text-slate-700 font-medium text-xs">{item.submission.remarks}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {item.assignmentStatus === "SUBMITTED" && (
                                        <div className="flex flex-col gap-3">
                                          {rejectingAssignmentId === item.assignmentId ? (
                                            <div className="flex items-start gap-2 bg-rose-50 p-3 rounded-xl border border-rose-100">
                                              <input 
                                                type="text" 
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                placeholder="Reason for rejection..."
                                                className="flex-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-rose-400"
                                                autoFocus
                                              />
                                              <button onClick={() => handleRejectSubmission(item.assignmentId)} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition">Confirm</button>
                                              <button onClick={() => { setRejectingAssignmentId(null); setRejectReason(""); }} className="px-3 py-1.5 bg-white text-slate-600 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition">Cancel</button>
                                            </div>
                                          ) : (
                                            <div className="flex gap-2">
                                              <button 
                                                onClick={() => handleVerifySubmission(item.assignmentId)}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition shadow-sm shadow-emerald-200"
                                              >
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Work
                                              </button>
                                              <button 
                                                onClick={() => setRejectingAssignmentId(item.assignmentId)}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 transition"
                                              >
                                                <AlertTriangle className="w-3.5 h-3.5" /> Reject & Resubmit
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default WebDevManagerView;
