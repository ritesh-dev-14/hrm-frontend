import { ArrowRight } from "lucide-react";

export default function DashboardHero({
  name,
  title,
  description,
  buttonText,
  onClick,
}) {
  return (
    <div className="relative overflow-hidden mb-6 rounded-4xl border border-slate-200 bg-white px-6 py-8 lg:px-10 lg:py-10 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/5 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-sky-500/5 blur-3xl rounded-full" />

      <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
        <div className="max-w-2xl">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tighter text-slate-900 leading-none mb-5">
            {title},{" "}
            <span className="bg-linear-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent">
              {name}
            </span>
          </h1>

          <p className="text-slate-600 text-base lg:text-lg leading-relaxed max-w-xl">
            {description}
          </p>
        </div>

        <button
          onClick={onClick}
          className="group h-13.5 px-7 rounded-2xl bg-slate-900 text-white text-sm font-semibold flex items-center gap-3 hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-300/40 transition-all duration-300 active:scale-[0.98]"
        >
          {buttonText}

          <ArrowRight
            size={16}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </button>
      </div>
    </div>
  );
}