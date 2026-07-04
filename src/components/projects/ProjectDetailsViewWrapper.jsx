// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";
// import API from "../../services/api";

// // ================= Manager Views =================
// import SMMManagerView from "./managers/SMMManagerView";
// import ITManagerView from "./managers/ITManagerView";
// import SEOManagerView from "./managers/SEOManagerView";
// import VideoEditorManagerView from "./managers/VideoEditorManagerView";
// import PerformanceMarketingManagerView from "./managers/PerformanceMarketingManagerView";
// import HRManagerView from "./managers/HRManagerView";
// import SalesBusinessDevelopmentManagerView from "./managers/SalesBusinessDevelopmentManagerView";
// import ContentCreativeManagerView from "./managers/ContentCreativeManagerView";

// // ================= Employee Views =================
// import ITEmployeeView from "./employees/ITEmployeeView";
// import VideoEditorEmployeeView from "./employees/VideoEditorEmployeeView";
// import ContentCreativeEmployeeView from "./employees/ContentCreativeEmployeeView";

// const rolePages = {
//   MANAGER: {
//     "Web Development": ITManagerView,
//     "Social Media ": SMMManagerView,
//     SEO: SEOManagerView,
//     "Video Production": VideoEditorManagerView,
//     "Performance Marketing": PerformanceMarketingManagerView,
//     "Sales & Business Development": SalesBusinessDevelopmentManagerView,
//     "Content & Creative": ContentCreativeManagerView,
//   },

//   EMPLOYEE: {
//     "Web Development": ITEmployeeView,
//     "Video Production": VideoEditorEmployeeView,
//     "Content & Creative": ContentCreativeEmployeeView,
//   },
// };

// const ProjectDetailsWrapper = () => {
//   const { id } = useParams();
//   const { user } = useAuth();

//   const [departmentName, setDepartmentName] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchProjectAndResolveDepartment = async () => {
//       if (!user) return;

//       // Fast-track HR role since it doesn't depend on project departments
//       if (user.role === "HR") {
//         setDepartmentName("HR");
//         setLoading(false);
//         return;
//       }
      
//       try {

//         setLoading(true);
//         setError(null);
        
//         // Fetch the project details to get its department
//         const res = await API.get(`/api/projects/${id}`);
//         const projectData = res.data?.data || res.data;
        
//         // Resolve department name from the project object
//         let resolvedDept = "";
//         if (projectData?.department?.name) {
//           resolvedDept = projectData.department.name;
//         } else if (typeof projectData?.department === "string") {
//           resolvedDept = projectData.department;
//         }

//         setDepartmentName(resolvedDept);
//       } catch (err) {
//         console.error("Error resolving project department mapping:", err);
//         setError(err.response?.data?.message || "Failed to load project context.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProjectAndResolveDepartment();
//   }, [id, user]);

//   if (loading) {
//     return <div className="p-10 text-center text-slate-500 text-sm">Loading project configuration...</div>;
//   }

//   if (error) {
//     return (
//       <div className="p-10 text-center">
//         <h2 className="text-xl font-semibold text-red-600">Error Loading Project</h2>
//         <p className="mt-2 text-sm text-slate-500">{error}</p>
//       </div>
//     );
//   }

//   if (user?.role === "HR") {
//     return <HRManagerView projectId={id} />;
//   }

//   const Component = rolePages?.[user?.role]?.[departmentName];

//   if (!Component) {
//     return (
//       <div className="p-10 text-center">
//         <h2 className="text-xl font-semibold text-slate-900">Department view not found</h2>
//         <p className="text-xs text-slate-500 mt-1">
//           Could not resolve matching view for Department: <strong className="text-slate-800">"{departmentName || "N/A"}"</strong> under Role: <strong>{user?.role}</strong>
//         </p>

//         <pre className="mt-6 mx-auto max-w-2xl text-left bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600 font-mono overflow-x-auto">
//           {JSON.stringify({ user, resolvedProjectDepartment: departmentName }, null, 2)}
//         </pre>
//       </div>
//     );
//   }

//   return <Component projectId={id} />;
// };

// export default ProjectDetailsWrapper;

import React from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import HRManagerView from "./managers/HRManagerView";
import SMMManagerView from "./managers/SMMManagerView";

const ProjectDetailsWrapper = () => {
  const { id } = useParams();
  const { user } = useAuth();

  // Show HR View if user is either HR or ADMIN
  if (user?.role === "HR" || user?.role === "ADMIN" || user?.role === "COORDINATOR") {
    return <HRManagerView projectId={id} />;
  }

  // Otherwise, default to SMM View
  return <SMMManagerView projectId={id} />;
};

export default ProjectDetailsWrapper;