import { CalendarDays, Clock3 } from "lucide-react";
import { motion } from "framer-motion";

export default function AttendanceHistory({ history }) {
  return (
    <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-500 mb-2">
          Attendance History
        </p>

        <h2 className="text-2xl font-bold text-slate-900">
          Recent Records
        </h2>
      </div>

      <div className="space-y-4">
        {history?.length > 0 ? (
          history.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm transition-all"
            >
              <div>
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                  <CalendarDays size={16} />
                  {new Date(item.date).toLocaleDateString()}
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  Status: {item.status}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Clock3 size={15} />
                {item.totalHours?.toFixed(2)} hrs
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-10 text-center text-sm text-slate-400">
            No attendance records found
          </div>
        )}
      </div>
    </div>
  );
}