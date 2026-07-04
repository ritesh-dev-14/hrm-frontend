import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../services/api";
import { 
  Plus, 
  Video, 
  Folder, 
  Users, 
  ListTodo, 
  Calendar, 
  ArrowRight, 
  Loader2, 
  X,
  AlertCircle 
} from "lucide-react";

const ShootManagerPage = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Create Workspace Form State
  const [formData, setFormData] = useState({
    brandName: "",
    description: "",
  });

  // Fetch All Workspaces
  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true);
      const res = await API.get("/api/shoot-workspaces");
      if (res.data?.success) {
        setWorkspaces(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching shoot workspaces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Assigned Projects for Dropdown selection
  const fetchAssignedProjects = async () => {
    try {
      const res = await API.get("/api/projects/assigned");
      if (res.data?.success) {
        setAssignedProjects(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching assigned projects:", error);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    fetchAssignedProjects();
  }, []);

  // Handle Dropdown Change Event
  const handleProjectSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setFormData({ brandName: "", description: "" });
      return;
    }

    const selectedProject = assignedProjects.find((p) => p.id === selectedId);
    if (selectedProject) {
      setFormData({
        brandName: selectedProject.projectName || "",
        description: selectedProject.description || "",
      });
    }
  };

  // Handle Form Submission
  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!formData.brandName.trim()) return;

    try {
      setIsSubmitLoading(true);
      setErrorMessage("");
      
      const res = await API.post("/api/shoot-workspaces", {
        brandName: formData.brandName.trim(),
        description: formData.description.trim(),
      });

      if (res.data?.success) {
        // Reset state, close modal, and update list
        setFormData({ brandName: "", description: "" });
        setIsModalOpen(false);
        fetchWorkspaces();
      } else {
        setErrorMessage(res.data?.message || "Failed to create shoot workspace.");
      }
    } catch (error) {
      console.error("Error creating shoot workspace:", error);
      setErrorMessage(
        error.response?.data?.message || "An error occurred while creating the workspace."
      );
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Video className="text-indigo-600 h-6 w-6" />
            Shoot's Project Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize, track, and monitor media production campaigns and active tasks.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition shadow-sm shadow-indigo-600/10 text-sm"
        >
          <Plus size={18} />
          Create Shoot Project
        </button>
      </div>

      {/* CORE WORKSPACE LIST TRACKS */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-slate-500 text-sm mt-3">Loading shoot projects...</p>
        </div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <Folder className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-md font-semibold text-slate-800">No Shoots Workspaces Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Get started by creating your first workspace workflow container to track photo and reel pipelines.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium text-sm rounded-lg transition"
          >
            Create New Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((shoot) => (
            <div
              key={shoot.id}
              onClick={() => navigate(`/shoot/${shoot.id}`)}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow-md transition duration-200 p-5 flex flex-col justify-between cursor-pointer relative overflow-hidden"
            >
              <div>
                {/* Title */}
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition truncate max-w-[85%]">
                    {shoot.name}
                  </h3>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition shrink-0 mt-1" />
                </div>

                {/* Description */}
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 min-h-[40px]">
                  {shoot.description || "No description provided for this shoot workspace."}
                </p>
              </div>

              {/* Workspace Metrics Footer Row */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md font-medium text-slate-700">
                    <ListTodo size={14} className="text-slate-400" />
                    {shoot.tasks?.length || 0} Tasks
                  </span>
                  
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md font-medium text-slate-700">
                    <Users size={14} className="text-slate-400" />
                    {shoot.members?.length || 0} Members
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar size={12} />
                  {shoot.createdAt ? new Date(shoot.createdAt).toLocaleDateString() : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE WORKSPACE POPUP MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden relative animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Video className="text-indigo-600 h-5 w-5" />
                New Shoot Project
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setErrorMessage("");
                  setFormData({ brandName: "", description: "" });
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleCreateWorkspace} className="p-5 space-y-4">
              
              {errorMessage && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl flex items-center gap-2 border border-rose-100">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Assigned Project <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  onChange={handleProjectSelect}
                  className="w-full px-3 py-2.5 border border-slate-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800 transition cursor-pointer"
                >
                  <option value="">-- Choose a Project --</option>
                  {assignedProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.projectName}
                    </option>
                  ))}
                </select>
              </div>

              {formData.brandName && (
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4.5 space-y-3 animate-fade-in">
                  <div>
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Project Brand Name</span>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{formData.brandName}</p>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Description Baseline</span>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed bg-white border border-slate-100 p-2.5 rounded-lg max-h-24 overflow-y-auto">
                      {formData.description || "No description provided for this project setup."}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Trigger Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitLoading}
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrorMessage("");
                    setFormData({ brandName: "", description: "" });
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitLoading || !formData.brandName.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSubmitLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Shoot Project"
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShootManagerPage;