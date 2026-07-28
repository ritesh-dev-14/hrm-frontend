import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import logo from "../assets/logo-removebg-.png";
import { motion } from "framer-motion";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));

    if (errors[name]) {
      setErrors((p) => ({ ...p, [name]: "" }));
    }
  };

  const validate = () => {
    const e = {};
    if (!formData.email) e.email = "Required";
    if (!formData.password) e.password = "Required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ email: "", password: "", general: "" });

    const v = validate();
    if (Object.keys(v).length) {
      setErrors((p) => ({ ...p, ...v }));
      return;
    }

    setLoading(true);

    try {
      const res = await API.post("/api/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const { user, token } = res?.data?.data;

      login(user, token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setErrors((p) => ({
        ...p,
        general:
          err.response?.data?.message ||
          "Invalid credentials",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* Login Form Panel */}
      <div className="w-full flex items-center justify-center p-6 sm:p-12 md:p-24 bg-white relative">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-72 h-72 rounded-full bg-emerald-50 blur-[80px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-72 h-72 rounded-full bg-blue-50 blur-[80px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-white shadow-xl shadow-slate-200/50 p-3 rounded-2xl border border-slate-100">
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
            </div>
          </div>

          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Welcome back</h2>
            <p className="text-slate-500">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ERROR */}
            {errors.general && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                className="flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl"
              >
                <AlertCircle size={18} className="shrink-0 text-red-500" />
                <p className="font-medium">{errors.general}</p>
              </motion.div>
            )}

            <div className="space-y-5">
              {/* EMAIL */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@wepromote.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 font-medium ml-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 font-medium ml-1">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            {/* BUTTON */}
            <button
              disabled={loading}
              className="group w-full relative flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden shadow-lg shadow-blue-900/10"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Sign in to account</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* FOOTER */}
          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center">
            <p className="text-sm text-slate-500 text-center">
              Don't have an account or forgot password? <br/>
              <span className="font-medium text-slate-900 hover:text-blue-600 cursor-pointer transition-colors">Contact your administrator.</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}