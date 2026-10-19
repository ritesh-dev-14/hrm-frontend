import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserRoles } from "../utils/userRoles";
import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProfessionalLoader from "../components/ProfessionalLoader";
// Pages
const Login = lazy(() => import("../auth/login"));

const AdminHomePage = lazy(() => import("../pages/Admin/AdminHomePage"));
const AdminCompleteDetailsPage = lazy(() => import("../pages/Admin/AdminCompleteDetailsPage"));
const AdminWeeklyVoiceReports = lazy(() => import("../pages/Admin/AdminWeeklyVoiceReports"));
const AdminClientConversationPage = lazy(() => import("../pages/Admin/AdminClientConversationPage"));

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
const MessagesPage = lazy(() => import("../pages/MessagesPage.jsx"));

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
const ManagerClientPendingPage = lazy(() => import("../pages/Manager/ManagerClientPendingPage.jsx"));
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
const CoordinatorTaskProgressPage = lazy(() => import("../pages/Coordinator/CoordinatorTaskProgressPage.jsx"));
const SidebarAppealsPage = lazy(() => import("../pages/EA/SidebarAppealsPage.jsx"));

/* NEW â€” EMPLOYEE ACTIONS */
const AssignedActionsPage = lazy(() => import("../pages/Employee/AssignedActionsPage.jsx"));
const CordinatorTasks = lazy(() => import("../pages/CordinatorTasks.jsx"));
const EmployeeDailyReports = lazy(() => import("../pages/Employee/EmployeeDailyReports.jsx"));
const EditorWorkloadPage = lazy(() => import("../pages/EditorWorkloadPage.jsx"));
const PendingApprovalsPage = lazy(() => import("../pages/PendingApprovalsPage.jsx"));

const MarketingReportsPage = lazy(() => import("../pages/Manager/MarketingReportsPage.jsx"));

