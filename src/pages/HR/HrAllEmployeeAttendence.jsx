import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  CalendarDays,
  Clock3,
  TimerReset,
  Filter,
} from "lucide-react";
import { motion } from "framer-motion";

import api from "../../services/api";

export default function HrAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [selectedFilter, setSelectedFilter] =
    useState("all");

  const [selectedStatus, setSelectedStatus] =
    useState("ALL");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [attendanceRes, dashboardRes] =
        await Promise.all([
          api.get("/api/attendance"),
          api.get("/api/attendance/dashboard"),
        ]);

      setAttendance(
        attendanceRes.data?.data || [],
      );

      setDashboard(
        dashboardRes.data?.data || {},
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // FILTERED DATA

  const filteredAttendance = useMemo(() => {
    let filtered = [...attendance];

    const searchValue = search.toLowerCase();

    // SEARCH FILTER

    filtered = filtered.filter((item) => {
      const employeeName =
        item.user?.name?.toLowerCase?.() || "";

      const employeeId =
        item.user?.employeeId?.toLowerCase?.() ||
        "";

      const department =
        item.user?.department?.name?.toLowerCase?.() ||
        "";

      const position =
        item.user?.position?.toLowerCase?.() ||
        "";

      return (
        employeeName.includes(searchValue) ||
        employeeId.includes(searchValue) ||
        department.includes(searchValue) ||
        position.includes(searchValue)
      );
    });

    // DATE FILTER

    const now = new Date();

    if (selectedFilter !== "all") {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date);

        if (selectedFilter === "week") {
          const weekAgo = new Date();

          weekAgo.setDate(
            now.getDate() - 7,
          );

          return itemDate >= weekAgo;
        }

        if (selectedFilter === "month") {
          return (
            itemDate.getMonth() ===
              now.getMonth() &&
            itemDate.getFullYear() ===
              now.getFullYear()
          );
        }

        if (selectedFilter === "year") {
          return (
            itemDate.getFullYear() ===
            now.getFullYear()
          );
        }

        return true;
      });
    }

    // STATUS FILTER

    if (selectedStatus !== "ALL") {
      filtered = filtered.filter(
        (item) =>
          item.status === selectedStatus,
      );
    }

    return filtered;
  }, [
    attendance,
    search,
    selectedFilter,
    selectedStatus,
  ]);

  // FORMAT TIME

  const formatTime = (time) => {
    if (!time) return "--";

    return new Date(time).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  // FORMAT HOURS

  const formatHours = (hours) => {
    if (
      hours === null ||
      hours === undefined
    )
      return "--";

    return `${Number(hours).toFixed(
      1,
    )} hrs`;
  };

  // FORMAT DATE

  const formatDate = (date) => {
    if (!date) return "--";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-7">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-2">
              HR MANAGEMENT
            </p>

            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Attendance Dashboard
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              Monitor employee attendance,
              work sessions and status.
            </p>
          </div>

          {/* SEARCH */}

          <div className="relative w-full lg:w-[320px]">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-slate-900 transition-all"
            />
          </div>
        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Employees",
              value:
                dashboard?.totalEmployees ||
                0,
              icon: Users,
            },

            {
              label: "Present",
              value:
                dashboard?.present || 0,
              icon: CalendarDays,
            },

            {
              label: "Half Day",
              value:
                dashboard?.halfDay || 0,
              icon: TimerReset,
            },

            {
              label: "Absent",
              value:
                dashboard?.absent || 0,
              icon: Clock3,
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.04,
              }}
              className="bg-white border border-slate-200 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
                  <item.icon
                    size={20}
                    className="text-slate-700"
                  />
                </div>
              </div>

              <p className="text-xs font-medium text-slate-500 mb-1">
                {item.label}
              </p>

              <h2 className="text-3xl font-black text-slate-900">
                {item.value}
              </h2>
            </motion.div>
          ))}
        </div>

        {/* TABLE */}

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
          {/* TABLE TOP */}

          <div className="p-5 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Attendance Records
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Manage and track employee
                attendance.
              </p>
            </div>

            {/* FILTERS */}

            <div className="flex flex-col gap-3">
              {/* DATE FILTER */}

              <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-2xl">
                <div className="px-2">
                  <Filter
                    size={16}
                    className="text-slate-500"
                  />
                </div>

                {[
                  "all",
                  "week",
                  "month",
                  "year",
                ].map((filter) => (
                  <button
                    key={filter}
                    onClick={() =>
                      setSelectedFilter(
                        filter,
                      )
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                      selectedFilter ===
                      filter
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* STATUS FILTER */}

              <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-2xl">
                {[
                  "ALL",
                  "PRESENT",
                  "HALF_DAY",
                  "ABSENT",
                ].map((status) => (
                  <button
                    key={status}
                    onClick={() =>
                      setSelectedStatus(
                        status,
                      )
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                      selectedStatus ===
                      status
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    {status.replace(
                      "_",
                      " ",
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TABLE HEADER */}

          <div className="hidden lg:grid grid-cols-8 gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50">
            <p className="text-xs font-bold uppercase text-slate-500">
              Employee
            </p>

            <p className="text-xs font-bold uppercase text-slate-500">
              Department
            </p>

            <p className="text-xs font-bold uppercase text-slate-500">
              Position
            </p>

            <p className="text-xs font-bold uppercase text-slate-500">
              Date
            </p>

            <p className="text-xs font-bold uppercase text-slate-500">
              Check In
            </p>

            <p className="text-xs font-bold uppercase text-slate-500">
              Check Out
            </p>

            <p className="text-xs font-bold uppercase text-slate-500">
              Hours
            </p>

            <p className="text-xs font-bold uppercase text-right text-slate-500">
              Status
            </p>
          </div>

          {/* DATA */}

          <div>
            {!loading &&
            filteredAttendance.length >
              0 ? (
              filteredAttendance.map(
                (item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        index * 0.02,
                    }}
                    className="border-b border-slate-100 last:border-none"
                  >
                    {/* DESKTOP */}

                    <div className="hidden lg:grid grid-cols-8 gap-4 items-center px-6 py-5 hover:bg-slate-50 transition-all">
                      {/* EMPLOYEE */}

                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {item.user?.name ||
                            "Unknown"}
                        </h3>

                        <p className="text-xs text-slate-500 mt-1">
                          {item.user
                            ?.employeeId ||
                            "--"}
                        </p>
                      </div>

                      {/* DEPARTMENT */}

                      <p className="text-sm text-slate-600">
                        {item.user
                          ?.department
                          ?.name || "--"}
                      </p>

                      {/* POSITION */}

                      <p className="text-sm text-slate-600">
                        {item.user
                          ?.position ||
                          "--"}
                      </p>

                      {/* DATE */}

                      <p className="text-sm text-slate-600">
                        {formatDate(
                          item.date,
                        )}
                      </p>

                      {/* CHECK IN */}

                      <p className="text-sm text-slate-600">
                        {formatTime(
                          item.startTime,
                        )}
                      </p>

                      {/* CHECK OUT */}

                      <p className="text-sm text-slate-600">
                        {formatTime(
                          item.endTime,
                        )}
                      </p>

                      {/* HOURS */}

                      <p className="text-sm font-medium text-slate-700">
                        {formatHours(
                          item.totalHours,
                        )}
                      </p>

                      {/* STATUS */}

                      <div className="flex justify-end">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase
                        ${
                          item.status ===
                          "PRESENT"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.status ===
                                "HALF_DAY"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                        }`}
                        >
                          {item.status.replace(
                            "_",
                            " ",
                          )}
                        </span>
                      </div>
                    </div>

                    {/* MOBILE */}

                    <div className="lg:hidden p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {item.user
                              ?.name ||
                              "Unknown"}
                          </h3>

                          <p className="text-xs text-slate-500 mt-1">
                            {item.user
                              ?.employeeId ||
                              "--"}
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase
                        ${
                          item.status ===
                          "PRESENT"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.status ===
                                "HALF_DAY"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                        }`}
                        >
                          {item.status.replace(
                            "_",
                            " ",
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">
                            Department
                          </p>

                          <p className="text-sm font-medium text-slate-700">
                            {item.user
                              ?.department
                              ?.name ||
                              "--"}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">
                            Position
                          </p>

                          <p className="text-sm font-medium text-slate-700">
                            {item.user
                              ?.position ||
                              "--"}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">
                            Check In
                          </p>

                          <p className="text-sm font-medium text-slate-700">
                            {formatTime(
                              item.startTime,
                            )}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">
                            Check Out
                          </p>

                          <p className="text-sm font-medium text-slate-700">
                            {formatTime(
                              item.endTime,
                            )}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">
                            Date
                          </p>

                          <p className="text-sm font-medium text-slate-700">
                            {formatDate(
                              item.date,
                            )}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">
                            Total Hours
                          </p>

                          <p className="text-sm font-medium text-slate-700">
                            {formatHours(
                              item.totalHours,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ),
              )
            ) : (
              <div className="py-20 text-center">
                <p className="text-sm text-slate-400 font-medium">
                  {loading
                    ? "Loading attendance..."
                    : "No attendance found."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}