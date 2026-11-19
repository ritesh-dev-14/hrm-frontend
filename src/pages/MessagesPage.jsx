import { useCallback, useEffect, useState } from "react";
import { AlertCircle, LoaderCircle, MessageSquareText, RefreshCw, Search } from "lucide-react";
import API from "../services/api";

const fetchPreviews = () => API.get("/api/whatsapp-messages/previews");

const buildProjectSpecificMessage = (message) => {
  const parameters = message.templateParameters || [];
  const departments = (message.departmentNames || []).map((name) => name.toLowerCase());
  const hasSocialMedia = departments.some((name) => name.includes("social media"));
  const hasSeo = departments.some((name) => name.includes("seo"));
  const hasMetaAds = departments.some((name) =>
    name.includes("marketing") || name.includes("meta ads") || name.includes("ads"),
  );
  const divider = "━━━━━━━━━━━━━━━━━━━━";
  const reportSections = [];
  const pendingItemsByDepartment = message.pendingItemsByDepartment || {};

  if (hasMetaAds) {
    reportSections.push([
      `📣 META ADS REPORT : ${message.metaAdsReportDate || parameters[4] || ""}`,
      "",
      `Yesterday ad spend: ₹${parameters[1] || "0.00"}`,
      `Reach: ${parameters[2] || "0"}`,
      `Leads Obtained: ${parameters[3] || "0"}`,
      "",
      "📌 PENDING FROM YOUR SIDE",
      (pendingItemsByDepartment.marketing || []).join("\n") || "• None",
    ].join("\n"));
  }

  if (hasSeo) {
    reportSections.push([
      `🌐 SEO REPORT : ${parameters[4] || ""}`,
      "",
      `Project: ${parameters[5] || "Not available"}`,
      `Keywords: ${parameters[6] || "Not available"}`,
      `Ranking: #${parameters[7] || "N/A"}`,
      "",
      "📌 PENDING FROM YOUR SIDE",
      (pendingItemsByDepartment.seo || []).join("\n") || "• None",
    ].join("\n"));
  }

  if (hasSocialMedia) {
    const socialMediaReports = message.socialMediaReports || [];
    reportSections.push([
      "📱 SOCIAL MEDIA REPORT",
      "",
      ...socialMediaReports.flatMap((report) => [
        `${report.projectName}:`,
        `Last Content Uploaded: ${report.lastContentUploaded || "No content uploaded yet"}`,
        `Next Expected Upload Date: ${report.nextExpectedUploadDate || "Not scheduled"}`,
        "",
      ]),
      "📌 PENDING FROM YOUR SIDE",
      (pendingItemsByDepartment.socialMedia || []).join("\n") || "• None",
    ].join("\n").trim());
  }

  const messageBody = [
    `Hello ${message.clientName || "Client"},`,
    "",
    "Here is your complete daily report from We Promote.",
    "",
    ...reportSections.flatMap((section) => [section, divider, ""]),
    "Thank you for choosing We Promote",
  ].join("\n");

  return { ...message, messageBody };
};

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const updatePreviews = useCallback((response) => {
    const data = response.data?.data;
    if (!Array.isArray(data)) {
      throw new Error("The server returned an invalid preview list.");
    }
    setMessages(data.map(buildProjectSpecificMessage));
  }, []);

  const loadPreviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      updatePreviews(await fetchPreviews());
    } catch (requestError) {
      console.error("Unable to load client message previews:", requestError);
      setError(requestError.response?.data?.message || "Could not load client message previews.");
    } finally {
      setLoading(false);
    }
  }, [updatePreviews]);

  useEffect(() => {
    let mounted = true;
    fetchPreviews()
      .then((response) => {
        if (mounted) updatePreviews(response);
      })
      .catch((requestError) => {
        console.error("Unable to load client message previews:", requestError);
        if (mounted) setError(requestError.response?.data?.message || "Could not load client message previews.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [updatePreviews]);

  const visibleMessages = messages.filter((message) => (
    `${message.projectNames.join(" ")} ${message.clientName} ${message.departmentNames.join(" ")}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  ));
  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="mx-auto mb-7 flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-200">
            <MessageSquareText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 md:text-3xl">Client Messages</h1>
            <p className="mt-1 text-sm text-slate-500">
              Each client has one combined report across all departments and projects, shared with everyone. Phone-number spaces are ignored when matching projects.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadPreviews}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      <section className="mx-auto max-w-7xl">
        {error && (
          <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <label className="mb-5 flex max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-400">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search clients or projects"
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </label>

        {loading && messages.length === 0 ? (
          <div className="flex justify-center py-20 text-indigo-600"><LoaderCircle className="animate-spin" /></div>
        ) : visibleMessages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-slate-500">
            {messages.length ? "No clients match your search." : "No messaging-enabled client projects were found."}
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {visibleMessages.map((message) => (
              <article key={message.groupId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-slate-900">{message.clientName}</h2>
                      <p className="text-sm text-slate-500">{message.projectNames.join(", ")}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      {message.departmentNames.join(" + ") || "Message preview"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {message.clientPhone || "No client phone"}
                    {message.clientPhone && !message.isClientPhoneValid ? " · Invalid number (message preview only)" : ""}
                    {message.managerNames.length ? ` · Manager: ${message.managerNames.join(", ")}` : ""}
                  </p>
                </div>

                <div className="p-5">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-700">Message preview</h3>
                    <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-sans text-sm leading-6 text-slate-700">{message.messageBody}</pre>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
