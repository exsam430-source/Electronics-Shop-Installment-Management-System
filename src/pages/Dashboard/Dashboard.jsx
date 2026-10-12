import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  CalendarClock,
  CreditCard,
  AlertTriangle,
  DollarSign,
  Handshake,
  Printer,
  PlusCircle,
  Filter,
  ArrowUpRight,
  Sparkles,
  Layers
} from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';

export default function Dashboard() {
  const { profile } = useShop();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filter, setFilter] = useState('all'); // all, today, this_week, this_month, custom, month_year
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selMonth, setSelMonth] = useState(new Date().getMonth());
  const [selYear, setSelYear] = useState(new Date().getFullYear());

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = { filter };
      if (filter === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      } else if (filter === 'month_year') {
        params.month = selMonth;
        params.year = selYear;
      }

      const res = await api.get('/dashboard/stats', { params });
      if (res.data.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('[Dashboard fetch error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filter, selMonth, selYear]);

  const handleApplyCustomFilter = (e) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchStats();
    }
  };

  const handlePrintDashboard = () => {
    window.print();
  };

  const currency = profile?.currency || 'Rs.';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Date Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">
            Business Dashboard & Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time financial position for <span className="text-indigo-400 font-semibold">{profile?.shopName}</span>
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'today' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilter('this_week')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'this_week' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setFilter('this_month')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'this_month' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setFilter('custom')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'custom' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Custom
            </button>
          </div>

          {filter === 'custom' && (
            <form onSubmit={handleApplyCustomFilter} className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs py-1 px-2"
                required
              />
              <span className="text-slate-500 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs py-1 px-2"
                required
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
              >
                Apply
              </button>
            </form>
          )}

          <button
            onClick={handlePrintDashboard}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Summary</span>
          </button>
        </div>
      </div>

      {/* Quick Actions Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 no-print">
        <button
          onClick={() => navigate('/sales/cash/new')}
          className="flex items-center space-x-3 p-3.5 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white">New Cash Sale</p>
            <p className="text-[10px] text-slate-400">Instant counter checkout</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/sales/installment/new')}
          className="flex items-center space-x-3 p-3.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-xl transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white">New Installment</p>
            <p className="text-[10px] text-slate-400">3, 6, 9 or 12 mo plan</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/installments')}
          className="flex items-center space-x-3 p-3.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white">Record Payment</p>
            <p className="text-[10px] text-slate-400">Installment collection</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/products/new')}
          className="flex items-center space-x-3 p-3.5 bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-xl transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
            <Package className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white">Add Product</p>
            <p className="text-[10px] text-slate-400">Register new inventory</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/installments/overdue')}
          className="flex items-center space-x-3 p-3.5 bg-slate-900 border border-slate-800 hover:border-rose-500/40 rounded-xl transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-110 transition">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white">Overdue List</p>
            <p className="text-[10px] text-slate-400">Follow up & reminders</p>
          </div>
        </button>
      </div>

      {/* SECTION F: PROFIT TRIAD (Expected, Realized, Pending Profit - Q10) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="font-display font-bold text-lg text-white">
              Profit Analysis Triad
            </h2>
          </div>
          <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
            Calculated from verified transaction records
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Expected Profit */}
          <div className="glass-panel p-4 border-indigo-500/30 bg-slate-900/80">
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-slate-400">Expected Profit</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">All Sales</span>
            </div>
            <p className="text-2xl font-bold font-display text-white mt-2">
              {currency} {stats?.profit?.expectedProfit?.toLocaleString() || '0'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Total margin on all goods sold (cash + active installments)
            </p>
          </div>

          {/* Realized Profit */}
          <div className="glass-panel p-4 border-emerald-500/30 bg-slate-900/80">
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-emerald-400">Realized Profit</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Cash + Completed</span>
            </div>
            <p className="text-2xl font-bold font-display text-emerald-400 mt-2">
              {currency} {stats?.profit?.realizedProfit?.toLocaleString() || '0'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Profit from fully collected sales and completed plans
            </p>
          </div>

          {/* Pending Profit */}
          <div className="glass-panel p-4 border-amber-500/30 bg-slate-900/80">
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-amber-400">Pending Profit</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">Active Plans</span>
            </div>
            <p className="text-2xl font-bold font-display text-amber-400 mt-2">
              {currency} {stats?.profit?.pendingProfit?.toLocaleString() || '0'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Expected minus Realized (locked in running installments)
            </p>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid: Sales, Collections, Outstanding, Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="glass-panel p-5 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Sales Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display text-white mt-3">
            {currency} {stats?.sales?.totalSales?.toLocaleString() || '0'}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
            <span>Cash: {currency} {stats?.sales?.cashSalesAmount?.toLocaleString() || '0'}</span>
            <span>Inst: {currency} {stats?.sales?.installmentSalesAmount?.toLocaleString() || '0'}</span>
          </div>
        </div>

        {/* Collections */}
        <div className="glass-panel p-5 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Collections</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display text-emerald-400 mt-3">
            {currency} {stats?.collections?.filteredCollections?.toLocaleString() || '0'}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
            <span>Today: {currency} {stats?.collections?.todayCollections?.toLocaleString() || '0'}</span>
            <span>Month: {currency} {stats?.collections?.monthlyCollections?.toLocaleString() || '0'}</span>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="glass-panel p-5 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Outstanding Receivable</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display text-rose-400 mt-3">
            {currency} {stats?.outstanding?.totalOutstandingBalance?.toLocaleString() || '0'}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
            <span>Month Due: {currency} {stats?.outstanding?.monthlyInstallmentsDue?.toLocaleString() || '0'}</span>
            <span className="text-rose-400 font-semibold">Overdue: {currency} {stats?.outstanding?.overdueInstallmentAmount?.toLocaleString() || '0'}</span>
          </div>
        </div>

        {/* Inventory Stock */}
        <div className="glass-panel p-5 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Stock & Inventory</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display text-white mt-3">
            {stats?.inventory?.availableStock || 0}{' '}
            <span className="text-xs text-slate-400 font-normal">available units</span>
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
            <span>{stats?.inventory?.totalProducts || 0} product types</span>
            {stats?.inventory?.lowStockItems > 0 ? (
              <span className="text-amber-400 font-bold">{stats.inventory.lowStockItems} Low Stock!</span>
            ) : (
              <span className="text-emerald-400">Stock Healthy</span>
            )}
          </div>
        </div>
      </div>

      {/* Installment Accounts & Referral Commissions Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section C: Installment Account Status */}
        <div className="glass-panel p-6 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white text-base">
              Installment Accounts Portfolio
            </h3>
            <span className="text-xs text-indigo-400">
              {stats?.installments?.totalInstallmentAccounts || 0} Total Plans
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-center">
              <p className="text-xs text-slate-400 font-medium">Active Plans</p>
              <p className="text-xl font-bold text-indigo-400 mt-1">
                {stats?.installments?.activeInstallmentAccounts || 0}
              </p>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-center">
              <p className="text-xs text-slate-400 font-medium">Overdue Plans</p>
              <p className="text-xl font-bold text-rose-400 mt-1">
                {stats?.installments?.overdueAccounts || 0}
              </p>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-center">
              <p className="text-xs text-slate-400 font-medium">Completed</p>
              <p className="text-xl font-bold text-cyan-400 mt-1">
                {stats?.installments?.completedAccounts || 0}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Pending Installment Entries:</span>
            <span className="font-mono font-semibold text-slate-200">
              {stats?.outstanding?.pendingInstallmentsCount || 0} scheduled
            </span>
          </div>
        </div>

        {/* Section G: Referral Partner Commissions */}
        <div className="glass-panel p-6 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Handshake className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display font-semibold text-white text-base">
                Referral Partner Commissions (1%)
              </h3>
            </div>
            <button
              onClick={() => navigate('/referral-partners')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              View Partners →
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-center">
              <p className="text-xs text-slate-400 font-medium">Total Earned</p>
              <p className="text-lg font-bold text-white mt-1">
                {currency} {stats?.commissions?.totalCommissionEarned?.toLocaleString() || '0'}
              </p>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-center">
              <p className="text-xs text-slate-400 font-medium">Total Paid</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">
                {currency} {stats?.commissions?.totalCommissionPaid?.toLocaleString() || '0'}
              </p>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-center">
              <p className="text-xs text-slate-400 font-medium">Payable Balance</p>
              <p className="text-lg font-bold text-amber-400 mt-1">
                {currency} {stats?.commissions?.remainingCommissionPayable?.toLocaleString() || '0'}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Current Month Partner Earnings:</span>
            <span className="font-mono font-semibold text-indigo-400">
              {currency} {stats?.commissions?.monthlyCommissionEarned?.toLocaleString() || '0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
