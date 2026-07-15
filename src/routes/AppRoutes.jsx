import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

import API from "../services/api";
// Pages
import Login from "../auth/login";

import AdminHomePage from "../pages/Admin/AdminHomePage";
import AdminTaskCreation from "../pages/Admin/AdminTaskCreation";

// Shared Task Detail
import TaskDetailPage from "../components/taskCreation/TaskDetailPage.jsx";
import ProjectDetailsViewWrapper from "../components/projects/ProjectDetailsViewWrapper";

import HrHomePage from "../pages/HR/HrHomePage";
import HrTeamPage from "../pages/HR/HrTeamPage";
import HrLeaveManagement from "../pages/HR/HrEmployeeLeaves";
import HrPayslips from "../pages/HR/HrPaySlips";
import HrSettings from "../pages/HR/HrSettigns";
import HrAttendance from "../pages/HR/HrAttendance.jsx";
import HrLeaves from "../pages/HR/HrLeaves.jsx";
import HrAllEmployeeAttendence from "../pages/HR/HrAllEmployeeAttendence.jsx";
import HrTaskCreation from "../pages/HR/HrTaskCreation";

import EmployeeDetails from "../pages/HR/employeeDetailsHr/EmployeeDetails";
import EmployeHomePage from "../pages/Employee/EmployeeHomePage";
import EmployeeAttendence from "../pages/Employee/EmployeeAttendence";
import EmployeeLeave from "../pages/Employee/EmployeeLeave";
import EmployeePayslips from "../pages/Employee/EmployeePayslips";
import EmployeeSettings from "../pages/Employee/EmployeeSettings";
import EmployeeTaskPage from "../pages/Employee/EmployeeTaskPage.jsx";
import EmployeeTaskDetailsPage from "../pages/Employee/tasks/EmployeeTaskDetailsPage.jsx";

import ManagerHomePage from "../pages/Manager/ManagerHomePage";
import ManagerAttendence from "../pages/Manager/ManagerAttendence";
import ManagerLeave from "../pages/Manager/ManagerLeave";
import ManagerPayslips from "../pages/Manager/ManagerPayslips";
import ManagerSettings from "../pages/Manager/ManagerSettings";
import ManagerTaskPage from "../pages/Manager/ManagerTasksPage.jsx";

// shoots
import ShootPage from "../components/shoots/ShootPage.jsx";
import ShootWorkspaceDetails from "../components/shoots/manager/ShootWorkspaceDetails.jsx";

// editor
import EditorPage from "../components/editor/EditorPage.jsx";
import EditorWorkSpaceDetails from "../components/editor/manager/EditorWorkspaceDetails.jsx";

/* NEW — COORDINATOR */
import CoordinatorHomePage from "../pages/Coordinator/CoordinatorHomePage.jsx";
import CoordinatorPriorityActions from "../pages/Coordinator/CoordinatorPriorityActions.jsx";

/* NEW — EMPLOYEE ACTIONS */
import AssignedActionsPage from "../pages/Employee/AssignedActionsPage.jsx";
import CordinatorTasks from "../pages/CordinatorTasks.jsx";

