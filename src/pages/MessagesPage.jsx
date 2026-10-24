import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, MessageSquareText, RefreshCw, Search, Send } from "lucide-react";
import API from "../services/api";
import { getUserRoles } from "../utils/userRoles";

const fetchPreviews = () => API.get("/api/whatsapp-messages/previews");

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingTestFor, setSendingTestFor] = useState("");
  const [testSendStatus, setTestSendStatus] = useState({});
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = getUserRoles(storedUser, localStorage.getItem("role")).includes("ADMIN");

  const updatePreviews = useCallback((response) => {
    const data = response.data?.data;
    if (!Array.isArray(data)) {
      throw new Error("The server returned an invalid preview list.");
    }
    setMessages(data);
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
  const isHandaBanglesTestReport = (message) =>
    message.projectNames.some((name) => /handa\s*bangles/i.test(name));

  const sendHandaBanglesTest = async (message) => {
    const project = message.projects.find((item) => /handa\s*bangles/i.test(item.projectName));
    if (!project || sendingTestFor) return;
    if (!window.confirm("Send this Handa Bangles preview once to +91 8077742337 for testing?")) return;

    setSendingTestFor(message.groupId);
    setTestSendStatus((current) => ({ ...current, [message.groupId]: "" }));
    try {
      await API.post("/api/whatsapp-messages/send-handa-bangles-test", {
        projectId: project.id,
        messageBody: message.messageBody,
      });
      setTestSendStatus((current) => ({
        ...current,
        [message.groupId]: "WhatsApp accepted the test report for +91 8077742337.",
      }));
    } catch (requestError) {
      console.error("Unable to send Handa Bangles test report:", requestError);
      setTestSendStatus((current) => ({
        ...current,
        [message.groupId]: requestError.response?.data?.message || "Could not send the test report.",
      }));
    } finally {
      setSendingTestFor("");
    }
  };

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
              One combined daily report per client phone number. Pending notes come from each project’s “Pending from your side” items.
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
                  {isAdmin && isHandaBanglesTestReport(message) && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => sendHandaBanglesTest(message)}
                        disabled={Boolean(sendingTestFor || testSendStatus[message.groupId]?.startsWith("WhatsApp accepted"))}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {sendingTestFor === message.groupId ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : testSendStatus[message.groupId]?.startsWith("WhatsApp accepted") ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <Send size={14} />
                        )}
                        {sendingTestFor === message.groupId ? "Sending..." : "Send One-Time Test"}
                      </button>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Sends this preview once to +91 8077742337. Maximum one successful test today.
                      </p>
                      {testSendStatus[message.groupId] && (
                        <p
                          role="status"
                          className={`mt-1 text-xs font-semibold ${
                            testSendStatus[message.groupId].startsWith("WhatsApp accepted")
                              ? "text-emerald-700"
                              : "text-rose-700"
                          }`}
                        >
                          {testSendStatus[message.groupId]}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-700">Message as the client will see it</h3>
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
