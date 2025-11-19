// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { refreshAccessToken } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load auth data from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (storedUser && storedAccessToken && storedRefreshToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
    }

    setLoading(false);
  }, []);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!refreshToken) return;

    // Refresh token 5 minutes before expiration (15min - 5min = 10min)
    const refreshInterval = setInterval(async () => {
      try {
        const response = await refreshAccessToken(refreshToken);
        setAccessToken(response.access_token);
        localStorage.setItem('accessToken', response.access_token);
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(refreshInterval);
  }, [refreshToken]);

  const login = (userData, access, refresh) => {
    setUser(userData);
    setAccessToken(access);
    setRefreshToken(refresh);

    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);

    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('rememberMe');
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin' || user?.role === 'super_admin';
  };

  // Check if user is counselor
  const isCounselor = () => {
    return user?.role === 'counselor' || user?.role === 'peer_counselor';
  };

  // Check if user is student
  const isStudent = () => {
    return user?.role === 'student';
  };

  const value = {
    user,
    accessToken,
    refreshToken,
    loading,
    login,
    logout,
    updateUser,
    hasRole,
    isAdmin,
    isCounselor,
    isStudent,
    isAuthenticated: !!user && !!accessToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;