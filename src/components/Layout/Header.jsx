import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ShoppingCart, CalendarClock, WifiOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';

export default function Header() {
  const { user } = useAuth();
  const { profile } = useShop();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
      {/* Left: Status & Offline indicator */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>100% Offline Secure Engine</span>
        </div>
        <div className="text-xs text-slate-400 font-mono hidden md:block">
          {currentTime.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}{' '}
          • {currentTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Right: Quick actions & Admin badge */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/sales/cash/new')}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm shadow-emerald-600/30 transition-all hover:scale-[1.02]"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>New Cash Sale</span>
        </button>

        <button
          onClick={() => navigate('/sales/installment/new')}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02]"
        >
          <CalendarClock className="w-3.5 h-3.5" />
          <span>New Installment</span>
        </button>

        <div className="h-6 w-px bg-slate-800 mx-1"></div>

        <div className="flex items-center space-x-2 pl-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-semibold text-xs">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-200">{user?.fullName || 'Administrator'}</p>
            <p className="text-[10px] text-slate-400">{profile?.city || 'Local Host'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
