import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import API from "../../services/api";
import { toast } from "react-toastify";
import {
  UploadCloud,
  CheckCircle,
  FileAudio,
  X,
  Mic,
  Briefcase,
  Send,
  Images,
  Image as ImageIcon,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Clock,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  BarChart2,
  Share2,
  Calendar,
  CalendarDays
} from "lucide-react";

const DEPARTMENT_TABS = [
  { id: "Marketing", label: "Meta Ads", icon: TrendingUp, activeColor: "from-orange-500 to-amber-600", activeRing: "ring-orange-400" },
  { id: "SEO", label: "SEO", icon: BarChart2, activeColor: "from-emerald-500 to-teal-600", activeRing: "ring-emerald-400" },
  { id: "Social Media", label: "Social Media", icon: Share2, activeColor: "from-pink-500 to-rose-600", activeRing: "ring-pink-400" },
  { id: "ALL", label: "All Projects", icon: Briefcase, activeColor: "from-blue-600 to-indigo-600", activeRing: "ring-blue-400" },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const getDepartmentCategory = (client) => {
  const deptName = (client?.department?.name || client?.department || "").toLowerCase().trim();
  if (deptName.includes("seo")) return "SEO";
  if (deptName.includes("social") || deptName.includes("smm")) return "Social Media";
  return "Marketing"; // Meta Ads / Marketing
};

const getMonthWeeks = (year, monthIndex) => {
  const startOfYear = new Date(year, 0, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const getWeekNum = (day) => {
    const date = new Date(year, monthIndex, day);
    const diffDays = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.floor(diffDays / 7) + 1;
  };

  const chunks = [
    { weekIndex: 0, label: "Week 1", startDay: 1, endDay: 7 },
    { weekIndex: 1, label: "Week 2", startDay: 8, endDay: 14 },
    { weekIndex: 2, label: "Week 3", startDay: 15, endDay: 21 },
    { weekIndex: 3, label: "Week 4", startDay: 22, endDay: 28 },
  ];
  if (daysInMonth > 28) {
    chunks.push({ weekIndex: 4, label: "Week 5", startDay: 29, endDay: daysInMonth });
  }

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === monthIndex;
  const currentDay = now.getDate();

  return chunks.map((c) => {
    const weekNumber = getWeekNum(c.startDay);
    const isCurrent = isCurrentMonth && currentDay >= c.startDay && currentDay <= c.endDay;
    return {
      ...c,
      weekNumber,
      isCurrent,
      dateRange: `${c.startDay} - ${c.endDay} ${MONTH_NAMES[monthIndex].slice(0, 3)}`,
    };
  });
};

export default function ManagerWeeklyVoiceReport() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(() => {
    const weeks = getMonthWeeks(now.getFullYear(), now.getMonth());
    const currIdx = weeks.findIndex((w) => w.isCurrent);
    return currIdx !== -1 ? currIdx : 0;
  });

  const [activeClients, setActiveClients] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [selectedDeptTab, setSelectedDeptTab] = useState(
    () => location.state?.department || "Marketing"
  );

  useEffect(() => {
    if (location.state?.department) {
      setSelectedDeptTab(location.state.department);
    }
  }, [location.state?.department]);

  // Per-client submission mode: { [clientId]: 'VOICE' | 'SCREENSHOTS' | 'UNABLE_TO_SUBMIT' }
  const [clientModes, setClientModes] = useState({});

  // Audio file per client: { [clientId]: File }
  const [clientAudio, setClientAudio] = useState({});

  // Screenshot files per client: { [clientId]: File[] }
  const [clientScreenshots, setClientScreenshots] = useState({});

  // Reason text per client for inability to submit: { [clientId]: string }
  const [clientReasons, setClientReasons] = useState({});

  // Track which clients are currently in editing/updating mode
  const [editingClients, setEditingClients] = useState({});

  // Track submitting state per client: { [clientId]: boolean }
  const [submittingClients, setSubmittingClients] = useState({});

  // Lightbox Modal state: { isOpen: boolean, images: string[], currentIndex: number, clientTitle: string }
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
    clientTitle: ""
  });

  // Calculate weeks for current selected month
  const monthWeeks = useMemo(() => {
    return getMonthWeeks(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Ensure selectedWeekIndex is within valid range when month changes
  useEffect(() => {
    if (selectedWeekIndex >= monthWeeks.length) {
      setSelectedWeekIndex(0);
    }
  }, [monthWeeks.length, selectedWeekIndex]);

  const activeWeek = monthWeeks[selectedWeekIndex] || monthWeeks[0] || { weekNumber: 1, label: "Week 1", dateRange: "" };

  useEffect(() => {
    fetchActiveClientsAndSubmissions();
  }, [selectedYear]);

  const fetchActiveClientsAndSubmissions = async () => {
    try {
      setLoading(true);
      const [clientsRes, reportsRes] = await Promise.all([
        API.get("/api/weekly-voice-reports/active-clients"),
        API.get("/api/weekly-voice-reports/my-reports", {
          params: { year: selectedYear }
        }).catch(() => ({ data: { data: [] } }))
      ]);

      const clients = clientsRes.data?.data || [];
      setActiveClients(clients);
      setAllReports(reportsRes.data?.data || []);
    } catch (error) {
      toast.error("Failed to load active clients and reports");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Map allReports by [weekNumber][clientId]
  const reportsByWeek = useMemo(() => {
    const map = {};
    allReports.forEach((report) => {
      const w = report.weekNumber;
      if (!map[w]) map[w] = {};
      const clientList = Array.isArray(report.clients)
        ? report.clients
        : typeof report.clients === "string"
        ? JSON.parse(report.clients)
        : [];

      clientList.forEach((c) => {
        if (c?.id && !map[w][c.id]) {
          map[w][c.id] = {
            reportId: report.id,
            reportType:
              report.reportType ||
              (report.status === "Unable to Submit"
                ? "UNABLE_TO_SUBMIT"
                : report.audioUrl
                ? "VOICE"
                : report.screenshots?.length > 0
                ? "SCREENSHOTS"
                : "VOICE"),
            audioUrl: report.audioUrl,
            screenshots: report.screenshots || [],
            status: report.status,
            reason:
              c.reason ||
              (report.reportType === "UNABLE_TO_SUBMIT" || report.status === "Unable to Submit"
                ? report.status
                : null),
            qaStatus: report.qaStatus || "PENDING",
            qaFeedback: report.qaFeedback || null,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt
          };
        }
      });
    });
    return map;
  }, [allReports]);

  // Submitted details for the selected active week
  const submittedDetails = reportsByWeek[activeWeek.weekNumber] || {};
  const submittedClients = useMemo(() => new Set(Object.keys(submittedDetails)), [submittedDetails]);

  const handleModeChange = (clientId, mode) => {
    setClientModes((prev) => ({ ...prev, [clientId]: mode }));
  };

  // Audio handlers
  const handleAudioSelect = (clientId, file) => {
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast.error("Please select a valid audio file.");
        return;
      }
      setClientAudio((prev) => ({ ...prev, [clientId]: file }));
    }
  };

  const handleRemoveAudio = (clientId) => {
    setClientAudio((prev) => {
      const next = { ...prev };
      delete next[clientId];
      return next;
    });
  };

  // Screenshots handlers
  const handleScreenshotsSelect = (clientId, fileList) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles = Array.from(fileList).filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.warn(`Skipped non-image file: ${file.name}`);
        return false;
      }
      return true;
    });

    if (newFiles.length === 0) return;

    setClientScreenshots((prev) => {
      const existing = prev[clientId] || [];
      return { ...prev, [clientId]: [...existing, ...newFiles] };
    });
  };

  const handleRemoveSingleScreenshot = (clientId, indexToRemove) => {
    setClientScreenshots((prev) => {
      const current = prev[clientId] || [];
      const updated = current.filter((_, idx) => idx !== indexToRemove);
      return { ...prev, [clientId]: updated };
    });
  };

  const handleClearScreenshots = (clientId) => {
    setClientScreenshots((prev) => {
      const next = { ...prev };
      delete next[clientId];
      return next;
    });
  };

  // Submit / Re-Submit Single Client Report
  const handleSubmitSingle = async (client) => {
    const mode = clientModes[client.id] || "VOICE";
    const weekNumber = activeWeek.weekNumber;
    const year = selectedYear;
    const deptCategory = getDepartmentCategory(client);
    const department = client.department?.name || deptCategory;

    const formData = new FormData();
    formData.append("department", department);
    formData.append("weekNumber", weekNumber.toString());
    formData.append("year", year.toString());
    formData.append("reportType", mode);

    let clientPayload = {
      id: client.id,
      name: client.projectName || client.clientName
    };

    if (mode === "UNABLE_TO_SUBMIT") {
      const reason = clientReasons[client.id]?.trim();
      if (!reason) {
        toast.error(
          `Please provide a reason why you cannot submit for ${
            client.projectName || client.clientName
          }`
        );
        return;
      }
      formData.append("reason", reason);
      clientPayload.reason = reason;
      formData.append("clients", JSON.stringify([clientPayload]));
    } else if (mode === "VOICE") {
      const audioFile = clientAudio[client.id];
      if (!audioFile) {
        toast.error(
          `Please upload an audio file for ${client.projectName || client.clientName}`
        );
        return;
      }
      formData.append("audio", audioFile);
      formData.append("clients", JSON.stringify([clientPayload]));
    } else if (mode === "SCREENSHOTS") {
      const screenshots = clientScreenshots[client.id] || [];
      if (screenshots.length === 0) {
        toast.error(
          `Please select at least one screenshot for ${
            client.projectName || client.clientName
          }`
        );
        return;
      }
      screenshots.forEach((file) => {
        formData.append("screenshots", file);
      });
      formData.append("clients", JSON.stringify([clientPayload]));
    }

    setSubmittingClients((prev) => ({ ...prev, [client.id]: true }));

    try {
      const res = await API.post("/api/weekly-voice-reports", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const reportData = res.data?.data;
      const isRevision = submittedDetails[client.id]?.qaStatus === "REJECTED";

      if (reportData) {
        setAllReports((prev) => {
          const filtered = prev.filter((r) => r.id !== reportData.id);
          return [reportData, ...filtered];
        });
      }

      // Exit editing mode
      setEditingClients((prev) => ({ ...prev, [client.id]: false }));

      // Clean up files in state
      setClientAudio((prev) => {
        const next = { ...prev };
        delete next[client.id];
        return next;
      });
      setClientScreenshots((prev) => {
        const next = { ...prev };
        delete next[client.id];
        return next;
      });

      toast.success(
        isRevision
          ? `Revision re-submitted for ${
              client.projectName || client.clientName
            } (${activeWeek.label})! Quality Control (QA) will review it.`
          : mode === "UNABLE_TO_SUBMIT"
          ? `Reason recorded for ${
              client.projectName || client.clientName
            } (${activeWeek.label}). Sent to Quality Control (QA).`
          : `${mode === "VOICE" ? "Voice recording" : "Screenshots"} submitted for ${
              client.projectName || client.clientName
            } (${activeWeek.label})!`
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Failed to submit for ${client.projectName || client.clientName}`
      );
      console.error(error);
    } finally {
      setSubmittingClients((prev) => ({ ...prev, [client.id]: false }));
    }
  };

  // Lightbox navigation
  const openLightbox = (images, startIndex, clientTitle) => {
    setLightbox({
      isOpen: true,
      images,
      currentIndex: startIndex,
      clientTitle
    });
  };

  const closeLightbox = () => {
    setLightbox((prev) => ({ ...prev, isOpen: false }));
  };

  const nextLightboxImage = () => {
    setLightbox((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length
    }));
  };

  const prevLightboxImage = () => {
    setLightbox((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
    }));
  };

  const getDeptStats = (deptId) => {
    const clients = deptId === "ALL"
      ? activeClients
      : activeClients.filter((c) => getDepartmentCategory(c) === deptId);
    const completed = clients.filter((c) => {
      const details = submittedDetails[c.id];
      return details && details.qaStatus !== "REJECTED";
    }).length;
    const revision = clients.filter((c) => {
      return submittedDetails[c.id]?.qaStatus === "REJECTED";
    }).length;
    return { total: clients.length, completed, revision };
  };

  const getWeekStats = (weekNum) => {
    const weekMap = reportsByWeek[weekNum] || {};
    const completed = activeClients.filter((c) => {
      const details = weekMap[c.id];
      return details && details.qaStatus !== "REJECTED";
    }).length;
    const revision = activeClients.filter((c) => {
      return weekMap[c.id]?.qaStatus === "REJECTED";
    }).length;
    return {
      total: activeClients.length,
      completed,
      revision,
      isAllCompleted: activeClients.length > 0 && completed === activeClients.length,
    };
  };

  const handleJumpToCurrentWeek = () => {
    const today = new Date();
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    const weeks = getMonthWeeks(today.getFullYear(), today.getMonth());
    const idx = weeks.findIndex((w) => w.isCurrent);
    setSelectedWeekIndex(idx !== -1 ? idx : 0);
  };

  const filteredClients = useMemo(() => {
    if (selectedDeptTab === "ALL") return activeClients;
    return activeClients.filter((c) => getDepartmentCategory(c) === selectedDeptTab);
  }, [activeClients, selectedDeptTab]);

  const currentTabStats = getDeptStats(selectedDeptTab);
  const allSubmittedCurrentTab =
    filteredClients.length > 0 &&
    filteredClients.every((c) => {
      const details = submittedDetails[c.id];
      return details && details.qaStatus !== "REJECTED";
    });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="bg-[#0B1120] rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-screen filter blur-[80px] opacity-40 pointer-events-none"></div>
        <div className="absolute -bottom-32 left-10 w-64 h-64 bg-indigo-600 rounded-full mix-blend-screen filter blur-[80px] opacity-30 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-400/30 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" /> 1 Report Per Week (Voice, Screenshots, or Reason)
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
            Weekly Client Reports
          </h1>
          <p className="text-blue-100/80 text-sm md:text-base max-w-2xl leading-relaxed">
            Track and submit weekly voice notes, conversation screenshots, or reasons once a week for all your projects across Meta Ads, SEO, and Social Media.
          </p>
        </div>

        <div className="hidden md:flex relative z-10 w-16 h-16 bg-blue-500/20 rounded-2xl items-center justify-center border border-blue-400/30 shadow-inner">
          <MessageSquare className="text-blue-300 w-8 h-8" />
        </div>
      </div>

      {/* ─── 1. MONTH & YEAR SELECTOR ────────────────────────────────── */}
      <div className="bg-white p-3.5 md:p-4 rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Month Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
          {MONTH_NAMES.map((monthName, idx) => {
            const isSelected = selectedMonth === idx;
            const isCurrentMonth = now.getFullYear() === selectedYear && now.getMonth() === idx;
            return (
              <button
                key={monthName}
                type="button"
                onClick={() => setSelectedMonth(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-sm"
                    : isCurrentMonth
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {monthName.slice(0, 3)}
                {isCurrentMonth && !isSelected && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 ml-1.5 align-middle" />
                )}
              </button>
            );
          })}
        </div>

        {/* Year Controls & Jump to Current Week */}
        <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={handleJumpToCurrentWeek}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition cursor-pointer"
          >
            <Calendar size={13} />
            Current Week
          </button>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              className="p-1 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold px-2 text-slate-800">{selectedYear}</span>
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              className="p-1 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Next Year"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. WEEKLY DIVISION TABS ─────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {MONTH_NAMES[selectedMonth]} {selectedYear} · Select Week
          </p>
          <span className="text-xs font-semibold text-slate-500">
            Active: <strong className="text-blue-600 font-extrabold">{activeWeek.label}</strong> ({activeWeek.dateRange})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {monthWeeks.map((week, idx) => {
            const isSelected = selectedWeekIndex === idx;
            const stats = getWeekStats(week.weekNumber);
            return (
              <button
                key={week.weekNumber}
                type="button"
                onClick={() => setSelectedWeekIndex(idx)}
                className={`group flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg ring-2 ring-blue-500/30 scale-[1.01]"
                    : "bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-sm text-slate-800"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className={`text-xs font-bold tracking-wide uppercase ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                    {week.label}
                  </span>
                  {week.isCurrent && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-blue-100 text-blue-700 animate-pulse"
                    }`}>
                      Current
                    </span>
                  )}
                </div>

                <div className="my-1">
                  <p className={`text-sm md:text-base font-extrabold ${isSelected ? "text-white" : "text-slate-900"}`}>
                    {week.dateRange}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-current/10 flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                    {stats.isAllCompleted
                      ? "All Done"
                      : `${stats.completed}/${stats.total} Submitted`}
                  </span>
                  {stats.isAllCompleted ? (
                    <CheckCircle size={15} className={isSelected ? "text-emerald-300" : "text-emerald-500"} />
                  ) : stats.revision > 0 ? (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title={`${stats.revision} needs revision`} />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 3. DEPARTMENT TABS STRIP ─────────────────────────────────── */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {DEPARTMENT_TABS.map((tab) => {
            const stats = getDeptStats(tab.id);
            const TabIcon = tab.icon;
            const isActive = selectedDeptTab === tab.id;
            const isComplete = stats.total > 0 && stats.completed === stats.total;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedDeptTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? `bg-gradient-to-r ${tab.activeColor} text-white shadow-md ring-2 ${tab.activeRing}/30`
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/60"
                }`}
              >
                <TabIcon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : isComplete
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-200/80 text-gray-700"
                  }`}
                >
                  {stats.completed}/{stats.total}
                </span>
                {stats.revision > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title={`${stats.revision} needs revision`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-gray-500 font-semibold px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100 hidden sm:flex items-center gap-1.5">
          <span>{activeWeek.label} Active:</span>
          <strong className="text-gray-800">{DEPARTMENT_TABS.find((t) => t.id === selectedDeptTab)?.label}</strong>
        </div>
      </div>

      {/* ─── 4. CLIENT CARDS SECTION ─────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedDeptTab === "ALL" ? "All Active Clients" : `${DEPARTMENT_TABS.find((t) => t.id === selectedDeptTab)?.label} Clients`}
              </h2>
              <span className="text-sm font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                {activeWeek.label} · {activeWeek.dateRange}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Submit your 1 weekly update (<span className="font-semibold text-gray-700">Voice Note</span>,{" "}
              <span className="font-semibold text-gray-700">Screenshots</span>, or{" "}
              <span className="font-semibold text-gray-700">Reason</span>) for {activeWeek.label}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {currentTabStats.revision > 0 && (
              <div className="bg-rose-50 text-rose-700 px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border border-rose-200 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                {currentTabStats.revision} Needs Revision
              </div>
            )}
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {currentTabStats.completed} / {filteredClients.length} Completed for {activeWeek.label}
            </div>
          </div>
        </div>

        {allSubmittedCurrentTab && filteredClients.length > 0 && (
          <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900">
                  All {selectedDeptTab === "ALL" ? "Client" : DEPARTMENT_TABS.find((t) => t.id === selectedDeptTab)?.label} Reports Submitted for {activeWeek.label}!
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Great job! All {filteredClients.length} clients in this department are completed for {activeWeek.label} ({activeWeek.dateRange}).
                </p>
              </div>
            </div>
            <span className="text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg bg-emerald-200/80 text-emerald-900">
              100% Complete
            </span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 bg-gray-50 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CheckCircle className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-lg font-medium">
              No active {selectedDeptTab === "ALL" ? "" : DEPARTMENT_TABS.find((t) => t.id === selectedDeptTab)?.label} clients assigned to you right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredClients.map((client) => {
                const isSubmitted = submittedClients.has(client.id);
                const submittedInfo = submittedDetails[client.id];
                const needsRevision = submittedInfo?.qaStatus === "REJECTED";
                const isEditing = editingClients[client.id] || needsRevision;
                const isUnableToSubmit =
                  submittedInfo?.reportType === "UNABLE_TO_SUBMIT" ||
                  submittedInfo?.status === "Unable to Submit";

                const isSubmitting = submittingClients[client.id];
                const mode = clientModes[client.id] || "VOICE";

                const audioFile = clientAudio[client.id];
                const screenshots = clientScreenshots[client.id] || [];
                const reasonText = clientReasons[client.id] || "";

                const hasSelection =
                  mode === "VOICE"
                    ? !!audioFile
                    : mode === "SCREENSHOTS"
                    ? screenshots.length > 0
                    : !!reasonText.trim();

                return (
                  <div
                    key={client.id}
                    className={`rounded-2xl border-2 transition-all duration-300 flex flex-col overflow-hidden ${
                      needsRevision
                        ? "border-rose-300 bg-rose-50/15 shadow-md ring-2 ring-rose-200"
                        : isSubmitted && !isEditing
                        ? isUnableToSubmit
                          ? "border-amber-200 bg-amber-50/20 shadow-sm"
                          : "border-green-200 bg-green-50/20 shadow-sm"
                        : hasSelection
                        ? "border-blue-200 bg-blue-50/10 shadow-md"
                        : "border-gray-100 bg-white hover:border-gray-200 shadow-sm"
                    }`}
                  >
                    {/* Card Header */}
                    <div
                      className={`p-4 border-b flex justify-between items-center ${
                        needsRevision
                          ? "bg-rose-50/80 border-rose-100"
                          : isSubmitted && !isEditing && isUnableToSubmit
                          ? "bg-amber-50/80 border-amber-100"
                          : "bg-gray-50/60 border-gray-100"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-800 truncate text-base">
                            {client.projectName || client.clientName}
                          </h3>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full tracking-wider uppercase shrink-0 ${
                              getDepartmentCategory(client) === "SEO"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : getDepartmentCategory(client) === "Social Media"
                                ? "bg-pink-100 text-pink-800 border border-pink-200"
                                : "bg-orange-100 text-orange-800 border border-orange-200"
                            }`}
                          >
                            {getDepartmentCategory(client) === "Marketing" ? "Meta Ads" : getDepartmentCategory(client)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                          {client.status || "Active"}
                        </p>
                      </div>

                      {needsRevision ? (
                        <span className="bg-rose-100 text-rose-700 text-xs font-black px-2.5 py-1 rounded-md flex items-center gap-1 border border-rose-200 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Needs Revision
                        </span>
                      ) : isSubmitted && !isEditing ? (
                        isUnableToSubmit ? (
                          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Unable to Submit
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Done
                          </span>
                        )
                      ) : null}
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      {isSubmitted && !isEditing ? (
                        /* Submitted State */
                        <div className="py-6 flex flex-col items-center justify-center text-center">
                          {isUnableToSubmit ? (
                            <>
                              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                                <AlertTriangle className="w-7 h-7" />
                              </div>
                              <h4 className="font-bold text-gray-800 text-base mb-1">
                                Marked as Unable to Submit
                              </h4>
                              <p className="text-xs text-gray-500 font-medium mb-3">
                                Reason reported to Quality Control (QA)
                              </p>
                              <div className="w-full bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-950 font-medium text-left mb-4">
                                <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider mb-1">
                                  Reason Provided:
                                </span>
                                "{submittedInfo?.reason || "Reason provided during submission"}"
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3">
                                <CheckCircle className="w-8 h-8" />
                              </div>
                              <h4 className="font-bold text-gray-800 text-base mb-1">
                                Successfully Submitted
                              </h4>
                              <p className="text-xs text-gray-500 font-medium mb-4">
                                {submittedInfo?.reportType === "SCREENSHOTS"
                                  ? `Conversation Screenshots (${
                                      submittedInfo.screenshots?.length || 0
                                    } images)`
                                  : "Voice Feedback Recording"}
                              </p>

                              {/* Preview if available */}
                              {submittedInfo?.reportType === "VOICE" &&
                                submittedInfo.audioUrl && (
                                  <div className="w-full bg-white p-3 rounded-xl border border-green-200 mb-3">
                                    <audio
                                      controls
                                      src={submittedInfo.audioUrl}
                                      className="w-full h-8"
                                    />
                                  </div>
                                )}

                              {submittedInfo?.reportType === "SCREENSHOTS" &&
                                submittedInfo.screenshots?.length > 0 && (
                                  <button
                                    onClick={() =>
                                      openLightbox(
                                        submittedInfo.screenshots,
                                        0,
                                        client.projectName || client.clientName
                                      )
                                    }
                                    className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center gap-1.5 border border-indigo-100 mb-3"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    View {submittedInfo.screenshots.length} Screenshots
                                  </button>
                                )}
                            </>
                          )}

                          {/* QA Status & Action Button */}
                          <div className="w-full flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                                submittedInfo?.qaStatus === "APPROVED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {submittedInfo?.qaStatus === "APPROVED" ? (
                                <CheckCircle className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              {submittedInfo?.qaStatus === "APPROVED"
                                ? "QA Approved"
                                : "Pending QA Review"}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setEditingClients((prev) => ({
                                  ...prev,
                                  [client.id]: true
                                }))
                              }
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" /> Update
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Input / Revision Form State */
                        <div>
                          {/* Needs Revision Feedback Banner */}
                          {needsRevision && (
                            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4 text-xs shadow-xs">
                              <div className="flex items-center gap-1.5 font-extrabold text-rose-800 mb-1.5">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                QA Requested Revision
                              </div>
                              {submittedInfo?.qaFeedback ? (
                                <div className="bg-white/90 p-3 rounded-xl border border-rose-200/80 my-2">
                                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-1">
                                    QA Feedback / Remarks:
                                  </span>
                                  <p className="text-rose-950 font-bold italic leading-relaxed">
                                    "{submittedInfo.qaFeedback}"
                                  </p>
                                </div>
                              ) : (
                                <p className="text-rose-700 font-medium my-1">
                                  QA has requested revision on this client report.
                                </p>
                              )}

                              {/* Previous submission review link if applicable */}
                              {submittedInfo?.screenshots?.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openLightbox(
                                      submittedInfo.screenshots,
                                      0,
                                      `${client.projectName || client.clientName} - Previous Submission`
                                    )
                                  }
                                  className="mt-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" /> View previously submitted {submittedInfo.screenshots.length} screenshot(s)
                                </button>
                              )}
                              {submittedInfo?.audioUrl && (
                                <div className="mt-2 pt-2 border-t border-rose-200/60">
                                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mb-1">
                                    Previous Voice Recording:
                                  </span>
                                  <audio controls src={submittedInfo.audioUrl} className="w-full h-7" />
                                </div>
                              )}
                              <p className="text-[11px] text-rose-600 font-semibold mt-2">
                                ↳ Submit your updated voice recording, screenshots, or reason below:
                              </p>
                            </div>
                          )}

                          {/* Segmented Mode Selector: 3 Options */}
                          <div className="flex bg-gray-100 p-1 rounded-xl mb-4 gap-1">
                            <button
                              type="button"
                              onClick={() => handleModeChange(client.id, "VOICE")}
                              className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                                mode === "VOICE"
                                  ? "bg-white text-blue-600 shadow-sm"
                                  : "text-gray-500 hover:text-gray-700"
                              }`}
                            >
                              <Mic className="w-3.5 h-3.5" />
                              Voice
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModeChange(client.id, "SCREENSHOTS")}
                              className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                                mode === "SCREENSHOTS"
                                  ? "bg-white text-indigo-600 shadow-sm"
                                  : "text-gray-500 hover:text-gray-700"
                              }`}
                            >
                              <Images className="w-3.5 h-3.5" />
                              Screenshots
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModeChange(client.id, "UNABLE_TO_SUBMIT")}
                              className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                                mode === "UNABLE_TO_SUBMIT"
                                  ? "bg-white text-amber-700 shadow-sm"
                                  : "text-gray-500 hover:text-gray-700"
                              }`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              Unable
                            </button>
                          </div>

                          {/* Mode: VOICE */}
                          {mode === "VOICE" && (
                            <div>
                              {!audioFile ? (
                                <label className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 rounded-xl cursor-pointer transition-all group">
                                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <UploadCloud className="w-6 h-6" />
                                  </div>
                                  <span className="text-sm font-bold text-gray-700">
                                    Upload Recording
                                  </span>
                                  <span className="text-xs text-gray-400 mt-1">
                                    MP3, M4A, WAV, AAC
                                  </span>
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleAudioSelect(client.id, e.target.files[0])
                                    }
                                  />
                                </label>
                              ) : (
                                <div className="w-full flex flex-col items-center relative bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                                  <button
                                    onClick={() => handleRemoveAudio(client.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full shadow-sm transition-colors"
                                    title="Remove audio"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>

                                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                                    <FileAudio className="w-5 h-5" />
                                  </div>
                                  <p className="text-xs font-bold text-gray-800 w-full truncate text-center px-4">
                                    {audioFile.name}
                                  </p>
                                  <p className="text-[11px] text-gray-500 mb-3">
                                    {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                                  </p>

                                  <audio
                                    controls
                                    src={URL.createObjectURL(audioFile)}
                                    className="w-full h-8 mb-4 scale-95"
                                  />

                                  <div className="w-full flex items-center gap-2">
                                    {isEditing && !needsRevision && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingClients((prev) => ({
                                            ...prev,
                                            [client.id]: false
                                          }))
                                        }
                                        className="py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleSubmitSingle(client)}
                                      disabled={isSubmitting}
                                      className={`flex-1 py-2.5 px-4 rounded-xl text-white font-bold text-xs transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-md ${
                                        needsRevision
                                          ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                                          : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                                      }`}
                                    >
                                      {isSubmitting ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                      ) : (
                                        <>
                                          <Send className="w-4 h-4" />
                                          {needsRevision
                                            ? "Re-Submit Voice Report"
                                            : "Submit Voice Report"}
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Mode: SCREENSHOTS */}
                          {mode === "SCREENSHOTS" && (
                            <div>
                              {screenshots.length === 0 ? (
                                <label className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-xl cursor-pointer transition-all group">
                                  <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Images className="w-6 h-6" />
                                  </div>
                                  <span className="text-sm font-bold text-gray-700">
                                    Upload Screenshots
                                  </span>
                                  <span className="text-xs text-gray-400 mt-1">
                                    Multiple PNG, JPG, WEBP allowed
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) =>
                                      handleScreenshotsSelect(client.id, e.target.files)
                                    }
                                  />
                                </label>
                              ) : (
                                <div className="space-y-3">
                                  {/* Screenshots Header */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-indigo-100">
                                      <ImageIcon className="w-3.5 h-3.5" />
                                      {screenshots.length} Screenshot
                                      {screenshots.length > 1 ? "s" : ""}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <label className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Add More
                                        <input
                                          type="file"
                                          accept="image/*"
                                          multiple
                                          className="hidden"
                                          onChange={(e) =>
                                            handleScreenshotsSelect(
                                              client.id,
                                              e.target.files
                                            )
                                          }
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => handleClearScreenshots(client.id)}
                                        className="text-[11px] font-semibold text-gray-400 hover:text-red-500 px-2 py-1 transition-colors"
                                      >
                                        Clear
                                      </button>
                                    </div>
                                  </div>

                                  {/* Thumbnails Preview Grid */}
                                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1.5 bg-gray-50 rounded-xl border border-gray-200">
                                    {screenshots.map((file, idx) => {
                                      const url = URL.createObjectURL(file);
                                      return (
                                        <div
                                          key={idx}
                                          className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white aspect-square flex items-center justify-center shadow-xs"
                                        >
                                          <img
                                            src={url}
                                            alt={`screenshot-${idx}`}
                                            className="w-full h-full object-cover"
                                          />

                                          {/* Overlay actions */}
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                openLightbox(
                                                  screenshots.map((f) =>
                                                    URL.createObjectURL(f)
                                                  ),
                                                  idx,
                                                  client.projectName ||
                                                    client.clientName
                                                )
                                              }
                                              className="p-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-full transition-transform hover:scale-110 shadow-sm"
                                              title="Preview"
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleRemoveSingleScreenshot(
                                                  client.id,
                                                  idx
                                                )
                                              }
                                              className="p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full transition-transform hover:scale-110 shadow-sm"
                                              title="Remove"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Submit Screenshots Button */}
                                  <div className="flex items-center gap-2">
                                    {isEditing && !needsRevision && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingClients((prev) => ({
                                            ...prev,
                                            [client.id]: false
                                          }))
                                        }
                                        className="py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleSubmitSingle(client)}
                                      disabled={isSubmitting}
                                      className={`flex-1 py-2.5 px-4 rounded-xl text-white font-bold text-xs transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-md ${
                                        needsRevision
                                          ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                                          : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                                      }`}
                                    >
                                      {isSubmitting ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                      ) : (
                                        <>
                                          <Send className="w-4 h-4" />
                                          {needsRevision
                                            ? `Re-Submit Screenshots (${screenshots.length})`
                                            : `Submit Screenshots (${screenshots.length})`}
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Mode: UNABLE_TO_SUBMIT */}
                          {mode === "UNABLE_TO_SUBMIT" && (
                            <div className="space-y-3">
                              <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-xs">
                                <p className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  Why are you unable to submit for this client?
                                </p>
                                <p className="text-gray-600 text-[11px] leading-relaxed">
                                  Please provide a reason so Quality Control (QA) is informed why no recording or screenshots could be provided this week.
                                </p>
                              </div>

                              {/* Quick Suggestion Chips */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                  Quick Reasons:
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    "Client Unresponsive",
                                    "Campaign Paused",
                                    "Meeting Delayed by Client",
                                    "Awaiting Creative Approvals",
                                    "Ad Account Policy Review"
                                  ].map((chip) => (
                                    <button
                                      key={chip}
                                      type="button"
                                      onClick={() =>
                                        setClientReasons((prev) => ({
                                          ...prev,
                                          [client.id]: prev[client.id]
                                            ? `${prev[client.id]} - ${chip}`
                                            : chip
                                        }))
                                      }
                                      className="px-2.5 py-1 bg-gray-100 hover:bg-amber-100 hover:text-amber-900 text-gray-700 text-[11px] font-medium rounded-lg transition-colors border border-gray-200/60 cursor-pointer"
                                    >
                                      + {chip}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Textarea */}
                              <div>
                                <textarea
                                  rows={3}
                                  value={clientReasons[client.id] || ""}
                                  onChange={(e) =>
                                    setClientReasons((prev) => ({
                                      ...prev,
                                      [client.id]: e.target.value
                                    }))
                                  }
                                  placeholder="State why report cannot be submitted (e.g. client unresponsive for 2 weeks, campaign temporarily paused)..."
                                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all resize-none"
                                />
                              </div>

                              {/* Submit Reason Button */}
                              <div className="flex items-center gap-2">
                                {isEditing && !needsRevision && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingClients((prev) => ({
                                        ...prev,
                                        [client.id]: false
                                      }))
                                    }
                                    className="py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                )}
                                <button
                                  onClick={() => handleSubmitSingle(client)}
                                  disabled={
                                    isSubmitting || !(clientReasons[client.id]?.trim())
                                  }
                                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 cursor-pointer"
                                >
                                  {isSubmitting ? (
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                  ) : (
                                    <>
                                      <Send className="w-3.5 h-3.5" />
                                      {needsRevision
                                        ? "Re-Submit Reason for QA"
                                        : "Submit Reason to QA"}
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* Lightbox Modal for Screenshots */}
      {lightbox.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 md:p-8 animate-fade-in">
          {/* Top Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between text-white z-10 pb-4 border-b border-white/10">
            <div>
              <h3 className="font-bold text-lg">{lightbox.clientTitle}</h3>
              <p className="text-xs text-white/60">
                Screenshot {lightbox.currentIndex + 1} of {lightbox.images.length}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={lightbox.images[lightbox.currentIndex]}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              >
                <ExternalLink className="w-4 h-4" />
                Open original
              </a>
              <button
                onClick={closeLightbox}
                className="p-2 bg-white/10 hover:bg-red-500/80 rounded-xl text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Image Display */}
          <div className="flex-1 w-full max-w-5xl flex items-center justify-between my-4 relative">
            {lightbox.images.length > 1 && (
              <button
                onClick={prevLightboxImage}
                className="p-3 bg-white/10 hover:bg-white/25 rounded-2xl text-white transition-all backdrop-blur-sm -ml-4 md:ml-0"
                title="Previous"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="flex-1 h-full flex items-center justify-center p-2 overflow-hidden">
              <img
                src={lightbox.images[lightbox.currentIndex]}
                alt={`Screenshot ${lightbox.currentIndex + 1}`}
                className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl transition-all"
              />
            </div>

            {lightbox.images.length > 1 && (
              <button
                onClick={nextLightboxImage}
                className="p-3 bg-white/10 hover:bg-white/25 rounded-2xl text-white transition-all backdrop-blur-sm -mr-4 md:ml-0"
                title="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Thumbnail Strip at bottom */}
          {lightbox.images.length > 1 && (
            <div className="w-full max-w-3xl flex items-center justify-center gap-2 overflow-x-auto py-2">
              {lightbox.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightbox((prev) => ({ ...prev, currentIndex: idx }))}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    lightbox.currentIndex === idx
                      ? "border-blue-400 scale-105"
                      : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumb ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
