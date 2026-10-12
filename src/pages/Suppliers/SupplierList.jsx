import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Plus, DollarSign, Phone, MapPin, X, CheckCircle, FileText } from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';

export default function SupplierList() {
  const { profile } = useShop();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Supplier Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    supplierName: '',
    contactPerson: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    initialBalance: '0'
  });

  // Pay Supplier Modal
  const [payModalSupplier, setPayModalSupplier] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNotes, setPayNotes] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      if (res.data.success) {
        setSuppliers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/suppliers', newSupplier);
      if (res.data.success) {
        setShowAddModal(false);
        setNewSupplier({
          supplierName: '',
          contactPerson: '',
          phone: '',
          mobile: '',
          address: '',
          city: '',
          initialBalance: '0'
        });
        fetchSuppliers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create supplier');
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payModalSupplier || !payAmount) return;

    setPayLoading(true);
    try {
      await api.post(`/suppliers/${payModalSupplier._id}/pay`, {
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        notes: payNotes
      });
      setPayModalSupplier(null);
      setPayAmount('');
      setPayNotes('');
      fetchSuppliers();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment recording failed');
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
          <h1 className="font-display font-bold text-2xl text-white">Suppliers & Wholesalers</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage electronic vendors, purchase ledgers, and pay outstanding balances
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/purchases')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Purchase History</span>
          </button>

          <button
            onClick={() => navigate('/purchases/new')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Purchase</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((sup) => (
          <div key={sup._id} className="glass-panel p-5 border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs font-bold text-indigo-400">{sup.supplierCode}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  sup.balance > 0 ? 'bg-rose-500/15 text-rose-400 font-bold' : 'bg-emerald-500/15 text-emerald-400'
                }`}>
                  Balance: {currency} {sup.balance?.toLocaleString()}
                </span>
              </div>

              <h3 className="font-display font-bold text-white text-base">{sup.supplierName}</h3>
              {sup.contactPerson && (
                <p className="text-xs text-slate-400">Contact: {sup.contactPerson}</p>
              )}

              <div className="mt-3 space-y-1 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{sup.phone}</span>
                </div>
                {sup.city && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{sup.city}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => navigate(`/purchases?supplierId=${sup._id}`)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition"
              >
                View Purchases →
              </button>
              <button
                onClick={() => {
                  setPayModalSupplier(sup);
                  setPayAmount(sup.balance > 0 ? sup.balance.toString() : '');
                }}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/30 transition"
              >
                Pay Supplier
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold text-white text-base">Add New Supplier</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Madina Electronics Wholesale"
                  value={newSupplier.supplierName}
                  onChange={(e) => setNewSupplier({ ...newSupplier, supplierName: e.target.value })}
                  className="w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Tariq Mehmood"
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+92 300 1234567"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Lahore / Gujranwala"
                    value={newSupplier.city}
                    onChange={(e) => setNewSupplier({ ...newSupplier, city: e.target.value })}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Opening Balance</label>
                  <input
                    type="number"
                    min="0"
                    value={newSupplier.initialBalance}
                    onChange={(e) => setNewSupplier({ ...newSupplier, initialBalance: e.target.value })}
                    className="w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Market road, shop number"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className="w-full text-xs"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {payModalSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-display font-semibold text-white text-base">Settle Supplier Balance</h3>
                <p className="text-xs text-slate-400">{payModalSupplier.supplierName}</p>
              </div>
              <button onClick={() => setPayModalSupplier(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Current Balance Owed:</span>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  {currency} {payModalSupplier.balance?.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Amount ({currency}) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full text-sm font-mono font-bold"
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
                  <option value="cheque">Cheque</option>
                  <option value="mobile_wallet">Mobile Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Voucher Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Bank Ref #9921 or Cash Voucher"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalSupplier(null)}
                  className="w-1/3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/30"
                >
                  {payLoading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
