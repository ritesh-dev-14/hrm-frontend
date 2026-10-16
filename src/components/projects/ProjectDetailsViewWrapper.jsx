import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import ProfessionalLoader from "../ProfessionalLoader";
import ProjectPendingSection from "./ProjectPendingSection";
import { getUserRoles } from "../../utils/userRoles";

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
  const userRoles = useMemo(() => getUserRoles(user), [user]);
  const hasRole = (...allowedRoles) => allowedRoles.some((allowedRole) => userRoles.includes(allowedRole));
  const coordinatorOnly = userRoles.includes("COORDINATOR") &&
    !userRoles.some((role) => ["MANAGER", "HR", "ADMIN", "EA"].includes(role));

  const [deptName, setDeptName] = useState(null);
  const [project, setProject] = useState(null);
  const [loadingDept, setLoadingDept] = useState(Boolean(id) && !coordinatorOnly);

  useEffect(() => {
    // COORDINATOR: no department lookup needed, always HRManagerView
    if (!id || coordinatorOnly) return;

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
  }, [id, coordinatorOnly]);

  const withPendingSection = (projectView) => (
    <>
      {projectView}
      <ProjectPendingSection projectId={id} />
    </>
  );

  // ── COORDINATOR → always HRManagerView ──
  if (coordinatorOnly) {
    return withPendingSection(<HRManagerView projectId={id} />);
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
      return withPendingSection(<PerformanceMarketingManagerView projectId={id} campaignId={campaignId} initialProject={project} />);
    }

    // Web Development projects use the dedicated web development workspace for every role.
    if (WEB_DEV_DEPT_KEYS.some((key) => normalised.includes(key))) {
      return withPendingSection(<WebDevManagerView projectId={id} />);
    }

    // HR / ADMIN / EA → HRManagerView for all non-marketing projects
    if (
      hasRole("HR", "ADMIN", "EA")
    ) {
      return withPendingSection(<HRManagerView projectId={id} />);
    }

    // MANAGER: route by department
    if (hasRole("MANAGER")) {
      // SEO department → clean credential + reports view
      if (SEO_DEPT_KEYS.some((key) => normalised.includes(key))) {
        return withPendingSection(
          <ProjectDetailsView
            projectId={id}
            userRole={user?.role}
            onBack={() => window.history.back()}
          />,
        );
      }

      // Default: Social Media / all other departments
      return withPendingSection(<SMMManagerView projectId={id} initialProject={project} />);
    }
  }

  // Final fallback
  return withPendingSection(<HRManagerView projectId={id} />);
};

export default ProjectDetailsWrapper;