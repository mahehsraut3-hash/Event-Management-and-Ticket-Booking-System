import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('tbs_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check current user session on load
  const loadUser = useCallback(async (authToken) => {
    if (!authToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.data?.success && res.data?.data?.user) {
        setUser(res.data.data.user);
      } else {
        throw new Error('Could not fetch user details');
      }
    } catch (err) {
      console.warn('[AuthContext] Session invalid or expired:', err.response?.data?.message || err.message);
      localStorage.removeItem('tbs_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser(token);
  }, [token, loadUser]);

  // Login handler
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success && res.data?.data) {
        const { token: newToken, user: userData } = res.data.data;
        localStorage.setItem('tbs_token', newToken);
        setToken(newToken);
        setUser(userData);
        return { success: true, user: userData };
      }
      throw new Error(res.data?.message || 'Login failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Register handler
  const register = async ({ name, email, password, role = 'attendee' }) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      if (res.data?.success && res.data?.data) {
        const { token: newToken, user: userData } = res.data.data;
        localStorage.setItem('tbs_token', newToken);
        setToken(newToken);
        setUser(userData);
        return { success: true, user: userData };
      }
      throw new Error(res.data?.message || 'Registration failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('tbs_token');
    setToken(null);
    setUser(null);
    setAuthError(null);
  };

  const value = {
    user,
    token,
    loading,
    authError,
    isAuthenticated: !!token && !!user,
    role: user?.role || 'guest',
    isOrganizer: user?.role === 'organizer' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
    isAttendee: user?.role === 'attendee',
    login,
    register,
    logout,
    refreshUser: () => loadUser(token)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
