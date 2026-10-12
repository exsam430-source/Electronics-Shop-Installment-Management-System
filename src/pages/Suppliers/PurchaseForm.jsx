import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Plus, Trash2, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';

export default function PurchaseForm() {
  const { profile } = useShop();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('0');
  const [notes, setNotes] = useState('');

  // Items list
  const [items, setItems] = useState([
    { productId: '', quantity: 1, unitPrice: 0, serialNumbers: '' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, prodRes] = await Promise.all([
          api.get('/suppliers'),
          api.get('/products')
        ]);
        if (supRes.data.success) setSuppliers(supRes.data.data);
        if (prodRes.data.success) setProducts(prodRes.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1, unitPrice: 0, serialNumbers: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'productId') {
      const selected = products.find((p) => p._id === value);
      if (selected) {
        updated[index].unitPrice = selected.purchasePrice || 0;
      }
    }

    setItems(updated);
  };

  const totalAmount = items.reduce((acc, it) => acc + (it.quantity * it.unitPrice || 0), 0);
  const paid = parseFloat(amountPaid) || 0;
  const balanceRemaining = Math.max(0, totalAmount - paid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      setError('Please select a supplier.');
      return;
    }

    for (const it of items) {
      if (!it.productId || it.quantity <= 0 || it.unitPrice <= 0) {
        setError('Please select valid products with positive quantity and unit price.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const formattedItems = items.map((it) => ({
        productId: it.productId,
        quantity: parseInt(it.quantity, 10),
        unitPrice: parseFloat(it.unitPrice),
        serialNumbers: it.serialNumbers
          ? it.serialNumbers.split('\n').map((s) => s.trim()).filter(Boolean)
          : []
      }));

      const res = await api.post('/purchases', {
        supplierId,
        purchaseDate,
        items: formattedItems,
        amountPaid: paid,
        paymentMethod,
        notes
      });

      if (res.data.success) {
        navigate('/purchases');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record purchase entry');
    } finally {
      setLoading(false);
    }
  };

  const currency = profile?.currency || 'Rs.';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/suppliers')}
          className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Record Supplier Purchase Entry</h1>
          <p className="text-xs text-slate-400">
            Intake wholesale inventory, log individual unit serial numbers and auto-update ledger
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top Info */}
        <div className="glass-panel p-5 border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Supplier *</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
              className="w-full text-xs"
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.supplierName} ({s.supplierCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Purchase Date *</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
              className="w-full text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full text-xs"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="credit">On Credit / Payable</option>
            </select>
          </div>
        </div>

        {/* Dynamic Products List */}
        <div className="glass-panel p-5 border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-display font-semibold text-white text-sm">
              Products Intake List
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-xs font-semibold rounded-lg border border-indigo-500/30 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Product</span>
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-indigo-400 font-bold">Item #{idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Product Name *
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      required
                      className="w-full text-xs"
                    >
                      <option value="">Select Catalog Product</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.productName} ({p.brand})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                      required
                      className="w-full text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Unit Purchase Price ({currency}) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      required
                      className="w-full text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Serial Numbers (Q8 — Optional: one per line):
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Enter serial numbers for each unit intake..."
                    value={item.serialNumbers}
                    onChange={(e) => handleItemChange(idx, 'serialNumbers', e.target.value)}
                    className="w-full text-xs font-mono resize-none"
                  />
                </div>

                <div className="text-right text-xs text-slate-300 font-mono">
                  Line Total: <strong>{currency} {(item.quantity * item.unitPrice).toLocaleString()}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Settlement Card */}
        <div className="glass-panel p-5 border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Purchase Amount</span>
            <p className="text-2xl font-bold font-mono text-white mt-1">
              {currency} {totalAmount.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-400 mb-1">
              Amount Paid to Supplier Now ({currency})
            </label>
            <input
              type="number"
              min="0"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full text-sm font-mono font-bold text-emerald-400"
            />
          </div>

          <div>
            <span className="text-xs font-medium text-rose-400">Balance Remaining (Payable)</span>
            <p className="text-2xl font-bold font-mono text-rose-400 mt-1">
              {currency} {balanceRemaining.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/suppliers')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01]"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Recording Inventory...' : 'Confirm & Save Purchase'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
