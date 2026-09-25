import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Loader2, Building2, User, Phone, MapPin, Calendar, RefreshCw,
  Globe, Lock, Eye, EyeOff, Copy, Camera, TrendingUp, Megaphone, Code2,
  ExternalLink, FileText, AlertCircle, Clock, BarChart3, Sparkles, ShieldAlert, Hash,
} from "lucide-react";
import API from "../../services/api";
import { toast } from "react-toastify";
import { getHealthConfig, computeClientSideFallback } from "../../utils/clientHealthScore";

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return dateStr; }
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
};

const progressColor = (pct) => {
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-rose-500";
};

const getDeptType = (project) => {
  const name = (project?.department?.name || "").toLowerCase();
  if (name.includes("social") || name.includes("smm")) return "social";
  if (name.includes("seo")) return "seo";
  if (name.includes("meta") || name.includes("marketing") || name.includes("ads")) return "ads";
  if (name.includes("web") || name.includes("it")) return "web";
  return "general";
};

const deptConfig = {
  social: { label: "Social Media", icon: Camera, gradient: "from-violet-600 to-purple-700" },
  seo:    { label: "SEO",          icon: TrendingUp, gradient: "from-emerald-600 to-teal-700" },
  ads:    { label: "Meta Ads",     icon: Megaphone, gradient: "from-pink-600 to-rose-700" },
  web:    { label: "Web Dev",      icon: Code2, gradient: "from-blue-600 to-indigo-700" },
  general:{ label: "General",      icon: Building2, gradient: "from-slate-700 to-slate-800" },
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function PBar({ value = 0, colorClass = "bg-indigo-500", height = "h-2" }) {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className={`w-full ${height} bg-slate-100 rounded-full overflow-hidden`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`h-full rounded-full ${colorClass}`}
      />
    </div>
  );
}

function StatBox({ label, value, sub, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-700",
    emerald:"bg-emerald-50 border-emerald-100 text-emerald-700",
    amber:  "bg-amber-50 border-amber-100 text-amber-700",
    rose:   "bg-rose-50 border-rose-100 text-rose-700",
    violet: "bg-violet-50 border-violet-100 text-violet-700",
    slate:  "bg-slate-50 border-slate-200 text-slate-700",
    pink:   "bg-pink-50 border-pink-100 text-pink-700",
    blue:   "bg-blue-50 border-blue-100 text-blue-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color] || colors.slate}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-black">{value ?? "—"}</p>
      {sub && <p className="text-[11px] font-medium opacity-60 mt-1">{sub}</p>}
    </div>
  );
}

