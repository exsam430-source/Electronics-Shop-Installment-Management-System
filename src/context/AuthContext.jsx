import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('eshop_token'));
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Check if first time setup is needed
        const setupRes = await api.get('/auth/setup-status');
        if (setupRes.data.needsSetup) {
          setNeedsSetup(true);
          setLoading(false);
          return;
        }

        // 2. If token exists, verify session
        if (token) {
          const meRes = await api.get('/auth/me');
          if (meRes.data.success) {
            setUser(meRes.data.user);
          } else {
            logout();
          }
        }
      } catch (err) {
        console.error('[Auth init error]:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token]);

  const login = (authToken, userData) => {
    localStorage.setItem('eshop_token', authToken);
    localStorage.setItem('eshop_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    setNeedsSetup(false);
  };

  const logout = () => {
    localStorage.removeItem('eshop_token');
    localStorage.removeItem('eshop_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, needsSetup, setNeedsSetup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
