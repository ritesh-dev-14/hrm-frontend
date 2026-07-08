// import { useEffect, useState } from "react";
// import { X, Loader2, CheckCircle2 } from "lucide-react";
// import API from "../../services/api";

// const INITIAL_STATE = {
//   projectName: "",
//   description: "",
//   departmentId: "",
//   startDate: "",
//   endDate: "",
//   renewalDate: "",
//   frequency: "",
//   assignTo: [], // Will accurately hold employeeId strings e.g. ["PM-MGR-001"]
// };

// const CreateTaskModal = ({ open, onClose, onTaskCreated }) => {
//   const [formData, setFormData] = useState(INITIAL_STATE);
//   const [departments, setDepartments] = useState([]);
//   const [managers, setManagers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState(false);

//   // Keyboard accessibility (ESC key to close)
//   useEffect(() => {
//     const handleEsc = (e) => {
//       if (e.key === "Escape") onClose();
//     };
//     if (open) {
//       window.addEventListener("keydown", handleEsc);
//     }
//     return () => window.removeEventListener("keydown", handleEsc);
//   }, [open, onClose]);

//   // Fetch configuration data on Modal open
//   useEffect(() => {
//     if (open) {
//       setFormData(INITIAL_STATE);
//       setError("");
//       setSuccess(false);

//       const fetchModalData = async () => {
//         try {
//           const [deptRes, managerRes] = await Promise.all([
//             API.get("/api/departments"),
//             API.get("/api/hr/managers"),
//           ]);
//           setDepartments(deptRes?.data?.data || deptRes?.data || []);
//           setManagers(managerRes?.data?.data || managerRes?.data || []);
//         } catch (err) {
//           setError("Failed to load departments or managers.");
//         }
//       };

//       fetchModalData();
//     }
//   }, [open]);

//   // Determine if conditional fields should show
//   const selectedDeptObj = departments.find(
//     (d) => d.id === formData.departmentId,
//   );
//   const showConditionalFields =
//     selectedDeptObj?.name === "SEO" ||
//     selectedDeptObj?.name === "Social Media Department";

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//     if (error) setError("");
//   };

//   // Custom multi-select toggle handler mapped directly to employeeId
//   const handleManagerToggle = (employeeId) => {
//     if (!employeeId) return;
//     setFormData((prev) => {
//       const isAlreadySelected = prev.assignTo.includes(employeeId);
//       const updatedAssignTo = isAlreadySelected
//         ? prev.assignTo.filter((id) => id !== employeeId)
//         : [...prev.assignTo, employeeId];
//       return { ...prev, assignTo: updatedAssignTo };
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       setLoading(true);
//       setError("");

//       // Construct payload matching target schema requirements
//       const payload = {
//         projectName: formData.projectName.trim(),
//         description: formData.description.trim(),
//         departmentId: formData.departmentId,
//         startDate: formData.startDate
//           ? `${formData.startDate}T00:00:00.000Z`
//           : null,
//         endDate: formData.endDate ? `${formData.endDate}T00:00:00.000Z` : null,
//         assignTo: formData.assignTo,
//       };

//       // Append conditional fields only if relevant criteria are met
//       if (showConditionalFields) {
//         payload.renewalDate = formData.renewalDate
//           ? `${formData.renewalDate}T00:00:00.000Z`
//           : null;
//         payload.frequency = formData.frequency;
//       }

//       const response = await API.post("/api/projects", payload);

//       if (
//         response?.data?.success ||
//         response?.status === 201 ||
//         response?.status === 200
//       ) {
//         setSuccess(true);
//         setTimeout(() => {
//           onTaskCreated(response.data?.data || response.data);
//           onClose();
//         }, 1200);
//       }
//     } catch (err) {
//       setError(err?.response?.data?.message || "Failed to create project");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!open) return null;

//   const today = new Date().toISOString().split("T")[0];

//   return (
//     <div
//       onClick={onClose}
//       className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden max-h-[90vh] flex flex-col"
//       >
//         {/* HEADER */}
//         <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
//           <div>
//             <h2 className="text-[20px] font-semibold text-slate-900">
//               Create Project
//             </h2>
//             <p className="text-sm text-slate-500 mt-1">
//               Add a new project assignment
//             </p>
//           </div>
//           <button
//             onClick={onClose}
//             className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition"
//           >
//             <X size={18} className="text-slate-500" />
//           </button>
//         </div>

