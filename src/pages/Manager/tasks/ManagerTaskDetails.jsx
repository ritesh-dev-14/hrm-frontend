import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  UserPlus,
  X,
  AlertCircle,
  Plus,
  ClipboardList,
  Clock3,
  CheckCheck,
  ListTodo,
  CalendarDays,
  User,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Building2,
  Check,
} from "lucide-react";

import API from "../../../services/api";
import { assignMainTaskToMe } from "./taskDetails";
import { notifySuccess, notifyError } from "../../../utils/toast";

const statusStyles = {
  DRAFT: "bg-slate-100 text-slate-700 border border-slate-200",
  ASSIGNED: "bg-blue-50 text-blue-700 border border-blue-100",
  COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  PENDING: "bg-amber-50 text-amber-700 border border-amber-100",
  SUBMITTED: "bg-violet-50 text-violet-700 border border-violet-100",
  VERIFIED: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  REJECTED: "bg-red-50 text-red-700 border border-red-100",
  UNABLE_TO_SUBMIT: "bg-rose-50 text-rose-700 border border-rose-100",
};

const priorityStyles = {
  LOW: "text-slate-500",
  MEDIUM: "text-amber-600",
  HIGH: "text-red-600",
};

const ManagerTaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [creatingSubtask, setCreatingSubtask] = useState(false);
  const [assigningToMe, setAssigningToMe] = useState(false);

  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState(null);
  // ADD THIS NEW STATE
  const [loadingMyEmployees, setLoadingMyEmployees] = useState(false);

  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  // const [showAssignSourceModal, setShowAssignSourceModal] = useState(false);
  // const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const [activeEmployeeTab, setActiveEmployeeTab] = useState("MY_EMPLOYEES");

  const [rejectModal, setRejectModal] = useState({
    open: false,
    assignmentId: null,
    reason: "",
  });

  const [subtaskForm, setSubtaskForm] = useState({
    title: "",
    description: "",
    employeeId: "",
    dueDate: "",
    priority: "MEDIUM",
  });

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  const allEmployees = useMemo(() => {
    const deptEmployees =
      departmentEmployees?.flatMap((dep) => dep.employees || []) || [];

    const combined = [...employees, ...deptEmployees];

    return combined.filter(
      (emp, index, self) =>
        index === self.findIndex((e) => e.employeeId === emp.employeeId),
    );
  }, [employees, departmentEmployees]);

  const selectedEmployee = useMemo(() => {
    return allEmployees.find(
      (emp) => emp.employeeId === subtaskForm.employeeId,
    );
  }, [allEmployees, subtaskForm.employeeId]);

  const loadPage = async () => {
    try {
      setLoading(true);

      const [itemsRes, employeeRes] = await Promise.all([
        API.get(`/api/manager/tasks/${id}/items`),
        API.get("/api/manager/my-employees"),
      ]);

      if (itemsRes?.data?.success) {
        const payload = itemsRes.data.data;

        setTask(payload.task);
        setSubtasks(payload.items || []);
        setSummary(payload.summary);
      }

      if (employeeRes?.data?.success) {
        setEmployees(employeeRes.data.data || []);
      }
    } catch (error) {
      console.error(error);
      notifyError("Failed to load task dashboard details");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMyEmployees = async () => {
    try {
      setLoadingMyEmployees(true);

      const response = await API.get("/api/manager/my-employees");

      if (response?.data?.success) {
        const employeesData = response.data.data || [];

        setEmployees(employeesData);

        setShowAssignSourceModal(false);

        // AUTO SELECT FIRST EMPLOYEE OPTIONAL
        // setSubtaskForm((prev) => ({
        //   ...prev,
        //   employeeId: employeesData[0]?.employeeId || "",
        // }));

        notifySuccess("Employees loaded successfully");
      }
    } catch (error) {
      console.error(error);

      notifyError("Failed to load manager employees");
    } finally {
      setLoadingMyEmployees(false);
    }
  };

  useEffect(() => {
    if (id) loadPage();
  }, [id]);

  const handleLoadDepartments = async () => {
    try {
      setLoadingDepartments(true);

      const response = await API.get("/api/departments/with-employees/all");

      if (response?.data?.success) {
        setDepartmentEmployees(response.data.data || []);
        setShowDepartmentModal(true);
      }
    } catch (error) {
      console.error(error);
      notifyError("Failed to load departments");
    } finally {
      setLoadingDepartments(false);
    }
  };

  const resetSubtaskForm = () => {
    setSubtaskForm({
      title: "",
      description: "",
      employeeId: "",
      dueDate: "",
      priority: "MEDIUM",
    });
  };

  const closeAllDepartmentModals = () => {
    setSelectedDepartment(null);
  };

  const handleAssignToMe = async () => {
    try {
      if (!currentUser?.employeeId) {
        notifyError("Employee ID missing");
        return;
      }

      setAssigningToMe(true);

      const response = await assignMainTaskToMe(
        task.id,
        currentUser.employeeId,
      );

      notifySuccess(
        response?.data?.message || "Main task assigned successfully",
      );

      loadPage();
    } catch (error) {
      console.error(error);
      notifyError("Failed to self assign task");
    } finally {
      setAssigningToMe(false);
    }
  };

  const handleCreateSubtask = async () => {
    try {
      if (!subtaskForm.title.trim()) {
        notifyError("Title is required");
        return;
      }

      if (!subtaskForm.employeeId) {
        notifyError("Please select employee");
        return;
      }

      if (!subtaskForm.dueDate) {
        notifyError("Please select due date");
        return;
      }

      setCreatingSubtask(true);

      await API.post(`/api/task-items/${task.id}`, {
        title: subtaskForm.title,
        description: subtaskForm.description,
        employeeId: subtaskForm.employeeId,
        dueDate: new Date(subtaskForm.dueDate).toISOString(),
        priority: subtaskForm.priority,
      });

      notifySuccess("Subtask created successfully");

      resetSubtaskForm();
      setShowSubtaskForm(false);

      loadPage();
    } catch (error) {
      console.error(error);
      notifyError("Failed to create Task");
    } finally {
      setCreatingSubtask(false);
    }
  };

  const handleOpenAssignModal = (subtask) => {
    setSelectedSubtask(subtask);

    const currentAssignments =
      subtask.assignments?.map((a) => a.employee?.employeeId) || [];

    setSelectedEmployees(currentAssignments);
    setOpenAssignModal(true);
  };

  const toggleEmployee = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId],
    );
  };

  const handleAssign = async () => {
    try {
      if (!selectedEmployees.length) {
        notifyError("Select at least one employee");
        return;
      }

      setAssigning(true);

      await API.patch(`/api/task-items/assign/${selectedSubtask.id}`, {
        employeeIds: selectedEmployees,
      });

      notifySuccess("Assignment updated");

      setOpenAssignModal(false);

      loadPage();
    } catch (error) {
      console.error(error);
      notifyError("Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const handleApproveSubmission = async (assignmentId) => {
    try {
      setActionLoadingId(assignmentId);

      await API.patch(`/api/task-item-submission/${assignmentId}/verify`);

      notifySuccess("Submission verified");

      loadPage();
    } catch (error) {
      console.error(error);
      notifyError("Verification failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSubmission = async () => {
    try {
      if (!rejectModal.reason.trim()) {
        notifyError("Rejection reason required");
        return;
      }

      setActionLoadingId(rejectModal.assignmentId);

      await API.patch(
        `/api/task-item-submission/${rejectModal.assignmentId}/reject`,
        {
          rejectionReason: rejectModal.reason,
        },
      );

      notifySuccess("Submission rejected");

      setRejectModal({
        open: false,
        assignmentId: null,
        reason: "",
      });

      loadPage();
    } catch (error) {
      console.error(error);
      notifyError("Rejection failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const stats = useMemo(() => {
    return [
      {
        title: "Total Tasks",
        value: summary?.totalItems || 0,
        icon: ListTodo,
      },
      {
        title: "Submitted",
        value: summary?.submittedCount || 0,
        icon: ClipboardList,
      },
      {
        title: "Verified",
        value: summary?.verifiedCount || 0,
        icon: CheckCheck,
      },
      {
        title: "Blocked",
        value: summary?.unableToSubmitCount || 0,
        icon: Clock3,
      },
    ];
  }, [summary]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={30} className="animate-spin text-slate-500" />
      </div>
    );
  }

  if (!task) return null;

  const isMainTaskAssignedToMe =
    task.createdBy?.employeeId === currentUser?.employeeId;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* TOP BAR */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-black transition"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        {/* HEADER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[task.status]}`}
                >
                  {task.status}
                </span>

                <span className="text-sm font-medium text-slate-500">
                  {task.progress || 0}% Progress
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                {task.projectName}
              </h1>

              <p className="mt-4 text-slate-600 leading-7 max-w-4xl">
                {task.description}
              </p>
            </div>

            <button
              onClick={handleAssignToMe}
              disabled={assigningToMe || isMainTaskAssignedToMe}
              className={`h-12 px-5 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all ${
                isMainTaskAssignedToMe
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-black text-white hover:bg-slate-800"
              }`}
            >
              <UserPlus size={16} />

              {isMainTaskAssignedToMe
                ? "Assigned "
                : assigningToMe
                  ? "Assigning..."
                  : "Assign To Me"}
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mt-6">
          {stats.map((item, index) => (
            <div
              key={index}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <item.icon size={22} className="text-slate-700" />
                </div>

                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Live
                </span>
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mt-5">
                {item.value}
              </h2>

              <p className="text-sm text-slate-500 mt-1">{item.title}</p>
            </div>
          ))}
        </div>
          
        {/* ACTION BAR */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm mt-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Task Management
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Manage assignments and review submissions
              </p>
            </div>

            <button
              onClick={() => setShowSubtaskForm(!showSubtaskForm)}
              className="h-11 px-5 rounded-2xl bg-black text-white text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition"
            >
              <Plus size={16} />
              Create Task
            </button>
          </div>
        </div>

        {/* CREATE SUBTASK FORM */}
        {showSubtaskForm && (
          <div className="mt-6 bg-white border border-slate-200 rounded-3xl p-6 md:p-8">
            {/* HEADER */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Create Task
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Assign task to employee and set deadline
                </p>
              </div>

              <button
                onClick={() => {
                  setShowSubtaskForm(false);
                  resetSubtaskForm();
                }}
                className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition"
              >
                <X size={18} className="text-slate-600" />
              </button>
            </div>

            {/* FORM */}
            <div className="mt-8 space-y-6">
              {/* TITLE */}
              <div className="grid md:grid-cols-4 gap-4 items-start">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Task Title
                  </p>

                  <p className="text-xs text-slate-400 mt-1">Enter task name</p>
                </div>

                <div className="md:col-span-3">
                  <input
                    type="text"
                    placeholder="Design dashboard UI"
                    value={subtaskForm.title}
                    onChange={(e) =>
                      setSubtaskForm({
                        ...subtaskForm,
                        title: e.target.value,
                      })
                    }
                    className="w-full h-12 px-4 rounded-xl border border-slate-300 outline-none focus:border-black text-sm"
                  />
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="grid md:grid-cols-4 gap-4 items-start">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Description
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Add task details
                  </p>
                </div>

                <div className="md:col-span-3">
                  <textarea
                    placeholder="Write task details..."
                    value={subtaskForm.description}
                    onChange={(e) =>
                      setSubtaskForm({
                        ...subtaskForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full min-h-[140px] p-4 rounded-xl border border-slate-300 outline-none resize-none focus:border-black text-sm"
                  />
                </div>
              </div>

              {/* EMPLOYEE */}
              <div className="grid md:grid-cols-4 gap-4 items-start">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Assign Employee
                  </p>

                  <p className="text-xs text-slate-400 mt-1">Select employee</p>
                </div>

                <div className="md:col-span-3">
                  {/* TOGGLE */}
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
                    <button
                      type="button"
                      onClick={async () => {
                        setSelectedDepartment(null);

                        if (employees.length === 0) {
                          await handleLoadMyEmployees();
                        }
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                        !selectedDepartment
                          ? "bg-black text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      My Employees
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (departmentEmployees.length === 0) {
                          await handleLoadDepartments();
                        }

                        if (departmentEmployees.length > 0) {
                          setSelectedDepartment(departmentEmployees[0]);
                        }
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                        selectedDepartment
                          ? "bg-black text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Other Department
                    </button>
                  </div>

                  {/* DEPARTMENT LIST */}
                  {selectedDepartment && departmentEmployees.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {departmentEmployees.map((department) => (
                        <button
                          key={department.id}
                          type="button"
                          onClick={() => setSelectedDepartment(department)}
                          className={`px-3 py-2 rounded-lg text-sm transition ${
                            selectedDepartment.id === department.id
                              ? "bg-black text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {department.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* EMPLOYEE LIST */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="max-h-[320px] overflow-y-auto">
                      {/* MY EMPLOYEES */}
                      {!selectedDepartment &&
                        employees.map((emp) => {
                          const selected =
                            subtaskForm.employeeId === emp.employeeId;

                          return (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => {
                                setSubtaskForm((prev) => ({
                                  ...prev,
                                  employeeId: emp.employeeId,
                                }));
                              }}
                              className={`w-full px-4 py-4 flex items-center justify-between border-b border-slate-100 transition ${
                                selected ? "bg-slate-100" : "hover:bg-slate-50"
                              }`}
                            >
                              <div className="text-left">
                                <p className="text-sm font-medium text-slate-900">
                                  {emp.name}
                                </p>

                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-slate-400 font-mono">
                                    {emp.employeeId}
                                  </span>

                                  {emp.department?.name && (
                                    <span className="text-xs text-slate-500">
                                      • {emp.department.name}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {selected && (
                                <Check size={16} className="text-black" />
                              )}
                            </button>
                          );
                        })}

                      {/* OTHER DEPARTMENT EMPLOYEES */}
                      {selectedDepartment &&
                        selectedDepartment.employees?.map((emp) => {
                          const selected =
                            subtaskForm.employeeId === emp.employeeId;

                          return (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => {
                                setSubtaskForm((prev) => ({
                                  ...prev,
                                  employeeId: emp.employeeId,
                                }));
                              }}
                              className={`w-full px-4 py-4 flex items-center justify-between border-b border-slate-100 transition ${
                                selected ? "bg-slate-100" : "hover:bg-slate-50"
                              }`}
                            >
                              <div className="text-left">
                                <p className="text-sm font-medium text-slate-900">
                                  {emp.name}
                                </p>

                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-slate-400 font-mono">
                                    {emp.employeeId}
                                  </span>

                                  {emp.department?.name && (
                                    <span className="text-xs text-slate-500">
                                      • {emp.department.name}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {selected && (
                                <Check size={16} className="text-black" />
                              )}
                            </button>
                          );
                        })}

                      {/* EMPTY STATE */}
                      {!selectedDepartment &&
                        employees.length === 0 &&
                        !loadingMyEmployees && (
                          <div className="p-6 text-center text-sm text-slate-400">
                            No employees found
                          </div>
                        )}

                      {loadingMyEmployees && (
                        <div className="p-6 flex items-center justify-center">
                          <Loader2
                            size={20}
                            className="animate-spin text-slate-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SELECTED EMPLOYEE */}
                  {selectedEmployee && (
                    <div className="mt-3 text-sm text-slate-600">
                      Selected Employee:
                      <span className="font-semibold text-black ml-1">
                        {selectedEmployee.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* DATE */}
              <div className="grid md:grid-cols-4 gap-4 items-start">
                <div>
                  <p className="text-sm font-medium text-slate-700">Due Date</p>

                  <p className="text-xs text-slate-400 mt-1">Select deadline</p>
                </div>

                <div className="md:col-span-3">
                  <input
                    type="date"
                    value={subtaskForm.dueDate}
                    onChange={(e) =>
                      setSubtaskForm({
                        ...subtaskForm,
                        dueDate: e.target.value,
                      })
                    }
                    className="w-full md:w-[300px] h-12 px-4 rounded-xl border border-slate-300 outline-none focus:border-black text-sm"
                  />
                </div>
              </div>

              {/* PRIORITY */}
              <div className="grid md:grid-cols-4 gap-4 items-start">
                <div>
                  <p className="text-sm font-medium text-slate-700">Priority</p>

                  <p className="text-xs text-slate-400 mt-1">
                    Select priority level
                  </p>
                </div>

                <div className="md:col-span-3 flex gap-3">
                  {["LOW", "MEDIUM", "HIGH"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setSubtaskForm({
                          ...subtaskForm,
                          priority: level,
                        })
                      }
                      className={`h-11 px-5 rounded-xl border text-sm font-medium transition ${
                        subtaskForm.priority === level
                          ? "bg-black text-white border-black"
                          : "border-slate-300 hover:border-black text-slate-700"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowSubtaskForm(false);
                    resetSubtaskForm();
                  }}
                  className="h-11 px-5 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleCreateSubtask}
                  disabled={creatingSubtask}
                  className="h-11 px-5 rounded-xl bg-black text-white text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {creatingSubtask && (
                    <Loader2 size={16} className="animate-spin" />
                  )}

                  {creatingSubtask ? "Creating..." : "Create Task"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TABLE */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mt-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Task
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Status
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Priority
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Due
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Members
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Submission Remarks
                  </th>

                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {subtasks.length > 0 ? (
                  subtasks.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      {/* TASK */}
                      <td className="px-6 py-5 max-w-sm">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {item.title}
                        </h3>

                        {item.description && (
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[item.status]}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* PRIORITY */}
                      <td className="px-6 py-5">
                        <span
                          className={`text-sm font-semibold ${priorityStyles[item.priority]}`}
                        >
                          {item.priority}
                        </span>
                      </td>

                      {/* DATE */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <CalendarDays size={15} className="text-slate-400" />

                          {formatDate(item.dueDate)}
                        </div>
                      </td>

                      {/* ASSIGNMENTS */}
                      <td className="px-6 py-5">
                        {item.assignments?.length > 0 ? (
                          <div className="space-y-2">
                            {item.assignments.map((assignment) => (
                              <div
                                key={assignment.assignmentId}
                                className="flex items-center gap-2"
                              >
                                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                  <User size={12} className="text-slate-600" />
                                </div>

                                <div>
                                  <p className="text-xs font-semibold text-slate-800">
                                    {assignment.employee?.name}
                                  </p>

                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {assignment.employee?.employeeId}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-dashed">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* SUBMISSIONS */}
                      <td className="px-6 py-5 max-w-xs">
                        {item.assignments?.map((assignment) => {
                          const sub = assignment.submission;

                          if (!sub) return null;

                          return (
                            <div
                              key={assignment.assignmentId}
                              className="text-xs space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-2"
                            >
                              {/* <p className="font-semibold text-slate-700">
                                By {assignment.employee?.name}
                              </p> */}

                              {sub.unableToSubmitReason ? (
                                <div className="text-rose-600 flex items-start gap-1">
                                  <AlertCircle
                                    size={13}
                                    className="shrink-0 mt-0.5"
                                  />

                                  <span>{sub.unableToSubmitReason}</span>
                                </div>
                              ) : (
                                <div className="space-y-1 text-slate-600">
                                  {sub.remarks && <p>"{sub.remarks}"</p>}

                                  {sub.driveLink && (
                                    <a
                                      href={sub.driveLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 font-medium inline-flex items-center gap-1 hover:underline"
                                    >
                                      Review
                                      <ExternalLink size={12} />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenAssignModal(item)}
                            className="p-2 border border-slate-200 hover:border-black hover:bg-slate-50 text-slate-700 rounded-xl transition"
                          >
                            <UserPlus size={15} />
                          </button>

                          {item.assignments?.map((assignment) => {
                            const isPendingReview =
                              assignment.status === "SUBMITTED" ||
                              item.status === "SUBMITTED";

                            if (!isPendingReview) return null;

                            return (
                              <div
                                key={assignment.assignmentId}
                                className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl"
                              >
                                <button
                                  disabled={actionLoadingId !== null}
                                  onClick={() =>
                                    handleApproveSubmission(
                                      assignment.assignmentId,
                                    )
                                  }
                                  className="p-1.5 bg-white text-emerald-600 hover:bg-emerald-50 rounded-lg border border-slate-200 shadow-sm transition"
                                >
                                  {actionLoadingId ===
                                  assignment.assignmentId ? (
                                    <Loader2
                                      size={13}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <ThumbsUp size={13} />
                                  )}
                                </button>

                                <button
                                  disabled={actionLoadingId !== null}
                                  onClick={() =>
                                    setRejectModal({
                                      open: true,
                                      assignmentId: assignment.assignmentId,
                                      reason: "",
                                    })
                                  }
                                  className="p-1.5 bg-white text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 shadow-sm transition"
                                >
                                  <ThumbsDown size={13} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-16 text-slate-400 text-sm font-medium"
                    >
                      No subtasks found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ASSIGN MODAL */}
      {openAssignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Manage Assignments
                </h3>

                <p className="text-xs text-slate-400 mt-0.5">
                  Select employees
                </p>
              </div>

              <button
                onClick={() => setOpenAssignModal(false)}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-2.5 max-h-[360px] overflow-y-auto bg-slate-50/50">
              {employees.map((employee) => {
                const checked = selectedEmployees.includes(employee.employeeId);

                return (
                  <label
                    key={employee.id}
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer bg-white transition-all ${
                      checked
                        ? "border-black ring-1 ring-black"
                        : "border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      className="accent-black"
                      onChange={() => toggleEmployee(employee.employeeId)}
                    />

                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {employee.name}
                      </p>

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-400 font-mono">
                          {employee.employeeId}
                        </span>

                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          {employee.position || "Developer"}
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setOpenAssignModal(false)}
                className="h-11 px-5 rounded-2xl border border-slate-300 text-sm font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleAssign}
                disabled={assigning}
                className="h-11 px-5 rounded-2xl bg-black text-white text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-50"
              >
                {assigning ? "Updating..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* REJECT MODAL */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Reject Submission
              </h3>

              <p className="text-xs text-slate-400 mt-0.5">
                Provide rejection reason
              </p>
            </div>

            <div className="p-5">
              <textarea
                placeholder="Write rejection reason..."
                value={rejectModal.reason}
                onChange={(e) =>
                  setRejectModal({
                    ...rejectModal,
                    reason: e.target.value,
                  })
                }
                className="w-full min-h-[140px] p-4 rounded-2xl border border-slate-300 outline-none focus:border-red-500 resize-none text-sm"
              />
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() =>
                  setRejectModal({
                    open: false,
                    assignmentId: null,
                    reason: "",
                  })
                }
                className="h-11 px-5 rounded-2xl border border-slate-300 text-sm font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleRejectSubmission}
                disabled={actionLoadingId === rejectModal.assignmentId}
                className="h-11 px-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition disabled:opacity-50"
              >
                {actionLoadingId === rejectModal.assignmentId
                  ? "Rejecting..."
                  : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTaskDetailPage;
