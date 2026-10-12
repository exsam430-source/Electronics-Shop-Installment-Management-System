import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, ShieldCheck, AlertCircle, X, Search, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';

export default function ReturnList() {
  const { profile } = useShop();

  const [returns, setReturns] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [activeTab, setActiveTab] = useState('returns'); // returns | warranties
  const [loading, setLoading] = useState(true);

  // New Return Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [returnForm, setReturnForm] = useState({
    customerId: '',
    saleId: '',
    saleType: 'cash_sale',
    returnType: 'return',
    productId: '',
    serialNumber: '',
    quantity: 1,
    returnReason: '',
    refundAmount: '0',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [retRes, warRes, custRes, prodRes] = await Promise.all([
        api.get('/returns'),
        api.get('/returns/warranties'),
        api.get('/customers'),
        api.get('/products')
      ]);
      if (retRes.data.success) setReturns(retRes.data.data);
      if (warRes.data.success) setWarranties(warRes.data.data);
      if (custRes.data.success) setCustomers(custRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedProd = products.find((p) => p._id === returnForm.productId);
      const res = await api.post('/returns', {
        customerId: returnForm.customerId,
        saleId: returnForm.saleId || returnForm.customerId, // fallback if ID
        saleType: returnForm.saleType,
        returnType: returnForm.returnType,
        items: [
          {
            productId: returnForm.productId,
            productName: selectedProd?.productName || 'Electronic Appliance',
            serialNumber: returnForm.serialNumber,
            quantity: parseInt(returnForm.quantity, 10) || 1,
            returnReason: returnForm.returnReason
          }
        ],
        refundAmount: parseFloat(returnForm.refundAmount) || 0,
        notes: returnForm.notes
      });

      if (res.data.success) {
        setShowAddModal(false);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record return');
    }
  };

  const currency = profile?.currency || 'Rs.';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Returns, Exchanges & Warranty</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Process product returns with stock restoration (referral commissions remain intact per Q3)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record Return / Exchange</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('returns')}
          className={`pb-3 px-4 text-xs font-semibold transition border-b-2 ${
            activeTab === 'returns'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Returns & Exchanges ({returns.length})
        </button>
        <button
          onClick={() => setActiveTab('warranties')}
          className={`pb-3 px-4 text-xs font-semibold transition border-b-2 ${
            activeTab === 'warranties'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Warranty Tracking ({warranties.length})
        </button>
      </div>

      {activeTab === 'returns' ? (
        <div className="glass-panel overflow-hidden border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Return #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Returned Item & S/N</th>
                  <th className="py-3 px-4 text-right">Refund Amount</th>
                  <th className="py-3 px-4 text-center">Stock Restored</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-500 font-sans">
                      No product returns or exchanges recorded.
                    </td>
                  </tr>
                ) : (
                  returns.map((ret) => (
                    <tr key={ret._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-rose-400">{ret.returnNumber}</td>
                      <td className="py-3 px-4 text-slate-300 font-sans">
                        {new Date(ret.returnDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3 px-4 font-sans font-semibold text-white">
                        {ret.customerId?.customerName}
                      </td>
                      <td className="py-3 px-4 font-sans capitalize text-slate-300">
                        {ret.returnType}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-sans">
                        {ret.items?.map((it) => (
                          <div key={it.productId?._id || it.productName}>
                            {it.productName} {it.serialNumber ? `(S/N: ${it.serialNumber})` : ''}
                            {it.returnReason && (
                              <p className="text-[10px] text-slate-500">Reason: {it.returnReason}</p>
                            )}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        {currency} {ret.refundAmount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className="text-emerald-400 text-xs">✓ Restored</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Serial Number (S/N)</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Warranty Period</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {warranties.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-500 font-sans">
                      No serial-tracked warranty records found.
                    </td>
                  </tr>
                ) : (
                  warranties.map((w) => (
                    <tr key={w._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-cyan-400">{w.serialNumber}</td>
                      <td className="py-3 px-4 font-sans font-semibold text-white">
                        {w.productId?.productName} ({w.productId?.brand})
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-300">
                        {w.customerId?.customerName}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {w.warrantyDuration} Months
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(w.warrantyEndDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            new Date(w.warrantyEndDate) > new Date()
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {new Date(w.warrantyEndDate) > new Date() ? 'Active' : 'Expired'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Return Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold text-white text-base">Record Return / Exchange</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer *</label>
                <select
                  required
                  value={returnForm.customerId}
                  onChange={(e) => setReturnForm({ ...returnForm, customerId: e.target.value })}
                  className="w-full text-xs"
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.customerName} ({c.customerId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Return Type</label>
                  <select
                    value={returnForm.returnType}
                    onChange={(e) => setReturnForm({ ...returnForm, returnType: e.target.value })}
                    className="w-full text-xs"
                  >
                    <option value="return">Product Return (Refund)</option>
                    <option value="exchange">Exchange</option>
                    <option value="damaged">Damaged Return</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sale Type</label>
                  <select
                    value={returnForm.saleType}
                    onChange={(e) => setReturnForm({ ...returnForm, saleType: e.target.value })}
                    className="w-full text-xs"
                  >
                    <option value="cash_sale">Cash Sale</option>
                    <option value="installment_sale">Installment Sale</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product *</label>
                <select
                  required
                  value={returnForm.productId}
                  onChange={(e) => setReturnForm({ ...returnForm, productId: e.target.value })}
                  className="w-full text-xs"
                >
                  <option value="">Select Product Being Returned</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.productName} ({p.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Serial Number (S/N)</label>
                  <input
                    type="text"
                    placeholder="SN-XXXX"
                    value={returnForm.serialNumber}
                    onChange={(e) => setReturnForm({ ...returnForm, serialNumber: e.target.value })}
                    className="w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Refund Amount ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={returnForm.refundAmount}
                    onChange={(e) => setReturnForm({ ...returnForm, refundAmount: e.target.value })}
                    className="w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Return</label>
                <input
                  type="text"
                  placeholder="e.g. Defective cooling, customer exchange..."
                  value={returnForm.returnReason}
                  onChange={(e) => setReturnForm({ ...returnForm, returnReason: e.target.value })}
                  className="w-full text-xs"
                />
              </div>

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300">
                ℹ️ Note: Returned product units are automatically marked back into available stock. Referral partner commissions are strictly preserved per project policy.
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
                  Save Return Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
