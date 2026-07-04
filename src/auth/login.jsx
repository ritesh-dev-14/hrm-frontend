import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import logo from "../assets/logo-removebg-.png"

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

  const [showPassword, setShowPassword] =
    useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md ">
        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="w-10 h-10 mx-auto border border-slate-200 rounded-xl flex items-center justify-center mb-4">
            {/* <Lock size={16} className="text-slate-700" /> */}
            <img src={logo} alt="" />
          </div>

          <h1 className="text-xl font-medium text-slate-900">
            Sign in
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Enter your credentials to continue
          </p>
        </div>

        {/* CARD */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* ERROR */}
          {errors.general && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle size={14} />
              {errors.general}
            </div>
          )}

          {/* EMAIL */}
          <div>
            <label className="text-xs text-slate-500">
              Email
            </label>

            <div className="relative mt-1">
              <Mail
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-slate-900 transition"
              />
            </div>

            {errors.email && (
              <p className="text-xs text-red-500 mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-xs text-slate-500">
              Password
            </label>

            <div className="relative mt-1">
              <Lock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type={
                  showPassword ? "text" : "password"
                }
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-slate-900 transition"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? (
                  <EyeOff size={14} />
                ) : (
                  <Eye size={14} />
                )}
              </button>
            </div>

            {errors.password && (
              <p className="text-xs text-red-500 mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* BUTTON */}
          <button
            disabled={loading}
            className="w-full py-2.5 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition flex items-center justify-center"
          >
            {loading ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* FOOTER */}
        <p className="text-center text-xs text-slate-400 mt-8">
          Contact admin for access
        </p>
      </div>
    </div>
  );
}