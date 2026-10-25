import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/admin/dashboard')
        .then((res) => {
          if (res.data && res.data.user) {
            setUser(res.data.user);
          }
        })
        .catch(() => {
          // Silent fallback or initial load handling
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('isAuthenticated', 'true');
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    setToken(null);
    setUser(null);
  };

  const devLogin = () => {
    const devToken = 'developer_mode_token';
    const devUser = { name: 'Developer Admin', email: 'dev@mkgadmin.local', role: 'Super Admin' };
    localStorage.setItem('token', devToken);
    localStorage.setItem('isAuthenticated', 'true');
    setToken(devToken);
    setUser(devUser);
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout, devLogin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
