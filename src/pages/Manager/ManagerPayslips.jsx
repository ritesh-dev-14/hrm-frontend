import { Download } from "lucide-react";

const PAYSLIP_DATA = [
  {
    period: "January 2026",
    basicSalary: "$1,000",
    netSalary: "$1,000",
  }
];

export default function PayslipsPage() {
  return (
    <div className="min-h-screen bg-white p-8 font-sans text-[#1F2937]">
      {/* HEADER */}
      <header className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-[#0F172A]">Payslips</h1>
        <p className="text-[#64748B] text-sm mt-1">Your payslip history</p>
      </header>

      {/* TABLE CONTAINER */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] uppercase text-[11px] tracking-[0.15em] font-bold text-[#64748B]">
              <th className="px-8 py-5">Period</th>
              <th className="px-8 py-5">Basic Salary</th>
              <th className="px-8 py-5 text-center">Net Salary</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {PAYSLIP_DATA.map((slip, index) => (
              <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-8 py-6 text-[14px] font-medium text-[#64748B]">
                  {slip.period}
                </td>
                <td className="px-8 py-6 text-[14px] font-medium text-[#64748B]">
                  {slip.basicSalary}
                </td>
                <td className="px-8 py-6 text-[14px] font-bold text-[#0F172A] text-center">
                  {slip.netSalary}
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] text-[13px] font-bold rounded-lg transition-all active:scale-95">
                    <Download size={16} />
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {PAYSLIP_DATA.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-[#94A3B8] text-sm font-medium">No payslips found</p>
          </div>
        )}
      </div>
    </div>
  );
}