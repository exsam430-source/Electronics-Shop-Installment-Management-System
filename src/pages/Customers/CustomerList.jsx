import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Phone,
  MessageSquare,
  CreditCard,
  Eye,
  X,
  History,
  AlertCircle,
  User,
  Pencil
} from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';
import WhatsAppModal from '../../components/WhatsApp/WhatsAppModal';

export default function CustomerList() {
  const { profile } = useShop();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hasBalanceOnly, setHasBalanceOnly] = useState(false);

  // Customer Detail Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // WhatsApp Modal
  const [whatsAppCustomer, setWhatsAppCustomer] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (hasBalanceOnly) params.hasBalance = 'true';

      const res = await api.get('/customers', { params });
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, hasBalanceOnly]);

  const handleViewCustomer = async (cust) => {
    setSelectedCustomer(cust);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/customers/${cust._id}`);
      if (res.data.success) {
        setCustomerHistory(res.data.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const currency = profile?.currency || 'Rs.';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Customer Accounts Directory</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Customer registration, contact synchronizations and installment balances
          </p>
        </div>

        <button
          onClick={() => navigate('/customers/new')}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Customer</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, customer ID, mobile, or CNIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 text-xs font-sans"
            />
          </div>
        </div>

        <button
          onClick={() => setHasBalanceOnly(!hasBalanceOnly)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
            hasBalanceOnly
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Outstanding Balance Only</span>
        </button>
      </div>

      {/* Customers Table */}
      <div className="glass-panel overflow-hidden border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Mobile / WhatsApp</th>
                <th className="py-3 px-4">Referral Partner</th>
                <th className="py-3 px-4 text-right">Total Purchases</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Outstanding Balance</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">
                    No customer accounts found.
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                      {cust.customerId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      <div className="flex items-center space-x-2.5">
                        {cust.customerPhoto ? (
                          <img
                            src={cust.customerPhoto}
                            alt={cust.customerName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <span className="truncate max-w-[180px]">{cust.customerName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      <div>{cust.mobileNumber}</div>
                      {cust.whatsappNumber && cust.whatsappNumber !== cust.mobileNumber && (
                        <div className="text-[10px] text-emerald-400">WA: {cust.whatsappNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {cust.referralPartnerId?.partnerName || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {currency} {cust.totalPurchases?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                      {currency} {cust.totalPaid?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                      {cust.outstandingBalance > 0
                        ? `${currency} ${cust.outstandingBalance.toLocaleString()}`
                        : '0'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setWhatsAppCustomer(cust)}
                          title="Send WhatsApp Notice"
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg transition"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/customers/edit/${cust._id}`)}
                          title="Edit Customer & Photo"
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewCustomer(cust)}
                          title="View Ledger & History"
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Full Profile & History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                {selectedCustomer.customerPhoto ? (
                  <img
                    src={selectedCustomer.customerPhoto}
                    alt={selectedCustomer.customerName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="font-display font-semibold text-white text-base flex items-center gap-2">
                    <span>{selectedCustomer.customerName}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {selectedCustomer.customerId}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mobile: {selectedCustomer.mobileNumber} {selectedCustomer.whatsappNumber && `• WhatsApp: ${selectedCustomer.whatsappNumber}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const id = selectedCustomer._id;
                    setSelectedCustomer(null);
                    navigate(`/customers/edit/${id}`);
                  }}
                  title="Edit Customer Profile & Photo"
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs flex items-center space-x-1.5 border border-slate-700 transition"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit</span>
                </button>
                <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <p className="text-[11px] text-slate-400">Total Purchases</p>
                <p className="text-base font-bold text-white mt-0.5">
                  {currency} {selectedCustomer.totalPurchases?.toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <p className="text-[11px] text-slate-400">Total Paid</p>
                <p className="text-base font-bold text-emerald-400 mt-0.5">
                  {currency} {selectedCustomer.totalPaid?.toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <p className="text-[11px] text-slate-400">Remaining Balance</p>
                <p className="text-base font-bold text-rose-400 mt-0.5">
                  {currency} {selectedCustomer.outstandingBalance?.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Installment Accounts & Purchases History
              </h4>
              {loadingHistory ? (
                <p className="text-center text-xs text-slate-500 py-6">Loading transaction history...</p>
              ) : (
                <div className="space-y-3">
                  {customerHistory?.installmentSales?.map((is) => (
                    <div key={is._id} className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono font-bold text-indigo-400">{is.saleNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          is.accountStatus === 'completed' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          {is.accountStatus}
                        </span>
                      </div>
                      <p className="text-slate-300 font-medium">
                        {is.items?.map((it) => it.productName).join(', ')}
                      </p>
                      <div className="flex justify-between text-slate-400 mt-2 pt-2 border-t border-slate-900 font-mono">
                        <span>Total: {currency} {is.totalSaleAmount?.toLocaleString()}</span>
                        <span>Paid: {currency} {is.totalAmountPaid?.toLocaleString()}</span>
                        <span className="text-rose-400 font-bold">Remaining: {currency} {is.totalRemainingBalance?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}

                  {customerHistory?.payments?.map((pm) => (
                    <div key={pm._id} className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-mono text-slate-400">{pm.paymentNumber}</span>
                        <p className="text-[11px] text-slate-500">{new Date(pm.paymentDate).toLocaleDateString('en-GB')} • {pm.notes}</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">
                        +{currency} {pm.amount?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal Trigger */}
      {whatsAppCustomer && (
        <WhatsAppModal
          customer={whatsAppCustomer}
          type={whatsAppCustomer.outstandingBalance > 0 ? 'overdue_alert' : 'greeting'}
          data={{ remainingAmount: whatsAppCustomer.outstandingBalance }}
          onClose={() => setWhatsAppCustomer(null)}
        />
      )}
    </div>
  );
}
