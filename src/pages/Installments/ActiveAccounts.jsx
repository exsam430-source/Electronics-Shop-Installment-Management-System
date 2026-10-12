import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  Eye,
  DollarSign,
  X,
  CheckCircle,
  Receipt as ReceiptIcon
} from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';
import ReceiptModal from '../../components/Receipt/ReceiptModal';

export default function ActiveAccounts() {
  const { profile } = useShop();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Quick Pay Modal
  const [payModalAccount, setPayModalAccount] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [applyLateFee, setApplyLateFee] = useState(false);
  const [payNotes, setPayNotes] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/installments/accounts', {
        params: { status: 'active', search }
      });
      if (res.data.success) {
        setAccounts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [search]);

  const handleOpenPay = (acc) => {
    setPayModalAccount(acc);
    setPayAmount(acc.monthlyInstallmentAmount?.toString() || '');
    setApplyLateFee(false);
    setPayNotes('');
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payModalAccount || !payAmount) return;

    setPayLoading(true);
    try {
      const res = await api.post('/installments/record', {
        installmentSaleId: payModalAccount._id,
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        applyLateFee,
        notes: payNotes
      });

      if (res.data.success) {
        setCreatedReceipt(res.data.receipt);
        setPayModalAccount(null);
        fetchAccounts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed');
    } finally {
      setPayLoading(false);
    }
  };

  const currency = profile?.currency || 'Rs.';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Active Installment Accounts</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Running financing plans with real-time balance tracking and payment recording
          </p>
        </div>

        <button
          onClick={() => navigate('/sales/installment/new')}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Installment Plan</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shadow-md">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by sale #, customer name, ID, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 text-xs font-sans"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {accounts.length} Active Accounts
        </span>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.length === 0 ? (
          <div className="col-span-3 text-center py-12 glass-panel text-slate-500 text-xs">
            No active installment accounts matching criteria.
          </div>
        ) : (
          accounts.map((acc) => {
            const paidPct = Math.min(
              100,
              Math.round(((acc.totalAmountPaid || 0) / (acc.totalSaleAmount || 1)) * 100)
            );

            return (
              <div key={acc._id} className="glass-panel p-5 border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      {acc.saleNumber}
                    </span>
                    <span className="text-[10px] bg-indigo-500/15 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-500/20">
                      {acc.installmentDuration} Months Plan
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-white text-base">
                    {acc.customerId?.customerName || 'Customer'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {acc.customerId?.customerId} • {acc.customerId?.mobileNumber}
                  </p>

                  <p className="text-xs text-slate-300 font-medium mt-2.5 truncate">
                    {acc.items?.map((it) => it.productName).join(', ')}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Paid: {currency} {acc.totalAmountPaid?.toLocaleString()}</span>
                      <span className="text-indigo-400 font-semibold">{paidPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${paidPct}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Monthly Due:</span>
                      <span className="font-bold text-cyan-300">
                        {currency} {acc.monthlyInstallmentAmount?.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Remaining:</span>
                      <span className="font-bold text-rose-400">
                        {currency} {acc.totalRemainingBalance?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/installments/${acc._id}`)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Schedule</span>
                  </button>

                  <button
                    onClick={() => handleOpenPay(acc)}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/30 transition"
                  >
                    Record Payment
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Payment Modal */}
      {payModalAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-display font-semibold text-white text-base">
                  Record Installment Payment
                </h3>
                <p className="text-xs text-slate-400">
                  {payModalAccount.customerId?.customerName} ({payModalAccount.saleNumber})
                </p>
              </div>
              <button onClick={() => setPayModalAccount(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Monthly Scheduled:</span>
                  <span className="font-bold text-cyan-300">
                    {currency} {payModalAccount.monthlyInstallmentAmount?.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Remaining Balance:</span>
                  <span className="font-bold text-rose-400">
                    {currency} {payModalAccount.totalRemainingBalance?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Amount Received ({currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full text-base font-mono font-bold text-emerald-400"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Supports partial amounts or multi-installment excess rollover
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full text-xs"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_wallet">Mobile Wallet (EasyPaisa/JazzCash)</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              {profile?.lateFeeSettings?.enabled && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="lateFeeCheck"
                    checked={applyLateFee}
                    onChange={(e) => setApplyLateFee(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="lateFeeCheck" className="text-xs text-rose-300 cursor-pointer">
                    Apply configured late fee penalty (Q9) if overdue
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Month 3 installment payment"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalAccount(null)}
                  className="w-1/3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/30"
                >
                  {payLoading ? 'Saving...' : 'Confirm & Print Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {createdReceipt && (
        <ReceiptModal
          receipt={createdReceipt}
          onClose={() => setCreatedReceipt(null)}
          onPrinted={() => {}}
        />
      )}
    </div>
  );
}
