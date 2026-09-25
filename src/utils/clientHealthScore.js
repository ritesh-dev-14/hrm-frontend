/**
 * clientHealthScore.js
 * ─────────────────────────────────────────────────────────────────
 * Pure helper utilities for the Client Health Score system.
 *
 * The REAL scores come from the backend API (/api/health-scores).
 * These helpers are used to:
 *   1. Render the correct badge/colour/label from the API response
 *   2. Provide a lightweight FALLBACK score computed client-side
 *      (useful when projects are loaded without a health-score fetch)
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const HEALTH_STATUS = {
  HEALTHY: "HEALTHY",
  ATTENTION: "ATTENTION",
  AT_RISK: "AT_RISK",
};

/** Visual config keyed by status string */
export const HEALTH_CONFIG = {
  HEALTHY: {
    label: "Healthy",
    emoji: "🟢",
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100",
    glow: "shadow-emerald-100",
    bar: "bg-emerald-500",
    textColor: "text-emerald-700",
    description: "Work on track · communication good · no major issues",
  },
  ATTENTION: {
    label: "Attention",
    emoji: "🟡",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-100",
    glow: "shadow-amber-100",
    bar: "bg-amber-400",
    textColor: "text-amber-700",
    description: "Some deadlines / pending approvals / minor issues",
  },
  AT_RISK: {
    label: "At Risk",
    emoji: "🔴",
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700 border-rose-200 ring-rose-100",
    glow: "shadow-rose-100",
    bar: "bg-rose-500",
    textColor: "text-rose-700",
    description: "Major delays / missed deliverables / poor communication",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Given a numeric score (0–100) returns the status string.
 */
export function scoreToStatus(score) {
  if (score >= 70) return HEALTH_STATUS.HEALTHY;
  if (score >= 40) return HEALTH_STATUS.ATTENTION;
  return HEALTH_STATUS.AT_RISK;
}

/**
 * Returns the HEALTH_CONFIG entry for a status string.
 */
export function getHealthConfig(status) {
  return HEALTH_CONFIG[status] || HEALTH_CONFIG.ATTENTION;
}

/**
 * CLIENT-SIDE FALLBACK scorer.
 * Used when we don't have a backend response yet.
 * Only uses data already present in the project object.
 *
 * @param {object} project  – project object from /api/projects
 * @returns {{ score: number, status: string }}
 */
export function computeClientSideFallback(project) {
  let score = 100;

  // Renewal check
  if (project.renewalDate) {
    const daysLeft = Math.ceil(
      (new Date(project.renewalDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft < 0) score -= 10;
    else if (daysLeft <= 7) score -= 5;
  }

  // Paused / non-ONGOING status
  if (project.status === "PAUSED") score -= 20;

  return {
    score: Math.max(0, score),
    status: scoreToStatus(Math.max(0, score)),
  };
}

/**
 * Builds a lookup map: { [projectId]: healthEntry }
 * from the array returned by the /api/health-scores endpoint.
 *
 * @param {Array} scores
 * @returns {object}
 */
export function buildHealthMap(scores = []) {
  return scores.reduce((acc, entry) => {
    acc[entry.projectId] = entry;
    return acc;
  }, {});
}
