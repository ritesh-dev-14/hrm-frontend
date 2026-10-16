import { createContext, useContext, useState, useEffect } from "react";
import { refreshEmployeeLogoutStatus } from "../utils/employeeLogoutStatus";
import { getUserRoles } from "../utils/userRoles";

const defaultAuthContext = {
  user: null,
  role: null,
  roles: [],
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
  const [roles, setRoles] = useState([]);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = () => {
    setUser(null);
    setRole(null);
    setRoles([]);
    setToken(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // load from localStorage on refresh
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      const normalizedUser = { ...storedUser, roles: getUserRoles(storedUser) };
      setUser(normalizedUser);
      setRole(storedUser.role);
      setRoles(normalizedUser.roles);
      setToken(storedToken);
    }

    // Finish loading regardless of whether data exists
    setIsLoading(false);
  }, []);

  const login = (userData, token) => {
    const normalizedUser = { ...userData, roles: getUserRoles(userData) };
    setUser(normalizedUser);
    setRole(userData.role);
    setRoles(normalizedUser.roles);
    setToken(token);

    localStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.setItem("token", token);
  };

  const logout = async ({ enforceEmployeeCheck = false } = {}) => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const currentRole = role || storedUser?.role;

    if (!enforceEmployeeCheck || !["EMPLOYEE", "HR"].includes(String(currentRole || "").trim().toUpperCase())) {
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
      value={{ user, role, roles, token, login, logout, clearSession, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext) || defaultAuthContext;
};