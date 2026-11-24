import { CalendarClock, X } from "lucide-react";

const formatDate = (value) => new Date(value).toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

export default function EAOverdueTasksPopup({ data, onClose, onViewTasks }) {
  if (!data) return null;

  const tasks = data.tasks || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ea-overdue-title"
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <CalendarClock size={20} />
            </span>
            <div>
              <h2 id="ea-overdue-title" className="font-bold text-slate-900">Overdue EA-Assigned Tasks</h2>
              <p className="mt-1 text-sm text-slate-500">
                {tasks.length} incomplete task{tasks.length === 1 ? "" : "s"} due today or earlier.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close overdue tasks notification"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </header>

        <div className="overflow-y-auto p-5">
          <div className="space-y-3">
            {tasks.map((assignment) => (
              <article key={assignment.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <div>
                    <h3 className="font-semibold text-slate-800">{assignment.task?.projectName || "Untitled task"}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {assignment.assignedTo?.name || "Unknown assignee"}
                      {assignment.assignedTo?.role ? ` (${assignment.assignedTo.role})` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-sm sm:text-right">
                    <p className="font-semibold text-red-600">Due {formatDate(assignment.completionDate)}</p>
                    <p className="mt-1 text-slate-500">Status: {assignment.status.replaceAll("_", " ")}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Assigned by {assignment.createdBy?.name || assignment.assignedBy || "EA"}
                </p>
              </article>
            ))}
          </div>
        </div>

        <footer className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-white"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={onViewTasks}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            View all tasks
          </button>
        </footer>
      </section>
    </div>
  );
}
