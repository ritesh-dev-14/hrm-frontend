/**
 * Auth Service - Handles all authentication API calls
 */

import api from "./api";
import { config } from "../utils/config";

export const authService = {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - User data and token
   */
  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;

      // Store token and user data
      if (token) {
        localStorage.setItem(config.tokenKey, token);
        localStorage.setItem(config.userKey, JSON.stringify(user));
        localStorage.setItem(config.roleKey, user.role);
      }

      return { success: true, user, token };
    } catch (error) {
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
      return { success: false, message, error };
    }
  },

  /**
   * Logout user and clear data
   */
  logout: () => {
    localStorage.removeItem(config.tokenKey);
    localStorage.removeItem(config.userKey);
    localStorage.removeItem(config.roleKey);
  },

  /**
   * Get current user from localStorage
   * @returns {object} - User object or null
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem(config.userKey);
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Get current user role
   * @returns {string} - User role or null
   */
  getCurrentRole: () => {
    return localStorage.getItem(config.roleKey);
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem(config.tokenKey);
  },

  /**
   * Verify token and get user data
   */
  verifyToken: async () => {
    try {
      const response = await api.get("/auth/verify");
      return { success: true, user: response.data.user };
    } catch (error) {
      authService.logout();
      return { success: false, error };
    }
  },
};

export default authService;
