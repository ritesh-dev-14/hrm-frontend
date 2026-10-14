import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { toast } from "react-toastify";
import AttendanceCard from "../../components/attendece/AttendenceCard";
import {
  ShieldCheck,
  Calendar,
  CalendarDays,
  CheckCircle,
  AlertCircle,
  Briefcase,
  User,
  Mic,
  Images,
  Image as ImageIcon,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Clock,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  FileText,
  CreditCard,
  ArrowRight
} from "lucide-react";

export default function QAMetaAdsWeeklyReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0); // 0-indexed for weeks array

  // Active view tab: 'SUBMITTED' | 'UNSUBMITTED'
  const [activeTab, setActiveTab] = useState("SUBMITTED");

  // Filters within submitted tab
  const [qaStatusFilter, setQaStatusFilter] = useState("ALL"); // ALL, PENDING, APPROVED, REJECTED
  const [formatFilter, setFormatFilter] = useState("ALL"); // ALL, VOICE, SCREENSHOTS
  const [searchQuery, setSearchQuery] = useState("");

  // Review Modal state: { isOpen: boolean, report: object, action: 'APPROVE' | 'REJECT', feedback: string, isSubmitting: boolean }
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    report: null,
    action: "APPROVE",
    feedback: "",
    isSubmitting: false
  });

  // Lightbox Modal state
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
    title: ""
  });

  useEffect(() => {
    fetchTrackingData(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const fetchTrackingData = async (year, month) => {
    try {
      setLoading(true);
      const res = await API.get("/api/weekly-voice-reports/qa/meta-ads-tracking", {
        params: { year, month }
      });
      setData(res.data.data);
      // Default to first week if index is out of bounds
      if (selectedWeekIndex >= (res.data.data?.weeks?.length || 0)) {
        setSelectedWeekIndex(0);
      }
    } catch (error) {
      toast.error("Failed to load QA tracking data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevYear = () => setSelectedYear((y) => y - 1);
  const handleNextYear = () => setSelectedYear((y) => y + 1);

  // Active selected week
  const activeWeek = data?.weeks?.[selectedWeekIndex] || null;

  // Handle Quick Approve
  const handleQuickApprove = async (reportId) => {
    try {
      await API.patch(`/api/weekly-voice-reports/${reportId}/qa-review`, {
        qaStatus: "APPROVED",
        qaFeedback: "Approved by QA"
      });
      toast.success("Report approved successfully!");
      fetchTrackingData(selectedYear, selectedMonth);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve report");
    }
  };

  // Open Review / Reject Modal
  const openReviewModal = (report, action) => {
    setReviewModal({
      isOpen: true,
      report,
      action,
      feedback: report.qaFeedback || "",
      isSubmitting: false
    });
  };

  const closeReviewModal = () => {
    setReviewModal({
      isOpen: false,
      report: null,
      action: "APPROVE",
      feedback: "",
      isSubmitting: false
    });
  };

  const handleSubmitReview = async () => {
    if (!reviewModal.report) return;

    if (reviewModal.action === "REJECT" && !reviewModal.feedback.trim()) {
      toast.error("Please provide feedback explaining what needs revision.");
      return;
    }

    setReviewModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await API.patch(`/api/weekly-voice-reports/${reviewModal.report.reportId}/qa-review`, {
        qaStatus: reviewModal.action === "APPROVE" ? "APPROVED" : "REJECTED",
        qaFeedback: reviewModal.feedback.trim()
      });

      toast.success(
        reviewModal.action === "APPROVE"
          ? "Report approved successfully!"
          : "Report marked as Needs Revision."
      );
      closeReviewModal();
      fetchTrackingData(selectedYear, selectedMonth);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
      setReviewModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Lightbox handlers
  const openLightbox = (images, startIndex, title) => {
    setLightbox({
      isOpen: true,
      images,
      currentIndex: startIndex,
      title
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

  // Filter submitted reports
  const filteredSubmittedReports = (activeWeek?.submittedProjects || []).filter((item) => {
    if (qaStatusFilter !== "ALL" && item.qaStatus !== qaStatusFilter) return false;
    if (formatFilter !== "ALL" && item.reportType !== formatFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchProject = item.projectName?.toLowerCase().includes(q);
      const matchManager = item.manager?.name?.toLowerCase().includes(q);
      if (!matchProject && !matchManager) return false;
    }
    return true;
  });

  // Filter unsubmitted projects
  const filteredUnsubmittedProjects = (activeWeek?.unsubmittedProjects || []).filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchProject = item.projectName?.toLowerCase().includes(q);
      const matchManager = item.manager?.name?.toLowerCase().includes(q);
      if (!matchProject && !matchManager) return false;
    }
    return true;
  });

  const stats = activeWeek?.stats || {
    totalProjects: 0,
    submittedCount: 0,
    unsubmittedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    pendingReviewCount: 0
  };

  const submissionPercentage =
    stats.totalProjects > 0
      ? Math.round((stats.submittedCount / stats.totalProjects) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-[#0B1120] rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600 rounded-full mix-blend-screen filter blur-[90px] opacity-40 pointer-events-none"></div>
        <div className="absolute -bottom-32 left-10 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen filter blur-[90px] opacity-35 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Quality Control (QA)
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
            Meta Ads Quality Audit
          </h1>
          <p className="text-blue-100/80 text-sm md:text-base max-w-2xl leading-relaxed">
            Audit weekly voice recordings and conversation screenshots month-by-month. Verify manager client communications and approve or request revisions.
          </p>
        </div>

        {/* Year Selector & Refresh */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-1 text-white">
            <button
              onClick={handlePrevYear}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-extrabold px-3 text-sm">{selectedYear}</span>
            <button
              onClick={handleNextYear}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
              title="Next Year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => fetchTrackingData(selectedYear, selectedMonth)}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white backdrop-blur-md transition-all border border-white/10 shadow-lg flex items-center gap-2 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden md:inline font-semibold text-sm">Refresh</span>
          </button>
        </div>
      </div>

      {/* QA Employee Shift & Quick Access Bar */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left: Compact Attendance Shift Controls */}
          <div className="lg:col-span-7 lg:pr-6 lg:border-r lg:border-slate-100">
            <AttendanceCard compact={true} />
          </div>

          {/* Right: Quick Staff Portals (Leave, Payslips, Attendance History) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Staff Portals
              </span>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                Quick Access
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Apply Leave */}
              <button
                type="button"
                onClick={() => navigate("/leave")}
                className="group flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-sm transition-all text-center cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                  Apply Leave
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Balance & Req</span>
              </button>

              {/* My Payslips */}
              <button
                type="button"
                onClick={() => navigate("/payslips")}
                className="group flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm transition-all text-center cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                  My Payslips
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Salary Slips</span>
              </button>

              {/* Full Calendar */}
              <button
                type="button"
                onClick={() => navigate("/attendance")}
                className="group flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-sm transition-all text-center cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                  Attendance
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Full Log</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Month Navigation Strip */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <Calendar className="w-4 h-4 text-blue-600" />
            Select Month
          </div>
          <span className="text-xs font-semibold text-gray-400">
            Year: {selectedYear}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {data?.months?.map((m) => {
            const isSelected = m.monthIndex === selectedMonth;
            return (
              <button
                key={m.monthIndex}
                onClick={() => {
                  setSelectedMonth(m.monthIndex);
                  setSelectedWeekIndex(0);
                }}
                className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer border ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 scale-102"
                    : m.isCurrent
                    ? "bg-blue-50/70 text-blue-700 border-blue-200 hover:bg-blue-100/70"
                    : "bg-gray-50/80 text-gray-700 border-gray-100 hover:bg-gray-100"
                }`}
              >
                <span>{m.name.substring(0, 3)}</span>
                {m.isCurrent && (
                  <span
                    className={`text-[9px] font-black uppercase mt-1 px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-blue-200 text-blue-800"
                    }`}
                  >
                    Now
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Weeks Strip for Selected Month */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {data?.monthName || "Selected Month"} {selectedYear} — Weeks Breakdown
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select a week to review its submitted reports and pending projects.
            </p>
          </div>
          <div className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/60 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            {data?.weeks?.length || 4} Weeks in this Month
          </div>
        </div>

        {/* Weeks Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {data?.weeks?.map((week, idx) => {
            const isSelected = selectedWeekIndex === idx;
            const weekSubmitted = week.stats?.submittedCount || 0;
            const weekTotal = week.stats?.totalProjects || 0;

            const startDateObj = new Date(week.startDate);
            const endDateObj = new Date(week.endDate);
            const dateRangeStr = `${startDateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric"
            })} - ${endDateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric"
            })}`;

            return (
              <div
                key={week.weekIndex}
                onClick={() => setSelectedWeekIndex(idx)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20"
                    : "border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-extrabold ${
                      isSelected ? "text-blue-700" : "text-gray-800"
                    }`}
                  >
                    {week.weekLabel}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200/50">
                    W#{week.weekNumber}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-3 font-medium">
                  {dateRangeStr}
                </p>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200/60">
                  <span className="font-semibold text-gray-500">Submitted:</span>
                  <span
                    className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                      weekSubmitted === weekTotal && weekTotal > 0
                        ? "bg-green-100 text-green-700"
                        : weekSubmitted > 0
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {weekSubmitted} / {weekTotal}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOP KPI CARDS FOR SELECTED WEEK */}
      {activeWeek && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Submitted Projects */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-emerald-900/10 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                Submitted
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-gray-900">
                {stats.submittedCount}
              </span>
              <span className="text-xs font-semibold text-gray-400">
                / {stats.totalProjects} Projects
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              Reports received for {activeWeek.weekLabel}
            </p>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${submissionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* 2. Unsubmitted / Missing */}
          <div className="bg-white rounded-3xl p-6 border border-red-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-red-900/10 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-red-800 uppercase tracking-wider bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                Not Submitted
              </span>
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-red-600">
                {stats.unsubmittedCount}
              </span>
              <span className="text-xs font-semibold text-gray-400">
                Pending Reports
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              Managers have not submitted for this week
            </p>
          </div>

          {/* 3. QA Approved */}
          <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-blue-900/10 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                QA Approved
              </span>
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <ThumbsUp className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-blue-600">
                {stats.approvedCount}
              </span>
              <span className="text-xs font-semibold text-gray-400">
                Approved Reports
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              Verified by Quality Control
            </p>
          </div>

          {/* 4. Pending QA Review */}
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-amber-900/10 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                Needs QA Action
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-amber-600">
                {stats.pendingReviewCount}
              </span>
              <span className="text-xs font-semibold text-gray-400">
                Awaiting Audit
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              {stats.rejectedCount > 0
                ? `${stats.rejectedCount} marked for revision`
                : "Ready to review below"}
            </p>
          </div>
        </div>
      )}

      {/* MAIN CONTENT SECTION: TABS & PROJECTS LIST */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Tab Headers */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl max-w-fit">
            <button
              onClick={() => setActiveTab("SUBMITTED")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "SUBMITTED"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Submitted Reports
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                {stats.submittedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("UNSUBMITTED")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "UNSUBMITTED"
                  ? "bg-white text-red-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <AlertCircle className="w-4 h-4 text-red-600" />
              Not Submitted Projects
              <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                {stats.unsubmittedCount}
              </span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search project or manager..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-52 transition-all"
              />
            </div>

            {activeTab === "SUBMITTED" && (
              <>
                <select
                  value={qaStatusFilter}
                  onChange={(e) => setQaStatusFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl p-2 cursor-pointer focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All QA Statuses</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Needs Revision</option>
                </select>

                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl p-2 cursor-pointer focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Media Types</option>
                  <option value="VOICE">Voice Recording</option>
                  <option value="SCREENSHOTS">Screenshots</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* TAB 1: SUBMITTED REPORTS */}
        {activeTab === "SUBMITTED" && (
          <div>
            {filteredSubmittedReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                  <CheckCircle className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  No Submitted Reports Found
                </h3>
                <p className="text-xs text-gray-500 max-w-sm">
                  {stats.submittedCount === 0
                    ? `No reports have been submitted yet for ${activeWeek?.weekLabel}.`
                    : "No reports match your current filters."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubmittedReports.map((item) => {
                  const isVoice = item.reportType === "VOICE";
                  const screenshots = item.screenshots || [];

                  return (
                    <div
                      key={item.reportId + item.projectId}
                      className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.05)] overflow-hidden flex flex-col justify-between hover:shadow-blue-900/10 transition-all duration-300"
                    >
                      <div className="p-6">
                        {/* Header: Project & QA Status */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <h3 className="text-base font-extrabold text-gray-800 leading-tight">
                              {item.projectName}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                              <User className="w-3 h-3 text-gray-400" />
                              Mgr: {item.manager?.name || "Unassigned"}
                            </p>
                          </div>

                          {/* QA Status Badge */}
                          {item.qaStatus === "APPROVED" ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Approved
                            </span>
                          ) : item.qaStatus === "REJECTED" ? (
                            <span className="bg-red-100 text-red-800 text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 border border-red-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                              Needs Revision
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Pending Review
                            </span>
                          )}
                        </div>

                        {/* Format & Submission Info */}
                        <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 mb-4 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-gray-600">
                            <span className="font-medium text-gray-400">Format:</span>
                            {isVoice ? (
                              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1">
                                <Mic className="w-3 h-3" /> Voice Note
                              </span>
                            ) : (
                              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
                                <Images className="w-3 h-3" /> Screenshots ({screenshots.length})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-gray-600">
                            <span className="font-medium text-gray-400">Submitted:</span>
                            <span className="font-semibold text-gray-700">
                              {new Date(item.submittedAt).toLocaleDateString()} at{" "}
                              {new Date(item.submittedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>

                          {item.qaReviewer && (
                            <div className="flex items-center justify-between text-gray-600 pt-1 border-t border-gray-200/50">
                              <span className="font-medium text-gray-400">Reviewed By:</span>
                              <span className="font-semibold text-gray-700">
                                {item.qaReviewer.name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Media Preview Box */}
                        {isVoice ? (
                          <div className="bg-blue-50/40 p-3.5 rounded-2xl border border-blue-100 mb-4">
                            <p className="text-[11px] font-bold text-blue-900 mb-2 flex items-center gap-1 uppercase tracking-wider">
                              <Mic className="w-3 h-3" /> Listen to Voice Update
                            </p>
                            <audio controls src={item.audioUrl} className="w-full h-9" />
                          </div>
                        ) : (
                          <div className="bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100 mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11px] font-bold text-indigo-900 flex items-center gap-1 uppercase tracking-wider">
                                <ImageIcon className="w-3 h-3" /> Conversation Screenshots
                              </p>
                              <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                                {screenshots.length} Images
                              </span>
                            </div>

                            {/* Screenshots Grid */}
                            <div className="grid grid-cols-3 gap-1.5 mb-2">
                              {screenshots.slice(0, 3).map((url, sIdx) => {
                                const isLast = sIdx === 2 && screenshots.length > 3;
                                return (
                                  <div
                                    key={sIdx}
                                    onClick={() =>
                                      openLightbox(
                                        screenshots,
                                        sIdx,
                                        `${item.projectName} - ${activeWeek.weekLabel}`
                                      )
                                    }
                                    className="relative aspect-square rounded-lg overflow-hidden border border-indigo-200/60 bg-white cursor-pointer group shadow-xs"
                                  >
                                    <img
                                      src={url}
                                      alt="Screenshot preview"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    {isLast ? (
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-black">
                                        +{screenshots.length - 2}
                                      </div>
                                    ) : (
                                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Eye className="w-4 h-4" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <button
                              onClick={() =>
                                openLightbox(
                                  screenshots,
                                  0,
                                  `${item.projectName} - ${activeWeek.weekLabel}`
                                )
                              }
                              className="w-full py-1.5 px-2 bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 border border-indigo-200 cursor-pointer shadow-xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View All Screenshots
                            </button>
                          </div>
                        )}

                        {/* QA Feedback Note if present */}
                        {item.qaFeedback && (
                          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 mb-4 text-xs">
                            <span className="font-bold text-amber-900 block mb-0.5">
                              QA Feedback / Remarks:
                            </span>
                            <p className="text-amber-800 font-medium">
                              "{item.qaFeedback}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* QA Action Buttons Footer */}
                      <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex items-center gap-2">
                        {item.qaStatus === "APPROVED" ? (
                          <div className="w-full flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              Quality Standard Met
                            </span>
                            <button
                              onClick={() => openReviewModal(item, "REJECT")}
                              className="text-xs font-bold text-gray-500 hover:text-red-600 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-red-50"
                            >
                              Re-evaluate
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleQuickApprove(item.reportId)}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </button>

                            <button
                              onClick={() => openReviewModal(item, "REJECT")}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-red-50 text-red-600 font-bold text-xs transition-all border border-red-200 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                              Needs Revision
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NOT SUBMITTED PROJECTS */}
        {activeTab === "UNSUBMITTED" && (
          <div>
            <div className="mb-4 bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-xs text-red-800 font-medium leading-relaxed">
                The following <span className="font-extrabold">{stats.unsubmittedCount} Meta Ads projects</span> have NOT submitted their weekly report for <span className="font-extrabold">{activeWeek?.weekLabel}</span>. Follow up with the respective managers.
              </p>
            </div>

            {filteredUnsubmittedProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  100% Submission Complete!
                </h3>
                <p className="text-xs text-gray-500">
                  All active Meta Ads projects have submitted their report for this week.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUnsubmittedProjects.map((proj) => (
                  <div
                    key={proj.projectId}
                    className="p-5 rounded-2xl border-2 border-red-100/70 bg-red-50/20 flex flex-col justify-between hover:border-red-200 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-100 text-red-700">
                          Missing Submission
                        </span>
                        <span className="text-xs font-semibold text-gray-400">
                          {proj.status || "Active"}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-800 text-base mb-1">
                        {proj.projectName || proj.clientName}
                      </h4>
                      <p className="text-xs text-gray-500 mb-3">
                        Client: {proj.clientName || "N/A"}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-red-100/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-[11px]">
                          {proj.manager?.name ? proj.manager.name.charAt(0) : "?"}
                        </div>
                        <div>
                          <span className="font-bold text-gray-800 block leading-tight">
                            {proj.manager?.name || "No Manager Assigned"}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {proj.manager?.email || ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* REVIEW / REJECT MODAL */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    reviewModal.action === "APPROVE"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {reviewModal.action === "APPROVE" ? (
                    <ThumbsUp className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">
                    {reviewModal.action === "APPROVE"
                      ? "Approve Report"
                      : "Request Revision / Reject"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {reviewModal.report?.projectName}
                  </p>
                </div>
              </div>
              <button
                onClick={closeReviewModal}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-xs text-gray-600 leading-relaxed">
                {reviewModal.action === "APPROVE"
                  ? "Are you sure you want to approve this weekly report? You can add optional feedback notes below."
                  : "Please provide detailed feedback for the manager explaining why this report requires revision (e.g., inaudible audio, blurry screenshots, missing updates)."}
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  QA Feedback / Notes:
                </label>
                <textarea
                  rows={4}
                  value={reviewModal.feedback}
                  onChange={(e) =>
                    setReviewModal((prev) => ({ ...prev, feedback: e.target.value }))
                  }
                  placeholder={
                    reviewModal.action === "APPROVE"
                      ? "Optional remarks..."
                      : "Explain the issue clearly so the manager can correct it..."
                  }
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={closeReviewModal}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmitReview}
                disabled={reviewModal.isSubmitting}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                  reviewModal.action === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                    : "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                }`}
              >
                {reviewModal.isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {reviewModal.action === "APPROVE" ? "Confirm Approval" : "Submit Rejection"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR SCREENSHOTS */}
      {lightbox.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 md:p-8 animate-fade-in">
          {/* Top Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between text-white z-10 pb-4 border-b border-white/10">
            <div>
              <h3 className="font-bold text-lg">{lightbox.title}</h3>
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
                className="p-2 bg-white/10 hover:bg-red-500/80 rounded-xl text-white transition-colors cursor-pointer"
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
                className="p-3 bg-white/10 hover:bg-white/25 rounded-2xl text-white transition-all backdrop-blur-sm -ml-4 md:ml-0 cursor-pointer"
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
                className="p-3 bg-white/10 hover:bg-white/25 rounded-2xl text-white transition-all backdrop-blur-sm -mr-4 md:ml-0 cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Thumbnail Strip */}
          {lightbox.images.length > 1 && (
            <div className="w-full max-w-3xl flex items-center justify-center gap-2 overflow-x-auto py-2">
              {lightbox.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightbox((prev) => ({ ...prev, currentIndex: idx }))}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    lightbox.currentIndex === idx
                      ? "border-blue-400 scale-105"
                      : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
