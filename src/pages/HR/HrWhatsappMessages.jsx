import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Send,
  Search,
  Filter,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  X,
  RotateCw,
} from "lucide-react";
import {
  getWhatsappMessages,
  getWhatsappMessageById,
  getWhatsappStatistics,
  sendWhatsappMessageManually,
  triggerWhatsappJob,
} from "../../services/whatsappApi";
import API from "../../services/api";

const WhatsappMessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingProject, setSendingProject] = useState(null);
  const [sending, setSending] = useState(false);
  const [triggeringJob, setTriggeringJob] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    projectId: "",
    managerId: "",
    datePreset: "",
    dateFrom: "",
    dateTo: "",
    status: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0, pages: 0 });

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchData();
  }, [filters]);

  const handlePresetChange = (preset) => {
    const today = new Date();
    let dateFrom = "";
    let dateTo = "";

    if (preset === "today") {
      const todayStr = today.toISOString().split("T")[0];
      dateFrom = todayStr;
      dateTo = todayStr;
    } else if (preset === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      dateFrom = yesterdayStr;
      dateTo = yesterdayStr;
    } else if (preset === "last_7_days") {
      const last7 = new Date();
      last7.setDate(today.getDate() - 7);
      dateFrom = last7.toISOString().split("T")[0];
      dateTo = today.toISOString().split("T")[0];
    } else if (preset === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      dateFrom = firstDay.toISOString().split("T")[0];
      dateTo = today.toISOString().split("T")[0];
    }

    setFilters((prev) => ({
      ...prev,
      datePreset: preset,
      dateFrom,
      dateTo,
    }));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch messages
      const messagesData = await getWhatsappMessages({
        ...filters,
        limit: 50,
        offset: pagination.offset,
      });

      setMessages(messagesData.data || []);
      setPagination(messagesData.pagination || {});

      // Fetch statistics
      const statsData = await getWhatsappStatistics(filters);
      setStats(statsData.data || {});

      // Fetch projects for manual send and filters
      if (projects.length === 0) {
        const projectsRes = await API.get("/api/projects");
        setProjects(projectsRes.data?.data || []);
      }

      // Fetch managers list for filters
      if (managers.length === 0) {
        const managersRes = await API.get("/api/hr/managers");
        setManagers(managersRes.data?.data || []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load messages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = async (message) => {
    try {
      const fullMessage = await getWhatsappMessageById(message.id);
      setSelectedMessage(fullMessage.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Error fetching message:", err);
      setError("Failed to load message details");
    }
  };

  const handleSendManual = async () => {
    if (!sendingProject) return;

    try {
      setSending(true);
      await sendWhatsappMessageManually(sendingProject);
      setShowSendModal(false);
      setSendingProject(null);
      // Refresh messages
      await fetchData();
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleTriggerJob = async () => {
    try {
      setTriggeringJob(true);
      await triggerWhatsappJob();
      // Refresh data
      await fetchData();
      alert("Job triggered successfully! Messages will be processed.");
    } catch (err) {
      console.error("Error triggering job:", err);
      setError(err.response?.data?.message || "Failed to trigger job");
    } finally {
      setTriggeringJob(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "SENT":
        return <Send className="h-5 w-5 text-blue-500" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "FAILED":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <MessageCircle className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClass = "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2";
    switch (status) {
      case "DELIVERED":
        return <span className={`${baseClass} bg-green-100 text-green-700`}>{getStatusIcon(status)} Delivered</span>;
      case "SENT":
        return <span className={`${baseClass} bg-blue-100 text-blue-700`}>{getStatusIcon(status)} Sent</span>;
      case "PENDING":
        return <span className={`${baseClass} bg-yellow-100 text-yellow-700`}>{getStatusIcon(status)} Pending</span>;
      case "FAILED":
        return <span className={`${baseClass} bg-red-100 text-red-700`}>{getStatusIcon(status)} Failed</span>;
      default:
        return <span className={`${baseClass} bg-slate-100 text-slate-700`}>Unknown</span>;
    }
  };

  if (loading && messages.length === 0) {
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-3 rounded-xl">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">WhatsApp Messages</h1>
              <p className="text-slate-600">Client messaging history and analytics</p>
            </div>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSendModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
            >
              <Send className="h-4 w-4" />
              Send Manual
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleTriggerJob}
              disabled={triggeringJob}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <RotateCw className={`h-4 w-4 ${triggeringJob ? "animate-spin" : ""}`} />
              Trigger Job
            </motion.button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon={<Send className="h-5 w-5" />} label="Total Sent" value={stats.sent} color="blue" />
            <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Delivered" value={stats.delivered} color="green" />
            <StatCard icon={<AlertCircle className="h-5 w-5" />} label="Failed" value={stats.failed} color="red" />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Success Rate"
              value={`${stats.successRate}%`}
              color="purple"
            />
          </div>
        )}
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white px-4 py-2 rounded-lg border border-slate-200 flex items-center gap-2 hover:border-slate-300 transition-all"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          {Object.values(filters).some((f) => f) && (
            <button
              onClick={() => setFilters({ projectId: "", managerId: "", datePreset: "", dateFrom: "", dateTo: "", status: "" })}
              className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-slate-300"
            >
              Clear Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="bg-white p-6 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date Filter</label>
              <select
                value={filters.datePreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Custom Range</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="this_month">This Month</option>
              </select>
            </div>
            {filters.datePreset === "" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Project</label>
              <select
                value={filters.projectId}
                onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Manager</label>
              <select
                value={filters.managerId}
                onChange={(e) => setFilters({ ...filters, managerId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Managers</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="SENT">Sent</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>
        )}
      </motion.div>

      {/* Messages Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Project</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Manager</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No messages found
                  </td>
                </tr>
              ) : (
                messages.map((msg, idx) => (
                  <motion.tr key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(msg.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{msg.clientName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{msg.projectName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{msg.managerName}</td>
                    <td className="px-6 py-4">{getStatusBadge(msg.status)}</td>
                    <td className="px-6 py-4 text-center">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewMessage(msg)}
                        className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 mx-auto"
                      >
                        View <ChevronRight className="h-4 w-4" />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-600">
              Page {Math.floor(pagination.offset / pagination.limit) + 1} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
                disabled={pagination.offset === 0}
                className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:border-slate-300"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
                disabled={pagination.offset + pagination.limit >= pagination.total}
                className="px-4 py-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:border-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Message Detail Modal */}
      {showDetailModal && selectedMessage && (
        <MessageDetailModal message={selectedMessage} onClose={() => setShowDetailModal(false)} />
      )}

      {/* Manual Send Modal */}
      {showSendModal && (
        <SendMessageModal
          projects={projects}
          selectedProject={sendingProject}
          onSelectProject={setSendingProject}
          onSend={handleSendManual}
          onClose={() => {
            setShowSendModal(false);
            setSendingProject(null);
          }}
          sending={sending}
        />
      )}
    </div>
  );
};

// Statistics Card Component
const StatCard = ({ icon, label, value, color }) => {
  const bgColors = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    red: "bg-red-50",
    purple: "bg-purple-50",
  };
  const textColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    purple: "text-purple-600",
  };

  return (
    <motion.div whileHover={{ y: -5 }} className={`${bgColors[color]} p-6 rounded-lg border border-slate-200`}>
      <div className="flex items-center gap-3 mb-2">
        <span className={textColors[color]}>{icon}</span>
        <p className="text-slate-600 text-sm font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </motion.div>
  );
};

// Message Detail Modal Component
const MessageDetailModal = ({ message, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{message.projectName}</h2>
            <p className="text-indigo-100">{message.clientName}</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-indigo-500 p-2 rounded-lg transition-all">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Manager</label>
              <p className="text-slate-900 font-medium">{message.managerName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Client Phone</label>
              <p className="text-slate-900 font-medium">{message.clientPhone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Sent At</label>
              <p className="text-slate-900 font-medium">{message.sentAt ? new Date(message.sentAt).toLocaleString() : "Not sent"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${message.status === "DELIVERED" ? "bg-green-100 text-green-700" : message.status === "SENT" ? "bg-blue-100 text-blue-700" : message.status === "FAILED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {message.status}
                </span>
              </div>
            </div>
          </div>

          {message.failureReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-700 mb-1">Failure Reason</p>
              <p className="text-red-600 text-sm">{message.failureReason}</p>
            </div>
          )}

          {/* Full Message Content */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Full Message Content</label>
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 whitespace-pre-wrap text-sm text-slate-700 font-mono leading-relaxed">
              {message.fullContent}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Send Message Modal Component
const SendMessageModal = ({ projects, selectedProject, onSelectProject, onSend, onClose, sending }) => {
  const socialMediaProjects = projects.filter((p) => p.department?.name?.includes("Social") || p.department?.name?.includes("Marketing"));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-2xl max-w-md w-full"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Send WhatsApp Message</h2>
          <button onClick={onClose} className="text-white hover:bg-indigo-500 p-2 rounded-lg transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Project</label>
            <select
              value={selectedProject || ""}
              onChange={(e) => onSelectProject(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose a project...</option>
              {socialMediaProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName} ({p.clientName || "No client"})
                </option>
              ))}
            </select>
          </div>

          <p className="text-sm text-slate-600 mb-6">
            This will generate a message with today's upload status and social media statistics, then send it via WhatsApp to the client.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onSend}
              disabled={!selectedProject || sending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
            >
              {sending ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WhatsappMessagesPage;
