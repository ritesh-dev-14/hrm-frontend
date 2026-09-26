import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { lazy, Suspense } from "react";
import ProfessionalLoader from "../components/ProfessionalLoader";
// Pages
const Login = lazy(() => import("../auth/login"));

const AdminHomePage = lazy(() => import("../pages/Admin/AdminHomePage"));
const AdminCompleteDetailsPage = lazy(() => import("../pages/Admin/AdminCompleteDetailsPage"));

// Shared Task Detail
const ProjectDetailsViewWrapper = lazy(() => import("../components/projects/ProjectDetailsViewWrapper"));

const HrHomePage = lazy(() => import("../pages/HR/HrHomePage"));
const HrTeamPage = lazy(() => import("../pages/HR/HrTeamPage"));
const HrLeaveManagement = lazy(() => import("../pages/HR/HrEmployeeLeaves"));
const HrPayslips = lazy(() => import("../pages/HR/HrPaySlips"));
const HrUploads = lazy(() => import("../pages/HR/HrUploads"));
const HrSettings = lazy(() => import("../pages/HR/HrSettigns"));
const HrAttendance = lazy(() => import("../pages/HR/HrAttendance.jsx"));
const HrLeaves = lazy(() => import("../pages/HR/HrLeaves.jsx"));
const HrAllEmployeeAttendence = lazy(() => import("../pages/HR/HrAllEmployeeAttendence.jsx"));
const HrTaskCreation = lazy(() => import("../pages/HR/HrTaskCreation"));
const HrReports = lazy(() => import("../pages/HR/HrReports"));
const ProjectsReportsOverviewPage = lazy(() => import("../pages/HR/ProjectsReportsOverviewPage"));
const HrEmployeeProjectReport = lazy(() => import("../pages/HR/HrEmployeeProjectReport"));
const HrEmployeeDetailedAttendance = lazy(() => import("../pages/HR/HrEmployeeDetailedAttendance"));
const HrWhatsappMessages = lazy(() => import("../pages/HR/HrWhatsappMessages.jsx"));

const EmployeeDetails = lazy(() => import("../pages/HR/employeeDetailsHr/EmployeeDetails"));
const EmployeHomePage = lazy(() => import("../pages/Employee/EmployeeHomePage"));
const EmployeeAttendence = lazy(() => import("../pages/Employee/EmployeeAttendence"));
const EmployeeLeave = lazy(() => import("../pages/Employee/EmployeeLeave"));
const EmployeePayslips = lazy(() => import("../pages/Employee/EmployeePayslips"));
const EmployeeSettings = lazy(() => import("../pages/Employee/EmployeeSettings"));
const EmployeeTaskPage = lazy(() => import("../pages/Employee/EmployeeTaskPage.jsx"));
const EmployeeReports = lazy(() => import("../pages/Employee/EmployeeReports"));
const EmployeePendingPage = lazy(() => import("../pages/Employee/EmployeePendingPage.jsx"));

const ManagerHomePage = lazy(() => import("../pages/Manager/ManagerHomePage"));
const ManagerAttendence = lazy(() => import("../pages/Manager/ManagerAttendence"));
const ManagerLeave = lazy(() => import("../pages/Manager/ManagerLeave"));
const ManagerPayslips = lazy(() => import("../pages/Manager/ManagerPayslips"));
const ManagerSettings = lazy(() => import("../pages/Manager/ManagerSettings"));
const ManagerPendingPage = lazy(() => import("../pages/Manager/ManagerPendingPage"));
const ManagerTaskPage = lazy(() => import("../pages/Manager/ManagerTasksPage.jsx"));

// shoots
const ShootPage = lazy(() => import("../components/shoots/ShootPage.jsx"));
const ShootWorkspaceDetails = lazy(() => import("../components/shoots/manager/ShootWorkspaceDetails.jsx"));
const ShootManagementPage = lazy(() => import("../components/shoots/ShootManagementPage.jsx"));

// editor
const EditorPage = lazy(() => import("../components/editor/EditorPage.jsx"));
const EditorWorkSpaceDetails = lazy(() => import("../components/editor/manager/EditorWorkspaceDetails.jsx"));

/* NEW â€” COORDINATOR */
const CoordinatorHomePage = lazy(() => import("../pages/Coordinator/CoordinatorHomePage.jsx"));
const CoordinatorPriorityActions = lazy(() => import("../pages/Coordinator/CoordinatorPriorityActions.jsx"));
const SidebarAppealsPage = lazy(() => import("../pages/EA/SidebarAppealsPage.jsx"));

/* NEW â€” EMPLOYEE ACTIONS */
const AssignedActionsPage = lazy(() => import("../pages/Employee/AssignedActionsPage.jsx"));
const CordinatorTasks = lazy(() => import("../pages/CordinatorTasks.jsx"));
const EmployeeDailyReports = lazy(() => import("../pages/Employee/EmployeeDailyReports.jsx"));
const MarketingReportsPage = lazy(() => import("../pages/Manager/MarketingReportsPage.jsx"));

