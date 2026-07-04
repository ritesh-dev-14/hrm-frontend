import { useEffect, useMemo, useRef, useState } from "react";

import {
  CheckCircle2,
  XCircle,
  Clock3,
  Search,
  Filter,
  ChevronDown,
  Check,
  CalendarDays,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

import API from "../../services/api";

// ---------------- STATUS FILTER ----------------
const CustomStatusFilter = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  const ref = useRef(null);

  const options = [
    { label: "All Requests", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", close);

    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div
      ref={ref}
      className="relative w-full md:w-[240px] lg:min-w-[240px]"
    >
      <button
        onClick={() => setOpen(!open)}
        className={`w-full h-12 sm:h-13 flex items-center justify-between px-4 sm:px-5 rounded-2xl border bg-white transition-all
        ${
          open
            ? "border-slate-300 shadow-sm"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Filter size={17} className="text-slate-400 shrink-0" />

          <span className="text-sm font-semibold text-slate-700 truncate">
            {options.find((o) => o.value === value)?.label}
          </span>
        </div>

        <ChevronDown
          size={17}
          className={`text-slate-400 transition-transform shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 4 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden"
          >
            {options.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-5 py-3 text-sm font-medium transition-all
                ${
                  value === item.value
                    ? "bg-black text-white"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                {item.label}

                {value === item.value && <Check size={16} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------------- MAIN PAGE ----------------
export default function HrLeaveManagement() {
  const [leaveRequests, setLeaveRequests] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  // ---------------- FETCH ----------------
  const fetchLeaves = async () => {
    try {
      setLoading(true);

      const res = await API.get("/api/hr/leaves");

      setLeaveRequests(res.data?.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // ---------------- UPDATE STATUS ----------------
  const updateLeaveStatus = async (
    leaveId,
    status,
    reviewNote = "",
  ) => {
    try {
      const payload =
        status === "REJECTED"
          ? { status, reviewNote }
          : { status };

      await API.put(`/api/hr/leave/${leaveId}`, payload);

      setLeaveRequests((prev) =>
        prev.map((leave) =>
          leave.id === leaveId
            ? { ...leave, status, reviewNote }
            : leave,
        ),
      );
    } catch (err) {
      console.log(err);
    }
  };

  const handleApprove = (id) => {
    updateLeaveStatus(id, "APPROVED");
  };

  const handleReject = (id) => {
    const note = prompt("Enter rejection reason");

    if (note?.trim()) {
      updateLeaveStatus(id, "REJECTED", note);
    }
  };

  // ---------------- FILTER ----------------
  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter((leave) => {
      const matchesSearch =
        leave.user?.name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        leave.user?.employeeId
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : leave.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leaveRequests, search, statusFilter]);

  // ---------------- STATS ----------------
  const stats = useMemo(() => {
    return {
      pending: leaveRequests.filter(
        (l) => l.status === "PENDING",
      ).length,

      approved: leaveRequests.filter(
        (l) => l.status === "APPROVED",
      ).length,

      rejected: leaveRequests.filter(
        (l) => l.status === "REJECTED",
      ).length,
    };
  }, [leaveRequests]);

  const cards = [
    {
      label: "Pending",
      count: stats.pending,
      icon: Clock3,
      color: "bg-slate-100 text-slate-700",
    },
    {
      label: "Approved",
      count: stats.approved,
      icon: CheckCircle2,
      color: "bg-slate-100 text-slate-700",
    },
    {
      label: "Rejected",
      count: stats.rejected,
      icon: XCircle,
      color: "bg-slate-100 text-slate-700",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Leave Management
          </h1>

          <p className="text-slate-500 mt-2 text-sm">
            Review and manage employee leave requests
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {card.label}
                  </p>

                  <h2 className="text-3xl font-bold text-slate-900 mt-2">
                    {card.count}
                  </h2>
                </div>

                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center ${card.color}`}
                >
                  <card.icon size={20} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* SEARCH */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 sm:h-13 pl-11 pr-4 rounded-2xl border border-slate-200 bg-white text-sm font-medium outline-none focus:border-slate-400 transition-all"
            />
          </div>

          <CustomStatusFilter
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden lg:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-8 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Employee
                  </th>

                  <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Leave
                  </th>

                  <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Duration
                  </th>

                  <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Status
                  </th>

                  <th className="px-8 py-5 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">
                      <div className="w-7 h-7 border-2 border-slate-300 border-t-black rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">
                      <p className="text-sm font-medium text-slate-400">
                        No leave requests found
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((leave) => (
                    <>
                      <tr
                        key={leave.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        {/* EMPLOYEE */}
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700">
                              {leave.user?.name
                                ?.split(" ")
                                ?.map((n) => n[0])
                                ?.join("")
                                ?.slice(0, 2)}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900 text-sm">
                                {leave.user?.name}
                              </p>

                              <p className="text-xs text-slate-400 mt-0.5">
                                {leave.user?.employeeId}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* TYPE */}
                        <td className="px-6 py-5">
                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              {leave.type}
                            </p>

                            <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                              {leave.reason}
                            </p>
                          </div>
                        </td>

                        {/* DURATION */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                            <CalendarDays
                              size={15}
                              className="text-slate-400"
                            />

                            <span>
                              {new Date(
                                leave.startDate,
                              ).toLocaleDateString()}
                            </span>

                            <span className="text-slate-300">
                              —
                            </span>

                            <span>
                              {new Date(
                                leave.endDate,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-5">
                          <StatusBadge
                            status={leave.status}
                          />
                        </td>

                        {/* ACTIONS */}
                        <td className="px-8 py-5">
                          {leave.status === "PENDING" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  handleApprove(leave.id)
                                }
                                className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center hover:bg-slate-800 transition-all"
                              >
                                <CheckCircle2 size={18} />
                              </button>

                              <button
                                onClick={() =>
                                  handleReject(leave.id)
                                }
                                className="w-10 h-10 rounded-xl border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 transition-all"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          ) : (
                            <div className="text-right">
                              <span className="text-[11px] uppercase tracking-widest text-slate-300 font-bold">
                                Processed
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* REJECTION NOTE */}
                      {leave.status === "REJECTED" &&
                        leave.reviewNote && (
                          <tr className="bg-slate-50">
                            <td
                              colSpan="5"
                              className="px-8 pb-5"
                            >
                              <div className="border-l-4 border-black pl-4 py-2">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                  Rejection Reason
                                </p>

                                <p className="text-sm text-slate-700 mt-1">
                                  {leave.reviewNote}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE CARDS */}
        <div className="lg:hidden space-y-4">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 flex justify-center">
              <div className="w-7 h-7 border-2 border-slate-300 border-t-black rounded-full animate-spin" />
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
              <p className="text-sm font-medium text-slate-400">
                No leave requests found
              </p>
            </div>
          ) : (
            filteredLeaves.map((leave, index) => (
              <motion.div
                key={leave.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm"
              >
                {/* TOP */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700 shrink-0">
                      {leave.user?.name
                        ?.split(" ")
                        ?.map((n) => n[0])
                        ?.join("")
                        ?.slice(0, 2)}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {leave.user?.name}
                      </h3>

                      <p className="text-xs text-slate-400 mt-1">
                        {leave.user?.employeeId}
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={leave.status} />
                </div>

                {/* CONTENT */}
                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                      Leave Type
                    </p>

                    <p className="text-sm font-semibold text-slate-700">
                      {leave.type}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {leave.reason}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                      Duration
                    </p>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CalendarDays
                        size={15}
                        className="text-slate-400"
                      />

                      <span>
                        {new Date(
                          leave.startDate,
                        ).toLocaleDateString()}
                      </span>

                      <span>—</span>

                      <span>
                        {new Date(
                          leave.endDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {leave.status === "REJECTED" &&
                    leave.reviewNote && (
                      <div className="border-l-4 border-black pl-4">
                        <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                          Rejection Reason
                        </p>

                        <p className="text-sm text-slate-700 mt-1">
                          {leave.reviewNote}
                        </p>
                      </div>
                    )}
                </div>

                {/* ACTIONS */}
                {leave.status === "PENDING" && (
                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <button
                      onClick={() =>
                        handleApprove(leave.id)
                      }
                      className="h-11 rounded-2xl bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                    >
                      <CheckCircle2 size={17} />
                      Approve
                    </button>

                    <button
                      onClick={() =>
                        handleReject(leave.id)
                      }
                      className="h-11 rounded-2xl border border-slate-200 text-slate-700 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"
                    >
                      <XCircle size={17} />
                      Reject
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- STATUS BADGE ----------------
function StatusBadge({ status }) {
  const styles = {
    PENDING:
      "bg-slate-100 text-slate-700 border-slate-200",

    APPROVED:
      "bg-black text-white border-black",

    REJECTED:
      "bg-slate-200 text-slate-800 border-slate-300",
  };

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}
    >
      {status}
    </span>
  );
}