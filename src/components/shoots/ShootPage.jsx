import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import ShootManagerPage from "./manager/ShootManagerPage.jsx";
import ShootEmployeePage from "./employee/ShootEmployeePage.jsx";

const ShootPage = ({ view = "workspaces" }) => {
  const { user } = useAuth();

  const role = user?.role;

  if (role === "MANAGER") {
    return view === "tasks" ? <ShootEmployeePage /> : <ShootManagerPage />;
  }

  if (role === "EMPLOYEE") {
    return <ShootEmployeePage />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default ShootPage;