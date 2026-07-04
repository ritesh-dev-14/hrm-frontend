import  { useState } from "react";
import { 
  Download, 
  Search, 
  Plus, 
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard
} from "lucide-react";

const HrPayslips = () => {
  const [payslips] = useState([
    { id: 1, name: "James Thomas", period: "February 2026", basic: "$1,000", net: "$1,000", status: "Paid" },
    { id: 2, name: "David Musk", period: "January 2026", basic: "$1,000", net: "$1,000", status: "Paid" },
    { id: 3, name: "John Doe", period: "January 2026", basic: "$900", net: "$1,000", status: "Paid" },
    { id: 4, name: "Richard Robert", period: "January 2026", basic: "$1,000", net: "$1,100", status: "Paid" },
  ]);

  const payrollStats = [
    { label: "Total Payroll", value: "$4,100", icon: <DollarSign size={20} className="text-indigo-600"/> },
    { label: "Total Deductions", value: "$120", icon: <TrendingUp size={20} className="text-rose-500"/> },
    { label: "Pending Payouts", value: "0", icon: <CreditCard size={20} className="text-emerald-500"/> },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      {/* Header matching your Dashboard style */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-[32px] font-bold text-[#0F172A] tracking-tight">Payslips</h1>
          <p className="text-[#64748B] text-lg font-medium">Generate and manage employee payroll records</p>
        </div>
        <button className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95">
          <Plus size={20} />
          Generate Payslip
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {payrollStats.map((stat, i) => (
          <div key={i} className="bg-white border border-[#F1F5F9] rounded-3xl p-6 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-[#F8FAFC] rounded-2xl">{stat.icon}</div>
            <div>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Period Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={20} />
          <input 
            type="text"
            placeholder="Search by employee..."
            className="w-full bg-white border border-[#E2E8F0] rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#6366F1] transition-all font-medium"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
          <select className="appearance-none bg-white border border-[#E2E8F0] rounded-2xl py-4 pl-11 pr-10 outline-none text-[#1E293B] font-bold cursor-pointer">
            <option>February 2026</option>
            <option>January 2026</option>
          </select>
        </div>
      </div>

      {/* Premium Table Container */}
      <div className="bg-white rounded-4xl border border-[#F1F5F9] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
              <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-500">Employee</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-500">Period</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-500">Basic Salary</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-500">Net Salary</th>
              <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {payslips.map((slip) => (
              <tr key={slip.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                      {slip.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="font-bold text-slate-900">{slip.name}</span>
                  </div>
                </td>
                <td className="px-6 py-6 font-medium text-slate-600">{slip.period}</td>
                <td className="px-6 py-6 font-bold text-slate-700">{slip.basic}</td>
                <td className="px-6 py-6">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-sm">
                    {slip.net}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#F8FAFC] hover:bg-indigo-50 text-[#64748B] hover:text-[#6366F1] rounded-xl border border-[#E2E8F0] transition-all font-bold text-sm">
                    <Download size={16} />
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HrPayslips;