function CredField({ label, value, fieldKey, showPasswords, onToggle, onCopy }) {
  const isPass = /pass|password/i.test(fieldKey || "");
  const show = showPasswords[fieldKey];
  const display = isPass && value ? (show ? value : "••••••••••••") : (value || "N/A");
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">{label}</span>
      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
        <span className="font-mono text-sm text-slate-800 truncate">{display}</span>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isPass && value && (
            <button onClick={() => onToggle(fieldKey)} className="text-slate-400 hover:text-slate-600 transition">
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          )}
          {value && (
            <button onClick={() => onCopy(value, label)} className="text-slate-400 hover:text-slate-600 transition">
              <Copy size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TAB: Overview ─────────────────────────────────────────────────────────────
function OverviewTab({ project, monthlySheets }) {
  const renewal = daysUntil(project?.renewalDate);
  const renewalChip =
    renewal === null ? null :
    renewal < 0 ? { label: `Overdue by ${Math.abs(renewal)} days`, cls: "bg-rose-100 text-rose-700 border-rose-200" } :
    renewal <= 15 ? { label: `Renews in ${renewal} days`, cls: "bg-amber-100 text-amber-700 border-amber-200" } :
    { label: `Renews in ${renewal} days`, cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };

  const latestSheet = monthlySheets?.[0];

  return (
    <div className="space-y-5">
      {renewalChip && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-semibold ${renewalChip.cls}`}>
          <Clock size={15} />
          {renewalChip.label} — Renewal: {fmt(project?.renewalDate)} &nbsp;·&nbsp; Frequency: {project?.frequency || "Monthly"}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Start Date", value: fmt(project?.startDate || project?.projectStartDate) },
          { label: "End Date", value: fmt(project?.endDate) },
          { label: "Department", value: project?.department?.name || "General", highlight: true },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.label}</span>
            <p className={`text-base font-black ${item.highlight ? "text-indigo-600" : "text-slate-900"}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
          <User size={15} className="text-indigo-500" /> Client & Contact
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Client Name</span>
            <p className="font-bold text-slate-800">{project?.clientName || "N/A"}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Phone</span>
            {project?.phone ? (
              <a href={`tel:${project.phone}`} className="font-bold text-indigo-600 hover:underline flex items-center gap-1">
                <Phone size={13} /> {project.phone}
              </a>
            ) : <p className="font-bold text-slate-500">N/A</p>}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Location</span>
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <MapPin size={13} className="text-slate-400 shrink-0" /> {project?.location || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Website</span>
            {project?.website ? (
              <a href={project.website} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline flex items-center gap-1">
                <Globe size={13} /> {project.website}
              </a>
            ) : <p className="font-bold text-slate-500">N/A</p>}
          </div>
        </div>
      </div>

      {project?.description && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3 mb-3">
            <FileText size={15} className="text-slate-400" /> Project Description
          </h4>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{project.description}</p>
        </div>
      )}

      {project?.assignments?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <Building2 size={15} className="text-indigo-500" /> Assigned Managers
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {project.assignments.map((asg) => (
              <div key={asg.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="font-bold text-sm text-slate-800">{asg.manager?.name}</p>
                  <p className="text-[11px] text-slate-500">{asg.manager?.employeeId} · {asg.manager?.role}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">Manager</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {latestSheet && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <Sparkles size={15} className="text-violet-500" /> Latest Content Snapshot — {latestSheet.month}/{latestSheet.year}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox label="Reels Target" value={latestSheet.totalReels} color="violet" />
            <StatBox label="Reels Live" value={latestSheet.totalReelsUploaded} color="emerald" />
            <StatBox label="Posts Target" value={latestSheet.totalPosts} color="violet" />
            <StatBox label="Posts Live" value={latestSheet.totalPostsUploaded} color="emerald" />
          </div>
          {latestSheet.totalReels > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Reels Progress</span>
                <span>{Math.round((latestSheet.totalReelsUploaded / latestSheet.totalReels) * 100)}%</span>
              </div>
              <PBar
                value={(latestSheet.totalReelsUploaded / latestSheet.totalReels) * 100}
                colorClass={progressColor((latestSheet.totalReelsUploaded / latestSheet.totalReels) * 100)}
                height="h-3"
              />
            </div>
          )}
          {latestSheet.moodBoardLink && (
            <a href={latestSheet.moodBoardLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl hover:bg-amber-100 transition">
              <Sparkles size={13} /> Open Mood Board
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── TAB: Social Media ─────────────────────────────────────────────────────────
function SocialMediaTab({ monthlySheets, shootWorkspaces }) {
  if (!monthlySheets.length && !shootWorkspaces.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
        <Camera className="w-10 h-10 text-slate-200 mx-auto" />
        <p className="font-bold text-slate-600">No Social Media Data</p>
        <p className="text-xs text-slate-400">No content calendar or shoot data found for this project.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {monthlySheets.map((sheet) => {
        const reelPct = sheet.totalReels ? Math.round((sheet.totalReelsUploaded / sheet.totalReels) * 100) : 0;
        const postPct = sheet.totalPosts ? Math.round((sheet.totalPostsUploaded / sheet.totalPosts) * 100) : 0;
        return (
          <div key={sheet.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-bold text-slate-900">Content Calendar — {sheet.month}/{sheet.year}</h4>
              <div className="flex items-center gap-2">
                {sheet.moodBoardLink && (
                  <a href={sheet.moodBoardLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-lg hover:bg-amber-100 transition">
                    <Sparkles size={12} /> Mood Board
                  </a>
                )}
                <span className="text-xs text-slate-400">By: {sheet.createdBy?.name || "Manager"}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox label="Reels Target" value={sheet.totalReels} color="violet" />
              <StatBox label="Reels Live" value={sheet.totalReelsUploaded} sub={`${reelPct}% done`} color="emerald" />
              <StatBox label="Posts Target" value={sheet.totalPosts} color="violet" />
              <StatBox label="Posts Live" value={sheet.totalPostsUploaded} sub={`${postPct}% done`} color="emerald" />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5"><span>Reels</span><span>{reelPct}%</span></div>
                <PBar value={reelPct} colorClass={progressColor(reelPct)} height="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5"><span>Posts</span><span>{postPct}%</span></div>
                <PBar value={postPct} colorClass={progressColor(postPct)} height="h-3" />
              </div>
            </div>
            {sheet.days?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Scheduled Deliverables ({sheet.days.length} days)</p>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 custom-scrollbar">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 font-semibold text-slate-600 sticky top-0">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Title / Script</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sheet.days.map((day) => (
                        <tr key={day.id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-medium whitespace-nowrap">{fmt(day.date)}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 font-semibold text-[10px]">
                              {day.reelType || day.postType || "Post"}
                            </span>
                          </td>
                          <td className="p-3 max-w-[180px] truncate">{day.title || day.script || "—"}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              day.uploadStatus === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                              day.uploadStatus === "REJECTED" ? "bg-rose-100 text-rose-800" :
                              "bg-amber-100 text-amber-800"
                            }`}>{day.uploadStatus || "PENDING"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {shootWorkspaces.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <Camera size={15} className="text-indigo-500" /> Shoot Workspaces ({shootWorkspaces.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shootWorkspaces.map((ws) => (
              <div key={ws.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800 text-sm">{ws.title || ws.projectName || "Shoot Workspace"}</p>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">Active</span>
                </div>
                <p className="text-[11px] text-slate-500">Created: {fmt(ws.createdAt)}</p>
                {ws.shootTasks?.slice(0, 3).map((st) => (
                  <div key={st.id} className="bg-white p-2 rounded-lg border text-xs">
                    <span className="font-bold text-slate-800">{st.title}</span>
                    <span className="ml-2 text-slate-400">· {st.date || "TBD"} · {st.location || "On Site"}</span>
                    <div className="flex gap-2 mt-1">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">Pics: {st.noOfPics || 0}</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">Reels: {st.noOfReels || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB: Meta Ads ─────────────────────────────────────────────────────────────
function MetaAdsTab({ metaAdsTasks }) {
  if (!metaAdsTasks?.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
        <Megaphone className="w-10 h-10 text-slate-200 mx-auto" />
        <p className="font-bold text-slate-600">No Meta Ads Data</p>
        <p className="text-xs text-slate-400">No campaigns have been created for this project in the Meta Ads module.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {metaAdsTasks.map((task) => {
        const reports = task.reports || [];
        const totalSpend = reports.reduce((s, r) => s + (Number(r.amountSpent) || 0), 0);
        const totalLeads = reports.reduce((s, r) => s + (Number(r.leads) || 0), 0);
        const totalReach = reports.reduce((s, r) => s + (Number(r.reach) || 0), 0);
        const avgCpl = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;
        const latestReport = reports[reports.length - 1];

        return (
          <div key={task.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h4 className="text-base font-black text-slate-900">{task.projectName || task.clientName || "Campaign"}</h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-pink-50 text-pink-700 text-[10px] font-bold border border-pink-100">{task.objective || "N/A"}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                    Budget: ₹{Number(task.monthlyBudget || 0).toLocaleString("en-IN")}
                  </span>
                  {task.area && (
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100">
                      <MapPin size={9} className="inline mr-0.5" />{task.area}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-slate-400 shrink-0">To: {task.assignedTo?.name || "N/A"}</span>
            </div>

            {reports.length > 0 && (
              <>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Campaign Performance — {reports.length} Report{reports.length !== 1 ? "s" : ""}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatBox label="Total Spend" value={`₹${totalSpend.toLocaleString("en-IN")}`} color="pink" />
                    <StatBox label="Total Leads" value={totalLeads} color="emerald" />
                    <StatBox label="Total Reach" value={totalReach > 0 ? totalReach.toLocaleString("en-IN") : "—"} color="blue" />
                    <StatBox label="Avg CPL" value={avgCpl > 0 ? `₹${avgCpl}` : "—"} color="violet" />
                  </div>
                </div>

                {latestReport && (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Latest Report — {fmt(latestReport.reportDate)}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-[10px] text-slate-400 block">Ad Running</span><span className={`font-bold ${latestReport.isAdRunning ? "text-emerald-600" : "text-rose-600"}`}>{latestReport.isAdRunning ? "Yes" : "No"}</span></div>
                      <div><span className="text-[10px] text-slate-400 block">Spend</span><span className="font-bold text-slate-800">₹{Number(latestReport.amountSpent || 0).toLocaleString("en-IN")}</span></div>
                      <div><span className="text-[10px] text-slate-400 block">Leads</span><span className="font-bold text-slate-800">{latestReport.leads ?? "—"}</span></div>
                      <div><span className="text-[10px] text-slate-400 block">Daily Budget</span><span className="font-bold text-slate-800">₹{Number(latestReport.dailyBudget || 0).toLocaleString("en-IN")}</span></div>
                    </div>
                    {latestReport.notes && <p className="text-xs text-slate-600 bg-white rounded-lg border p-2 mt-2">{latestReport.notes}</p>}
                  </div>
                )}

                {reports.length > 1 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Daily Report History</p>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 custom-scrollbar">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-50 font-semibold text-slate-600 sticky top-0">
                          <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Spend</th>
                            <th className="p-3">Leads</th>
                            <th className="p-3">Reach</th>
                            <th className="p-3">CPL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[...reports].reverse().map((r) => {
                            const cpl = r.leads > 0 ? Math.round(r.amountSpent / r.leads) : 0;
                            return (
                              <tr key={r.id} className="hover:bg-slate-50/60">
                                <td className="p-3 font-medium">{fmt(r.reportDate)}</td>
                                <td className="p-3">₹{Number(r.amountSpent || 0).toLocaleString("en-IN")}</td>
                                <td className="p-3">{r.leads ?? "—"}</td>
                                <td className="p-3">{r.reach?.toLocaleString("en-IN") ?? "—"}</td>
                                <td className="p-3">{cpl > 0 ? `₹${cpl}` : "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── TAB: SEO ──────────────────────────────────────────────────────────────────
function SEOTab({ project, seoReports, seoTasks }) {
  return (
    <div className="space-y-5">
      {(project?.seoEmail || project?.seoName) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
            <TrendingUp size={15} className="text-emerald-600" /> SEO Account Info
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {project.seoName && <div><span className="text-[10px] text-slate-400 block">Contact</span><span className="font-bold text-slate-800">{project.seoName}</span></div>}
            {project.seoContact && <div><span className="text-[10px] text-slate-400 block">Phone</span><span className="font-bold text-slate-800">{project.seoContact}</span></div>}
            {project.seoEmail && <div><span className="text-[10px] text-slate-400 block">Email</span><span className="font-bold text-slate-800 text-xs truncate">{project.seoEmail}</span></div>}
          </div>
        </div>
      )}

      {seoTasks?.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <Hash size={15} className="text-emerald-600" /> Keyword Rankings & SEO Tasks
          </h4>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 custom-scrollbar">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 font-semibold text-slate-600 sticky top-0">
                <tr>
                  <th className="p-3">Keyword</th>
                  <th className="p-3">Task</th>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {seoTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-semibold text-slate-800">{t.keyword || "—"}</td>
                    <td className="p-3 max-w-[180px] truncate text-slate-600">{t.taskName || t.workingOnTask || "—"}</td>
                    <td className="p-3">
                      {t.rankingNumber ? (
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">#{t.rankingNumber}</span>
                      ) : "—"}
                    </td>
                    <td className="p-3 text-slate-500">{fmt(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <TrendingUp className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="font-bold text-slate-500 text-sm">No SEO task data yet</p>
        </div>
      )}

      {seoReports?.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <BarChart3 size={15} className="text-emerald-600" /> Monthly SEO Reports
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {seoReports.map((rep) => (
              <div key={rep.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Report {rep.month}/{rep.year}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">SEO</span>
                </div>
                <p className="text-slate-600">{rep.remarks || "Monthly SEO audit."}</p>
                {rep.reportFile && (
                  <a href={rep.reportFile} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline">
                    <FileText size={12} /> View PDF Report
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <BarChart3 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="font-bold text-slate-500 text-sm">No SEO reports submitted yet</p>
        </div>
      )}
    </div>
  );
}

// ── TAB: Web Dev ──────────────────────────────────────────────────────────────
function WebDevTab({ project }) {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
          <Globe size={15} className="text-blue-600" /> Domain & Hosting Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Domain Name</span>
            {project?.domainName ? (
              <a href={`https://${project.domainName}`} target="_blank" rel="noopener noreferrer"
                className="font-bold text-blue-600 hover:underline flex items-center gap-1">
                <Globe size={13} /> {project.domainName}
              </a>
            ) : <p className="font-bold text-slate-500">N/A</p>}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Website URL</span>
            {project?.website ? (
              <a href={project.website} target="_blank" rel="noopener noreferrer"
                className="font-bold text-blue-600 hover:underline flex items-center gap-1">
                <ExternalLink size={13} /> {project.website}
              </a>
            ) : <p className="font-bold text-slate-500">N/A</p>}
          </div>
          {project?.requirements && (
            <div className="md:col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Requirements</span>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-xl border p-3 whitespace-pre-line">{project.requirements}</p>
            </div>
          )}
        </div>
      </div>

      {project?.description && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3 mb-3">
            <Code2 size={15} className="text-blue-600" /> Project Scope & Notes
          </h4>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{project.description}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
          <Calendar size={15} className="text-blue-600" /> Timeline
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Start", value: fmt(project?.startDate || project?.projectStartDate) },
            { label: "End", value: fmt(project?.endDate) },
            { label: "Renewal", value: fmt(project?.renewalDate), highlight: true },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 bg-slate-50 rounded-xl border">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">{item.label}</span>
              <span className={`font-bold text-sm ${item.highlight ? "text-indigo-600" : "text-slate-800"}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TAB: Credentials ──────────────────────────────────────────────────────────
function CredentialsTab({ project, showPasswords, onToggle, onCopy }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold">
        <ShieldAlert size={15} className="shrink-0" />
        All credentials are confidential — Admin access only.
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
          <Globe size={15} className="text-violet-600" /> Social Media Credentials
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <p className="font-bold text-slate-600 text-xs uppercase tracking-wide">Facebook</p>
            <CredField label="Email" value={project?.fbEmail} fieldKey="fbEmail" showPasswords={showPasswords} onToggle={onToggle} onCopy={onCopy} />
            <CredField label="Password" value={project?.fbPassword} fieldKey="fbPassword" showPasswords={showPasswords} onToggle={onToggle} onCopy={onCopy} />
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <p className="font-bold text-slate-600 text-xs uppercase tracking-wide">Instagram</p>
            <CredField label="Email" value={project?.instaEmail} fieldKey="instaEmail" showPasswords={showPasswords} onToggle={onToggle} onCopy={onCopy} />
            <CredField label="Password" value={project?.instaPassword} fieldKey="instaPassword" showPasswords={showPasswords} onToggle={onToggle} onCopy={onCopy} />
          </div>
        </div>
      </div>

      {(project?.domainName || project?.clientEmail) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <Globe size={15} className="text-blue-600" /> Web & Domain Credentials
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="font-bold text-slate-600 text-xs uppercase tracking-wide">Domain Access</p>
              <CredField label="Domain Name" value={project?.domainName} fieldKey="domainName" showPasswords={showPasswords} onToggle={onToggle} onCopy={onCopy} />
              <CredField label="Password" value={project?.domainPassword} fieldKey="domainPassword" showPasswords={showPasswords} onToggle={onToggle} onCopy={onCopy} />
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="font-bold text-slate-600 text-xs uppercase tracking-wide">Client Email</p>
              <CredField label="Email" value={project?.clientEmail} fieldKey="clientEmail" showPasswords={showPasswords} onToggle={onToggle} onCopy={onCopy} />
              <CredField label="Password" value={project?.clientEmailPassword} fieldKey="clientEmailPassword" showPasswords={showPasswords} onToggle={onToggle} onCopy={onCopy} />
            </div>
          </div>
        </div>
      )}

      {project?.seoEmail && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <TrendingUp size={15} className="text-emerald-600" /> SEO Credentials
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <CredField label="SEO Email" value={project?.seoEmail} fieldKey="seoEmail" showPasswords={showPasswords} onToggle={onToggle} onCopy={onCopy} />
            <CredField label="SEO Password" value={project?.seoPassword} fieldKey="seoPassword" showPasswords={showPasswords} onToggle={onToggle} onCopy={onCopy} />
            {project?.seoName && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Contact Name</span>
                <p className="font-bold text-slate-800 bg-white px-3 py-2 rounded-xl border text-sm">{project.seoName}</p>
              </div>
            )}
            {project?.seoContact && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Contact Phone</span>
                <p className="font-bold text-slate-800 bg-white px-3 py-2 rounded-xl border text-sm">{project.seoContact}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function AdminProjectDetailModal({ projectId, onClose }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showPasswords, setShowPasswords] = useState({});

  const [monthlySheets, setMonthlySheets] = useState([]);
  const [shootWorkspaces, setShootWorkspaces] = useState([]);
  const [seoReports, setSeoReports] = useState([]);
  const [seoTasks, setSeoTasks] = useState([]);
  const [metaAdsTasks, setMetaAdsTasks] = useState([]);
  const [healthScore, setHealthScore] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    try {
      const projRes = await API.get(`/api/projects/${projectId}`);
      if (!projRes?.data?.success) throw new Error("Project not found");
      const proj = projRes.data.data;
      setProject(proj);

      const [sheetsRes, seoRepRes, seoTasksRes, shootRes, metaAdsRes, healthRes] = await Promise.allSettled([
        API.get(`/api/projects/${proj.id}/monthly-sheets`),
        API.get(`/api/seo-reports?projectId=${proj.id}`),
        API.get(`/api/seo-tasks?projectId=${proj.id}`),
        API.get("/api/shoot-workspaces"),
        API.get("/api/meta-ads-tasks"),
        API.get(`/api/health-scores/${proj.id}`),
      ]);

      if (sheetsRes.status === "fulfilled" && sheetsRes.value?.data?.success)
        setMonthlySheets(sheetsRes.value.data.data || []);

      if (seoRepRes.status === "fulfilled" && seoRepRes.value?.data?.success)
        setSeoReports(seoRepRes.value.data.data || []);

      if (seoTasksRes.status === "fulfilled" && seoTasksRes.value?.data?.success)
        setSeoTasks(seoTasksRes.value.data.data || []);

      if (shootRes.status === "fulfilled" && shootRes.value?.data?.success) {
        const all = shootRes.value.data.data || [];
        const matched = all.filter(
          (w) =>
            w.title?.toLowerCase().includes(proj.projectName.toLowerCase()) ||
            w.projectName?.toLowerCase().includes(proj.projectName.toLowerCase())
        );
        setShootWorkspaces(matched);
      }

      if (metaAdsRes.status === "fulfilled") {
        const raw = metaAdsRes.value?.data?.data ?? metaAdsRes.value?.data ?? [];
        const ads = Array.isArray(raw) ? raw : raw?.tasks || raw?.items || [];
        const filtered = ads.filter(
          (t) =>
            t.projectName?.toLowerCase().includes(proj.projectName.toLowerCase()) ||
            t.clientName?.toLowerCase().includes(proj.projectName.toLowerCase()) ||
            t.projectId === proj.id
        );
        setMetaAdsTasks(filtered);
      }

      if (healthRes.status === "fulfilled" && healthRes.value?.data?.success) {
        setHealthScore(healthRes.value.data.data);
      } else {
        setHealthScore(computeClientSideFallback(proj));
      }
    } catch (err) {
      console.error("AdminProjectDetailModal error:", err);
      setError("Failed to load project details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const deptType = project ? getDeptType(project) : "general";
  const cfg = deptConfig[deptType] || deptConfig.general;

  const togglePassword = (key) => setShowPasswords((p) => ({ ...p, [key]: !p[key] }));
  const copyToClipboard = (value, label) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied!`);
  };

  // Build smart tabs based on dept + available data
  const baseTabs = [{ id: "overview", label: "Overview", icon: Building2 }];
  if (deptType === "social" || monthlySheets.length > 0 || shootWorkspaces.length > 0)
    baseTabs.push({ id: "social", label: "Social Media", icon: Camera });
  if (deptType === "ads" || metaAdsTasks.length > 0)
    baseTabs.push({ id: "ads", label: "Meta Ads", icon: Megaphone });
  if (deptType === "seo" || seoTasks.length > 0 || seoReports.length > 0)
    baseTabs.push({ id: "seo", label: "SEO", icon: TrendingUp });
  if (deptType === "web")
    baseTabs.push({ id: "web", label: "Web Dev", icon: Code2 });
  baseTabs.push({ id: "credentials", label: "Credentials", icon: Lock });

  const uniqueTabs = baseTabs.filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

  const renewal = project ? daysUntil(project.renewalDate) : null;
  const renewalBadge =
    renewal === null ? null :
    renewal < 0 ? { label: `Overdue ${Math.abs(renewal)}d`, cls: "bg-rose-500" } :
    renewal <= 15 ? { label: `Renews ${renewal}d`, cls: "bg-amber-400" } : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${cfg.gradient} text-white p-5 md:p-7 shrink-0`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
                  {project?.logo
                    ? <img src={project.logo} alt={project.projectName} className="w-full h-full object-cover" />
                    : <cfg.icon size={26} />
                  }
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                      {project?.department?.name || cfg.label}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      project?.status === "COMPLETED" ? "bg-emerald-500" :
                      project?.status === "PAUSED" ? "bg-amber-400" : "bg-white/30"
                    }`}>{project?.status || "ONGOING"}</span>
                    {renewalBadge && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white ${renewalBadge.cls}`}>
                        {renewalBadge.label}
                      </span>
                    )}
                    {healthScore && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30 backdrop-blur-sm shadow-sm`}>
                        {getHealthConfig(healthScore.status).emoji} {getHealthConfig(healthScore.status).label} ({healthScore.score}/100)
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-black leading-tight truncate">
                    {project?.projectName || "Loading..."}
                  </h2>
                  <p className="text-white/70 text-xs mt-1 flex items-center gap-3 flex-wrap">
                    {project?.clientName && <span>Client: {project.clientName}</span>}
                    {project?.phone && (
                      <a href={`tel:${project.phone}`} className="hover:text-white transition flex items-center gap-1">
                        <Phone size={11} /> {project.phone}
                      </a>
                    )}
                    {project?.location && <span className="flex items-center gap-1"><MapPin size={11} /> {project.location}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={fetchAll} disabled={loading}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                  <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                </button>
                <button onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-1 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
            {uniqueTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    active ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
                  }`}>
                  <Icon size={13} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 md:p-7 bg-slate-50/40" style={{ scrollbarWidth: "thin" }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
                <Loader2 size={36} className="animate-spin text-indigo-500" />
                <p className="text-sm font-semibold">Loading full project context...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-rose-600">
                <AlertCircle size={32} />
                <p className="font-bold">{error}</p>
                <button onClick={fetchAll} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition">Retry</button>
              </div>
            ) : (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                {activeTab === "overview" && <OverviewTab project={project} monthlySheets={monthlySheets} />}
                {activeTab === "social" && <SocialMediaTab monthlySheets={monthlySheets} shootWorkspaces={shootWorkspaces} />}
                {activeTab === "ads" && <MetaAdsTab metaAdsTasks={metaAdsTasks} />}
                {activeTab === "seo" && <SEOTab project={project} seoReports={seoReports} seoTasks={seoTasks} />}
                {activeTab === "web" && <WebDevTab project={project} />}
                {activeTab === "credentials" && (
                  <CredentialsTab project={project} showPasswords={showPasswords} onToggle={togglePassword} onCopy={copyToClipboard} />
                )}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400 font-mono">ID: {project?.id || "—"}</span>
            <button onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition">
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
