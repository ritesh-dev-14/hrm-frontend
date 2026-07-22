import { useState, useEffect, useCallback } from "react";
import { 
  Download, 
  Search, 
  Plus, 
  Calendar, 
  FileText, 
  Trash2, 
  Eye, 
  X, 
  Upload, 
  CheckCircle, 
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import API from "../../services/api";
import { notifySuccess, notifyError } from "../../utils/toast";

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

const currentYearNum = new Date().getFullYear();
const currentMonthNum = new Date().getMonth() + 1;

const YEARS = Array.from({ length: 5 }, (_, i) => currentYearNum - i);

const HrPayslips = () => {
  // State for payslips list
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Employee list for upload dropdown
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    month: currentMonthNum,
    year: currentYearNum,
    title: "",
    remarks: "",
    sendEmail: true,
    file: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  // View Modal State
  const [viewingPayslip, setViewingPayslip] = useState(null);

  // Action States
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await API.get("/api/payslips/users").catch(() => null);
      if (res?.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setEmployees(res.data.data);
        return;
      }

      // Fallback
      const [empRes, mgrRes] = await Promise.all([
        API.get("/api/hr/employees").catch(() => ({ data: { data: [] } })),
        API.get("/api/hr/managers").catch(() => ({ data: { data: [] } })),
      ]);
      const empList = empRes.data?.data || empRes.data || [];
      const mgrList = mgrRes.data?.data || mgrRes.data || [];
      const combined = [...empList, ...mgrList];
      const uniqueUsers = Array.from(new Map(combined.map((u) => [u.id || u._id, u])).values());
      setEmployees(uniqueUsers);
    } catch (err) {
      console.error("Error loading employees for payslip upload:", err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Fetch payslips list
  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedMonth) params.month = selectedMonth;
      if (selectedYear) params.year = selectedYear;

      const res = await API.get("/api/payslips", { params });
      if (res.data?.success) {
        setPayslips(res.data.data || []);
        setTotalCount(res.data.pagination?.total || (res.data.data || []).length);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load payslips";
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const getMonthName = (mNum) => {
    const found = MONTHS.find((m) => m.value === Number(mNum));
    return found ? found.label : `Month ${mNum}`;
  };

  // Programmatic Image Download
  const handleDownload = async (slip) => {
    if (!slip?.imageUrl) return;
    const monthName = getMonthName(slip.month);
    const empName = slip.user?.name ? slip.user.name.replace(/\s+/g, "_") : "Employee";
    const fileName = `Payslip_${empName}_${monthName}_${slip.year}.png`;
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
      console.error("Direct download failed, opening in new tab:", err);
      window.open(slip.imageUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle File Change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      notifyError("Please select an image file (PNG, JPG, WEBP, etc.)");
      return;
    }

    setFormData((prev) => ({ ...prev, file: selectedFile }));
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  // Submit Upload Form
  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!formData.userId) {
      notifyError("Please select an employee");
      return;
    }

    if (!formData.file) {
      notifyError("Please select a payslip image file");
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("userId", formData.userId);
      data.append("month", formData.month);
      data.append("year", formData.year);
      if (formData.title) data.append("title", formData.title);
      if (formData.remarks) data.append("remarks", formData.remarks);
      data.append("sendEmail", formData.sendEmail ? "true" : "false");
      data.append("image", formData.file);

      const res = await API.post("/api/payslips", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        notifySuccess("Payslip uploaded successfully!");
        setIsUploadModalOpen(false);
        setFormData({
          userId: "",
          month: currentMonthNum,
          year: currentYearNum,
          title: "",
          remarks: "",
          sendEmail: true,
          file: null,
        });
        setImagePreview(null);
        fetchPayslips();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to upload payslip";
      notifyError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payslip?")) return;

    setDeletingId(id);
    try {
      const res = await API.delete(`/api/payslips/${id}`);
      if (res.data?.success) {
        notifySuccess("Payslip deleted successfully");
        fetchPayslips();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete payslip";
      notifyError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            Payslips Management
          </h1>
          <p className="text-[#64748B] text-sm sm:text-base font-medium mt-1">
            Upload, issue, and manage employee payroll slips
          </p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={20} />
          Upload & Send Payslip
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-[#F1F5F9] rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Total Uploaded</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{totalCount}</h3>
          </div>
        </div>

        <div className="bg-white border border-[#F1F5F9] rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Active Staff</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{employees.length}</h3>
          </div>
        </div>

        <div className="bg-white border border-[#F1F5F9] rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-sky-50 text-sky-600 rounded-xl">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Current Period</p>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              {getMonthName(currentMonthNum)} {currentYearNum}
            </h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee name, ID, or remarks..."
            className="w-full bg-white border border-[#E2E8F0] rounded-xl py-3 pl-11 pr-4 outline-none focus:border-[#6366F1] transition-all font-medium text-sm text-[#0F172A]"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-[#E2E8F0] rounded-xl py-3 px-4 outline-none text-sm font-semibold text-[#1E293B] cursor-pointer"
          >
            <option value="">All Months</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-[#E2E8F0] rounded-xl py-3 px-4 outline-none text-sm font-semibold text-[#1E293B] cursor-pointer"
          >
            <option value="">All Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-slate-500 font-medium text-sm">Loading payslips...</p>
          </div>
        ) : payslips.length === 0 ? (
          <div className="py-16 text-center">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-slate-800 font-bold text-base">No payslips found</h3>
            <p className="text-slate-400 text-sm mt-1">Upload a payslip to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Pay Period
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Title / Remarks
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Uploaded By
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {payslips.map((slip) => {
                  const empName = slip.user?.name || "Unknown";
                  const empCode = slip.user?.employeeId ? `(#${slip.user.employeeId})` : "";
                  const monthName = getMonthName(slip.month);
                  const isDownloading = downloadingId === slip.id;

                  return (
                    <tr key={slip.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0">
                            {empName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {empName} <span className="text-slate-400 font-normal text-xs">{empCode}</span>
                            </p>
                            <p className="text-xs text-slate-400 font-medium">
                              {slip.user?.position || slip.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                          {monthName} {slip.year}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 text-sm">{slip.title || `Payslip ${monthName}`}</p>
                        {slip.remarks && (
                          <p className="text-xs text-slate-500 truncate max-w-xs">{slip.remarks}</p>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-slate-600">
                        {slip.uploadedBy?.name || "HR"}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                        {new Date(slip.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingPayslip(slip)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            title="View Image"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDownload(slip)}
                            disabled={isDownloading}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                            title="Download Image File"
                          >
                            {isDownloading ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Download size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(slip.id)}
                            disabled={deletingId === slip.id}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={18} />
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

      {/* UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Upload Payslip</h3>
                  <p className="text-xs text-slate-400">Send payslip image to an employee / staff member</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Employee / Staff <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, userId: e.target.value }))}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="">-- Choose Employee / Staff --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role} - {emp.employeeId || emp.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Month and Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Month <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData((prev) => ({ ...prev, month: Number(e.target.value) }))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition-all cursor-pointer"
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Year <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData((prev) => ({ ...prev, year: Number(e.target.value) }))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition-all cursor-pointer"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={`e.g. Payslip for ${getMonthName(formData.month)} ${formData.year}`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition-all"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Remarks / Notes
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Optional note for the employee..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Payslip Image Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Payslip Image File <span className="text-rose-500">*</span>
                </label>
                <div className="relative border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-4 text-center transition-all bg-slate-50 hover:bg-indigo-50/20 group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="Payslip preview"
                        className="max-h-36 mx-auto rounded-lg object-contain shadow-sm border border-slate-200"
                      />
                      <p className="text-xs font-medium text-indigo-600 truncate">{formData.file?.name}</p>
                    </div>
                  ) : (
                    <div className="py-4 space-y-1">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto group-hover:text-indigo-600 transition-colors" />
                      <p className="text-sm font-semibold text-slate-700">Click or drag image file here</p>
                      <p className="text-xs text-slate-400">Supports PNG, JPG, WEBP formats</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Send Email Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={formData.sendEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sendEmail: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="sendEmail" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Send email notification with payslip link to employee
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} /> Upload & Send
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PAYSLIP MODAL */}
      {viewingPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{viewingPayslip.title || "Payslip Detail"}</h3>
                <p className="text-xs text-slate-400">
                  {viewingPayslip.user?.name} — {getMonthName(viewingPayslip.month)} {viewingPayslip.year}
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
                  alt="Payslip full view"
                  className="max-w-full object-contain rounded-lg shadow-sm"
                />
              </div>

              {viewingPayslip.remarks && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5">
                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">HR Remarks</p>
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
                  {downloadingId === viewingPayslip.id ? "Downloading..." : "Download Image File"}
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
};

export default HrPayslips;