import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Handshake,
  ShoppingCart,
  CalendarClock,
  CreditCard,
  Receipt,
  RotateCcw,
  BarChart3,
  Settings,
  LogOut,
  Layers,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';

export default function Sidebar() {
  const { logout } = useAuth();
  const { profile } = useShop();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products & Stock', path: '/products', icon: Package },
    { name: 'Categories', path: '/categories', icon: Layers },
    { name: 'Suppliers & Purchases', path: '/suppliers', icon: Truck },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Referral Partners', path: '/referral-partners', icon: Handshake },
    { name: 'Cash Sales', path: '/sales/cash', icon: ShoppingCart },
    { name: 'Installment Sales', path: '/sales/installment', icon: CalendarClock },
    { name: 'Installment Accounts', path: '/installments', icon: CreditCard },
    { name: 'Overdue Installments', path: '/installments/overdue', icon: AlertCircle, badgeColor: 'text-rose-400' },
    { name: 'Payments Ledger', path: '/payments', icon: CreditCard },
    { name: 'Receipts & Reprint', path: '/receipts', icon: Receipt },
    { name: 'Returns & Warranty', path: '/returns', icon: RotateCcw },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    { name: 'System Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-xl tracking-wider overflow-hidden shrink-0">
          {profile?.logo ? (
            <img src={profile.logo} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          )}
        </div>
        <div className="overflow-hidden">
          <h1 className="font-display font-bold text-base text-white truncate" title={profile?.shopName}>
            {profile?.shopName || 'MR SOLVER'}
          </h1>
          <p className="text-xs text-indigo-400 font-medium tracking-wide">
            Electronics & Installments
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 text-indigo-400" />
                <span>{item.name}</span>
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* Footer & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors border border-rose-500/20"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit / Logout</span>
        </button>
      </div>
    </aside>
  );
}
