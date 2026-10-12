import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Printer,
  Download,
  DollarSign,
  TrendingUp,
  Package,
  CreditCard,
  Layers
} from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';

export default function ReportsHub() {
  const { profile } = useShop();

  const [activeTab, setActiveTab] = useState('monthly'); // monthly | sales | collections | stock | profit
  const [loading, setLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selMonth, setSelMonth] = useState(new Date().getMonth());
  const [selYear, setSelYear] = useState(new Date().getFullYear());

  // Report Data
  const [salesData, setSalesData] = useState(null);
  const [collectionData, setCollectionData] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (activeTab === 'monthly') {
        const res = await api.get('/reports/monthly-summary', {
          params: { month: selMonth, year: selYear }
        });
        if (res.data.success) setMonthlyData(res.data);
      } else if (activeTab === 'sales') {
        const res = await api.get('/reports/sales', { params: { startDate, endDate } });
        if (res.data.success) setSalesData(res.data);
      } else if (activeTab === 'collections') {
        const res = await api.get('/reports/collections', { params: { startDate, endDate } });
        if (res.data.success) setCollectionData(res.data);
      } else if (activeTab === 'stock') {
        const res = await api.get('/reports/stock');
        if (res.data.success) setStockData(res.data);
      } else if (activeTab === 'profit') {
        const res = await api.get('/reports/profit', { params: { startDate, endDate } });
        if (res.data.success) setProfitData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, selMonth, selYear]);

  const handlePrint = () => {
    window.print();
  };

  const currency = profile?.currency || 'Rs.';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Business Reports & Analytics</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit-ready printable summaries for sales, collections, stock valuations and profits
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 shadow-sm transition"
        >
          <Printer className="w-4 h-4 text-indigo-400" />
          <span>Print Current Report</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 no-print">
        {[
          { id: 'monthly', label: 'Monthly Business Summary' },
          { id: 'sales', label: 'Sales Reports' },
          { id: 'collections', label: 'Collection Reports' },
          { id: 'profit', label: 'Profit Analysis' },
          { id: 'stock', label: 'Stock Valuation' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 text-xs font-semibold transition border-b-2 ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-4 text-black">
        <h2 className="text-xl font-bold uppercase">{profile?.shopName}</h2>
        <p className="text-xs">{profile?.address} • Phone: {profile?.phone}</p>
        <p className="text-sm font-semibold mt-2 underline uppercase">
          {activeTab === 'monthly' && 'MONTHLY EXECUTIVE BUSINESS SUMMARY'}
          {activeTab === 'sales' && 'SALES REPORT'}
          {activeTab === 'collections' && 'COLLECTIONS REPORT'}
          {activeTab === 'profit' && 'PROFIT ANALYSIS REPORT'}
          {activeTab === 'stock' && 'INVENTORY & STOCK VALUATION REPORT'}
        </p>
        <p className="text-[10px] text-neutral-600 mt-1">Generated: {new Date().toLocaleString('en-GB')}</p>
      </div>

      {/* TAB 1: MONTHLY BUSINESS SUMMARY */}
      {activeTab === 'monthly' && monthlyData && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex items-center justify-between no-print">
            <span className="text-xs font-semibold text-slate-300">Select Month & Year:</span>
            <div className="flex items-center space-x-2">
              <select
                value={selMonth}
                onChange={(e) => setSelMonth(parseInt(e.target.value, 10))}
                className="text-xs py-1 px-3"
              >
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>
              <select
                value={selYear}
                onChange={(e) => setSelYear(parseInt(e.target.value, 10))}
                className="text-xs py-1 px-3"
              >
                {[2026, 2027, 2028, 2029].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 border-slate-800">
              <span className="text-xs text-slate-400 block">Total Revenue</span>
              <p className="text-2xl font-bold font-mono text-white mt-1">
                {currency} {monthlyData.summary?.totalRevenue?.toLocaleString()}
              </p>
              <div className="text-[10px] text-slate-400 mt-2">
                Cash: {currency} {monthlyData.summary?.totalCashRevenue?.toLocaleString()} • Inst: {currency} {monthlyData.summary?.totalInstRevenue?.toLocaleString()}
              </div>
            </div>

            <div className="glass-panel p-5 border-slate-800">
              <span className="text-xs text-slate-400 block">Actual Collections</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {currency} {monthlyData.summary?.totalCollections?.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400 mt-2 block">
                {monthlyData.summary?.paymentsCount} collection transactions
              </span>
            </div>

            <div className="glass-panel p-5 border-slate-800">
              <span className="text-xs text-slate-400 block">Expected Profit Margin</span>
              <p className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                {currency} {monthlyData.summary?.expectedProfit?.toLocaleString()}
              </p>
            </div>

            <div className="glass-panel p-5 border-slate-800">
              <span className="text-xs text-slate-400 block">Commissions Paid (1%)</span>
              <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                {currency} {monthlyData.summary?.totalCommissionPaid?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES REPORT */}
      {activeTab === 'sales' && salesData && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-panel p-4 border-slate-800">
              <span className="text-xs text-slate-400">Total Sales</span>
              <p className="text-xl font-bold font-mono text-white mt-1">
                {currency} {salesData.summary?.totalRevenue?.toLocaleString()}
              </p>
            </div>
            <div className="glass-panel p-4 border-slate-800">
              <span className="text-xs text-slate-400">Cash Sales Volume</span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {currency} {salesData.summary?.totalCashRevenue?.toLocaleString()}
              </p>
            </div>
            <div className="glass-panel p-4 border-slate-800">
              <span className="text-xs text-slate-400">Installment Sales Volume</span>
              <p className="text-xl font-bold font-mono text-indigo-400 mt-1">
                {currency} {salesData.summary?.totalInstallmentRevenue?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROFIT ANALYSIS */}
      {activeTab === 'profit' && profitData && (
        <div className="glass-panel p-6 border-slate-800 space-y-4">
          <h3 className="font-display font-semibold text-white text-base">
            Detailed 3-Profit Matrix Breakdown (Q10)
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30">
              <span className="text-xs text-slate-400">Expected Profit</span>
              <p className="text-2xl font-bold font-mono text-white mt-1">
                {currency} {profitData.summary?.expectedProfit?.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Sum of (Sale Price - Cost) for ALL sales</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30">
              <span className="text-xs text-emerald-400">Realized Profit</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {currency} {profitData.summary?.realizedProfit?.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Cash sales + fully settled accounts</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30">
              <span className="text-xs text-amber-400">Pending Profit</span>
              <p className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {currency} {profitData.summary?.pendingProfit?.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Remaining profit locked in active plans</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STOCK VALUATION */}
      {activeTab === 'stock' && stockData && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-panel p-4 border-slate-800">
              <span className="text-xs text-slate-400">Total Physical Units</span>
              <p className="text-xl font-bold font-mono text-white mt-1">
                {stockData.summary?.totalStockUnits} units
              </p>
            </div>
            <div className="glass-panel p-4 border-slate-800">
              <span className="text-xs text-slate-400">Total Stock Purchase Valuation</span>
              <p className="text-xl font-bold font-mono text-cyan-400 mt-1">
                {currency} {stockData.summary?.totalStockValue?.toLocaleString()}
              </p>
            </div>
            <div className="glass-panel p-4 border-slate-800">
              <span className="text-xs text-slate-400">Low Stock Product Count</span>
              <p className="text-xl font-bold font-mono text-amber-400 mt-1">
                {stockData.summary?.lowStockCount} items
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