export const AppRoutes = () => {
  const { role, user, token, isLoading } = useAuth();
  const isAuthenticated = user && token;

  // Compute the initial state synchronously to prevent asynchronous state-change flickering
  const [departmentName, setDepartmentName] = useState(() => {
    if (role === "HR" || role === "ADMIN") return role.toUpperCase();

    const initialDeptId =
      user?.departmentId ||
      user?.department ||
      user?.deptId ||
      user?.department_id;
    const initialDeptsArray = user?.departments || [];

    if (!initialDeptId && initialDeptsArray.length === 0 && user) {
      return user?.position ? String(user.position).trim() : "GENERAL_STAFF";
    }
    return "";
  });

  const [isDeptLoading, setIsDeptLoading] = useState(() => {
    if (role === "HR" || role === "ADMIN") return false;

    const initialDeptId =
      user?.departmentId ||
      user?.department ||
      user?.deptId ||
      user?.department_id;
    const initialDeptsArray = user?.departments || [];

    if (!initialDeptId && initialDeptsArray.length === 0) return false;
    return true;
  });

  useEffect(() => {
    const getDepartmentName = async () => {
      if (isLoading) return;

      if (!user) {
        setIsDeptLoading(false);
        return;
      }

      try {
        if (!role) {
          setIsDeptLoading(false);
          return;
        }

        const normalizedRole = role.toUpperCase();
        if (normalizedRole === "HR" || normalizedRole === "ADMIN") {
          setIsDeptLoading(false);
          return;
        }

        const assignedDepartmentId =
          user?.departmentId ||
          user?.department ||
          user?.deptId ||
          user?.department_id;

        const assignedDepartmentsArray = user?.departments || [];

        if (!assignedDepartmentId && assignedDepartmentsArray.length === 0) {
          setIsDeptLoading(false);
          return;
        }

        const res = await API.get("/api/departments");
        const departmentsList = res.data?.data || [];

        const targetIds = new Set();
        if (assignedDepartmentId) {
          if (typeof assignedDepartmentId === "object") {
            targetIds.add(
              String(
                assignedDepartmentId?.id || assignedDepartmentId?._id || "",
              ),
            );
          } else {
            targetIds.add(String(assignedDepartmentId));
          }
        }

        assignedDepartmentsArray.forEach((dept) => {
          if (typeof dept === "object") {
            targetIds.add(String(dept?.id || dept?._id || ""));
          } else {
            targetIds.add(String(dept));
          }
        });

        const matchedDepartment = departmentsList.find((d) => {
          const systemDeptId = String(d.id || d._id || "");
          return targetIds.has(systemDeptId);
        });

        if (matchedDepartment?.name) {
          setDepartmentName(matchedDepartment.name.trim());
        } else {
          if (typeof user?.department === "string" && user?.department) {
            setDepartmentName(user.department);
          } else {
            setDepartmentName("GENERAL_STAFF");
          }
        }
      } catch (err) {
        console.error(
          "Failed fetching routing engine context keys via API:",
          err,
        );
        setDepartmentName("GENERAL_STAFF");
      } finally {
        setIsDeptLoading(false);
      }
    };

    getDepartmentName();
  }, [role, user, isLoading]);

  if (isLoading || (isAuthenticated && isDeptLoading)) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-white">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium text-sm">
            Loading Environment...
          </p>
        </div>
      </div>
    );
  }

  return (
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
              ) : role === "COORDINATOR" ? (
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
              ) : role === "COORDINATOR" ? (
                <HrTaskCreation />
              ) : (
                <EmployeeTaskPage />
              )
            }
          />

          <Route path="/project/:id" element={<ProjectDetailsViewWrapper />} />

          {/* SAFE ACCESS GUARD GRID FOR MEDIA SHOOTS */}
          <Route path="/shoot" element={<ShootPage />} />

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
              role === "COORDINATOR" ? (
                <CoordinatorPriorityActions />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route path="/tasks" element={<CordinatorTasks />} />

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
              ) : role === "COORDINATOR" ? (
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
              ) : role === "COORDINATOR" ? (
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
              ) : role === "HR" ? (
                <HrPayslips />
              ) : role === "COORDINATOR" ? (
                <EmployeePayslips />
              ) : null
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
              ) : role === "COORDINATOR" ? (
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
              <Route path="/hr/team/:id" element={<EmployeeDetails />} />
              <Route
                path="/hr/employees-leaves"
                element={<HrLeaveManagement />}
              />
              <Route path="/hr/team" element={<HrTeamPage />} />
            </>
          )}

          {role === "ADMIN" && (
            <>
              <Route
                path="/hr/employees-attendance"
                element={<HrAllEmployeeAttendence />}
              />
              <Route path="/hr/team/:id" element={<EmployeeDetails />} />
              <Route
                path="/hr/employees-leaves"
                element={<HrLeaveManagement />}
              />
              <Route path="/hr/team" element={<HrTeamPage />} />
            </>
          )}

          {/* ADMIN */}
          {role === "ADMIN" && (
            <Route path="/admin/settings" element={<AdminHomePage />} />
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
    </Routes>
  );
};

export default AppRoutes;
