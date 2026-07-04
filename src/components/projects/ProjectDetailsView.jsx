import { useEffect, useState } from "react";
import { 
  Calendar, 
  Building2, 
  User2, 
  RefreshCw, 
  Clock, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  Edit2,
  Check,
  X,
  Lock,
  Globe,
  MapPin,
  Phone
} from "lucide-react";
import API from "../../services/api";

const ProjectDetailsView = ({ projectId, onBack, userRole = "" }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Edit Feature States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    description: "",
    endDate: "",
    frequency: "",
    renewalDate: "",
    clientName: "",
    location: "",
    phone: "",
    fbEmail: "",
    fbPassword: "",
    instaEmail: "",
    instaPassword: "",
    projectStartDate: "" // Matches target endpoint key payload schema
  });

  // Strict structural role verification
  const isManager = userRole?.toUpperCase() === "MANAGER";

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    if (!projectId) {
      setError("No Project ID provided.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const response = await API.get(`/api/projects/${projectId}`);
      
      if (response?.data?.success && response?.data?.data) {
        const data = response.data.data;
        setProject(data);
        
        setEditForm({
          description: data.description || "",
          endDate: data.endDate ? data.endDate.split("T")[0] : "",
          frequency: data.frequency || "monthly",
          renewalDate: data.renewalDate ? data.renewalDate.split("T")[0] : "",
          clientName: data.clientName || "",
          location: data.location || "",
          phone: data.phone || "",
          fbEmail: data.fbEmail || "",
          fbPassword: data.fbPassword || "",
          instaEmail: data.instaEmail || "",
          instaPassword: data.instaPassword || "",
          projectStartDate: data.startDate ? data.startDate.split("T")[0] : ""
        });
      } else {
        setError("Could not parse project data from server response.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "An error occurred while fetching details.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
  if (!isManager) {
    setError("Unauthorized Action: Only Managers can update project details.");
    return;
  }

  try {
    setSaving(true);
    setError("");

    // Fallback safely to original data values if form inputs are unmodified or empty
    const payload = {
      clientName: editForm.clientName || project.clientName || null,
      location: editForm.location || project.location || null,
      phone: editForm.phone || project.phone || null,
      fbEmail: editForm.fbEmail || project.fbEmail || null,
      fbPassword: editForm.fbPassword || project.fbPassword || null,
      instaEmail: editForm.instaEmail || project.instaEmail || null,
      instaPassword: editForm.instaPassword || project.instaPassword || null,
      description: editForm.description || project.description || null,
      frequency: editForm.frequency || project.frequency || "monthly",
      
      // Match ISO strings cleanly or fallback safely to existing records
      projectStartDate: editForm.projectStartDate ? new Date(editForm.projectStartDate).toISOString() : project.startDate,
      endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : project.endDate,
      renewalDate: editForm.renewalDate ? new Date(editForm.renewalDate).toISOString() : project.renewalDate
    };

    console.log("Submitting updated project payload structure:", payload);

    const response = await API.patch(`/api/projects/${projectId}`, payload);

    if (response?.data?.success || response?.status === 200) {
      setIsEditing(false);
      await fetchProjectDetails();
    } else {
      setError("Failed to update project fields.");
    }
  } catch (err) {
    // Print out exact detailed backend authorization/validation complaints
    console.error("Backend Rejected with 403 details:", err?.response?.data);
    setError(err?.response?.data?.message || "Server verification failed (403 Forbidden). Ensure you are assigned to this project.");
  } finally {
    setSaving(false);
  }
};

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-slate-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading project information...</p>
      </div>
    );
  }

  const isSocialMediaDept = project?.department?.name?.toLowerCase().includes("social media");

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-fadeIn">
      {/* ACTION BAR */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Projects
        </button>

        {/* CONTROLS RENDER ONLY IF REQUEST IS VERIFIED MANAGER ROLE */}
        {isManager && (
          <div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition shadow-sm"
              >
                <Edit2 size={15} /> Edit Project
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-700 transition"
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} 
                  Save Changes
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* CORE INFO CARD */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* TOP OVERVIEW */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-sm">
                <Building2 size={12} />
                {project.department?.name || "General Department"}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-3 tracking-tight">
                {project.projectName}
              </h1>
            </div>
            
            <div className="text-xs text-slate-400 flex flex-col gap-1 md:text-right md:self-end">
              <span className="flex items-center md:justify-end gap-1.5">
                <Clock size={12} /> Created: {formatDate(project.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* DETAILS LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          
          {/* MAIN COLUMN */}
          <div className="lg:col-span-2 p-8 space-y-8">
            {/* DESCRIPTION */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Project Details & Scope
              </h3>
              {isEditing ? (
                <textarea
                  name="description"
                  val ue={editForm.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 text-sm text-slate-700 bg-slate-50/50 resize-none"
                  placeholder="Enter updated project description..."
                />
              ) : (
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {project.description || "No project description provided."}
                </p>
              )}
            </div>

            {/* CLIENT INFORMATION VIEW */}
            <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Globe size={14} /> Client Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Client Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="clientName"
                      value={editForm.clientName}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">{project.clientName || "-"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Location / Zone</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={editForm.location}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" /> {project.location || "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-400"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                      <Phone size={13} className="text-slate-400" /> {project.phone || "-"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* CONNECTED PLATFORM CREDENTIALS */}
            {isSocialMediaDept && (
              <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Lock size={14} /> Connected Platform Credentials
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Facebook Email/Username</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="fbEmail"
                        value={editForm.fbEmail}
                        onChange={handleInputChange}
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-700 break-all">{project.fbEmail || "Not Provided"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Facebook Password</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="fbPassword"
                        value={editForm.fbPassword}
                        onChange={handleInputChange}
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-700 font-mono">
                        {project.fbPassword ? "••••••••" : "Not Provided"}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 sm:pt-0">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Instagram Email/Username</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="instaEmail"
                        value={editForm.instaEmail}
                        onChange={handleInputChange}
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-700 break-all">{project.instaEmail || "Not Provided"}</p>
                    )}
                  </div>

                  <div className="pt-2 sm:pt-0">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Instagram Password</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="instaPassword"
                        value={editForm.instaPassword}
                        onChange={handleInputChange}
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-700 font-mono">
                        {project.instaPassword ? "••••••••" : "Not Provided"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TEAM MANAGERS OVERVIEW */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                Assigned Team Managers ({project.assignments?.length || 0})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.assignments?.map((assignment) => (
                  <div key={assignment.id} className="flex items-start gap-3 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-600 shrink-0">
                      <User2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">{assignment.manager?.name || "Unknown Manager"}</h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{assignment.manager?.position || "Manager Role"}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-600 font-medium">
                        {assignment.manager?.employeeId || "No ID"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* META SIDEBAR */}
          <div className="p-8 bg-slate-50/30 space-y-6">
            
            {/* TIMELINE */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Project Schedule
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Calendar size={16} className="text-slate-400 shrink-0" />
                  <div className="w-full">
                    <span className="block text-xs text-slate-400 font-medium">Start Date</span>
                    {isEditing ? (
                      <input
                        type="date"
                        name="projectStartDate"
                        value={editForm.projectStartDate}
                        onChange={handleInputChange}
                        className="mt-1 w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-slate-400"
                      />
                    ) : (
                      <span className="font-medium text-slate-800">{formatDate(project.startDate)}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Calendar size={16} className="text-slate-400 shrink-0" />
                  <div className="w-full">
                    <span className="block text-xs text-slate-400 font-medium">End Date</span>
                    {isEditing ? (
                      <input
                        type="date"
                        name="endDate"
                        value={editForm.endDate}
                        onChange={handleInputChange}
                        className="mt-1 w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-slate-400"
                      />
                    ) : (
                      <span className="font-medium text-slate-800">{formatDate(project.endDate)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* BILLING ARCHITECTURE */}
            <div className="pt-5 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Renewal Architecture
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <RefreshCw size={16} className="text-slate-400 shrink-0" />
                  <div className="w-full">
                    <span className="block text-xs text-slate-400 font-medium">Next Renewal</span>
                    {isEditing ? (
                      <input
                        type="date"
                        name="renewalDate"
                        value={editForm.renewalDate}
                        onChange={handleInputChange}
                        className="mt-1 w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-slate-400"
                      />
                    ) : (
                      <span className="font-medium text-slate-800">{formatDate(project.renewalDate)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Clock size={16} className="text-slate-400 shrink-0" />
                  <div className="w-full">
                    <span className="block text-xs text-slate-400 font-medium">Billing Frequency</span>
                    {isEditing ? (
                      <select
                        name="frequency"
                        value={editForm.frequency}
                        onChange={handleInputChange}
                        className="mt-1 w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-slate-400 capitalize"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    ) : (
                      <span className="font-medium text-slate-800 capitalize">{project.frequency || "N/A"}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CREATOR SIGNATURE */}
            {project.createdBy && (
              <div className="pt-5 border-t border-slate-100">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Created By
                </h3>
                <div className="text-sm">
                  <p className="font-medium text-slate-800">{project.createdBy.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{project.createdBy.role} Officer</p>
                  <span className="inline-block mt-1 text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    ID: {project.createdBy.employeeId}
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsView;