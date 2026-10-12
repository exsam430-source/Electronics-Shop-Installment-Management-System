import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  ArrowLeft,
  User,
  CreditCard,
  DollarSign,
  Receipt as ReceiptIcon,
  CheckCircle,
  AlertTriangle,
  Clock,
  X
} from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';
import ReceiptModal from '../../components/Receipt/ReceiptModal';

export default function InstallmentAccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useShop();

  const [account, setAccount] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pay single installment modal
  const [payModalSchedule, setPayModalSchedule] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [applyLateFee, setApplyLateFee] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState(null);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/sales/installment/${id}`);
      if (res.data.success) {
        setAccount(res.data.data);
        setSchedule(res.data.schedule || []);
        setPayments(res.data.payments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleOpenPay = (sched) => {
    setPayModalSchedule(sched);
    setPayAmount(sched.remainingAmount?.toString() || '');
    setApplyLateFee(false);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payModalSchedule || !payAmount) return;

    setPayLoading(true);
    try {
      const res = await api.post('/installments/record', {
        installmentSaleId: account._id,
        scheduleId: payModalSchedule._id,
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        applyLateFee
      });

      if (res.data.success) {
        setCreatedReceipt(res.data.receipt);
        setPayModalSchedule(null);
        fetchDetail();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed');
    } finally {
      setPayLoading(false);
    }
  };

  const currency = profile?.currency || 'Rs.';

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading installment schedule...</div>;
  }

  if (!account) {
    return <div className="p-8 text-center text-rose-400 text-sm">Account not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/installments')}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-display font-bold text-2xl text-white">
                Account Schedule: {account.saleNumber}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                  account.accountStatus === 'completed'
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : account.accountStatus === 'overdue'
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                }`}
              >
                {account.accountStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Customer: <span className="text-white font-semibold">{account.customerId?.customerName}</span> ({account.customerId?.customerId}) • {account.customerId?.mobileNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Matrix */}
      <div className="glass-panel p-5 border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="text-xs text-slate-400 block">Total Plan Price</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">
            {currency} {account.totalSaleAmount?.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block">Total Amount Paid</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            {currency} {account.totalAmountPaid?.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block">Remaining Balance</span>
          <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
            {currency} {account.totalRemainingBalance?.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block">Monthly Rate</span>
          <span className="text-xl font-bold font-mono text-cyan-300 mt-1 block">
            {currency} {account.monthlyInstallmentAmount?.toLocaleString()} / mo
          </span>
        </div>
      </div>

      {/* Financed Appliances List */}
      <div className="glass-panel p-5 border-slate-800">
        <h3 className="font-display font-semibold text-white text-sm mb-3">
          Financed Electronic Products
        </h3>
        <div className="divide-y divide-slate-800/80">
          {account.items?.map((it, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-white">{it.productName}</span>
                {it.brand && <span className="text-slate-400 ml-1.5">({it.brand})</span>}
                {it.serialNumber && (
                  <span className="text-cyan-400 font-mono ml-2">S/N: {it.serialNumber}</span>
                )}
              </div>
              <div className="font-mono text-slate-300">
                {it.quantity} unit(s) • {currency} {it.unitPrice?.toLocaleString()} each
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Installment Schedule Table */}
      <div className="glass-panel overflow-hidden border-slate-800">
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center">
          <h3 className="font-display font-semibold text-white text-sm">
            Monthly Installment Breakdown ({schedule.length} Months)
          </h3>
          <span className="text-xs text-indigo-400 font-mono">
            {schedule.filter((s) => s.paymentStatus === 'paid').length} of {schedule.length} Paid
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Inst #</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Scheduled Amount</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Remaining</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {schedule.map((sched) => (
                <tr key={sched._id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-bold text-slate-300">
                    Month #{sched.installmentNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {new Date(sched.dueDate).toLocaleDateString('en-GB')}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-white">
                    {currency} {sched.installmentAmount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400">
                    {currency} {sched.amountPaid?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-rose-400">
                    {currency} {sched.remainingAmount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        sched.paymentStatus === 'paid'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : sched.paymentStatus === 'partial'
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                          : new Date(sched.dueDate) < new Date()
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {sched.paymentStatus === 'paid'
                        ? 'Paid'
                        : sched.paymentStatus === 'partial'
                        ? 'Partial'
                        : new Date(sched.dueDate) < new Date()
                        ? 'Overdue'
                        : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {sched.paymentStatus !== 'paid' ? (
                      <button
                        onClick={() => handleOpenPay(sched)}
                        className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/30 transition"
                      >
                        Pay
                      </button>
                    ) : sched.receiptId ? (
                      <button
                        onClick={() => setCreatedReceipt(sched.receiptId)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-semibold rounded-lg"
                      >
                        Receipt
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[11px]">✓ Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Schedule Modal */}
      {payModalSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-display font-semibold text-white text-base">
                  Record Installment #{payModalSchedule.installmentNumber} Payment
                </h3>
                <p className="text-xs text-slate-400">
                  Due: {new Date(payModalSchedule.dueDate).toLocaleDateString('en-GB')}
                </p>
              </div>
              <button onClick={() => setPayModalSchedule(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-3">
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
                  <option value="mobile_wallet">Mobile Wallet</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalSchedule(null)}
                  className="w-1/3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/30"
                >
                  {payLoading ? 'Saving...' : 'Confirm Payment'}
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