const MarketingReportsApprovalPage = lazy(() => import("../pages/HR/MarketingReportsApprovalPage.jsx"));
const MarketingProjectsPage = lazy(() => import("../pages/MarketingProjectsPage.jsx"));
const SocialMediaProjectsPage = lazy(() => import("../pages/SocialMediaProjectsPage.jsx"));
const SEOProjectsPage = lazy(() => import("../pages/SEOProjectsPage.jsx"));
const WebDevelopmentProjectsPage = lazy(() => import("../pages/WebDevelopmentProjectsPage.jsx"));
const DailyDepartmentReportPage = lazy(() => import("../pages/DailyDepartmentReportPage"));
const DepartmentReportsPage = lazy(() => import("../pages/DepartmentReportsPage"));
const DataDashboardPage = lazy(() => import("../pages/DataDashboardPage"));

export const AppRoutes = () => {
  const { role, user, token, isLoading } = useAuth();
  const isAuthenticated = user && token;

  if (isLoading) {
    return <ProfessionalLoader text="Loading environment..." />;
  }

  return (
    <Suspense
      fallback={<ProfessionalLoader text="Opening page..." />}
    >
      <Routes>
      {/* LOGIN */}
      <Route path="/login" element={<Login />} />

      {/* AUTH ROUTES */}
      {isAuthenticated && role && (
        <>
          {/* HOME */}
          <Route
            path="/dashboard"
            element={
              role === "ADMIN" ? (
                <AdminHomePage />
              ) : role === "HR" ? (
                <HrHomePage />
              ) : role === "MANAGER" ? (
                <ManagerHomePage />
              ) : role === "COORDINATOR" || role === "EA" ? (
                <CoordinatorHomePage />
              ) : (
                <EmployeHomePage />
              )
            }
          />

          {/* TASKS */}
          <Route
            path="/projects"
            element={
              role === "ADMIN" ? (
                <HrTaskCreation />
              ) : role === "HR" ? (
                <HrTaskCreation />
              ) : role === "MANAGER" ? (
                <ManagerTaskPage />
              ) : role === "COORDINATOR" || role === "EA" ? (
                <HrTaskCreation />
              ) : (
                <EmployeeTaskPage />
              )
            }
          />

          <Route
            path="/employee-pending"
            element={role === "EMPLOYEE" ? <EmployeePendingPage /> : <Navigate to="/dashboard" replace />}
          />

          <Route path="/project/:id" element={<ProjectDetailsViewWrapper />} />
          <Route path="/project/:id/campaign/:campaignId" element={<ProjectDetailsViewWrapper />} />

          <Route
            path="/employee-daily-reports"
            element={
              role === "EMPLOYEE" ? (
                <EmployeeDailyReports />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* SAFE ACCESS GUARD GRID FOR MEDIA SHOOTS */}
          <Route path="/shoot" element={<ShootPage />} />
          <Route path="/shoot-management" element={<ShootManagementPage />} />

          <Route
            path="/shoot/:workspaceId"
            element={<ShootWorkspaceDetails />}
          />

          <Route path="/editor" element={<EditorPage />} />

          <Route
            path="/editor/:workspaceId"
            element={<EditorWorkSpaceDetails />}
          />

          <Route
            path="/priority-actions"
            element={
              role === "COORDINATOR" || role === "EA" ? (
                <CoordinatorPriorityActions />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/sidebar-appeals"
            element={
              ["EA", "ADMIN", "HR", "COORDINATOR"].includes(role) ? (
                <SidebarAppealsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/manager-pending"
            element={
              role === "MANAGER" ? (
                <ManagerPendingPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route path="/tasks" element={<CordinatorTasks />} />

          <Route
            path="/marketing"
            element={
              role === "HR" || role === "ADMIN" ? (
                <MarketingReportsApprovalPage />
              ) : role === "MANAGER" ? (
                <MarketingReportsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/department-reports"
            element={
              ["ADMIN", "HR", "EA", "MANAGER"].includes(role) ? (
                <DepartmentReportsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/meta-ads-tasks"
            element={
              <Navigate to="/marketing-projects" replace />
            }
          />



          <Route
            path="/marketing-projects"
            element={
              ["ADMIN", "HR", "EA", "MANAGER"].includes(role) ? (
                <MarketingProjectsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/social-media-projects"
            element={
              ["ADMIN", "HR", "EA", "MANAGER"].includes(role) ? (
                <SocialMediaProjectsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/seo-projects"
            element={
              ["ADMIN", "HR", "EA", "MANAGER"].includes(role) ? (
                <SEOProjectsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/web-development-projects"
            element={
              ["ADMIN", "HR", "EA", "MANAGER"].includes(role) ? (
                <WebDevelopmentProjectsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/assigned-actions"
            element={
              ["EMPLOYEE", "MANAGER", "HR"].includes(role) ? (
                <AssignedActionsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* ATTENDANCE */}
          <Route
            path="/attendance"
            element={
              role === "EMPLOYEE" ? (
                <EmployeeAttendence />
              ) : role === "MANAGER" ? (
                <ManagerAttendence />
              ) : role === "HR" ? (
                <HrAttendance />
              ) : role === "COORDINATOR" || role === "EA" ? (
                <EmployeeAttendence />
              ) : null
            }
          />

          {/* LEAVE */}
          <Route
            path="/leave"
            element={
              role === "EMPLOYEE" ? (
                <EmployeeLeave />
              ) : role === "MANAGER" ? (
                <ManagerLeave />
              ) : role === "HR" ? (
                <HrLeaves />
              ) : role === "COORDINATOR" || role === "EA" ? (
                <EmployeeLeave />
              ) : null
            }
          />

          {/* PAYSLIPS */}
          <Route
            path="/payslips"
            element={
              role === "EMPLOYEE" ? (
                <EmployeePayslips />
              ) : role === "MANAGER" ? (
                <ManagerPayslips />
              ) : ["HR", "ADMIN", "EA"].includes(role) ? (
                <HrPayslips />
              ) : role === "COORDINATOR" ? (
                <EmployeePayslips />
              ) : null
            }
          />

          <Route
            path="/uploads"
            element={
              ["ADMIN", "HR", "MANAGER", "EMPLOYEE", "EA", "COORDINATOR"].includes(role) ? (
                <HrUploads />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          {/* SETTINGS */}
          <Route
            path="/settings"
            element={
              role === "EMPLOYEE" ? (
                <EmployeeSettings />
              ) : role === "MANAGER" ? (
                <ManagerSettings />
              ) : role === "HR" ? (
                <HrSettings />
              ) : role === "COORDINATOR" || role === "EA" ? (
                <EmployeeSettings />
              ) : null
            }
          />

          {/* HR */}
          {role === "HR" && (
            <>
              <Route
                path="/hr/employees-attendance"
                element={<HrAllEmployeeAttendence />}
              />
              <Route path="/hr/employee-attendance/:employeeId" element={<HrEmployeeDetailedAttendance />} />
              <Route path="/hr/team/:id" element={<EmployeeDetails />} />
              <Route
                path="/hr/employees-leaves"
                element={<HrLeaveManagement />}
              />
              <Route path="/hr/team" element={<HrTeamPage />} />
              <Route path="/reports/hr" element={<HrReports />} />
              <Route path="/reports/overview" element={<ProjectsReportsOverviewPage />} />
              <Route path="/reports/hr/employee/:employeeId" element={<HrEmployeeProjectReport />} />
              <Route path="/hr/whatsapp-messages" element={<HrWhatsappMessages />} />
            </>
          )}

          {role === "ADMIN" && (
            <>
              <Route
                path="/hr/employees-attendance"
                element={<HrAllEmployeeAttendence />}
              />
              <Route path="/hr/employee-attendance/:employeeId" element={<HrEmployeeDetailedAttendance />} />
              <Route path="/hr/team/:id" element={<EmployeeDetails />} />
              <Route
                path="/hr/employees-leaves"
                element={<HrLeaveManagement />}
              />
              <Route path="/hr/team" element={<HrTeamPage />} />
              <Route path="/reports/hr" element={<HrReports />} />
              <Route path="/reports/overview" element={<ProjectsReportsOverviewPage />} />
              <Route path="/reports/hr/employee/:employeeId" element={<HrEmployeeProjectReport />} />
              <Route path="/hr/whatsapp-messages" element={<HrWhatsappMessages />} />
            </>
          )}

          {role === "EMPLOYEE" && (
            <>
              <Route path="/reports/employee" element={<EmployeeReports />} />
            </>
          )}

          {/* ADMIN */}
          {role === "ADMIN" && (
            <>
              <Route path="/admin/settings" element={<AdminHomePage />} />
              <Route path="/admin/complete-details" element={<AdminCompleteDetailsPage />} />
            </>
          )}

          {/* ROOT */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      )}

      {/* UNAUTH */}
      {!isAuthenticated && (
        <>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}

      <Route
        path="/daily-reports"
        element={
          ["ADMIN", "HR", "EA", "MANAGER"].includes(role) ? (
            <DailyDepartmentReportPage />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      <Route
        path="/data/:projectId?"
        element={
          ["ADMIN", "HR", "EA", "MANAGER"].includes(role) ? (
            <DataDashboardPage />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      </Routes>
    </Suspense>
  );
};

export default AppRoutes;


