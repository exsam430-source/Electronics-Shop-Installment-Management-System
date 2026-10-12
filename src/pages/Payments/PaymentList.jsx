import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, Search, Filter, DollarSign, Receipt as ReceiptIcon } from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';
import ReceiptModal from '../../components/Receipt/ReceiptModal';

export default function PaymentList() {
  const { profile } = useShop();

  const [payments, setPayments] = useState([]);
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [paymentType, setPaymentType] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (paymentType) params.paymentType = paymentType;
      if (paymentMethod) params.paymentMethod = paymentMethod;
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const [payRes, todayRes] = await Promise.all([
        api.get('/payments', { params }),
        api.get('/payments/today')
      ]);

      if (payRes.data.success) setPayments(payRes.data.data);
      if (todayRes.data.success) setTodayData(todayRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [paymentType, paymentMethod, startDate, endDate]);

  const handleViewReceipt = async (p) => {
    try {
      const res = await api.get(`/receipts/${p.receiptId?._id || p.receiptId}`);
      if (res.data.success) {
        setSelectedReceipt(res.data.data);
      }
    } catch (err) {
      alert('Could not retrieve receipt');
    }
  };

  const currency = profile?.currency || 'Rs.';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Payments & Collections Ledger</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Audited log of all cash, advance and installment collections received
        </p>
      </div>

      {/* Today's Collections Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 border-emerald-500/30 bg-slate-900/80">
          <span className="text-xs text-slate-400 font-medium block">Today's Total Collections</span>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {currency} {todayData?.totalToday?.toLocaleString() || '0'}
          </p>
          <span className="text-[10px] text-slate-500">{todayData?.count || 0} transactions today</span>
        </div>

        <div className="glass-panel p-4 border-slate-800">
          <span className="text-xs text-slate-400 font-medium block">Cash Received</span>
          <p className="text-xl font-bold font-mono text-white mt-1">
            {currency} {todayData?.byMethod?.cash?.toLocaleString() || '0'}
          </p>
        </div>

        <div className="glass-panel p-4 border-slate-800">
          <span className="text-xs text-slate-400 font-medium block">Bank Transfer</span>
          <p className="text-xl font-bold font-mono text-cyan-300 mt-1">
            {currency} {todayData?.byMethod?.bank_transfer?.toLocaleString() || '0'}
          </p>
        </div>

        <div className="glass-panel p-4 border-slate-800">
          <span className="text-xs text-slate-400 font-medium block">Mobile Wallets</span>
          <p className="text-xl font-bold font-mono text-indigo-300 mt-1">
            {currency} {todayData?.byMethod?.mobile_wallet?.toLocaleString() || '0'}
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="text-xs py-1.5 px-3"
          >
            <option value="">All Payment Types</option>
            <option value="cash_sale">Cash Sale Payments</option>
            <option value="advance_payment">Advance Payments</option>
            <option value="installment_payment">Monthly Installment Payments</option>
          </select>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="text-xs py-1.5 px-3"
          >
            <option value="">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="mobile_wallet">Mobile Wallet</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs py-1 px-2"
          />
          <span className="text-slate-500 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs py-1 px-2"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass-panel overflow-hidden border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Payment Purpose</th>
                <th className="py-3 px-4 text-center">Method</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500 font-sans">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-indigo-400">{p.paymentNumber}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      {new Date(p.paymentDate).toLocaleString('en-GB')}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-white">
                      {p.customerId?.customerName || 'Customer'}
                    </td>
                    <td className="py-3 px-4 font-sans capitalize text-slate-300">
                      {p.paymentType.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-center capitalize text-slate-400 font-sans">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400 text-sm">
                      +{currency} {p.amount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <button
                        onClick={() => handleViewReceipt(p)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-semibold rounded-lg"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onPrinted={() => {}}
        />
      )}
    </div>
  );
}
