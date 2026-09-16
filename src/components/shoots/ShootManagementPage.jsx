import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import { Activity, Camera, CheckCircle2, Clapperboard, FolderOpen, ImageIcon, Link2, Loader2, PencilLine, UploadCloud, Video, Wand2 } from "lucide-react";

const statCardClass = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

const formatNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

const ShootManagementPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalReels: 0,
    totalPics: 0,
    extraReels: 0,
    extraPics: 0,
    reelsApprovedByManager: 0,
    picsApprovedByManager: 0,
    totalVideosAvailable: 0,
    totalPicsAvailable: 0,
    rawDataLink: "",
    pendingForEdit: 0,
    pendingForVideoEdit: 0,
    pendingForPicEdit: 0,
    pendingForUpload: 0,
    videosUploaded: 0,
    videosEdited: 0,
    picsEdited: 0,
    workspaces: 0,
    workspacesList: [],
  });
  const [error, setError] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await API.get("/api/shoot-workspaces/management-summary");
        if (response?.data?.success) {
          const nextSummary = response.data.data || summary;
          setSummary(nextSummary);
          setSelectedWorkspaceId(nextSummary.workspaceSummaries?.[0]?.id || "");
        } else {
          setError("Failed to load shoot management summary.");
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load shoot management summary.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const workspacesList = Array.isArray(summary.workspaces) ? summary.workspaces : [];
  const workspaceSummaries = Array.isArray(summary.workspaceSummaries) ? summary.workspaceSummaries : [];
  const selectedWorkspace = workspaceSummaries.find((workspace) => workspace.id === selectedWorkspaceId) || workspaceSummaries[0];
  const displayedSummary = selectedWorkspace || summary;

  const cards = useMemo(() => [
    { label: "No of Reels", value: formatNumber(displayedSummary.totalReels), icon: Clapperboard, tone: "purple" },
    { label: "No of Pics", value: formatNumber(displayedSummary.totalPics), icon: ImageIcon, tone: "blue" },
    { label: "Extra Reels", value: formatNumber(displayedSummary.extraReels), icon: Video, tone: "rose" },
    { label: "Extra Pics", value: formatNumber(displayedSummary.extraPics), icon: Camera, tone: "amber" },
    { label: "Reels Approved", value: formatNumber(displayedSummary.reelsApprovedByManager), icon: CheckCircle2, tone: "green" },
    { label: "Pics Approved", value: formatNumber(displayedSummary.picsApprovedByManager), icon: CheckCircle2, tone: "emerald" },
    { label: "Total Videos Available", value: formatNumber(displayedSummary.totalVideosAvailable), icon: Activity, tone: "violet" },
    { label: "Total Pics Available", value: formatNumber(displayedSummary.totalPicsAvailable), icon: FolderOpen, tone: "cyan" },
    { label: "Pending Video Edit", value: formatNumber(displayedSummary.pendingForVideoEdit), icon: PencilLine, tone: "orange" },
    { label: "Pending Pic Edit", value: formatNumber(displayedSummary.pendingForPicEdit), icon: PencilLine, tone: "amber" },
    { label: "Pending for Upload", value: formatNumber(displayedSummary.pendingForUpload), icon: UploadCloud, tone: "red" },
    { label: "Videos Uploaded", value: formatNumber(displayedSummary.videosUploaded), icon: UploadCloud, tone: "indigo" },
    { label: "Videos Edited", value: formatNumber(displayedSummary.videosEdited), icon: Wand2, tone: "teal" },
    { label: "Pics Edited", value: formatNumber(displayedSummary.picsEdited), icon: Wand2, tone: "cyan" },
  ], [displayedSummary]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm font-medium">Loading shoot management summary...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Management overview</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Shoot Management</h1>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            <span className="font-semibold text-slate-800">Project link:</span>{" "}
            {displayedSummary.rawDataLink ? (
              <a href={displayedSummary.rawDataLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-indigo-600 underline decoration-indigo-300 underline-offset-2">
                <Link2 className="h-3.5 w-3.5" /> Raw data
              </a>
            ) : (
              <span className="text-slate-500">No raw data link added yet</span>
            )}
          </div>
        </div>

        {workspaceSummaries.length > 0 && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {workspaceSummaries.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => setSelectedWorkspaceId(workspace.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${displayedSummary.id === workspace.id ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"}`}
                >
                  {workspace.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-500">Showing workspace:</span>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">{displayedSummary.name || "All workspaces"}</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className={statCardClass}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">{label}</p>
                  <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-${tone}-100 text-${tone}-600`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Shoots in {displayedSummary.name || "workspace"}</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{displayedSummary.shoots?.length || 0} shoots</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Shoot</th>
                  <th className="px-4 py-3 font-semibold">Reels</th>
                  <th className="px-4 py-3 font-semibold">Pics</th>
                  <th className="px-4 py-3 font-semibold">Extra</th>
                  <th className="px-4 py-3 font-semibold">Approved</th>
                  <th className="px-4 py-3 font-semibold">Pending Edit</th>
                  <th className="px-4 py-3 font-semibold">Pending Upload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedSummary.shoots?.length > 0 ? (
                  displayedSummary.shoots.map((shoot) => (
                    <tr key={shoot.id} className="align-top">
                      <td className="px-4 py-3 font-semibold text-slate-800">{shoot.name}</td>
                      <td className="px-4 py-3 text-slate-700">{shoot.totalReels}</td>
                      <td className="px-4 py-3 text-slate-700">{shoot.totalPics}</td>
                      <td className="px-4 py-3 text-slate-700">{shoot.extraReels}/{shoot.extraPics}</td>
                      <td className="px-4 py-3 text-slate-700">{shoot.reelsApprovedByManager}/{shoot.picsApprovedByManager}</td>
                      <td className="px-4 py-3 text-slate-700">{shoot.pendingForEdit}</td>
                      <td className="px-4 py-3 text-slate-700">{shoot.pendingForUpload}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">No shoots available in this workspace yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShootManagementPage;
