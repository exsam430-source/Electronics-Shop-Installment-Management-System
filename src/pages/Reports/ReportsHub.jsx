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
import { generateReportHtml, printHtmlDocument, saveHtmlToPdf } from '../../services/printService';

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

  const getActiveReportMeta = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    let data = null;
    if (activeTab === 'monthly') data = monthlyData;
    else if (activeTab === 'sales') data = salesData;
    else if (activeTab === 'collections') data = collectionData;
    else if (activeTab === 'profit') data = profitData;
    else if (activeTab === 'stock') data = stockData;

    return {
      data,
      meta: {
        monthName: monthNames[selMonth],
        year: selYear,
        startDate,
        endDate
      }
    };
  };

  const handlePrint = async () => {
    const { data, meta } = getActiveReportMeta();
    if (!data) return;
    const fullHtml = generateReportHtml(activeTab, data, profile, meta);
    await printHtmlDocument(fullHtml, { pageSize: 'A4' });
  };

  const handleSavePdf = async () => {
    const { data, meta } = getActiveReportMeta();
    if (!data) return;
    const fullHtml = generateReportHtml(activeTab, data, profile, meta);
    await saveHtmlToPdf(fullHtml, {
      filename: `Audit_Report_${activeTab.toUpperCase()}_${Date.now()}.pdf`,
      pageSize: 'A4'
    });
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

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSavePdf}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-semibold border border-cyan-500/30 shadow-sm transition hover:scale-[1.02]"
            title="Download audit-ready report as PDF"
          >
            <Download className="w-4 h-4" />
            <span>Save PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition hover:scale-[1.02]"
            title="Print current report"
          >
            <Printer className="w-4 h-4" />
            <span>Print Current Report</span>
          </button>
        </div>
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

          {/* Sales Tables Preview */}
          {salesData.cashSales && salesData.cashSales.length > 0 && (
            <div className="glass-panel overflow-hidden border-slate-800">
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 font-semibold text-xs text-white">
                Cash Sales List ({salesData.cashSales.length} Invoices)
              </div>
              <div className="overflow-x-auto max-h-[320px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Invoice #</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4 text-right">Total Amount</th>
                      <th className="py-2.5 px-4 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {salesData.cashSales.slice(0, 20).map((cs) => (
                      <tr key={cs._id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-mono font-bold text-indigo-400">{cs.invoiceNumber}</td>
                        <td className="py-2.5 px-4 text-slate-300">{new Date(cs.saleDate).toLocaleDateString('en-GB')}</td>
                        <td className="py-2.5 px-4 text-white font-medium">{cs.customerId?.customerName || cs.customerName || 'Walk-in'}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-white">{currency} {cs.totalAmount?.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">{currency} {cs.profit?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {salesData.installmentSales && salesData.installmentSales.length > 0 && (
            <div className="glass-panel overflow-hidden border-slate-800">
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 font-semibold text-xs text-white">
                Installment Sales List ({salesData.installmentSales.length} Contracts)
              </div>
              <div className="overflow-x-auto max-h-[320px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Sale #</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4 text-center">Plan</th>
                      <th className="py-2.5 px-4 text-right">Total Amount</th>
                      <th className="py-2.5 px-4 text-right">Advance Paid</th>
                      <th className="py-2.5 px-4 text-right">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {salesData.installmentSales.slice(0, 20).map((is) => (
                      <tr key={is._id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-mono font-bold text-indigo-400">{is.saleNumber}</td>
                        <td className="py-2.5 px-4 text-slate-300">{new Date(is.saleDate).toLocaleDateString('en-GB')}</td>
                        <td className="py-2.5 px-4 text-white font-medium">{is.customerId?.customerName || 'Customer'}</td>
                        <td className="py-2.5 px-4 text-center text-slate-300">{is.installmentDuration} Mo</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-white">{currency} {is.totalSaleAmount?.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">{currency} {is.advancePayment?.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-400">{currency} {is.totalRemainingBalance?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COLLECTIONS REPORT */}
      {activeTab === 'collections' && collectionData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 border-slate-800">
              <span className="text-xs text-slate-400">Total Collections Recovered</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {currency} {collectionData.totalCollected?.toLocaleString()}
              </p>
            </div>
            <div className="glass-panel p-4 border-slate-800">
              <span className="text-xs text-slate-400">Transaction Receipts</span>
              <p className="text-2xl font-bold font-mono text-white mt-1">
                {collectionData.count || collectionData.payments?.length || 0} collections
              </p>
            </div>
          </div>

          {collectionData.payments && collectionData.payments.length > 0 && (
            <div className="glass-panel overflow-hidden border-slate-800">
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 font-semibold text-xs text-white">
                Recovered Installment Payments List
              </div>
              <div className="overflow-x-auto max-h-[360px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Payment #</th>
                      <th className="py-2.5 px-4">Receipt #</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4">Mode</th>
                      <th className="py-2.5 px-4 text-right">Amount Recovered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {collectionData.payments.slice(0, 25).map((p) => (
                      <tr key={p._id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-mono font-bold text-indigo-400">{p.paymentNumber}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-400">{p.receiptId?.receiptNumber || '—'}</td>
                        <td className="py-2.5 px-4 text-slate-300">{new Date(p.paymentDate).toLocaleDateString('en-GB')}</td>
                        <td className="py-2.5 px-4 text-white font-medium">{p.customerId?.customerName || 'Customer'}</td>
                        <td className="py-2.5 px-4 capitalize text-slate-400">{p.paymentMethod || 'cash'}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                          {currency} {p.amount?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROFIT ANALYSIS */}
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

      {/* TAB 5: STOCK VALUATION */}
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

          {stockData.products && stockData.products.length > 0 && (
            <div className="glass-panel overflow-hidden border-slate-800">
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 font-semibold text-xs text-white">
                Physical Inventory Products List ({stockData.products.length} Products)
              </div>
              <div className="overflow-x-auto max-h-[380px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Code</th>
                      <th className="py-2.5 px-4">Product Name</th>
                      <th className="py-2.5 px-4">Brand</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4 text-center">Stock</th>
                      <th className="py-2.5 px-4 text-right">Purchase Price</th>
                      <th className="py-2.5 px-4 text-right">Total Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {stockData.products.slice(0, 25).map((p) => (
                      <tr key={p._id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-mono font-bold text-indigo-400">{p.productCode}</td>
                        <td className="py-2.5 px-4 text-white font-medium">{p.productName}</td>
                        <td className="py-2.5 px-4 text-slate-300">{p.brand}</td>
                        <td className="py-2.5 px-4 text-slate-400">{p.categoryId?.categoryName || 'General'}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-white">{p.stockQuantity}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-300">{currency} {p.purchasePrice?.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-cyan-400">
                          {currency} {(p.stockQuantity * p.purchasePrice)?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
