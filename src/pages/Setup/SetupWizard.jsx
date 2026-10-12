import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Shield, Store, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';

export default function SetupWizard() {
  const { login } = useAuth();
  const { refreshProfile } = useShop();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    username: 'admin',
    password: '',
    confirmPassword: '',
    securityQuestion: 'What is your primary shop location?',
    securityAnswer: '',
    shopName: 'MR SOLVER ELECTRONICS & APPLIANCES',
    ownerName: '',
    phone: '+92 300 1234567',
    address: 'Main Commercial Market',
    city: 'Lahore'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.username || !formData.password) {
        setError('Please fill in all administrator credentials.');
        return;
      }
      if (formData.password.length < 4) {
        setError('Password must be at least 4 characters.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.shopName) {
      setError('Shop name is required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/setup', formData);
      if (res.data.success) {
        login(res.data.token, res.data.user);
        await refreshProfile();
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Setup initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white shadow-lg shadow-indigo-500/25 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">
            Initial System Setup Wizard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            MR SOLVER Electronics Shop & Installment Management System
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className={`flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-full ${
            step === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            <span>1</span>
            <span>Admin Account</span>
          </div>
          <div className="w-6 h-px bg-slate-800"></div>
          <div className={`flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-full ${
            step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            <span>2</span>
            <span>Business Profile</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Administrator Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="e.g. Muhammad Ahmad"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username (for daily login)</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Security Question (for recovery)</label>
                <input
                  type="text"
                  name="securityQuestion"
                  value={formData.securityQuestion}
                  onChange={handleChange}
                  className="w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Security Answer</label>
                <input
                  type="text"
                  name="securityAnswer"
                  placeholder="Secret answer for password recovery"
                  value={formData.securityAnswer}
                  onChange={handleChange}
                  required
                  className="w-full text-sm"
                />
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-indigo-600/30"
                >
                  <span>Continue to Shop Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Shop / Business Name</label>
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  required
                  className="w-full text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Name</label>
                  <input
                    type="text"
                    name="ownerName"
                    placeholder="Owner Full Name"
                    value={formData.ownerName || formData.fullName}
                    onChange={handleChange}
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Shop City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Shop Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone / Mobile (Printed on Receipts)</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full text-sm"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-emerald-600/30"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{loading ? 'Initializing Database...' : 'Complete Setup & Launch'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
