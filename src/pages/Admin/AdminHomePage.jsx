// const AdminPage = () => {
//   return (
//     <div className="p-8">
//       <h1>Admin Dashboard</h1>
//     </div>
//   );
// };

// export default AdminPage;





import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../services/api"; // Your custom API service instance

const AdminPage = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [monthlySheets, setMonthlySheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetching concurrently using your custom API utility
        // Note: Assumes your API setup handles base routes via 'API.get("/path")'
        const [overviewRes, employeesRes, sheetsRes, projectsRes] = await Promise.all([
          API.get("/api/hr/dashboard/admin-overview"),
          API.get("/api/hr/dashboard/employees"),
          API.get("/api/hr/dashboard/monthly-sheets"),
          API.get("/api/hr/dashboard/projects"),
        ]);

        // If your API utility uses Axios, the data is nested inside '.data'
        // We evaluate both patterns (Axios vs vanilla custom wrappers) below:
        const overviewData = overviewRes.data || overviewRes;
        const employeesData = employeesRes.data || employeesRes;
        const sheetsData = sheetsRes.data || sheetsRes;
        const projectsData = projectsRes.data || projectsRes;

        if (overviewData.success) setOverview(overviewData.data);
        if (employeesData.success) setEmployees(employeesData.data);
        if (sheetsData.success) setMonthlySheets(sheetsData.data);
        if (projectsData.success) setProjects(projectsData.data);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg font-semibold text-gray-600">
        Loading dashboard metrics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg m-8 border border-red-200">
        {error}
      </div>
    );
  }

  const counts = overview?.counts || {};
  const assignmentSummary = overview?.assignmentSummary || {};

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Admin Dashboard</h1>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          Live Metrics
        </span>
      </div>

      {/* --- SECTION 1: OVERVIEW STATS CARDS --- */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Core Ecosystem Numbers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/hr/team?role=MANAGER" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block">
            <p className="text-sm font-medium text-gray-500 uppercase">Total Managers</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{counts.totalManagers || 0}</p>
          </Link>
          <Link to="/hr/team?role=EMPLOYEE" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block">
            <p className="text-sm font-medium text-gray-500 uppercase">Total Employees</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{counts.totalEmployees || 0}</p>
          </Link>
          <Link to="/projects" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block">
            <p className="text-sm font-medium text-gray-500 uppercase">Active Projects</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{counts.totalProjects || 0}</p>
          </Link>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500 uppercase">Monthly Sheets Tracked</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{counts.totalMonthlySheets || 0}</p>
          </div>
        </div>
      </div>

      {/* Task Assignment Summary Widgets */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-md font-semibold text-gray-700 mb-3">Global Assignment Status Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-yellow-50 p-3 rounded-lg text-center">
            <span className="block text-xs font-medium text-yellow-700 uppercase">Pending</span>
            <span className="text-xl font-bold text-yellow-900">{assignmentSummary.pending || 0}</span>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <span className="block text-xs font-medium text-blue-700 uppercase">Submitted</span>
            <span className="text-xl font-bold text-blue-900">{assignmentSummary.submitted || 0}</span>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <span className="block text-xs font-medium text-green-700 uppercase">Completed</span>
            <span className="text-xl font-bold text-green-900">{assignmentSummary.completed || 0}</span>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <span className="block text-xs font-medium text-red-700 uppercase">Rejected</span>
            <span className="text-xl font-bold text-red-900">{assignmentSummary.rejected || 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* --- SECTION 2: PROJECTS OVERVIEW --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Project Catalog</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 font-semibold">Project Name</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Timeline (Start - End)</th>
                  <th className="px-4 py-3 font-semibold">Assigned Managers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-600">
                {projects.map((proj) => (
                  <tr 
                    key={proj.id} 
                    onClick={() => navigate(`/project/${proj.id}`)}
                    className="hover:bg-gray-50/70 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{proj.projectName}</td>
                    <td className="px-4 py-3">{proj.department?.name || "N/A"}</td>
                    <td className="px-4 py-3 text-xs">
                      {new Date(proj.startDate).toLocaleDateString()} - <br />
                      {new Date(proj.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {proj.managers?.map((mgr) => (
                        <div key={mgr.id} className="text-xs font-medium text-gray-800">
                          • {mgr.name}
                        </div>
                      )) || "No Managers Assigned"}
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-400">No projects listed.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- SECTION 3: MONTHLY SHEETS TARGETS --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Content Calendar & Monthly Sheets</h2>
          <div className="space-y-4">
            {monthlySheets.map((sheet) => (
              <div key={sheet.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-800">{sheet.project?.projectName}</h4>
                    <p className="text-xs text-gray-500">
                      Period: {sheet.month}/{sheet.year} • Created by {sheet.createdBy?.name}
                    </p>
                  </div>
                  {sheet.moodBoardLink && (
                    <a
                      href={sheet.moodBoardLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      View Moodboard →
                    </a>
                  )}
                </div>
                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <span className="block text-[10px] uppercase text-gray-400">Reels Target</span>
                    <span className="text-sm font-bold text-gray-700">{sheet.totalReels}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <span className="block text-[10px] uppercase text-gray-400">Reels Live</span>
                    <span className="text-sm font-bold text-emerald-600">{sheet.totalReelsUploaded}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <span className="block text-[10px] uppercase text-gray-400">Posts Target</span>
                    <span className="text-sm font-bold text-gray-700">{sheet.totalPosts}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <span className="block text-[10px] uppercase text-gray-400">Posts Live</span>
                    <span className="text-sm font-bold text-emerald-600">{sheet.totalPostsUploaded}</span>
                  </div>
                </div>
              </div>
            ))}
            {monthlySheets.length === 0 && (
              <p className="text-center py-4 text-gray-400 text-sm">No monthly data metrics logged.</p>
            )}
          </div>
        </div>
      </div>

      {/* --- SECTION 4: EMPLOYEE DIRECTORY & PERFORMANCE --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Team Roster & Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((emp) => (
            <div key={emp.id} className="border border-gray-200 p-5 rounded-xl shadow-xs hover:border-gray-300 transition-colors bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-md">{emp.name}</h3>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                    {emp.employeeId}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{emp.email}</p>
                <div className="mt-3 text-xs bg-gray-50 p-2 rounded border border-gray-100">
                  <span className="text-gray-400 block uppercase tracking-tight text-[9px]">Reports To</span>
                  <span className="font-medium text-gray-700">{emp.manager?.name || "Unassigned"}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-gray-500 font-medium">Avg Progress</span>
                  <span className="font-bold text-blue-600">{emp.assignmentStats?.averageProgress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${emp.assignmentStats?.averageProgress || 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {employees.length === 0 && (
            <p className="col-span-full text-center py-4 text-gray-400 text-sm">No employee data found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;