const MarketingReportsApprovalPage = lazy(() => import("../pages/HR/MarketingReportsApprovalPage.jsx"));
const MarketingProjectsPage = lazy(() => import("../pages/MarketingProjectsPage.jsx"));
const SocialMediaProjectsPage = lazy(() => import("../pages/SocialMediaProjectsPage.jsx"));
const SEOProjectsPage = lazy(() => import("../pages/SEOProjectsPage.jsx"));
const WebDevelopmentProjectsPage = lazy(() => import("../pages/WebDevelopmentProjectsPage.jsx"));
const DailyDepartmentReportPage = lazy(() => import("../pages/DailyDepartmentReportPage"));
const DepartmentReportsPage = lazy(() => import("../pages/DepartmentReportsPage"));
const DataDashboardPage = lazy(() => import("../pages/DataDashboardPage"));
const ManagerWeeklyVoiceReport = lazy(() => import("../pages/Manager/ManagerWeeklyVoiceReport"));
const QAMetaAdsWeeklyReports = lazy(() => import("../pages/QA/QAMetaAdsWeeklyReports.jsx"));
export const AppRoutes = () => {
  const { role, user, token, isLoading } = useAuth();
  const location = useLocation();
  const isAuthenticated = user && token;
  const currentRole = String(role || user?.role || "").trim().toUpperCase();
  const userRoles = getUserRoles(user, currentRole);
  const hasRole = (...allowedRoles) => allowedRoles.flat().some((allowedRole) => userRoles.includes(allowedRole));

  if (isLoading) {
    return <ProfessionalLoader text="Loading environment..." />;
  }

  return (
    <Suspense
      fallback={<ProfessionalLoader text="Opening page..." />}
    >
      <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      >
      <Routes location={location}>
      {/* LOGIN */}
      <Route path="/login" element={<Login />} />

      {/* AUTH ROUTES */}
      {isAuthenticated && userRoles.length > 0 && (
        <>
          <Route
            path="/messages"
            element={hasRole("ADMIN", "HR", "MANAGER") ? <MessagesPage /> : <Navigate to="/dashboard" replace />}
          />
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
              ) : role === "QA" ? (
                <QAMetaAdsWeeklyReports />
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
            element={hasRole("EMPLOYEE", "HR") ? <EmployeePendingPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/manager/client-pending"
            element={hasRole("MANAGER") ? <ManagerClientPendingPage /> : <Navigate to="/dashboard" replace />}
          />

          <Route path="/project/:id" element={<ProjectDetailsViewWrapper />} />
          <Route path="/project/:id/campaign/:campaignId" element={<ProjectDetailsViewWrapper />} />

          <Route
            path="/employee-daily-reports"
            element={
              hasRole("EMPLOYEE") ? (
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
            path="/editor-workload"
            element={
              hasRole("ADMIN", "HR", "EA", "MANAGER", "COORDINATOR") ? (
                <EditorWorkloadPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/pending-approvals"
            element={
              hasRole("ADMIN", "HR", "MANAGER", "EA", "COORDINATOR") ? (
                <PendingApprovalsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/editor/:workspaceId"
            element={<EditorWorkSpaceDetails />}
          />

          <Route
            path="/priority-actions"
            element={
              hasRole("COORDINATOR", "EA") ? (
                <CoordinatorPriorityActions />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/coordinator/task-progress"
            element={
              hasRole("COORDINATOR", "EA") ? (
                <CoordinatorTaskProgressPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/sidebar-appeals"
            element={
              hasRole("EA", "ADMIN", "HR", "COORDINATOR") ? (
                <SidebarAppealsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/manager-pending"
            element={
              hasRole("MANAGER") ? (
                <ManagerPendingPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/manager/weekly-voice-report"
            element={
              hasRole("MANAGER") ? (
                <ManagerWeeklyVoiceReport />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route path="/tasks" element={<CordinatorTasks />} />

          <Route
            path="/marketing"
            element={
              hasRole("HR", "ADMIN") ? (
                <MarketingReportsApprovalPage />
              ) : hasRole("MANAGER") ? (
                <MarketingReportsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/admin/weekly-voice-reports"
            element={
              hasRole("ADMIN", "HR", "EA") ? (
                <AdminWeeklyVoiceReports />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/admin/client-conversation"
            element={
              hasRole("ADMIN") ? (
                <AdminClientConversationPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/qa/weekly-reports"
            element={
              hasRole("QA", "ADMIN", "EA", "HR") ? (
                <QAMetaAdsWeeklyReports />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/department-reports"
            element={
              hasRole("ADMIN", "HR", "EA", "MANAGER") ? (
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
              hasRole("ADMIN", "HR", "EA", "COORDINATOR", "MANAGER") ? (
                <MarketingProjectsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/social-media-projects"
            element={
              hasRole("ADMIN", "HR", "EA", "COORDINATOR", "MANAGER") ? (
                <SocialMediaProjectsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/seo-projects"
            element={
              hasRole("ADMIN", "HR", "EA", "COORDINATOR", "MANAGER") ? (
                <SEOProjectsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/web-development-projects"
            element={
              hasRole("ADMIN", "HR", "EA", "COORDINATOR", "MANAGER") ? (
                <WebDevelopmentProjectsPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />

          <Route
            path="/assigned-actions"
            element={
              hasRole("EMPLOYEE", "MANAGER", "HR", "ADMIN") ? (
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
              currentRole === "MANAGER" ? (
                <ManagerAttendence />
              ) : currentRole === "HR" ? (
                <HrAttendance />
              ) : (
                <EmployeeAttendence />
              )
            }
          />

          {/* LEAVE */}
          <Route
            path="/leave"
            element={
              currentRole === "MANAGER" ? (
                <ManagerLeave />
              ) : currentRole === "HR" ? (
                <HrLeaves />
              ) : (
                <EmployeeLeave />
              )
            }
          />

          {/* PAYSLIPS */}
          <Route
            path="/payslips"
            element={
              hasRole("HR", "ADMIN", "EA") ? (
                <HrPayslips />
              ) : hasRole("MANAGER") ? (
                <ManagerPayslips />
              ) : (
                <EmployeePayslips />
              )
            }
          />

          <Route
            path="/uploads"
            element={
              hasRole("ADMIN", "HR", "MANAGER", "EMPLOYEE", "EA", "COORDINATOR") ? (
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
              currentRole === "MANAGER" ? (
                <ManagerSettings />
              ) : currentRole === "HR" ? (
                <HrSettings />
              ) : (
                <EmployeeSettings />
              )
            }
          />

          {/* HR */}
          {hasRole("HR") && (
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

          {hasRole("ADMIN") && (
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

          {hasRole("EMPLOYEE") && (
            <>
              <Route path="/reports/employee" element={<EmployeeReports />} />
            </>
          )}

          {/* ADMIN */}
          {hasRole("ADMIN") && (
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
          hasRole("ADMIN", "HR", "EA", "MANAGER") ? (
            <DailyDepartmentReportPage />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      <Route
        path="/data/:projectId?"
        element={
          hasRole("ADMIN", "HR", "EA", "MANAGER") ? (
            <DataDashboardPage />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      </Routes>
      </motion.div>
      </AnimatePresence>
    </Suspense>
  );
};

export default AppRoutes;
