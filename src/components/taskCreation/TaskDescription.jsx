import { useEffect, useState } from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Calendar,
  MapPin,
  Link2,
  ClipboardList,
} from "lucide-react";

import { fetchTaskById } from "./taskDetails";

const statusStyles = {
  DRAFT:
    "bg-amber-50 text-amber-700 border-amber-200",

  COMPLETED:
    "bg-emerald-50 text-emerald-700 border-emerald-200",

  IN_PROGRESS:
    "bg-blue-50 text-blue-700 border-blue-200",
};

const TaskDescriptionPage = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [task, setTask] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);

        const data =
          await fetchTaskById(id);

        setTask(data);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Failed to load task"
        );
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        {error}
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        Task not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] p-4 md:p-6">

      <div className="max-w-5xl mx-auto">

        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-5"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* CARD */}
        <div className="bg-white rounded-[30px] border border-slate-200 p-6 md:p-8 shadow-sm">

          {/* HEADER */}
          <div className="flex flex-wrap items-center gap-3 mb-5">

            <span
              className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                statusStyles[
                  task.status
                ]
              }`}
            >
              {task.status}
            </span>

            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              {task.setupType}
            </span>

          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            {task.title}
          </h1>

          <p className="text-slate-600 leading-relaxed mb-8">
            {task.description}
          </p>

          {/* INFO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Instructions */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList
                  size={18}
                />

                <h3 className="font-semibold text-slate-900">
                  Instructions
                </h3>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {task.instructions ||
                  "No instructions"}
              </p>
            </div>

            {/* Location */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={18} />

                <h3 className="font-semibold text-slate-900">
                  Location
                </h3>
              </div>

              <p className="text-sm text-slate-600">
                {task.location ||
                  "No location"}
              </p>
            </div>

            {/* Date */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={18} />

                <h3 className="font-semibold text-slate-900">
                  Task Date
                </h3>
              </div>

              <p className="text-sm text-slate-600">
                {new Date(
                  task.date
                ).toDateString()}
              </p>
            </div>

            {/* Link */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Link2 size={18} />

                <h3 className="font-semibold text-slate-900">
                  Reference
                </h3>
              </div>

              {task.referenceLink ? (
                <a
                  href={task.referenceLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-600 underline break-all"
                >
                  Open Reference Link
                </a>
              ) : (
                <p className="text-sm text-slate-600">
                  No link
                </p>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default TaskDescriptionPage;