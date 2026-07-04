import { useState, useEffect } from "react";
import { X, ChevronDown, Eye, EyeOff, Check } from "lucide-react";
import API from "../../services/api";
import { notifySuccess, notifyError } from "../../utils/toast";

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === "password";

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-700 tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <input
          type={isPasswordType && showPassword ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5"
        />

        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function HrAddManager({ isOpen, onClose, onSave }) {
  const [departments, setDepartments] = useState([]);
  const [fetchingDepartments, setFetchingDepartments] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: [], // Holds array of selected department names
  });

  const [loading, setLoading] = useState(false);

  const fetchDepartments = async () => {
    try {
      setFetchingDepartments(true);
      const res = await API.get("/api/departments");
      setDepartments(res.data?.data || []);
    } catch (err) {
      console.error(err);
      notifyError("Failed to load departments");
    } finally {
      setFetchingDepartments(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      setForm({
        name: "",
        email: "",
        password: "",
        department: [],
      });
      setDropdownOpen(false);
    }
  }, [isOpen]);

  // Global click listener to close custom dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".custom-multiselect-container")) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [dropdownOpen]);

  const toggleDepartmentSelection = (deptName) => {
    setForm((prev) => {
      const alreadySelected = prev.department.includes(deptName);
      const updatedDepts = alreadySelected
        ? prev.department.filter((name) => name !== deptName)
        : [...prev.department, deptName];
      return { ...prev, department: updatedDepts };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.department.length === 0) {
      notifyError("Please select at least one department");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/api/hr/manager", form);
      notifySuccess("Manager account created successfully!");

      if (onSave) onSave(res.data?.data);
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to add manager";
      notifyError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] border border-slate-100 architecture-container animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Add Manager</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Create manager-level access and corporate permissions.
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors cursor-pointer hover:bg-slate-50"
          >
            <X size={15} />
          </button>
        </div>

        {/* MODAL FORM BODY */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 flex-1 space-y-4 overflow-y-auto bg-white custom-scrollbar">
            
            <Field
              label="Full Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Jane Smith"
              required
            />

            <Field
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="jane@company.com"
              required
            />

            <Field
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              placeholder="••••••••"
              required
            />

            {/* CUSTOM PRODUCTION GRADE MULTISELECT FIELD */}
            <div className="space-y-1.5 relative custom-multiselect-container">
              <label className="text-xs font-semibold text-slate-700 tracking-wide">
                Assigned Departments <span className="text-red-500">*</span>
              </label>

              <div>
                <button
                  type="button"
                  disabled={fetchingDepartments}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full min-h-10 bg-white border border-slate-200 rounded-xl px-3 pr-10 py-2 text-left text-sm text-slate-800 outline-none transition-all flex flex-wrap gap-1.5 items-center justify-between hover:border-slate-300 focus:border-slate-900 disabled:opacity-50 cursor-pointer"
                >
                  {form.department.length === 0 ? (
                    <span className="text-slate-400">
                      {fetchingDepartments ? "Loading branches..." : "Select Departments"}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {form.department.map((deptName) => (
                        <span
                          key={deptName}
                          className="inline-flex items-center gap-1 bg-slate-900 text-white text-[11px] font-semibold pl-2 pr-1 py-0.5 rounded-md"
                        >
                          {deptName}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDepartmentSelection(deptName);
                            }}
                            className="hover:bg-white/20 rounded p-0.5"
                          >
                            <X size={10} />
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                  <ChevronDown size={15} className="text-slate-400 shrink-0" />
                </button>

                {/* Dropdown Menu Overlay List */}
                {dropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 z-10 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-0.5 custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
                    {departments.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 font-medium">
                        No departments found.
                      </div>
                    ) : (
                      departments.map((dept) => {
                        const isSelected = form.department.includes(dept.name);
                        return (
                          <button
                            key={dept.id}
                            type="button"
                            onClick={() => toggleDepartmentSelection(dept.name)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-slate-50 text-slate-900 font-semibold"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <span>{dept.name}</span>
                            {isSelected && <Check size={13} className="text-slate-900" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* MODAL PERSISTENT ACTIONS FOOTER */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors disabled:bg-slate-300 cursor-pointer shadow-sm shadow-slate-900/10"
            >
              {loading ? "Creating..." : "Create Manager"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}