import React, { useState, useEffect, useMemo } from "react";
import {
  FolderOpen,
  Search,
  Filter,
  Eye,
  EyeOff,
  Copy,
  Check,
  Building2,
  Calendar,
  User,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  Camera,
  FileSpreadsheet,
  FileText,
  Clock,
  Layers,
  ChevronRight,
  X,
  Sparkles,
  TrendingUp,
  Briefcase,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import API from "../../services/api";
import { toast } from "react-toastify";

export default function AdminCompleteDetailsPage() {
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter States
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Selected Project for Detail View Modal / Drawer
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, credentials, content_calendar, shoots, reports

  // Supplemental Data for Selected Project
  const [monthlySheets, setMonthlySheets] = useState([]);
  const [shootWorkspaces, setShootWorkspaces] = useState([]);
  const [seoReports, setSeoReports] = useState([]);

  // Visibility Toggles for Sensitive Fields
  const [showPasswords, setShowPasswords] = useState({});
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [projRes, deptRes] = await Promise.allSettled([
        API.get("/api/projects"),
        API.get("/api/departments"),
      ]);

      if (projRes.status === "fulfilled" && projRes.value?.data?.success) {
        setProjects(projRes.value.data.data || []);
      } else {
        setError("Failed to load projects list.");
      }

      if (deptRes.status === "fulfilled" && deptRes.value?.data?.data) {
        setDepartments(deptRes.value.data.data || []);
      }
    } catch (err) {
      console.error("Error loading complete details data:", err);
      setError("An unexpected error occurred while loading projects.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (proj) => {
    setSelectedProject(proj);
    setActiveTab("overview");
    setDetailLoading(true);

    try {
      // Fetch full project details to get all fields
      const res = await API.get(`/api/projects/${proj.id}`);
      if (res?.data?.success && res?.data?.data) {
        const fullProj = res.data.data;
        setSelectedProject(fullProj);

        // Fetch monthly sheets (content calendar)
        try {
          const sheetRes = await API.get(`/api/projects/${fullProj.id}/monthly-sheets`);
          if (sheetRes?.data?.success) {
            setMonthlySheets(sheetRes.data.data || []);
          }
        } catch (e) {
          console.warn("Could not fetch monthly sheets:", e);
          setMonthlySheets([]);
        }

        // Fetch SEO reports if applicable
        if (fullProj?.department?.name?.toLowerCase().includes("seo")) {
          try {
            const seoRes = await API.get(`/api/seo-reports?projectId=${fullProj.id}`);
            if (seoRes?.data?.success) {
              setSeoReports(seoRes.data.data || []);
            }
          } catch (e) {
            setSeoReports([]);
          }
        } else {
          setSeoReports([]);
        }

        // Fetch Shoot Workspaces
        try {
          const shootRes = await API.get("/api/shoot-workspaces");
          if (shootRes?.data?.success) {
            // Filter workspaces related to this project name
            const matching = (shootRes.data.data || []).filter(
              (w) =>
                w.title?.toLowerCase().includes(fullProj.projectName.toLowerCase()) ||
                w.projectName?.toLowerCase().includes(fullProj.projectName.toLowerCase())
            );
            setShootWorkspaces(matching.length > 0 ? matching : shootRes.data.data || []);
          }
        } catch (e) {
          setShootWorkspaces([]);
        }
      }
    } catch (err) {
      console.error("Error fetching detailed project context:", err);
      toast.error("Failed to load full project details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const togglePasswordView = (key) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Department Filter
      if (selectedDept !== "ALL") {
        const deptName = p.department?.name || "";
        if (selectedDept === "WEB_DEV") {
          if (!deptName.toLowerCase().includes("web") && !deptName.toLowerCase().includes("it")) return false;
        } else if (selectedDept === "SEO") {
          if (!deptName.toLowerCase().includes("seo")) return false;
        } else if (selectedDept === "SMM") {
          if (!deptName.toLowerCase().includes("social") && !deptName.toLowerCase().includes("smm")) return false;
        } else {
          if (p.department?.id !== selectedDept && deptName !== selectedDept) return false;
        }
      }

      // Status Filter
      if (statusFilter !== "ALL") {
        if ((p.status || "ONGOING").toUpperCase() !== statusFilter.toUpperCase()) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = p.projectName?.toLowerCase().includes(q);
        const clientMatch = p.clientName?.toLowerCase().includes(q);
        const deptMatch = p.department?.name?.toLowerCase().includes(q);
        const managerMatch = p.assignments?.some((a) => a.manager?.name?.toLowerCase().includes(q));
        if (!nameMatch && !clientMatch && !deptMatch && !managerMatch) return false;
      }

      return true;
    });
  }, [projects, selectedDept, statusFilter, searchQuery]);

  // Derived Statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const webDev = projects.filter((p) => p.department?.name?.toLowerCase().includes("web") || p.department?.name?.toLowerCase().includes("it")).length;
    const seo = projects.filter((p) => p.department?.name?.toLowerCase().includes("seo")).length;
    const smm = projects.filter((p) => p.department?.name?.toLowerCase().includes("social") || p.department?.name?.toLowerCase().includes("smm")).length;
    return { total, webDev, seo, smm };
  }, [projects]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER SECTION */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck size={14} /> Admin Directory Access
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Complete Details Workspace
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              Unified administrative portal for viewing and auditing all projects, department credentials, content calendars, shoot schedules, and performance metrics.
            </p>
          </div>

          <button
            onClick={fetchInitialData}
            disabled={loading}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-indigo-600" : ""} />
            Refresh Directory
          </button>
        </div>

        {/* METRICS & QUICK SUMMARY */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-md">
              {stats.total}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Projects</p>
              <p className="text-lg font-bold text-slate-800">All Client Projects</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              {stats.webDev}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Web Development</p>
              <p className="text-lg font-bold text-slate-800">Portals & Sites</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              {stats.seo}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SEO Department</p>
              <p className="text-lg font-bold text-slate-800">Search Growth</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              {stats.smm}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Social Media</p>
              <p className="text-lg font-bold text-slate-800">Content & Shoots</p>
            </div>
          </div>
        </div>

        {/* FILTERS & SEARCH BAR */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          
          {/* Department Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Filter size={14} /> Department:
            </span>
            {[
              { id: "ALL", label: "All Departments" },
              { id: "WEB_DEV", label: "Web Development" },
              { id: "SEO", label: "SEO Department" },
              { id: "SMM", label: "Social Media" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedDept(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  selectedDept === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Dynamic extra departments if present */}
            {departments.map((d) => {
              const dName = d.name || "";
              if (
                dName.toLowerCase().includes("web") ||
                dName.toLowerCase().includes("seo") ||
                dName.toLowerCase().includes("social")
              )
                return null;

              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDept(d.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                    selectedDept === d.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  {dName}
                </button>
              );
            })}
          </div>

          {/* Search & Status Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects by name, client, manager, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>
        </div>

        {/* PROJECTS GRID LIST */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
            <p className="text-slate-500 text-sm font-medium">Loading project directory details...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 rounded-3xl p-8 border border-rose-200 text-center space-y-3 text-rose-800">
            <AlertCircle className="w-10 h-10 mx-auto text-rose-600" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchInitialData}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center space-y-3">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-800 font-bold text-lg">No matching projects found</p>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Try adjusting your department filter, status filter, or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p) => {
              const deptName = p.department?.name || "General";
              const isWeb = deptName.toLowerCase().includes("web") || deptName.toLowerCase().includes("it");
              const isSeo = deptName.toLowerCase().includes("seo");
              const isSmm = deptName.toLowerCase().includes("social") || deptName.toLowerCase().includes("smm");

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* Card Top Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {p.logo ? (
                          <img
                            src={p.logo}
                            alt={p.projectName}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-sm"
                          />
                        ) : (
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                              isWeb
                                ? "bg-blue-600"
                                : isSeo
                                ? "bg-emerald-600"
                                : isSmm
                                ? "bg-violet-600"
                                : "bg-slate-800"
                            }`}
                          >
                            {p.projectName?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
                            {p.projectName}
                          </h3>
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60 mt-1">
                            {deptName}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          p.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.status === "PAUSED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {p.status || "ONGOING"}
                      </span>
                    </div>

                    {/* Quick Metadata Snippet */}
                    <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      {p.clientName && (
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700 truncate">Client: {p.clientName}</span>
                        </div>
                      )}

                      {p.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{p.location}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar size={13} /> {formatDate(p.startDate)}
                        </span>
                        {p.renewalDate && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60 font-medium">
                            Renew: {formatDate(p.renewalDate)}
                          </span>
                        )}
                      </div>

                      {/* Managers assigned */}
                      {p.assignments && p.assignments.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-1 items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                            Managers:
                          </span>
                          {p.assignments.map((asg) => (
                            <span
                              key={asg.id || asg.manager?.id}
                              className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium"
                            >
                              {asg.manager?.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 group-hover:underline">
                      View Each & Everything <ChevronRight size={14} />
                    </span>
                    <button
                      onClick={() => handleSelectProject(p)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold transition shadow-sm"
                    >
                      Complete Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* COMPREHENSIVE PROJECT DETAILS MODAL OVERLAY */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fadeIn my-auto">
            
            {/* MODAL HEADER */}
            <div className="bg-slate-900 text-white p-6 flex items-start justify-between relative overflow-hidden shrink-0">
              <div className="flex items-center gap-4 relative z-10">
                {selectedProject.logo ? (
                  <img
                    src={selectedProject.logo}
                    alt={selectedProject.projectName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl shadow-lg border-2 border-white/20">
                    {selectedProject.projectName?.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">
                      {selectedProject.department?.name || "General"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white">
                      {selectedProject.status || "ONGOING"}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    {selectedProject.projectName}
                  </h2>
                  <p className="text-xs text-slate-300 flex items-center gap-3 flex-wrap">
                    {selectedProject.clientName && <span>Client: {selectedProject.clientName}</span>}
                    {selectedProject.phone && <span>Contact: {selectedProject.phone}</span>}
                    {selectedProject.location && <span>Loc: {selectedProject.location}</span>}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* TAB NAVIGATION HEADER */}
            <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
              {[
                { id: "overview", label: "Overview & Meta", icon: Building2 },
                { id: "credentials", label: "Project Credentials", icon: Lock },
                { id: "content_calendar", label: "Content Calendar & Mood Board", icon: FileSpreadsheet },
                { id: "shoots", label: "Shoot Schedules & Tasks", icon: Camera },
                { id: "reports", label: "SEO & Audit Reports", icon: TrendingUp },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      active
                        ? "bg-white text-indigo-700 shadow-sm border border-slate-200/80"
                        : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* MODAL CONTENT BODY */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6 custom-scrollbar bg-slate-50/30">
              
              {detailLoading ? (
                <div className="py-20 text-center space-y-3">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">Gathering full project context...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW & META */}
                  {activeTab === "overview" && (
                    <div className="space-y-6 animate-fadeIn">
                      
                      {/* Description Box */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                          <FileText size={14} /> Project Description & Objectives
                        </h4>
                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                          {selectedProject.description || "No description provided for this project."}
                        </p>
                      </div>

                      {/* Timelines & Contract Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Date</span>
                          <p className="text-base font-bold text-slate-900">{formatDate(selectedProject.startDate || selectedProject.projectStartDate)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">End Date</span>
                          <p className="text-base font-bold text-slate-900">{formatDate(selectedProject.endDate)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Renewal Date / Frequency</span>
                          <p className="text-base font-bold text-indigo-600">
                            {formatDate(selectedProject.renewalDate)} ({selectedProject.frequency || "Monthly"})
                          </p>
                        </div>
                      </div>

                      {/* Client Info Grid */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                          <User size={16} className="text-indigo-600" /> Client & Contact Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 font-semibold block">Client Name:</span>
                            <span className="text-sm font-bold text-slate-800">{selectedProject.clientName || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block">Contact Phone:</span>
                            <span className="text-sm font-bold text-slate-800">{selectedProject.phone || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block">Location / Address:</span>
                            <span className="text-sm font-bold text-slate-800">{selectedProject.location || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block">Department:</span>
                            <span className="text-sm font-bold text-indigo-600">{selectedProject.department?.name || "General"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Assigned Managers */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                          <Briefcase size={16} className="text-indigo-600" /> Assigned Managers & Supervision
                        </h4>
                        {selectedProject.assignments && selectedProject.assignments.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedProject.assignments.map((asg) => (
                              <div key={asg.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-sm text-slate-800">{asg.manager?.name}</p>
                                  <p className="text-xs text-slate-500">ID: {asg.manager?.employeeId || "N/A"} • {asg.manager?.role}</p>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">Manager</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No managers currently assigned.</p>
                        )}
                      </div>

                    </div>
                  )}

                  {/* TAB 2: CREDENTIALS */}
                  {activeTab === "credentials" && (
                    <div className="space-y-6 animate-fadeIn">
                      
                      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
                        <ShieldAlert size={20} className="shrink-0 text-amber-600" />
                        <div>
                          <p className="font-bold">Confidential Administrative Credentials</p>
                          <p className="text-amber-700">All passwords and access tokens are restricted strictly for administrative management.</p>
                        </div>
                      </div>

                      {/* Social Media Credentials */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                          <Globe size={16} className="text-violet-600" /> Social Media Credentials
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Facebook */}
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <p className="font-bold text-slate-800 text-sm">Facebook Account</p>
                            <div className="space-y-1">
                              <span className="text-slate-400 font-semibold block">Email / Username:</span>
                              <div className="flex items-center justify-between bg-white p-2 rounded-lg border">
                                <span className="font-mono">{selectedProject.fbEmail || selectedProject.facebookUsername || "N/A"}</span>
                                {selectedProject.fbEmail && (
                                  <button onClick={() => copyToClipboard(selectedProject.fbEmail, "FB Email")} className="text-slate-400 hover:text-slate-600">
                                    <Copy size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-slate-400 font-semibold block">Password:</span>
                              <div className="flex items-center justify-between bg-white p-2 rounded-lg border">
                                <span className="font-mono">
                                  {showPasswords.fb ? selectedProject.fbPassword || "N/A" : selectedProject.fbPassword ? "••••••••••••" : "N/A"}
                                </span>
                                <div className="flex items-center gap-2">
                                  {selectedProject.fbPassword && (
                                    <button onClick={() => togglePasswordView("fb")} className="text-slate-400 hover:text-slate-600">
                                      {showPasswords.fb ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                  )}
                                  {selectedProject.fbPassword && (
                                    <button onClick={() => copyToClipboard(selectedProject.fbPassword, "FB Password")} className="text-slate-400 hover:text-slate-600">
                                      <Copy size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Instagram */}
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <p className="font-bold text-slate-800 text-sm">Instagram Account</p>
                            <div className="space-y-1">
                              <span className="text-slate-400 font-semibold block">Email / Username:</span>
                              <div className="flex items-center justify-between bg-white p-2 rounded-lg border">
                                <span className="font-mono">{selectedProject.instaEmail || selectedProject.instaUsername || "N/A"}</span>
                                {selectedProject.instaEmail && (
                                  <button onClick={() => copyToClipboard(selectedProject.instaEmail, "Insta Email")} className="text-slate-400 hover:text-slate-600">
                                    <Copy size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-slate-400 font-semibold block">Password:</span>
                              <div className="flex items-center justify-between bg-white p-2 rounded-lg border">
                                <span className="font-mono">
                                  {showPasswords.insta ? selectedProject.instaPassword || "N/A" : selectedProject.instaPassword ? "••••••••••••" : "N/A"}
                                </span>
                                <div className="flex items-center gap-2">
                                  {selectedProject.instaPassword && (
                                    <button onClick={() => togglePasswordView("insta")} className="text-slate-400 hover:text-slate-600">
                                      {showPasswords.insta ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                  )}
                                  {selectedProject.instaPassword && (
                                    <button onClick={() => copyToClipboard(selectedProject.instaPassword, "Insta Password")} className="text-slate-400 hover:text-slate-600">
                                      <Copy size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* LinkedIn / YouTube / Twitter */}
                          {(selectedProject.linkedinEmail || selectedProject.youtubeEmail || selectedProject.twitterEmail) && (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 md:col-span-2">
                              <p className="font-bold text-slate-800 text-sm">Other Channels (LinkedIn / YouTube / Twitter)</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {selectedProject.linkedinEmail && (
                                  <div className="bg-white p-2 rounded border">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">LinkedIn</span>
                                    <p className="font-mono text-xs truncate">{selectedProject.linkedinEmail}</p>
                                  </div>
                                )}
                                {selectedProject.youtubeEmail && (
                                  <div className="bg-white p-2 rounded border">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">YouTube</span>
                                    <p className="font-mono text-xs truncate">{selectedProject.youtubeEmail}</p>
                                  </div>
                                )}
                                {selectedProject.twitterEmail && (
                                  <div className="bg-white p-2 rounded border">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Twitter</span>
                                    <p className="font-mono text-xs truncate">{selectedProject.twitterEmail}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      </div>

                      {/* Web Development Credentials */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                          <Globe size={16} className="text-blue-600" /> Web Development Credentials & Domain Details
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Domain */}
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <p className="font-bold text-slate-800 text-sm">Domain Access</p>
                            <div className="space-y-1">
                              <span className="text-slate-400 font-semibold block">Domain Name:</span>
                              <div className="flex items-center justify-between bg-white p-2 rounded-lg border">
                                <span className="font-mono">{selectedProject.domainName || "N/A"}</span>
                                {selectedProject.domainName && (
                                  <button onClick={() => copyToClipboard(selectedProject.domainName, "Domain Name")} className="text-slate-400 hover:text-slate-600">
                                    <Copy size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-slate-400 font-semibold block">Domain Password:</span>
                              <div className="flex items-center justify-between bg-white p-2 rounded-lg border">
                                <span className="font-mono">
                                  {showPasswords.domain ? selectedProject.domainPassword || "N/A" : selectedProject.domainPassword ? "••••••••••••" : "N/A"}
                                </span>
                                {selectedProject.domainPassword && (
                                  <button onClick={() => togglePasswordView("domain")} className="text-slate-400 hover:text-slate-600">
                                    {showPasswords.domain ? <EyeOff size={13} /> : <Eye size={13} />}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Client Email */}
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <p className="font-bold text-slate-800 text-sm">Client Email Hosting Access</p>
                            <div className="space-y-1">
                              <span className="text-slate-400 font-semibold block">Client Email Address:</span>
                              <div className="flex items-center justify-between bg-white p-2 rounded-lg border">
                                <span className="font-mono">{selectedProject.clientEmail || "N/A"}</span>
                                {selectedProject.clientEmail && (
                                  <button onClick={() => copyToClipboard(selectedProject.clientEmail, "Client Email")} className="text-slate-400 hover:text-slate-600">
                                    <Copy size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-slate-400 font-semibold block">Client Email Password:</span>
                              <div className="flex items-center justify-between bg-white p-2 rounded-lg border">
                                <span className="font-mono">
                                  {showPasswords.clientEmailPass ? selectedProject.clientEmailPassword || "N/A" : selectedProject.clientEmailPassword ? "••••••••••••" : "N/A"}
                                </span>
                                {selectedProject.clientEmailPassword && (
                                  <button onClick={() => togglePasswordView("clientEmailPass")} className="text-slate-400 hover:text-slate-600">
                                    {showPasswords.clientEmailPass ? <EyeOff size={13} /> : <Eye size={13} />}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Requirements */}
                          {selectedProject.requirements && (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 md:col-span-2">
                              <p className="font-bold text-slate-800 text-sm">Project Requirements & Specifications</p>
                              <p className="text-xs text-slate-700 whitespace-pre-line bg-white p-3 rounded-lg border">
                                {selectedProject.requirements}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SEO Department Credentials */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                          <TrendingUp size={16} className="text-emerald-600" /> SEO Department Credentials
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <span className="text-slate-400 font-semibold block">SEO Account Email:</span>
                            <div className="flex items-center justify-between bg-white p-2 rounded-lg border">
                              <span className="font-mono">{selectedProject.seoEmail || "N/A"}</span>
                              {selectedProject.seoEmail && (
                                <button onClick={() => copyToClipboard(selectedProject.seoEmail, "SEO Email")} className="text-slate-400 hover:text-slate-600">
                                  <Copy size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <span className="text-slate-400 font-semibold block">SEO Account Password:</span>
                            <div className="flex items-center justify-between bg-white p-2 rounded-lg border">
                              <span className="font-mono">
                                {showPasswords.seo ? selectedProject.seoPassword || "N/A" : selectedProject.seoPassword ? "••••••••••••" : "N/A"}
                              </span>
                              {selectedProject.seoPassword && (
                                <button onClick={() => togglePasswordView("seo")} className="text-slate-400 hover:text-slate-600">
                                  {showPasswords.seo ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <span className="text-slate-400 font-semibold block">SEO Representative / Contact Name:</span>
                            <p className="font-bold text-slate-800 text-sm bg-white p-2 rounded-lg border">{selectedProject.seoName || "N/A"}</p>
                          </div>

                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <span className="text-slate-400 font-semibold block">SEO Contact Phone:</span>
                            <p className="font-bold text-slate-800 text-sm bg-white p-2 rounded-lg border">{selectedProject.seoContact || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 3: CONTENT CALENDAR & MOOD BOARD */}
                  {activeTab === "content_calendar" && (
                    <div className="space-y-6 animate-fadeIn">
                      
                      {/* Mood Board Link */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-500" /> Project Mood Board & Creative References
                          </h4>
                          <p className="text-xs text-slate-500">Visual direction, design aesthetic, references, and taste board for creative team.</p>
                        </div>
                        {monthlySheets[0]?.moodBoardLink ? (
                          <a
                            href={monthlySheets[0].moodBoardLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm"
                          >
                            <ExternalLink size={14} /> Open Mood Board
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No mood board link registered yet</span>
                        )}
                      </div>

                      {/* Monthly Sheet Progress */}
                      {monthlySheets.length > 0 ? (
                        monthlySheets.map((sheet) => (
                          <div key={sheet.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b pb-3">
                              <h4 className="text-sm font-bold text-slate-900">
                                Monthly Content Sheet — Month {sheet.month}/{sheet.year}
                              </h4>
                              <span className="text-xs font-semibold text-slate-500">
                                Created By: {sheet.createdBy?.name || "Manager"}
                              </span>
                            </div>

                            {/* Reels / Posts Progress */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold">
                                  <span>Reels Target & Progress</span>
                                  <span>{sheet.totalReelsUploaded || 0} / {sheet.totalReels || 0} Uploaded</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                                  <div
                                    className="h-full bg-indigo-600 transition-all"
                                    style={{
                                      width: `${
                                        sheet.totalReels
                                          ? Math.min(100, Math.round(((sheet.totalReelsUploaded || 0) / sheet.totalReels) * 100))
                                          : 0
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold">
                                  <span>Posts Target & Progress</span>
                                  <span>{sheet.totalPostsUploaded || 0} / {sheet.totalPosts || 0} Uploaded</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                                  <div
                                    className="h-full bg-violet-600 transition-all"
                                    style={{
                                      width: `${
                                        sheet.totalPosts
                                          ? Math.min(100, Math.round(((sheet.totalPostsUploaded || 0) / sheet.totalPosts) * 100))
                                          : 0
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Days Table */}
                            {sheet.days && sheet.days.length > 0 && (
                              <div className="pt-4 space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Scheduled Daily Deliverables ({sheet.days.length} Days)</p>
                                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 text-xs">
                                  <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-100 font-semibold text-slate-700 sticky top-0">
                                      <tr>
                                        <th className="p-2.5">Date</th>
                                        <th className="p-2.5">Type</th>
                                        <th className="p-2.5">Title / Script</th>
                                        <th className="p-2.5">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {sheet.days.map((day) => (
                                        <tr key={day.id} className="hover:bg-slate-50/70">
                                          <td className="p-2.5 font-medium whitespace-nowrap">{formatDate(day.date)}</td>
                                          <td className="p-2.5">
                                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                              {day.reelType || day.postType || "Post"}
                                            </span>
                                          </td>
                                          <td className="p-2.5 max-w-xs truncate">{day.title || day.script || "—"}</td>
                                          <td className="p-2.5">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                              day.uploadStatus === "APPROVED"
                                                ? "bg-emerald-100 text-emerald-800"
                                                : day.uploadStatus === "REJECTED"
                                                ? "bg-rose-100 text-rose-800"
                                                : "bg-amber-100 text-amber-800"
                                            }`}>
                                              {day.uploadStatus || "PENDING"}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                          </div>
                        ))
                      ) : (
                        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
                          <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-700">No Content Calendar Sheets Found</p>
                          <p className="text-xs text-slate-500">No monthly content sheets have been published for this project yet.</p>
                        </div>
                      )}

                    </div>
                  )}

                  {/* TAB 4: SHOOT SCHEDULES & TASKS */}
                  {activeTab === "shoots" && (
                    <div className="space-y-6 animate-fadeIn">
                      
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                          <Camera size={16} className="text-indigo-600" /> Shoot Workspaces & Media Schedules
                        </h4>

                        {shootWorkspaces.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {shootWorkspaces.map((ws) => (
                              <div key={ws.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-bold text-slate-900 text-sm">{ws.title || ws.projectName || "Shoot Workspace"}</p>
                                    <p className="text-xs text-slate-500">Created: {formatDate(ws.createdAt)}</p>
                                  </div>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                    Shoot Active
                                  </span>
                                </div>

                                {ws.shootTasks && ws.shootTasks.length > 0 ? (
                                  <div className="space-y-2 text-xs">
                                    <span className="font-semibold text-slate-400 uppercase tracking-wider block">Scheduled Tasks:</span>
                                    {ws.shootTasks.map((st) => (
                                      <div key={st.id} className="bg-white p-2.5 rounded-lg border space-y-1">
                                        <p className="font-bold text-slate-800">{st.title}</p>
                                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                                          <span>Date: {st.date || "TBD"} ({st.arrivalTime || "Time TBD"})</span>
                                          <span>Loc: {st.location || "On Site"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px]">Pics: {st.noOfPics || 0}</span>
                                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px]">Reels: {st.noOfReels || 0}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500 italic">No specific shoot tasks listed yet.</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center space-y-2">
                            <Camera className="w-10 h-10 text-slate-300 mx-auto" />
                            <p className="font-semibold text-slate-700 text-sm">No Shoots Scheduled</p>
                            <p className="text-xs text-slate-500">There are no shoot tasks or media schedules recorded for this project.</p>
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* TAB 5: SEO & REPORTS */}
                  {activeTab === "reports" && (
                    <div className="space-y-6 animate-fadeIn">
                      
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                          <TrendingUp size={16} className="text-emerald-600" /> SEO Monthly Growth & Audit Reports
                        </h4>

                        {seoReports.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {seoReports.map((rep) => (
                              <div key={rep.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900 text-sm">Report Month: {rep.month}/{rep.year}</span>
                                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">SEO Verified</span>
                                </div>
                                <p className="text-slate-600">{rep.remarks || "Regular monthly search audit report."}</p>
                                {rep.reportFile && (
                                  <a
                                    href={rep.reportFile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline pt-1"
                                  >
                                    <FileText size={13} /> View Attached PDF Report
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center space-y-2">
                            <TrendingUp className="w-10 h-10 text-slate-300 mx-auto" />
                            <p className="font-semibold text-slate-700 text-sm">No SEO Reports Found</p>
                            <p className="text-xs text-slate-500">No monthly SEO audits or report documents submitted for this project.</p>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </>
              )}

            </div>

            {/* MODAL FOOTER */}
            <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Project ID: <span className="font-mono">{selectedProject.id}</span>
              </span>
              <button
                onClick={() => setSelectedProject(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
