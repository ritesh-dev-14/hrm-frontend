import { ChevronRight } from "lucide-react";

export default function QuickActions({ actions }) {
  return (
    <div className="xl:col-span-5 bg-white border border-slate-200 rounded-4xl p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] flex flex-col h-full">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-slate-900 mb-0.5">
          Quick Actions
        </h3>

        <p className="text-xs text-slate-500">
          Frequently used actions and shortcuts.
        </p>
      </div>

      <div className="space-y-2">
        {actions.map((item, idx) => (
          <button
            key={idx}
            className="group w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 hover:bg-white transition-all duration-300 border border-transparent hover:border-slate-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-100 text-left"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}
              >
                <item.icon size={16} className={item.color} />
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 text-xs">
                  {item.label}
                </h4>

                <p className="text-[11px] text-slate-500 mt-0.5">
                  {item.sub}
                </p>
              </div>
            </div>

            <ChevronRight
              size={14}
              className="text-slate-400 group-hover:translate-x-1 transition-transform duration-300"
            />
          </button>
        ))}
      </div>
    </div>
  );
}