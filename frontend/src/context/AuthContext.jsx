import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gyansetu_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('gyansetu_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          localStorage.setItem('gyansetu_user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Session verification failed, logging out');
          logout();
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('gyansetu_token', res.access_token);
    localStorage.setItem('gyansetu_user', JSON.stringify(res.user));
    return res.user;
  };

  const register = async (email, password, fullName) => {
    const res = await api.register({ email, password, full_name: fullName });
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('gyansetu_token', res.access_token);
    localStorage.setItem('gyansetu_user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('gyansetu_token');
    localStorage.removeItem('gyansetu_user');
  };

  const updateUser = (updatedProfile) => {
    setUser(updatedProfile);
    localStorage.setItem('gyansetu_user', JSON.stringify(updatedProfile));
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
