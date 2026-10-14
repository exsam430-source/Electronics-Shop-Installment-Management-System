import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, KeyRound, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';

export default function Login() {
  const { login } = useAuth();
  const { profile } = useShop();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password Recovery Mode
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverData, setRecoverData] = useState({
    username: 'admin',
    securityAnswer: '',
    newPassword: ''
  });
  const [recoverSuccess, setRecoverSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRecoverSuccess('');

    try {
      const res = await api.post('/auth/recover-password', recoverData);
      if (res.data.success) {
        setRecoverSuccess('Password reset successfully! Please login with your new password.');
        setIsRecovering(false);
        setPassword(recoverData.newPassword);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password recovery failed. Check security answer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background Decorative Blur */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-600/15 to-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white shadow-lg shadow-indigo-500/25 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">
            {profile?.shopName || 'MR SOLVER ELECTRONICS'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">
            Electronics Shop & Installment Management System
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {recoverSuccess && (
          <div className="mb-5 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{recoverSuccess}</span>
          </div>
        )}

        {!isRecovering ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="admin"
                  className="w-full pl-10 text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsRecovering(true)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 transition"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 text-sm font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01]"
            >
              {loading ? 'Authenticating...' : 'Sign In to Shop Manager'}
            </button>

            {/* Default Administrator Quick Access Helper */}
            <div className="mt-3 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Default Admin Login:</span>
                <span className="font-mono text-emerald-400 font-medium">admin</span> / <span className="font-mono text-emerald-400 font-medium">admin123</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('admin123');
                }}
                className="px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-medium transition"
              >
                Auto-fill
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRecover} className="space-y-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
              Answer the security question you set during initial installation to reset your admin password.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
              <input
                type="text"
                value={recoverData.username}
                onChange={(e) => setRecoverData({ ...recoverData, username: e.target.value })}
                required
                className="w-full text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Security Question Answer</label>
              <input
                type="text"
                value={recoverData.securityAnswer}
                onChange={(e) => setRecoverData({ ...recoverData, securityAnswer: e.target.value })}
                required
                placeholder="Enter your security answer"
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                value={recoverData.newPassword}
                onChange={(e) => setRecoverData({ ...recoverData, newPassword: e.target.value })}
                required
                placeholder="New password (min 4 chars)"
                className="w-full text-sm font-mono"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRecovering(false)}
                className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            Offline Single-User Administration • Local System Storage
          </p>
        </div>
      </div>
    </div>
  );
}
