import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import API from "../../../services/api";

import {
  Edit3,
  Save,
  X,
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  Briefcase,
  TimerReset,
  LogIn,
  LogOut,
  User,
  Mail,
  Building2,
  Award,
  ChevronDown,
  Lock,
} from "lucide-react";

export default function EmployeeDetails() {
  const { id } = useParams();

  const [employee, setEmployee] = useState(null);

  const [attendance, setAttendance] = useState([]);

  const [leaveData, setLeaveData] = useState(null);

  const [departments, setDepartments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [isEditing, setIsEditing] =
    useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    position: "",
    password: "",
  });

  // ---------------- FETCH ----------------
  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      setError(null);

      const [
        empRes,
        attRes,
        leaveRes,
        deptRes,
      ] = await Promise.all([
        API.get(`/api/hr/employee/${id}`),

        API.get(`/api/attendance/${id}`),

        API.get(
          `/api/hr/leave/employee/${id}`
        ),

        API.get(`/api/departments`),
      ]);

      const empData =
        empRes?.data?.data || null;

      const attData =
        attRes?.data?.data?.records || [];

      const leaveStats =
        leaveRes?.data?.data || null;

      const deptData =
        deptRes?.data?.data || [];

      setEmployee(empData);

      setAttendance(attData);

      setLeaveData(leaveStats);

      setDepartments(deptData);

      setForm({
        name: empData?.name || "",

        email: empData?.email || "",

        department:
          empData?.department?.name || "",

        position:
          empData?.position || "",

        password: "",
      });
    } catch (err) {
      console.log(err);

      setError(
        "Failed to load employee details"
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SAVE ----------------
  const handleSave = async () => {
    try {
      let endpoint = "";

      let payload = {};

      if (employee.role === "MANAGER") {
        endpoint = `/api/hr/manager/${employee.employeeId}`;

        payload = {
          name: form.name,

          email: form.email,

          department: form.department,

          ...(form.password && {
            password: form.password,
          }),
        };
      } else {
        endpoint = `/api/hr/employee/${employee.employeeId}`;

        payload = {
          name: form.name,

          email: form.email,

          department: form.department,

          position: form.position,

          ...(form.password && {
            password: form.password,
          }),
        };
      }

      const res = await API.put(
        endpoint,
        payload
      );

      const updated =
        res?.data?.data;

      setEmployee(updated);

      setForm({
        name: updated?.name || "",

        email: updated?.email || "",

        department:
          updated?.department?.name || "",

        position:
          updated?.position || "",

        password: "",
      });

      setIsEditing(false);
    } catch (err) {
      console.log(err);

      alert(
        err?.response?.data?.message ||
          "Update failed"
      );
    }
  };

  // ---------------- ATTENDANCE STATS ----------------
  const attendanceStats = useMemo(() => {
    return {
      present: attendance.filter(
        (a) => a.status === "PRESENT"
      ).length,

      leave: attendance.filter(
        (a) => a.status === "LEAVE"
      ).length,

      absent: attendance.filter(
        (a) => a.status === "ABSENT"
      ).length,
    };
  }, [attendance]);

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin" />

          <p className="text-sm text-slate-500 font-medium tracking-wide">
            Loading profile analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className="p-8 text-center text-rose-500 font-medium">
        {error}
      </div>
    );

  if (!employee)
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Employee not found
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/40 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* PROFILE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  {employee.name}
                </h1>

                <span className="px-3 py-1 bg-slate-900 text-white text-[10px] rounded-md font-bold uppercase tracking-wider">
                  {employee.role}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {employee.department && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                    <Building2 size={12} />
                    {
                      employee?.department
                        ?.name
                    }
                  </span>
                )}

                {employee.position && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                    <Award size={12} />
                    {employee.position}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() =>
                setIsEditing(!isEditing)
              }
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                isEditing
                  ? "bg-slate-100 text-slate-700"
                  : "bg-white hover:bg-slate-50"
              }`}
            >
              {isEditing ? (
                <>
                  <X size={15} />
                  Cancel
                </>
              ) : (
                <>
                  <Edit3 size={15} />
                  Edit Profile
                </>
              )}
            </button>
          </div>

          {/* FORM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Input
              label="Full Name"
              value={form.name}
              disabled={!isEditing}
              icon={<User size={15} />}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />

            <Input
              label="Email Address"
              value={form.email}
              disabled={!isEditing}
              icon={<Mail size={15} />}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
            />

            {/* DEPARTMENT SELECT */}
            <SelectInput
              label="Department"
              value={form.department}
              disabled={!isEditing}
              icon={<Building2 size={15} />}
              onChange={(e) =>
                setForm({
                  ...form,
                  department:
                    e.target.value,
                })
              }
              options={departments}
            />

            <Input
              label="Position"
              value={form.position}
              disabled={!isEditing}
              icon={<Award size={15} />}
              onChange={(e) =>
                setForm({
                  ...form,
                  position:
                    e.target.value,
                })
              }
            />

            {/* PASSWORD */}
            {isEditing && (
              <Input
                label="New Password"
                type="password"
                value={form.password}
                disabled={!isEditing}
                icon={<Lock size={15} />}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password:
                      e.target.value,
                  })
                }
              />
            )}
          </div>

          {/* SAVE */}
          {isEditing && (
            <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
              >
                <Save size={15} />
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* LEAVE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <SectionHeader
            title="Leave Management"
            subtitle="Overview of employee leave data"
            icon={<Briefcase size={18} />}
          />

          {leaveData ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <StatCard
                  title="Total Leaves"
                  value={
                    leaveData.totalLeaves
                  }
                  icon={
                    <CalendarDays
                      size={18}
                    />
                  }
                />

                <StatCard
                  title="Approved"
                  value={
                    leaveData.approved
                  }
                  icon={
                    <CheckCircle2
                      size={18}
                    />
                  }
                />

                <StatCard
                  title="Pending"
                  value={
                    leaveData.pending
                  }
                  icon={
                    <Clock3 size={18} />
                  }
                />

                <StatCard
                  title="Rejected"
                  value={
                    leaveData.rejected
                  }
                  icon={
                    <XCircle
                      size={18}
                    />
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <BalanceCard
                  title="Casual Leave"
                  value={
                    leaveData.balance
                      ?.casualLeft
                  }
                />

                <BalanceCard
                  title="Sick Leave"
                  value={
                    leaveData.balance
                      ?.sickLeft
                  }
                />
              </div>
            </>
          ) : (
            <EmptyState text="No leave data found" />
          )}
        </div>

        {/* ATTENDANCE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <SectionHeader
            title="Attendance Logs"
            subtitle="Daily attendance records"
            icon={<TimerReset size={18} />}
          />

          <div className="grid grid-cols-3 gap-4 mt-6 mb-6">
            <StatCard
              title="Present"
              value={
                attendanceStats.present
              }
              icon={
                <CheckCircle2
                  size={18}
                />
              }
            />

            <StatCard
              title="Leave"
              value={
                attendanceStats.leave
              }
              icon={
                <CalendarDays
                  size={18}
                />
              }
            />

            <StatCard
              title="Absent"
              value={
                attendanceStats.absent
              }
              icon={
                <XCircle
                  size={18}
                />
              }
            />
          </div>

          <div className="space-y-3">
            {attendance.length > 0 ? (
              attendance.map((record) => (
                <div
                  key={record.id}
                  className="border border-slate-100 rounded-xl p-4 bg-slate-50"
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <StatusBadge
                        status={
                          record.status
                        }
                      />

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {new Date(
                            record.date
                          ).toLocaleDateString()}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          Logged at{" "}
                          {new Date(
                            record.createdAt
                          ).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <TimeBox
                        label="Check In"
                        value={
                          record.startTime
                            ? new Date(
                                record.startTime
                              ).toLocaleTimeString()
                            : "-- : --"
                        }
                        icon={
                          <LogIn
                            size={14}
                          />
                        }
                      />

                      <TimeBox
                        label="Check Out"
                        value={
                          record.endTime
                            ? new Date(
                                record.endTime
                              ).toLocaleTimeString()
                            : "-- : --"
                        }
                        icon={
                          <LogOut
                            size={14}
                          />
                        }
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text="No attendance logs found" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- SECTION HEADER ----------------
function SectionHeader({
  title,
  subtitle,
  icon,
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
        {icon}
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900">
          {title}
        </h2>

        <p className="text-xs text-slate-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

// ---------------- STAT CARD ----------------
function StatCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="border border-slate-100 rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
          {title}
        </p>

        <h3 className="text-2xl font-bold text-slate-900 mt-1">
          {value}
        </h3>
      </div>

      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

// ---------------- BALANCE CARD ----------------
function BalanceCard({
  title,
  value,
}) {
  return (
    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-400">
          {title}
        </p>

        <h3 className="text-2xl font-bold text-slate-900 mt-1">
          {value} Days
        </h3>
      </div>

      <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
        <CalendarDays size={16} />
      </div>
    </div>
  );
}

// ---------------- STATUS BADGE ----------------
function StatusBadge({ status }) {
  const styles = {
    PRESENT:
      "bg-emerald-50 text-emerald-700 border-emerald-200",

    LEAVE:
      "bg-amber-50 text-amber-700 border-amber-200",

    ABSENT:
      "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <span
      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase border ${
        styles[status]
      }`}
    >
      {status}
    </span>
  );
}

