import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import ProfessionalLoader from "../ProfessionalLoader";

import HRManagerView from "./managers/HRManagerView";
import SMMManagerView from "./managers/SMMManagerView";
import WebDevManagerView from "./managers/WebDevManagerView";
import PerformanceMarketingManagerView from "./managers/PerformanceMarketingManagerView";
import ProjectDetailsView from "./ProjectDetailsView";

// Normalised department name matchers
const WEB_DEV_DEPT_KEYS = ["web development", "webdevelopment", "it"];
const SEO_DEPT_KEYS = ["seo"];
const MARKETING_DEPT_KEYS = ["marketing", "performance marketing"];

const ProjectDetailsWrapper = () => {
  const { id, campaignId } = useParams();
  const { user } = useAuth();

  const [deptName, setDeptName] = useState(null);
  const [project, setProject] = useState(null);
  const [loadingDept, setLoadingDept] = useState(true);

  useEffect(() => {
    // COORDINATOR: no department lookup needed, always HRManagerView
    if (!id || user?.role === "COORDINATOR") {
      setLoadingDept(false);
      return;
    }

    // All other roles (HR, ADMIN, MANAGER, EA): fetch project department
    const fetchDept = async () => {
      try {
        const res = await API.get(`/api/projects/${id}`);
        const projectData = res?.data?.data || null;
        setProject(projectData);
        const dept = projectData?.department?.name || "";
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

  // ── COORDINATOR → always HRManagerView ──
  if (user?.role === "COORDINATOR") {
    return <HRManagerView projectId={id} />;
  }

  // ── Wait for department fetch (HR, ADMIN, MANAGER, EA) ──
  if (loadingDept) {
    return <ProfessionalLoader text="Loading project..." />;
  }

  // ── Route by department for all roles ──
  if (deptName !== null) {
    const normalised = deptName.replace(/\s*department\s*/gi, "").trim();

    // Marketing department → Performance Marketing View (for ALL roles)
    if (MARKETING_DEPT_KEYS.some((key) => normalised.includes(key))) {
      return <PerformanceMarketingManagerView projectId={id} campaignId={campaignId} initialProject={project} />;
    }

    // Web Development projects use the dedicated web development workspace for every role.
    if (WEB_DEV_DEPT_KEYS.some((key) => normalised.includes(key))) {
      return <WebDevManagerView projectId={id} />;
    }

    // HR / ADMIN / EA → HRManagerView for all non-marketing projects
    if (
      user?.role === "HR" ||
      user?.role === "ADMIN" ||
      user?.role === "EA"
    ) {
      return <HRManagerView projectId={id} />;
    }

    // MANAGER: route by department
    if (user?.role === "MANAGER") {
      // SEO department → clean credential + reports view
      if (SEO_DEPT_KEYS.some((key) => normalised.includes(key))) {
        return (
          <ProjectDetailsView
            projectId={id}
            userRole={user?.role}
            onBack={() => window.history.back()}
          />
        );
      }

      // Default: Social Media / all other departments
      return <SMMManagerView projectId={id} initialProject={project} />;
    }
  }

  // Final fallback
  return <HRManagerView projectId={id} />;
};

export default ProjectDetailsWrapper;