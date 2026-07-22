import { useState, useEffect, useCallback } from "react";
import { Download, Eye, Calendar, FileText, Loader2, X, Image as ImageIcon } from "lucide-react";
import API from "../../services/api";
import { notifyError } from "../../utils/toast";

const MONTHS = [
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

export default function EmployeePayslips() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [viewingPayslip, setViewingPayslip] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchMyPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedMonth) params.month = selectedMonth;
      if (selectedYear) params.year = selectedYear;

      const res = await API.get("/api/payslips/my-payslips", { params });
      if (res.data?.success) {
        setPayslips(res.data.data || []);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load payslips";
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchMyPayslips();
  }, [fetchMyPayslips]);

  const getMonthName = (mNum) => {
    const found = MONTHS.find((m) => m.value === Number(mNum));
    return found ? found.label : `Month ${mNum}`;
  };

  const handleDownload = async (slip) => {
    if (!slip?.imageUrl) return;
    const monthName = getMonthName(slip.month);
    const fileName = `Payslip_${monthName}_${slip.year}.png`;
    setDownloadingId(slip.id);

    try {
      const response = await fetch(slip.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Direct download failed, fallback to new tab:", err);
      window.open(slip.imageUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8 font-sans text-[#1F2937]">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">My Payslips</h1>
          <p className="text-[#64748B] text-sm mt-1">View and download your monthly salary slips</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3.5 outline-none text-xs font-semibold text-[#1E293B] cursor-pointer"
          >
            <option value="">All Months</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Year (e.g. 2026)"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2 px-3 outline-none text-xs font-semibold text-[#1E293B] w-28"
          />
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-slate-500 font-medium text-sm">Loading your payslips...</p>
          </div>
        ) : payslips.length === 0 ? (
          <div className="py-20 text-center">
            <ImageIcon className="w-12 h-12 text-[#94A3B8] mx-auto mb-3 opacity-60" />
            <h3 className="text-[#0F172A] font-bold text-base">No payslips available</h3>
            <p className="text-[#94A3B8] text-sm mt-1">Your uploaded payslips will appear here once issued by HR.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] uppercase text-[11px] tracking-[0.15em] font-bold text-[#64748B] border-b border-[#E2E8F0]">
                  <th className="px-8 py-5">Pay Period</th>
                  <th className="px-8 py-5">Title</th>
                  <th className="px-8 py-5">HR Remarks</th>
                  <th className="px-8 py-5">Issued Date</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {payslips.map((slip) => {
                  const monthName = getMonthName(slip.month);
                  const isDownloading = downloadingId === slip.id;

                  return (
                    <tr key={slip.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-6 text-sm font-bold text-[#0F172A]">
                        <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg">
                          <Calendar size={14} className="mr-1.5" />
                          {monthName} {slip.year}
                        </span>
                      </td>

                      <td className="px-8 py-6 text-sm font-semibold text-[#334155]">
                        {slip.title || `Payslip for ${monthName} ${slip.year}`}
                      </td>

                      <td className="px-8 py-6 text-sm text-[#64748B]">
                        {slip.remarks || "—"}
                      </td>

                      <td className="px-8 py-6 text-xs text-[#94A3B8] font-medium">
                        {new Date(slip.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setViewingPayslip(slip)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            <Eye size={16} />
                            View Slip
                          </button>
                          <button
                            onClick={() => handleDownload(slip)}
                            disabled={isDownloading}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            {isDownloading ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Download size={16} />
                            )}
                            {isDownloading ? "Downloading..." : "Download"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      {viewingPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{viewingPayslip.title || "My Payslip"}</h3>
                <p className="text-xs text-slate-400">
                  Period: {getMonthName(viewingPayslip.month)} {viewingPayslip.year}
                </p>
              </div>
              <button
                onClick={() => setViewingPayslip(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-center max-h-[60vh] overflow-auto">
                <img
                  src={viewingPayslip.imageUrl}
                  alt="Payslip full image"
                  className="max-w-full object-contain rounded-lg shadow-sm"
                />
              </div>

              {viewingPayslip.remarks && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5">
                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Note from HR</p>
                  <p className="text-sm text-slate-700 mt-1">{viewingPayslip.remarks}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => handleDownload(viewingPayslip)}
                  disabled={downloadingId === viewingPayslip.id}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {downloadingId === viewingPayslip.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  {downloadingId === viewingPayslip.id ? "Downloading..." : "Download Full Image"}
                </button>
                <button
                  onClick={() => setViewingPayslip(null)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}