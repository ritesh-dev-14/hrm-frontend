import  { useState } from "react";
import { 
  User, 

  Lock, 
 
  ShieldCheck, 
  Camera,
  Save,

} from "lucide-react";

const HrSettings = () => {
  const [profile, setProfile] = useState({
    name: "Admin",
    email: "admin@example.com",
    position: "HR Director",
    bio: "Managing core HR operations and team culture."
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-[32px] font-bold text-[#0F172A] tracking-tight">Settings</h1>
        <p className="text-[#64748B] text-lg font-medium">Manage your account and preferences</p>
      </div>

      <div className="max-w-4xl space-y-8">
        
        {/* SECTION: PUBLIC PROFILE */}
        <div className="bg-white rounded-4xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-[#F1F5F9] flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-[#6366F1]">
              <User size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Public Profile</h2>
          </div>
          
          <div className="p-8 space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center gap-6 mb-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#6366F1] font-black text-3xl border-4 border-white shadow-md">
                  {profile.name[0]}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-[#6366F1] hover:bg-indigo-50 transition-colors">
                  <Camera size={16} />
                </button>
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Profile Picture</h4>
                <p className="text-sm text-slate-500">PNG or JPG, max 5MB</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SettingsField 
                label="Name" 
                value={profile.name} 
                onChange={(v) => setProfile({...profile, name: v})} 
              />
              <SettingsField 
                label="Email" 
                type="email"
                value={profile.email} 
                onChange={(v) => setProfile({...profile, email: v})} 
              />
            </div>

            <SettingsField 
              label="Position" 
              value={profile.position} 
              onChange={(v) => setProfile({...profile, position: v})} 
            />

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Bio</label>
              <textarea 
                rows="4"
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3 outline-none focus:border-[#6366F1] focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-700 font-medium resize-none"
                placeholder="Tell us about yourself..."
              />
              <p className="text-[11px] text-slate-400 ml-1">This will be displayed on your internal profile.</p>
            </div>

            <div className="flex justify-end pt-4">
              <button className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95">
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* SECTION: PASSWORD & SECURITY */}
        <div className="bg-white rounded-4xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-[#F1F5F9] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
                <Lock size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Security</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <ShieldCheck className="text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Account Password</h4>
                  <p className="text-xs text-slate-500 font-medium">Last updated 3 months ago</p>
                </div>
              </div>
              <button className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-xl font-bold text-slate-700 transition-all shadow-sm">
                Change
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Reusable Field Component
const SettingsField = ({ label, value, onChange, type = "text" }) => (
  <div className="space-y-2">
    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3 outline-none focus:border-[#6366F1] focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-700 font-bold"
    />
  </div>
);

export default HrSettings;