//         {/* CONTENT */}
//         <div className="overflow-y-auto flex-1 custom-scrollbar">
//           {success ? (
//             <div className="py-20 flex flex-col items-center justify-center">
//               <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
//                 <CheckCircle2 size={28} className="text-emerald-600" />
//               </div>
//               <h3 className="text-lg font-semibold text-slate-900">
//                 Project Created
//               </h3>
//               <p className="text-sm text-slate-500 mt-1">
//                 Your project has been successfully added
//               </p>
//             </div>
//           ) : (
//             <form onSubmit={handleSubmit} className="p-6 space-y-5">
//               {/* PROJECT NAME */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-2">
//                   Project Name
//                 </label>
//                 <input
//                   type="text"
//                   name="projectName"
//                   required
//                   value={formData.projectName}
//                   onChange={handleChange}
//                   placeholder="Enter project name"
//                   className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-slate-400 transition"
//                 />
//               </div>

//               {/* DEPARTMENT SELECT */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-2">
//                   Department
//                 </label>
//                 <select
//                   name="departmentId"
//                   required
//                   value={formData.departmentId}
//                   onChange={handleChange}
//                   className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-slate-400 transition appearance-none"
//                 >
//                   <option value="">Select Department</option>
//                   {departments.map((dept) => (
//                     <option key={dept.id} value={dept.id}>
//                       {dept.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* DATES */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-2">
//                     Start Date
//                   </label>
//                   <input
//                     type="date"
//                     name="startDate"
//                     required
//                     min={today}
//                     value={formData.startDate}
//                     onChange={handleChange}
//                     className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-slate-400 transition"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-2">
//                     End Date
//                   </label>
//                   <input
//                     type="date"
//                     name="endDate"
//                     required
//                     min={formData.startDate || today}
//                     value={formData.endDate}
//                     onChange={handleChange}
//                     className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-slate-400 transition"
//                   />
//                 </div>
//               </div>

//               {/* CONDITIONAL RENEWAL FIELDS (SEO / Social Media) */}
//               {showConditionalFields && (
//                 <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 animate-fadeIn">
//                   <div>
//                     <label className="block text-sm font-medium text-slate-700 mb-2">
//                       Renewal Date
//                     </label>
//                     <input
//                       type="date"
//                       name="renewalDate"
//                       required={showConditionalFields}
//                       min={formData.endDate || today}
//                       value={formData.renewalDate}
//                       onChange={handleChange}
//                       className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-slate-400 transition"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-slate-700 mb-2">
//                       Frequency
//                     </label>
//                     <select
//                       name="frequency"
//                       required={showConditionalFields}
//                       value={formData.frequency}
//                       onChange={handleChange}
//                       className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-slate-400 transition shadow-sm"
//                     >
//                       <option value="">Select Frequency</option>
//                       <option value="monthly">Monthly</option>
//                       <option value="quarterly">Quarterly</option>
//                       <option value="yearly">Yearly</option>
//                     </select>
//                   </div>
//                 </div>
//               )}

//               {/* MULTI-SELECT ASSIGN MANAGERS */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-1">
//                   Assign Managers
//                 </label>
//                 <p className="text-xs text-slate-400 mb-2">
//                   Select all managers designated to this project
//                 </p>
//                 <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 rounded-2xl border border-slate-200 bg-white">
//                   {managers.length === 0 ? (
//                     <span className="text-xs text-slate-400 italic">
//                       No managers available
//                     </span>
//                   ) : (
//                     managers.map((manager) => {
//                       // Use employeeId for comparison check and assignments
//                       const isSelected = formData.assignTo.includes(
//                         manager.employeeId,
//                       );
//                       return (
//                         <button
//                           type="button"
//                           key={manager.id || manager.employeeId}
//                           onClick={() =>
//                             handleManagerToggle(manager.employeeId)
//                           }
//                           className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
//                             isSelected
//                               ? "bg-slate-900 border-slate-900 text-white shadow-sm"
//                               : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
//                           }`}
//                         >
//                           {manager.name || manager.employeeId}
//                         </button>
//                       );
//                     })
//                   )}
//                 </div>
//               </div>

//               {/* DESCRIPTION */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-2">
//                   Description
//                 </label>
//                 <textarea
//                   name="description"
//                   required
//                   rows={4}
//                   value={formData.description}
//                   onChange={handleChange}
//                   placeholder="Write project details..."
//                   className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none resize-none focus:border-slate-400 transition"
//                 />
//               </div>

//               {/* ERROR MESSAGE DISPLAY */}
//               {error && (
//                 <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-600">
//                   {error}
//                 </div>
//               )}

//               {/* ACTIONS */}
//               <div className="flex items-center justify-end gap-3 pt-2">
//                 <button
//                   type="button"
//                   onClick={onClose}
//                   className="h-11 px-5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="h-11 px-6 rounded-2xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition disabled:opacity-60"
//                 >
//                   {loading ? (
//                     <span className="flex items-center gap-2">
//                       <Loader2 size={16} className="animate-spin" />
//                       Creating
//                     </span>
//                   ) : (
//                     "Create Project"
//                   )}
//                 </button>
//               </div>
//             </form>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CreateTaskModal;







