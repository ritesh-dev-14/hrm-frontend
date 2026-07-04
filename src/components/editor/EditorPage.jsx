import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import EditorManagerPage from "./manager/EditorManagerPage.jsx";
import EditorEmployeePage from "./employee/EditorEmployeePage.jsx";

const ShootPage = () => {
  const { user } = useAuth();

  const role = user?.role;

  if (role === "MANAGER") {
    return <EditorManagerPage />;
  }

  if (role === "EMPLOYEE") {
    return <EditorEmployeePage />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default ShootPage;