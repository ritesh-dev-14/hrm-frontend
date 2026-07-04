import { User, Lock, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-white p-8 font-sans text-[#1F2937]">
      {/* HEADER */}
      <header className="mb-10">
        <h1 className="text-[28px] font-bold tracking-tight text-[#0F172A]">Settings</h1>
        <p className="text-[#64748B] text-sm mt-1">Manage your account and preferences</p>
      </header>

      <div className="max-w-5xl space-y-6">
        {/* PUBLIC PROFILE CARD */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#F1F5F9] flex items-center gap-3">
            <User size={18} className="text-[#64748B]" />
            <h2 className="text-[15px] font-bold text-[#0F172A]">Public Profile</h2>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-[13px] font-bold text-[#475569] mb-2 uppercase tracking-wide">
                  Name
                </label>
                <input 
                  type="text" 
                  defaultValue="David Musk"
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#64748B] focus:ring-2 focus:ring-[#6366F1]/10 focus:border-[#6366F1] outline-none transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[13px] font-bold text-[#475569] mb-2 uppercase tracking-wide">
                  Email
                </label>
                <input 
                  type="email" 
                  defaultValue="david@example.com"
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#64748B] focus:ring-2 focus:ring-[#6366F1]/10 focus:border-[#6366F1] outline-none transition-all"
                />
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="block text-[13px] font-bold text-[#475569] mb-2 uppercase tracking-wide">
                Position
              </label>
              <input 
                type="text" 
                defaultValue="Software Developer"
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#64748B] focus:ring-2 focus:ring-[#6366F1]/10 focus:border-[#6366F1] outline-none transition-all"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[13px] font-bold text-[#475569] mb-2 uppercase tracking-wide">
                Bio
              </label>
              <textarea 
                defaultValue="hi"
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] h-28 outline-none focus:border-[#6366F1] transition-all resize-none"
              />
              <p className="text-[12px] text-[#94A3B8] mt-3 font-medium">
                This will be displayed on your profile.
              </p>
            </div>

            {/* Save Changes Button */}
            <div className="flex justify-end pt-4">
              <button className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 active:scale-95">
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* PASSWORD CARD (Mini) */}
        <div className="max-w-md bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] flex items-center justify-center border border-[#F1F5F9]">
              <Lock size={20} className="text-[#64748B]" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#0F172A]">Password</h3>
              <p className="text-[13px] text-[#64748B] font-medium">Update your account password</p>
            </div>
          </div>
          <button className="px-6 py-2.5 border border-[#E2E8F0] text-[#0F172A] text-[14px] font-bold rounded-xl hover:bg-gray-50 transition-colors active:scale-95">
            Change
          </button>
        </div>
      </div>
    </div>
  );
}