import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Trash2,
  ArrowLeft,
  User,
  DollarSign,
  Receipt as ReceiptIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';
import ReceiptModal from '../../components/Receipt/ReceiptModal';

export default function NewCashSale() {
  const { profile } = useShop();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [notes, setNotes] = useState('');

  // Items
  const [items, setItems] = useState([
    { productId: '', quantity: 1, unitPrice: 0, serialNumber: '', availableUnits: [] }
  ]);

  // Generated receipt
  const [createdReceipt, setCreatedReceipt] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          api.get('/customers'),
          api.get('/products?status=available')
        ]);
        if (custRes.data.success) setCustomers(custRes.data.data);
        if (prodRes.data.success) setProducts(prodRes.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleAddItem = () => {
    setItems([
      ...items,
      { productId: '', quantity: 1, unitPrice: 0, serialNumber: '', availableUnits: [] }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = async (index, prodId) => {
    const updated = [...items];
    updated[index].productId = prodId;
    updated[index].serialNumber = '';

    const prod = products.find((p) => p._id === prodId);
    if (prod) {
      updated[index].unitPrice = prod.cashSalePrice || 0;
      // Fetch available serial units
      try {
        const uRes = await api.get(`/products/${prodId}/available-units`);
        if (uRes.data.success) {
          updated[index].availableUnits = uRes.data.data || [];
          if (uRes.data.data.length > 0) {
            updated[index].serialNumber = uRes.data.data[0].serialNumber;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    setItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const totalSaleAmount = items.reduce((acc, it) => acc + (it.quantity * it.unitPrice || 0), 0);
  const received = parseFloat(amountReceived) || totalSaleAmount;
  const changeReturned = Math.max(0, received - totalSaleAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    for (const it of items) {
      if (!it.productId || it.quantity <= 0) {
        setError('Please select valid products with quantity > 0.');
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
        serialNumber: it.serialNumber || ''
      }));

      const res = await api.post('/sales/cash', {
        customerId,
        items: formattedItems,
        paymentMethod,
        amountReceived: received,
        notes,
        saleDate
      });

      if (res.data.success) {
        setCreatedReceipt(res.data.receipt);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Cash sale creation failed');
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
          onClick={() => navigate('/sales/cash')}
          className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-white">New Cash Sale</h1>
          <p className="text-xs text-slate-400">
            Immediate multi-item counter checkout with serial unit tracking and instant receipt
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
        {/* Customer Selection Card */}
        <div className="glass-panel p-5 border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">Customer *</label>
              <button
                type="button"
                onClick={() => navigate('/customers/new')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                + Register New
              </button>
            </div>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full text-xs"
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.customerName} ({c.customerId}) — {c.mobileNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Sale Date *</label>
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              required
              className="w-full text-xs"
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
              <option value="mobile_wallet">Mobile Wallet (EasyPaisa/JazzCash)</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        </div>

        {/* Multi-Item Product Selection */}
        <div className="glass-panel p-5 border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-display font-semibold text-white text-sm">
              Items for Cash Purchase
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-xs font-semibold rounded-lg border border-indigo-500/30 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Item</span>
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Product Name *
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      required
                      className="w-full text-xs"
                    >
                      <option value="">Select Appliance</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.productName} ({p.brand}) — Stock: {p.stockQuantity}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Cash Unit Price ({currency})
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

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Quantity
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
                </div>

                {/* Specific Unit Serial Number Picker (Q8) */}
                {item.availableUnits && item.availableUnits.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Select Unit Serial Number (Q8 Tracking):
                    </label>
                    <select
                      value={item.serialNumber}
                      onChange={(e) => handleItemChange(idx, 'serialNumber', e.target.value)}
                      className="w-full text-xs font-mono text-cyan-300"
                    >
                      {item.availableUnits.map((u) => (
                        <option key={u._id} value={u.serialNumber}>
                          {u.serialNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="text-right text-xs text-slate-300 font-mono">
                  Line Total: <strong>{currency} {(item.quantity * item.unitPrice).toLocaleString()}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settlement Card */}
        <div className="glass-panel p-5 border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Bill Amount</span>
            <p className="text-2xl font-bold font-mono text-white mt-1">
              {currency} {totalSaleAmount.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-400 mb-1">
              Amount Received from Customer ({currency})
            </label>
            <input
              type="number"
              min="0"
              placeholder={totalSaleAmount.toString()}
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              className="w-full text-sm font-mono font-bold text-emerald-400"
            />
          </div>

          <div>
            <span className="text-xs font-medium text-cyan-400">Change to Return</span>
            <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">
              {currency} {changeReturned.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/sales/cash')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01]"
          >
            <ReceiptIcon className="w-4 h-4" />
            <span>{loading ? 'Processing Sale...' : 'Complete Sale & Generate Receipt'}</span>
          </button>
        </div>
      </form>

      {/* Instant Printable Receipt Preview */}
      {createdReceipt && (
        <ReceiptModal
          receipt={createdReceipt}
          onClose={() => {
            setCreatedReceipt(null);
            navigate('/sales/cash');
          }}
          onPrinted={() => {}}
        />
      )}
    </div>
  );
}
