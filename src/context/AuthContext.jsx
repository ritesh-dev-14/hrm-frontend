import { createContext, useContext, useState, useEffect } from "react";
import { refreshEmployeeLogoutStatus } from "../utils/employeeLogoutStatus";

const defaultAuthContext = {
  user: null,
  role: null,
  token: null,
  login: () => {},
  logout: async () => ({ allowed: false, error: true }),
  clearSession: () => {},
  isLoading: true,
};

const AuthContext = createContext(defaultAuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = () => {
    setUser(null);
    setRole(null);
    setToken(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // load from localStorage on refresh
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      setUser(storedUser);
      setRole(storedUser.role);
      setToken(storedToken);
    }

    // Finish loading regardless of whether data exists
    setIsLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    setRole(userData.role);
    setToken(token);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
  };

  const logout = async ({ enforceEmployeeCheck = false } = {}) => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const currentRole = role || storedUser?.role;

    if (!enforceEmployeeCheck || String(currentRole || "").trim().toUpperCase() !== "EMPLOYEE") {
      clearSession();
      return { allowed: true };
    }

    try {
      const status = await refreshEmployeeLogoutStatus();

      if (!status.error && status.canLogout === true) {
        clearSession();
        return { allowed: true, status };
      }

      return { allowed: false, status };
    } catch (error) {
      console.error("Employee logout check failed:", error);
      return { allowed: false, error: true };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, role, token, login, logout, clearSession, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext) || defaultAuthContext;
};