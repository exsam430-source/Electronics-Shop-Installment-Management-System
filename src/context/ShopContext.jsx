import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const [profile, setProfile] = useState(() => {
    try {
      const cached = localStorage.getItem('eshop_cached_profile');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      shopName: 'Electron manage',
      ownerName: 'Admin',
      currency: 'Rs.',
      printerType: 'thermal_80',
      lowStockThreshold: 2,
      lateFeeSettings: { enabled: false, type: 'fixed', amount: 500, graceDays: 10 }
    };
  });
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success && res.data.profile) {
        setProfile(res.data.profile);
        try {
          localStorage.setItem('eshop_cached_profile', JSON.stringify(res.data.profile));
        } catch (e) {}

        // Update browser document title and electron window title dynamically (Q11)
        if (res.data.profile.shopName) {
          document.title = `${res.data.profile.shopName} — Electronics & Installment Manager`;
          if (window.electronAPI && window.electronAPI.setWindowTitle) {
            window.electronAPI.setWindowTitle(res.data.profile.shopName);
          }
        }
      }
    } catch (err) {
      console.error('[Shop Profile Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <ShopContext.Provider value={{ profile, setProfile, refreshProfile: fetchProfile, loading }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
