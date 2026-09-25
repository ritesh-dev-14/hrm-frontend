/**
 * clientTier.js
 * ──────────────────────────────────────────────────────────────
 * Config, helpers, and visual styles for the Client Tier system.
 *
 * Tiers:     STRATEGIC | PREMIUM | GROWTH | STANDARD
 * Priorities: P1 | P2 | P3 | P4
 */

// ─── Tier Config ──────────────────────────────────────────────────────────────

export const TIER_CONFIG = {
  STRATEGIC: {
    label: "Strategic",
    shortLabel: "Strategic",
    emoji: "⭐",
    description: "Highest-value, long-term relationships. Maximum attention.",
    badge: "bg-violet-50 text-violet-700 border-violet-200 ring-violet-100",
    dot: "bg-violet-600",
    bar: "bg-violet-500",
    textColor: "text-violet-700",
    selectStyle: "bg-violet-600 text-white",
    order: 1,
  },
  PREMIUM: {
    label: "Premium",
    shortLabel: "Premium",
    emoji: "🥇",
    description: "High revenue clients. Priority delivery and communication.",
    badge: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-100",
    dot: "bg-amber-500",
    bar: "bg-amber-400",
    textColor: "text-amber-700",
    selectStyle: "bg-amber-500 text-white",
    order: 2,
  },
  GROWTH: {
    label: "Growth",
    shortLabel: "Growth",
    emoji: "🚀",
    description: "Growing accounts with expansion potential.",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100",
    dot: "bg-emerald-500",
    bar: "bg-emerald-400",
    textColor: "text-emerald-700",
    selectStyle: "bg-emerald-600 text-white",
    order: 3,
  },
  STANDARD: {
    label: "Standard",
    shortLabel: "Standard",
    emoji: "📋",
    description: "Regular accounts with standard delivery timelines.",
    badge: "bg-slate-100 text-slate-600 border-slate-200 ring-slate-100",
    dot: "bg-slate-400",
    bar: "bg-slate-400",
    textColor: "text-slate-600",
    selectStyle: "bg-slate-600 text-white",
    order: 4,
  },
};

// ─── Priority Config ──────────────────────────────────────────────────────────

export const PRIORITY_CONFIG = {
  P1: {
    label: "P1 — Critical",
    shortLabel: "P1",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    textColor: "text-rose-700",
  },
  P2: {
    label: "P2 — High",
    shortLabel: "P2",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    textColor: "text-orange-700",
  },
  P3: {
    label: "P3 — Medium",
    shortLabel: "P3",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    textColor: "text-blue-700",
  },
  P4: {
    label: "P4 — Low",
    shortLabel: "P4",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    textColor: "text-slate-600",
  },
};

export const TIER_ORDER = ["STRATEGIC", "PREMIUM", "GROWTH", "STANDARD"];

/**
 * Returns the TIER_CONFIG entry for a given tier string.
 */
export function getTierConfig(tier) {
  return TIER_CONFIG[tier] || null;
}

/**
 * Returns the PRIORITY_CONFIG entry for a given priority string.
 */
export function getPriorityConfig(priority) {
  return PRIORITY_CONFIG[priority] || null;
}
