import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Clock3, LoaderCircle, MessageSquareText, Plus, X } from "lucide-react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getUserRoles } from "../../utils/userRoles";
import { notifyError, notifySuccess } from "../../utils/toast";

const today = () => {
  const date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function ProjectPendingSection({ projectId, triggerClassName }) {
  const { user, role } = useAuth();
  const roles = getUserRoles(user, role);
  const canAdd = roles.includes("MANAGER") || roles.includes("ADMIN");
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loadedProjectId, setLoadedProjectId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dueDate, setDueDate] = useState(today);
  const [note, setNote] = useState("");
  const loading = isOpen && loadedProjectId !== projectId;

  useEffect(() => {
    if (!isOpen || !projectId) return;
    let active = true;
    API.get(`/api/projects/${projectId}/pending-items`)
      .then((response) => {
        if (active) {
          setItems(response.data?.data || []);
          setLoadedProjectId(projectId);
        }
      })
      .catch((error) => {
        if (active) {
          notifyError(error.response?.data?.message || "Could not load project pending items.");
          setLoadedProjectId(projectId);
        }
      })
    return () => {
      active = false;
    };
  }, [isOpen, projectId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!dueDate || !note.trim()) return;

    setSaving(true);
    try {
      const response = await API.post(`/api/projects/${projectId}/pending-items`, {
        dueDate,
        note: note.trim(),
      });
      setItems((previous) => [...previous, response.data.data].sort(
        (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
      ));
      setDueDate(today());
      setNote("");
      notifySuccess("Pending item added to this project.");
    } catch (error) {
      notifyError(error.response?.data?.message || "Could not save the pending item.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={triggerClassName || "fixed bottom-6 right-6 z-[60] inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-600/25 transition hover:bg-indigo-700"}
      >
        <MessageSquareText size={17} />
        Pending from your side
        {items.length > 0 && (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{items.length}</span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-slate-950/40 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-pending-title"
            className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <div className="flex items-center gap-2 text-indigo-600">
                  <MessageSquareText size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">Project follow-up</span>
                </div>
                <h2 id="project-pending-title" className="mt-1 text-xl font-black text-slate-900">
                  Pending from your side
                </h2>
                <p className="mt-1 text-sm text-slate-500">Dated notes about items this project is waiting on.</p>
              </div>
              <button
                type="button"
                aria-label="Close pending items"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {canAdd && (
                <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <h3 className="text-sm font-bold text-slate-800">Add a pending item</h3>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-slate-600">Date</span>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-slate-600">What are we waiting on?</span>
                    <textarea
                      required
                      maxLength={2000}
                      rows={3}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Write the pending item or follow-up note..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </label>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving || !note.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
                      Add pending item
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800">Project pending items</h3>
                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                    <LoaderCircle size={17} className="animate-spin" /> Loading project notes...
                  </div>
                ) : items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center">
                    <MessageSquareText size={26} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-600">Nothing pending has been recorded.</p>
                    <p className="mt-1 text-xs text-slate-400">Managers can add a dated note above.</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700">
                          <CalendarDays size={14} />
                          {formatDate(item.dueDate)}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock3 size={12} />
                          Added {formatDate(item.createdAt)} by {item.createdBy?.name || "Project team"}
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{item.note}</p>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </>,
    document.body,
  );
}