import { useEffect, useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import API from "../../services/api";

const INITIAL_STATE = {
  projectName: "",
  description: "",
  departmentId: "",
  startDate: "",
  endDate: "",
  renewalDate: "",
  frequency: "", // Ensure this is always initialized explicitly
  assignTo: [], 
};

const CreateTaskModal = ({ open, onClose, onTaskCreated }) => {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Keyboard accessibility (ESC key to close)
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  // Fetch configuration data on Modal open
  useEffect(() => {
    if (open) {
      setFormData(INITIAL_STATE);
      setError("");
      setSuccess(false);

      const fetchModalData = async () => {
        try {
          const [deptRes, managerRes] = await Promise.all([
            API.get("/api/departments"),
            API.get("/api/hr/managers"),
          ]);
          setDepartments(deptRes?.data?.data || deptRes?.data || []);
          setManagers(managerRes?.data?.data || managerRes?.data || []);
        } catch (err) {
          setError("Failed to load departments or managers.");
        }
      };

      fetchModalData();
    }
  }, [open]);

  // Determine if conditional fields should show
  const selectedDeptObj = departments.find(
    (d) => d.id === formData.departmentId,
  );
  const showConditionalFields =
    selectedDeptObj?.name === "SEO" ||
    selectedDeptObj?.name === "Social Media Department";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  // Custom multi-select toggle handler mapped directly to employeeId
  const handleManagerToggle = (employeeId) => {
    if (!employeeId) return;
    setFormData((prev) => {
      const isAlreadySelected = prev.assignTo.includes(employeeId);
      const updatedAssignTo = isAlreadySelected
        ? prev.assignTo.filter((id) => id !== employeeId)
        : [...prev.assignTo, employeeId];
      return { ...prev, assignTo: updatedAssignTo };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      // Construct payload matching target schema requirements
      const payload = {
        projectName: formData.projectName.trim(),
        description: formData.description.trim(),
        departmentId: formData.departmentId,
        startDate: formData.startDate
          ? `${formData.startDate}T00:00:00.000Z`
          : null,
        endDate: formData.endDate ? `${formData.endDate}T00:00:00.000Z` : null,
        assignTo: formData.assignTo,
      };

      // Append conditional fields only if relevant criteria are met
      if (showConditionalFields) {
        payload.renewalDate = formData.renewalDate
          ? `${formData.renewalDate}T00:00:00.000Z`
          : null;
        payload.frequency = formData.frequency || null; // Sends the chosen string structure
      }

      const response = await API.post("/api/projects", payload);

      if (
        response?.data?.success ||
        response?.status === 201 ||
        response?.status === 200
      ) {
        setSuccess(true);
        setTimeout(() => {
          onTaskCreated(response.data?.data || response.data);
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-[20px] font-semibold text-slate-900">
              Create Project
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Add a new project assignment
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {success ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Project Created
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Your project has been successfully added
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* PROJECT NAME */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  name="projectName"
                  required
                  value={formData.projectName}
                  onChange={handleChange}
                  placeholder="Enter project name"
                  className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-slate-400 transition"
                />
              </div>

              {/* DEPARTMENT SELECT */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Department
                </label>
                <select
                  name="departmentId"
                  required
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-slate-400 transition appearance-none"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATES */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    min={today}
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-slate-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    min={formData.startDate || today}
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-slate-400 transition"
                  />
                </div>
              </div>

              {/* CONDITIONAL RENEWAL FIELDS (SEO / Social Media) */}
              {showConditionalFields && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 animate-fadeIn">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Renewal Date
                    </label>
                    <input
                      type="date"
                      name="renewalDate"
                      required={showConditionalFields}
                      min={formData.endDate || today}
                      value={formData.renewalDate}
                      onChange={handleChange}
                      className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-slate-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Frequency
                    </label>
                    <select
                      name="frequency"
                      required={showConditionalFields}
                      value={formData.frequency}
                      onChange={handleChange}
                      className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-slate-400 transition shadow-sm"
                    >
                      <option value="">Select Frequency</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
              )}

              {/* MULTI-SELECT ASSIGN MANAGERS */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Assign Managers
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  Select all managers designated to this project
                </p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 rounded-2xl border border-slate-200 bg-white">
                  {managers.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">
                      No managers available
                    </span>
                  ) : (
                    managers.map((manager) => {
                      const isSelected = formData.assignTo.includes(
                        manager.employeeId,
                      );
                      return (
                        <button
                          type="button"
                          key={manager.id || manager.employeeId}
                          onClick={() =>
                            handleManagerToggle(manager.employeeId)
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                            isSelected
                              ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {manager.name || manager.employeeId}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Write project details..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none resize-none focus:border-slate-400 transition"
                />
              </div>

              {/* ERROR MESSAGE DISPLAY */}
              {error && (
                <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 px-5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 px-6 rounded-2xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Creating
                    </span>
                  ) : (
                    "Create Project"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;