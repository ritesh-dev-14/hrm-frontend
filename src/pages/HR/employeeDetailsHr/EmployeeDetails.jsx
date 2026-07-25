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
  Check,
} from "lucide-react";

export default function EmployeeDetails() {
  const { id } = useParams();

  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaveData, setLeaveData] = useState(null);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    departments: [],
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

      const [empRes, attRes, leaveRes, deptRes] = await Promise.all([
        API.get(`/api/hr/employee/${id}`).catch(() => null),
        API.get(`/api/attendance/${id}`).catch(() => null),
        API.get(`/api/hr/leave/employee/${id}`).catch(() => null),
        API.get(`/api/departments`).catch(() => null),
      ]);

      const empData = empRes?.data?.data || null;
      const attData = attRes?.data?.data?.records || [];
      const leaveStats = leaveRes?.data?.data || null;
      const deptData = deptRes?.data?.data || [];

      setEmployee(empData);
      setAttendance(attData);
      setLeaveData(leaveStats);
      setDepartments(deptData);

      let initialDepts = [];
      if (Array.isArray(empData?.departments) && empData.departments.length > 0) {
        initialDepts = empData.departments.map((d) => (typeof d === "object" ? d.name : d));
      } else if (Array.isArray(empData?.department)) {
        initialDepts = empData.department.map((d) => (typeof d === "object" ? d.name : d));
      } else if (empData?.department?.name) {
        initialDepts = [empData.department.name];
      } else if (typeof empData?.department === "string" && empData.department) {
        initialDepts = [empData.department];
      }

      setForm({
        name: empData?.name || "",
        email: empData?.email || "",
        departments: initialDepts,
        position: empData?.position || "",
        password: "",
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load profile details");
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
          name: form.name.trim(),
          email: form.email.trim(),
          department: form.departments, // Array of department names e.g. ["Video Production Department", "Web Development Department"]
          position: form.position.trim(), // Send position for managers!
          ...(form.password && {
            password: form.password,
          }),
        };
      } else {
        endpoint = `/api/hr/employee/${employee.employeeId}`;

        payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          department: form.departments.length > 0 ? form.departments : "",
          position: form.position.trim(), // Send position for employees!
          ...(form.password && {
            password: form.password,
          }),
        };
      }

      const res = await API.put(endpoint, payload);
      const updated = res?.data?.data;

      if (updated) {
        setEmployee(updated);

        let updatedDepts = [];
        if (Array.isArray(updated?.departments) && updated.departments.length > 0) {
          updatedDepts = updated.departments.map((d) => (typeof d === "object" ? d.name : d));
        } else if (Array.isArray(updated?.department)) {
          updatedDepts = updated.department.map((d) => (typeof d === "object" ? d.name : d));
        } else if (updated?.department?.name) {
          updatedDepts = [updated.department.name];
        } else if (typeof updated?.department === "string" && updated.department) {
          updatedDepts = [updated.department];
        }

        setForm({
          name: updated?.name || "",
          email: updated?.email || "",
          departments: updatedDepts,
          position: updated?.position || "",
          password: "",
        });
      }

      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Update failed");
    }
  };

  // ---------------- ATTENDANCE STATS ----------------
  const attendanceStats = useMemo(() => {
    return {
      present: attendance.filter((a) => a.status === "PRESENT").length,
      leave: attendance.filter((a) => a.status === "LEAVE").length,
      absent: attendance.filter((a) => a.status === "ABSENT").length,
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
      <div className="p-8 text-center text-rose-500 font-medium">{error}</div>
    );

  if (!employee)
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Employee or Manager not found
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

              {/* DEPARTMENT & POSITION PILLS */}
              <div className="flex flex-wrap gap-2 mt-3">
                {Array.isArray(employee.departments) && employee.departments.length > 0 ? (
                  employee.departments.map((dept, idx) => (
                    <span
                      key={dept.id || idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold"
                    >
                      <Building2 size={12} />
                      {dept.name || dept}
                    </span>
                  ))
                ) : employee.department ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                    <Building2 size={12} />
                    {employee.department.name || employee.department}
                  </span>
                ) : null}

                {employee.position && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                    <Award size={12} />
                    {employee.position}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
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

            {/* MULTI-SELECT DEPARTMENT */}
            <MultiSelectDepartment
              label="Department(s)"
              selectedDepts={form.departments}
              onChange={(updatedDepts) =>
                setForm({
                  ...form,
                  departments: updatedDepts,
                })
              }
              disabled={!isEditing}
              icon={<Building2 size={15} />}
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
                  position: e.target.value,
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
                    password: e.target.value,
                  })
                }
              />
            )}
          </div>

          {/* SAVE BUTTON */}
          {isEditing && (
            <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Save size={15} />
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* LEAVE MANAGEMENT */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <SectionHeader
            title="Leave Management"
            subtitle="Overview of leave data"
            icon={<Briefcase size={18} />}
          />

          {leaveData ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <StatCard
                  title="Total Leaves"
                  value={leaveData.totalLeaves}
                  icon={<CalendarDays size={18} />}
                />
                <StatCard
                  title="Approved"
                  value={leaveData.approved}
                  icon={<CheckCircle2 size={18} />}
                />
                <StatCard
                  title="Pending"
                  value={leaveData.pending}
                  icon={<Clock3 size={18} />}
                />
                <StatCard
                  title="Rejected"
                  value={leaveData.rejected}
                  icon={<XCircle size={18} />}
                />
              </div>

              {/* LEAVE HISTORY TABLE */}
              <div className="mt-8">
                <h3 className="text-sm font-bold text-slate-800 mb-4">
                  Recent Leave Requests
                </h3>
                {leaveData.recentRequests?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-4">Leave Type</th>
                          <th className="py-3 px-4">From</th>
                          <th className="py-3 px-4">To</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {leaveData.recentRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {req.type || "Leave"}
                            </td>
                            <td className="py-3.5 px-4">
                              {req.startDate ? new Date(req.startDate).toLocaleDateString() : "--"}
                            </td>
                            <td className="py-3.5 px-4">
                              {req.endDate ? new Date(req.endDate).toLocaleDateString() : "--"}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  req.status === "APPROVED"
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    : req.status === "REJECTED"
                                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                                    : "bg-amber-50 text-amber-600 border border-amber-100"
                                }`}
                              >
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-medium py-4">
                    No recent leave requests logged.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400 font-medium mt-4">
              Leave records unavailable.
            </p>
          )}
        </div>

        {/* ATTENDANCE ANALYTICS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <SectionHeader
            title="Attendance Overview"
            subtitle="Tracked check-in activity & attendance history"
            icon={<TimerReset size={18} />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <StatCard
              title="Total Present"
              value={attendanceStats.present}
              icon={<LogIn size={18} className="text-emerald-500" />}
            />
            <StatCard
              title="Total Leaves"
              value={attendanceStats.leave}
              icon={<LogOut size={18} className="text-amber-500" />}
            />
            <StatCard
              title="Total Absences"
              value={attendanceStats.absent}
              icon={<XCircle size={18} className="text-rose-500" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- SECTION HEADER ----------------
function SectionHeader({ title, subtitle, icon }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

// ---------------- STAT CARD ----------------
function StatCard({ title, value, icon }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>
        <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
      </div>
      <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-slate-500">
        {icon}
      </div>
    </div>
  );
}

// ---------------- INPUT ----------------
function Input({ label, type = "text", value, onChange, disabled, icon }) {
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

// ---------------- MULTI-SELECT DEPARTMENT ----------------
function MultiSelectDepartment({
  label,
  selectedDepts = [],
  onChange,
  disabled,
  icon,
  options = [],
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".custom-dept-multiselect")) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [dropdownOpen]);

  const toggleDept = (deptName) => {
    const isSelected = selectedDepts.includes(deptName);
    if (isSelected) {
      onChange(selectedDepts.filter((d) => d !== deptName));
    } else {
      onChange([...selectedDepts, deptName]);
    }
  };

  return (
    <div className="space-y-1.5 custom-dept-multiselect relative">
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>

      {disabled ? (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 z-10">
            {icon}
          </div>
          <div className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-600 flex flex-wrap gap-1.5 items-center min-h-[42px]">
            {selectedDepts.length > 0 ? (
              selectedDepts.map((d, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-semibold"
                >
                  {d}
                </span>
              ))
            ) : (
              <span className="text-slate-400 italic">No department assigned</span>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 z-10 pointer-events-none">
            {icon}
          </div>

          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all text-sm min-h-[42px] flex flex-wrap gap-1.5 items-center cursor-pointer"
          >
            {selectedDepts.length > 0 ? (
              selectedDepts.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold"
                >
                  {d}
                  <X
                    size={12}
                    className="hover:text-indigo-900 cursor-pointer ml-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDept(d);
                    }}
                  />
                </span>
              ))
            ) : (
              <span className="text-slate-400">Select department(s)...</span>
            )}

            <div className="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
              <ChevronDown size={16} />
            </div>
          </div>

          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto p-1.5 space-y-0.5">
              {options.map((dept) => {
                const isSelected = selectedDepts.includes(dept.name);
                return (
                  <div
                    key={dept.id || dept._id || dept.name}
                    onClick={() => toggleDept(dept.name)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-700 font-bold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span>{dept.name}</span>
                    {isSelected && <Check size={14} className="text-indigo-600" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}