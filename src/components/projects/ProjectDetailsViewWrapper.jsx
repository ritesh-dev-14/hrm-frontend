import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";

import HRManagerView from "./managers/HRManagerView";
import SMMManagerView from "./managers/SMMManagerView";
import WebDevManagerView from "./managers/WebDevManagerView";

// Normalised department name matchers
const WEB_DEV_DEPT_KEYS = ["web development", "webdevelopment", "it"];

const ProjectDetailsWrapper = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [deptName, setDeptName] = useState(null);
  const [loadingDept, setLoadingDept] = useState(true);

  useEffect(() => {
    // HR, ADMIN, COORDINATOR: no need to look up department
    if (!id || ["HR", "ADMIN", "COORDINATOR"].includes(user?.role)) {
      setLoadingDept(false);
      return;
    }

    // MANAGER: fetch project to determine department
    const fetchDept = async () => {
      try {
        const res = await API.get(`/api/projects/${id}`);
        const dept = res?.data?.data?.department?.name || "";
        setDeptName(dept.toLowerCase().replace(/\s+/g, " ").trim());
      } catch (err) {
        console.error("ProjectDetailsWrapper – failed to fetch project dept:", err);
        setDeptName("");
      } finally {
        setLoadingDept(false);
      }
    };

    fetchDept();
  }, [id, user]);

  // ── HR / ADMIN / COORDINATOR → HRManagerView ──
  if (
    user?.role === "HR" ||
    user?.role === "ADMIN" ||
    user?.role === "COORDINATOR"
  ) {
    return <HRManagerView projectId={id} />;
  }

  // ── MANAGER: wait for department fetch ──
  if (user?.role === "MANAGER" && loadingDept) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── MANAGER: route by department ──
  if (user?.role === "MANAGER" && deptName !== null) {
    const normalised = deptName.replace(/\s*department\s*/gi, "").trim();

    // Web Development department
    if (WEB_DEV_DEPT_KEYS.some((key) => normalised.includes(key.split(" ")[0]))) {
      return <WebDevManagerView projectId={id} />;
    }

    // Default: Social Media / all other departments
    return <SMMManagerView projectId={id} />;
  }

  // Final fallback (shouldn't normally reach here)
  return <SMMManagerView projectId={id} />;
};

export default ProjectDetailsWrapper;