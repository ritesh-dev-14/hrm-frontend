import { useState, useEffect } from "react";
import { X, Save, Eye, EyeOff, ChevronDown, Check } from "lucide-react";
import API from "../../services/api";
import { notifySuccess, notifyError } from "../../utils/toast";

export default function HrEditEmployee({ isOpen, employeeData, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Multi-select dropdown toggles
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
  
  // Master lists loaded from backend configurations
  const [departmentsList, setDepartmentsList] = useState([]);
  const [managersList, setManagersList] = useState([]);
  const [fetchingDepts, setFetchingDepts] = useState(false);
  const [fetchingManagers, setFetchingManagers] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    department: [], // Array of department names (strings)
    position: "",
    managerIds: [], // Array of manager IDs (UUID strings)
    password: "",
  });

  // Fetch corporate departments structural units
  const fetchDepartments = async () => {
    try {
      setFetchingDepts(true);
      const res = await API.get("/api/departments");
      setDepartmentsList(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load departments structural metrics:", err);
    } finally {
      setFetchingDepts(false);
    }
  };

  // Fetch active company reporting managers
  const fetchManagers = async () => {
    try {
      setFetchingManagers(true);
      const res = await API.get("/api/hr/managers");
      setManagersList(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load active reporting structures:", err);
    } finally {
      setFetchingManagers(false);
    }
  };

  useEffect(() => {
    if (employeeData && isOpen) {
      fetchDepartments();
      
      if (employeeData.role !== "MANAGER") {
        fetchManagers();
      }

      // Normalize backend departments array mapping parameters cleanly
      let initialDepts = [];
      if (Array.isArray(employeeData.department)) {
        initialDepts = employeeData.department.map(d => typeof d === "object" ? d.name : d);
      } else if (Array.isArray(employeeData.departments)) {
        initialDepts = employeeData.departments.map(d => typeof d === "object" ? d.name : d);
      } else if (employeeData.department) {
        initialDepts = [typeof employeeData.department === "object" ? employeeData.department.name : employeeData.department];
      }

      // Normalize current active manager relations metrics
      let initialMgrIds = [];
      if (Array.isArray(employeeData.managerIds)) {
        initialMgrIds = employeeData.managerIds;
      } else if (Array.isArray(employeeData.managers)) {
        initialMgrIds = employeeData.managers.map(m => m.id || m);
      } else if (employeeData.manager) {
        initialMgrIds = [employeeData.manager.id || employeeData.manager];
      }

      setForm({
        name: employeeData.name || "",
        email: employeeData.email || "",
        department: initialDepts,
        position: employeeData.position || "",
        managerIds: initialMgrIds,
        password: "",
      });
      
      setError(null);
      setShowPassword(false);
      setDeptDropdownOpen(false);
      setManagerDropdownOpen(false);
    }
  }, [employeeData, isOpen]);

  // Click outside to close custom select overlays
  useEffect(() => {
    if (!deptDropdownOpen && !managerDropdownOpen) return;
    
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".multiselect-interactive-container")) {
        setDeptDropdownOpen(false);
        setManagerDropdownOpen(false);
      }
    };
    
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [deptDropdownOpen, managerDropdownOpen]);

  if (!isOpen || !employeeData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleDepartmentSelection = (deptName) => {
    setForm((prev) => {
      const alreadySelected = prev.department.includes(deptName);
      const updatedDepts = alreadySelected
        ? prev.department.filter((name) => name !== deptName)
        : [...prev.department, deptName];
      return { ...prev, department: updatedDepts };
    });
  };

  const toggleManagerSelection = (mgrId) => {
    setForm((prev) => {
      const alreadySelected = prev.managerIds.includes(mgrId);
      const updatedMgrIds = alreadySelected
        ? prev.managerIds.filter((id) => id !== mgrId)
        : [...prev.managerIds, mgrId];
      return { ...prev, managerIds: updatedMgrIds };
    });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (form.department.length === 0) {
      setError("Please select at least one department assignment.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let endpoint = "";
      let payload = {};

      const rawId = employeeData.employeeId || employeeData.id || "";
      const cleanId = rawId.split(":")[0];

      if (employeeData.role === "MANAGER") {
        endpoint = `/api/hr/manager/${cleanId}`;
        payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          department: form.department,
          ...(form.password && { password: form.password }),
        };
      } else {
        endpoint = `/api/hr/employee/${cleanId}`;
        payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          department: form.department,
          position: form.position.trim(),
          managerIds: form.managerIds, // Array of manager UUID strings
          ...(form.password && { password: form.password }),
        };
      }

      const res = await API.put(endpoint, payload);
      
      if (res?.data?.success || res?.status === 200) {
        notifySuccess("Profile metrics updated successfully!");
        onSave();
        onClose();
      } else {
        setError("Update failed to finalize correctly.");
      }
    } catch (err) {
      console.error("Sync error:", err);
      const errorMsg = err?.response?.data?.message || "Internal database update failure.";
      setError(errorMsg);
      notifyError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/20 backdrop-blur-xs">
      <div className="bg-white h-full w-full max-w-md shadow-xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-white">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Edit Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {employeeData.role} — ID: {employeeData.employeeId || employeeData.id?.slice(0, 8)}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* COMPONENT BODY FORM CONTROLS */}
        <form onSubmit={handleSave} className="p-6 flex-1 space-y-4 overflow-y-auto bg-white custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none text-slate-800 focus:border-slate-900 transition-all focus:ring-2 focus:ring-slate-900/5"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none text-slate-800 focus:border-slate-900 transition-all focus:ring-2 focus:ring-slate-900/5"
            />
          </div>

          {/* DEPARTMENTS SELECTION ELEMENT */}
          <div className="space-y-1 relative multiselect-interactive-container">
            <label className="text-xs font-medium text-slate-700">Departments</label>
            <div>
              <button
                type="button"
                disabled={fetchingDepts}
                onClick={() => { setDeptDropdownOpen(!deptDropdownOpen); setManagerDropdownOpen(false); }}
                className="w-full min-h-10 bg-white border border-slate-200 rounded-lg px-3 pr-10 py-1.5 text-left text-sm text-slate-800 outline-none transition-all flex flex-wrap gap-1 items-center justify-between hover:border-slate-300 focus:border-slate-900 cursor-pointer disabled:opacity-50"
              >
                {form.department.length === 0 ? (
                  <span className="text-slate-400">
                    {fetchingDepts ? "Loading fields..." : "Select Departments"}
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
                          className="hover:bg-white/20 rounded p-0.5 transition-colors"
                        >
                          <X size={10} />
                        </span>
                      </span>
                    ))}
                  </div>
                )}
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
              </button>

              {deptDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 z-20 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-0.5 custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
                  {departmentsList.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">No organizational paths configuration found.</div>
                  ) : (
                    departmentsList.map((dept) => {
                      const isSelected = form.department.includes(dept.name);
                      return (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => toggleDepartmentSelection(dept.name)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors cursor-pointer ${
                            isSelected ? "bg-slate-50 text-slate-900 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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

          {employeeData.role !== "MANAGER" && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Job Title / Position</label>
                <input
                  type="text"
                  name="position"
                  required
                  value={form.position}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none text-slate-800 focus:border-slate-900 transition-all focus:ring-2 focus:ring-slate-900/5"
                />
              </div>

              {/* REPORTING MANAGERS MULTI-SELECT FOR EMPLOYEES */}
              <div className="space-y-1 relative multiselect-interactive-container">
                <label className="text-xs font-medium text-slate-700">Assign Reporting Managers</label>
                <div>
                  <button
                    type="button"
                    disabled={fetchingManagers}
                    onClick={() => { setManagerDropdownOpen(!managerDropdownOpen); setDeptDropdownOpen(false); }}
                    className="w-full min-h-10 bg-white border border-slate-200 rounded-lg px-3 pr-10 py-1.5 text-left text-sm text-slate-800 outline-none transition-all flex flex-wrap gap-1 items-center justify-between hover:border-slate-300 focus:border-slate-900 cursor-pointer disabled:opacity-50"
                  >
                    {form.managerIds.length === 0 ? (
                      <span className="text-slate-400">
                        {fetchingManagers ? "Loading structures..." : "Select Managers"}
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {form.managerIds.map((id) => {
                          const matchedManager = managersList.find((m) => m.id === id);
                          const managerName = matchedManager ? matchedManager.name : "Manager Profile";
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-medium pl-2 pr-1 py-0.5 rounded-md"
                            >
                              {managerName}
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleManagerSelection(id);
                                }}
                                className="hover:bg-slate-200 rounded p-0.5 transition-colors"
                              >
                                <X size={10} />
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <ChevronDown size={14} className="text-slate-400 shrink-0" />
                  </button>

                  {managerDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 z-20 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-0.5 custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
                      {managersList.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">No active management staff available.</div>
                      ) : (
                        managersList.map((manager) => {
                          const isSelected = form.managerIds.includes(manager.id);
                          return (
                            <button
                              key={manager.id}
                              type="button"
                              onClick={() => toggleManagerSelection(manager.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors cursor-pointer ${
                                isSelected ? "bg-slate-50 text-slate-900 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              <div className="flex flex-col">
                                <span>{manager.name}</span>
                                {manager.position && <span className="text-[10px] text-slate-400 font-normal">{manager.position}</span>}
                              </div>
                              {isSelected && <Check size={13} className="text-slate-900" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="space-y-1 pt-1">
            <label className="text-xs font-medium text-slate-700">Reset Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Leave blank to keep unchanged"
                className="w-full h-10 pl-3 pr-10 rounded-lg border border-slate-200 text-sm outline-none text-slate-800 focus:border-slate-900 transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </form>

        {/* FOOTER CONTROLS */}
        <div className="p-6 border-t border-slate-100 bg-white flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={handleSave}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-all disabled:bg-slate-300 cursor-pointer shadow-sm"
          >
            <Save size={14} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
}