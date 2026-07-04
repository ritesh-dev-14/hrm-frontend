import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  CheckCircle2,
  FolderOpen,
  Users,
  Loader2,
} from "lucide-react";

import AttendanceCard from "../../components/attendece/AttendenceCard";
import API from "../../services/api";

const ManagerHomePage = () => {
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);

  const user =
    JSON.parse(localStorage.getItem("user")) || {};

  const firstName =
    user?.name?.split(" ")[0] || "Manager";

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const res = await API.get(
        "/api/manager/dashboard",
      );

      if (res?.data?.success) {
        setDashboard(res.data.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!dashboard) return [];

    return [
      {
        title: "Total Tasks",
        value: dashboard.totalTasks || 0,
        icon: ClipboardList,
      },

      {
        title: "Completed",
        value: dashboard.completedTasks || 0,
        icon: CheckCircle2,
      },

      {
        title: "Draft Tasks",
        value: dashboard.draftTasks || 0,
        icon: FolderOpen,
      },

      {
        title: "Employees",
        value: dashboard.totalEmployees || 0,
        icon: Users,
      },
    ];
  }, [dashboard]);

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* TOP HEADER */}

        <div className="bg-white border border-slate-200 rounded-[32px] px-6 sm:px-8 py-7 mb-7 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold mb-3">
                Manager Workspace
              </p>

              <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
                Welcome back, {firstName}
              </h1>

              <p className="text-sm text-slate-500 mt-4 max-w-2xl leading-7">
                Monitor employees, task assignments and
                overall team performance from one place.
              </p>
            </div>

            <div className="flex items-center gap-10">
              <div>
                <p className="text-xs text-slate-400 mb-1">
                  Employees
                </p>

                <h3 className="text-2xl font-semibold text-slate-900">
                  {dashboard?.totalEmployees || 0}
                </h3>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1">
                  Tasks
                </p>

                <h3 className="text-2xl font-semibold text-slate-900">
                  {dashboard?.totalTasks || 0}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* ATTENDANCE */}

        <div className="bg-white border border-slate-200 rounded-[32px] p-5 sm:p-7 shadow-sm mb-7">
          <AttendanceCard />
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-[32px] h-[300px] flex flex-col items-center justify-center shadow-sm">
            <Loader2
              size={26}
              className="animate-spin text-slate-500"
            />

            <p className="text-sm text-slate-400 mt-4">
              Loading dashboard...
            </p>
          </div>
        ) : (
          <>
            {/* STATS */}

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-7">
              {stats.map((item, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 mb-5">
                    <item.icon size={20} />
                  </div>

                  <p className="text-sm text-slate-500 mb-2">
                    {item.title}
                  </p>

                  <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">
                    {item.value}
                  </h2>
                </div>
              ))}
            </div>

            {/* EMPLOYEES */}

            <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
              {/* HEADER */}

              <div className="px-6 sm:px-8 py-6 border-b border-slate-100">
                <h2 className="text-2xl font-semibold text-slate-900">
                  Employees Overview
                </h2>

                <p className="text-sm text-slate-500 mt-2">
                  Track assigned, completed and active
                  employee work.
                </p>
              </div>

              {/* TABLE HEADER */}

              <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50 border-b border-slate-100">
                <div className="col-span-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Employee
                </div>

                <div className="col-span-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Assigned
                </div>

                <div className="col-span-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Completed
                </div>

                <div className="col-span-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  In Progress
                </div>

                <div className="col-span-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Draft
                </div>
              </div>

              {/* EMPLOYEE LIST */}

              <div>
                {dashboard?.employees?.length >
                0 ? (
                  dashboard.employees.map(
                    (employee) => (
                      <div
                        key={employee.id}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-4 px-6 sm:px-8 py-6 border-b border-slate-100 hover:bg-slate-50/70 transition-all"
                      >
                        {/* USER */}

                        <div className="lg:col-span-4">
                          <h3 className="text-base font-semibold text-slate-900">
                            {employee.name}
                          </h3>

                          <p className="text-sm text-slate-500 mt-1">
                            {
                              employee.employeeId
                            }
                          </p>

                          <p className="text-sm text-slate-400 mt-1 break-all">
                            {employee.email}
                          </p>
                        </div>

                        {/* STATS */}

                        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <MiniStat
                            title="Assigned"
                            value={
                              employee.totalTasksAssigned
                            }
                          />

                          <MiniStat
                            title="Completed"
                            value={
                              employee.completedTasksCount
                            }
                          />

                          <MiniStat
                            title="Progress"
                            value={
                              employee.inProgressTasksCount
                            }
                          />

                          <MiniStat
                            title="Draft"
                            value={
                              employee.draftTasksCount
                            }
                          />
                        </div>
                      </div>
                    ),
                  )
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-sm text-slate-400">
                      No employees found
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const MiniStat = ({ title, value }) => {
  return (
    <div className="bg-slate-50 rounded-2xl px-4 py-4">
      <p className="text-xs text-slate-400 mb-2">
        {title}
      </p>

      <h3 className="text-xl font-semibold text-slate-900">
        {value}
      </h3>
    </div>
  );
};

export default ManagerHomePage;
