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
  Users,
  Clock,
  ArrowRight,
  Receipt as ReceiptIcon
} from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';
import ReceiptModal from '../../components/Receipt/ReceiptModal';

export default function ActiveAccounts() {
  const { profile } = useShop();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'overdue', 'completed', 'customers'

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
      const params = { search };
      if (statusFilter !== 'all' && statusFilter !== 'customers') {
        params.status = statusFilter;
      }
      const [accRes, custRes] = await Promise.all([
        api.get('/installments/accounts', { params }),
        api.get('/customers', { params: { search } })
      ]);

      if (accRes.data.success) {
        setAccounts(accRes.data.data);
      }
      if (custRes.data.success) {
        setCustomers(custRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [search, statusFilter]);

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

  const filteredCustomers = customers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.customerName?.toLowerCase().includes(s) ||
      c.customerId?.toLowerCase().includes(s) ||
      c.mobileNumber?.includes(s) ||
      c.cnic?.includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Installment Management System</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active customer financing plans, schedule tracking, and instant installment sales
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/customers/new')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>+ Add Customer</span>
          </button>
          <button
            onClick={() => navigate('/sales/installment/new')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Installment Sale</span>
          </button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-3">
        {[
          { id: 'all', label: 'All Installment Accounts', count: accounts.length },
          { id: 'active', label: 'Active', count: accounts.filter(a => a.accountStatus === 'active').length },
          { id: 'overdue', label: 'Overdue', count: accounts.filter(a => a.accountStatus === 'overdue').length },
          { id: 'completed', label: 'Completed', count: accounts.filter(a => a.accountStatus === 'completed').length },
          { id: 'customers', label: 'All Active Customers', count: customers.length, icon: Users }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
              statusFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              statusFilter === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Toolbar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shadow-md">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={statusFilter === 'customers' ? "Search customer by name, ID, CNIC or mobile..." : "Search by sale #, customer name, ID, or mobile..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 text-xs font-sans"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {statusFilter === 'customers' ? `${filteredCustomers.length} Customers` : `${accounts.length} Accounts`}
        </span>
      </div>

      {/* Content Rendering: Accounts or Customers */}
      {statusFilter === 'customers' ? (
        /* Customers Directory View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-3 text-center py-12 glass-panel text-slate-500 text-xs">
              No registered customers found matching criteria.
            </div>
          ) : (
            filteredCustomers.map(cust => (
              <div key={cust._id} className="glass-panel p-5 border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      {cust.customerId}
                    </span>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/20">
                      Active Customer
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-white text-base">
                    {cust.customerName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Phone: {cust.mobileNumber} {cust.cnic ? `• CNIC: ${cust.cnic}` : ''}
                  </p>
                  {cust.address && (
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      {cust.address}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Total Purchases:</span>
                      <span className="font-bold text-slate-200">
                        {currency} {cust.totalPurchases?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Outstanding:</span>
                      <span className="font-bold text-rose-400">
                        {currency} {cust.outstandingBalance?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/customers`)}
                    className="text-xs text-slate-400 hover:text-white transition flex items-center space-x-1"
                  >
                    <span>View Profile</span>
                  </button>

                  <button
                    onClick={() => navigate(`/sales/installment/new?customerId=${cust._id}`)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                  >
                    <span>+ Start Installment Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Accounts Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.length === 0 ? (
            <div className="col-span-3 text-center py-12 glass-panel text-slate-500 text-xs space-y-3">
              <p>No installment accounts found matching criteria.</p>
              {customers.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setStatusFilter('customers')}
                    className="px-4 py-2 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 rounded-xl text-xs font-semibold border border-indigo-500/30 transition"
                  >
                    View {customers.length} Registered Customers & Start Installment Plan →
                  </button>
                </div>
              )}
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
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${
                          acc.accountStatus === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : acc.accountStatus === 'overdue'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20'
                        }`}>
                          {acc.accountStatus}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                          {acc.installmentDuration} Mo
                        </span>
                      </div>
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

                    {acc.accountStatus !== 'completed' && (
                      <button
                        onClick={() => handleOpenPay(acc)}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/30 transition"
                      >
                        Record Payment
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

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
                  <span className="text-slate-500 block text-[10px]">Total Balance:</span>
                  <span className="font-bold text-rose-400">
                    {currency} {payModalAccount.totalRemainingBalance?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Amount Received ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max={payModalAccount.totalRemainingBalance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                  className="w-full text-base font-bold font-mono text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full text-xs"
                >
                  <option value="cash">Cash Counter</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_wallet">Mobile Wallet (JazzCash / EasyPaisa)</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="lateFeeCheck"
                  checked={applyLateFee}
                  onChange={(e) => setApplyLateFee(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="lateFeeCheck" className="text-xs text-slate-300">
                  Apply late fee rule (if overdue past grace period)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Optional payment notes..."
                  className="w-full text-xs"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPayModalAccount(null)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 transition"
                >
                  {payLoading ? 'Recording...' : 'Confirm & Print Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Receipt Modal */}
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
