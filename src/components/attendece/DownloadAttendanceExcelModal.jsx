import { useState } from "react";
import { FileSpreadsheet, Download, X, Calendar, CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../services/api";
import { exportMonthlyAttendanceExcel } from "../../utils/attendanceExcelExporter";
import { notifyError } from "../../utils/toast";

export default function DownloadAttendanceExcelModal({ buttonClassName = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = [2024, 2025, 2026, 2027];

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Fetch all employees and attendance records
      const [usersRes, recordsRes] = await Promise.all([
        API.get("/api/hr/dashboard/overview").catch(() => null),
        API.get("/api/attendance").catch(() => null),
      ]);

      let allUsers = [];
      let allRecords = [];

      if (usersRes?.data?.success) {
        allUsers = usersRes.data.data?.allUsers || [];
      }
      
      // Fallback if overview is not populated
      if (allUsers.length === 0) {
        const empRes = await API.get("/api/hr/dashboard/employees").catch(() => null);
        if (empRes?.data?.success) {
          allUsers = empRes.data.data || [];
        }
      }

      if (recordsRes?.data) {
        const data = recordsRes.data.data || recordsRes.data;
        allRecords = Array.isArray(data) ? data : [];
      }

      // Generate & download Excel
      exportMonthlyAttendanceExcel({
        allUsers,
        allRecords,
        year: Number(selectedYear),
        month: Number(selectedMonth),
      });

      setIsOpen(false);
    } catch (err) {
      console.error("Failed to export attendance Excel:", err);
      notifyError("Failed to generate Excel report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          buttonClassName ||
          "px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow flex items-center gap-2 transition-all cursor-pointer"
        }
      >
        <FileSpreadsheet size={16} />
        <span>Export Attendance Excel</span>
      </button>

      {/* MODAL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">
                      Export Monthly Excel
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">
                      Download full attendance roster & daily totals
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Info Box */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 space-y-2 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-2 text-slate-700 font-bold mb-1">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>Excel Report Format:</span>
                </div>
                <p>• Employee details (Name, ID, Department, Role)</p>
                <p>• Daily status columns for Date 1 to end of month</p>
                <p>• Total Days Present, Total Absent & Total Leaves</p>
              </div>

              {/* Month & Year Selectors */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 cursor-pointer"
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 cursor-pointer"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleExport}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isExporting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>Download Excel</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