// ---------------- TIME BOX ----------------
function TimeBox({
  label,
  value,
  icon,
}) {
  return (
    <div className="min-w-[120px] border border-slate-200 rounded-lg px-3 py-2 bg-white">
      <div className="flex items-center gap-1 mb-1">
        {icon}

        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
          {label}
        </p>
      </div>

      <h4 className="text-xs font-bold text-slate-800">
        {value}
      </h4>
    </div>
  );
}

// ---------------- EMPTY ----------------
function EmptyState({ text }) {
  return (
    <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
      {text}
    </div>
  );
}

// ---------------- INPUT ----------------
function Input({
  label,
  value,
  onChange,
  disabled,
  icon,
  type = "text",
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
          {icon}
        </div>

        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
            disabled
              ? "bg-slate-50 border-slate-100 text-slate-500"
              : "bg-white border-slate-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
          }`}
        />
      </div>
    </div>
  );
}

// ---------------- SELECT INPUT ----------------
function SelectInput({
  label,
  value,
  onChange,
  disabled,
  icon,
  options = [],
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 z-10">
          {icon}
        </div>

        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`appearance-none w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all ${
            disabled
              ? "bg-slate-50 border-slate-100 text-slate-500"
              : "bg-white border-slate-200 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
          }`}
        >
          <option value="">
            Select Department
          </option>

          {options.map((dept) => (
            <option
              key={dept.id}
              value={dept.name}
            >
              {dept.name}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-3 flex items-center text-slate-400">
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
}