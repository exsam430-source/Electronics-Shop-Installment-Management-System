import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  Plus,
  Trash2,
  ArrowLeft,
  DollarSign,
  Receipt as ReceiptIcon,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';
import ReceiptModal from '../../components/Receipt/ReceiptModal';

export default function NewInstallmentSale() {
  const { profile } = useShop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [customerId, setCustomerId] = useState(searchParams.get('customerId') || '');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [referralPartnerId, setReferralPartnerId] = useState('');
  const [duration, setDuration] = useState(12); // 3, 6, 9, 10, 12
  const [advancePayment, setAdvancePayment] = useState('0');
  const [collectFirstInstallment, setCollectFirstInstallment] = useState(false);
  const [firstDueDate, setFirstDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  // Dynamic multi-product items (Q1)
  const [items, setItems] = useState([
    { productId: '', quantity: 1, unitPrice: 0, serialNumber: '', availableUnits: [] }
  ]);

  // Generated receipt
  const [createdReceipt, setCreatedReceipt] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const custRes = await api.get('/customers');
        if (custRes.data.success) {
          setCustomers(custRes.data.data);
          const initialCustId = searchParams.get('customerId');
          if (initialCustId) {
            const found = custRes.data.data.find(c => c._id === initialCustId);
            if (found && found.referralPartnerId) {
              setReferralPartnerId(found.referralPartnerId._id || found.referralPartnerId);
            }
          }
        }
      } catch (e) {
        console.error('Error fetching customers', e);
      }

      try {
        const prodRes = await api.get('/products?status=available');
        if (prodRes.data.success) setProducts(prodRes.data.data);
      } catch (e) {
        console.error('Error fetching products', e);
      }

      try {
        const partRes = await api.get('/referral-partners');
        if (partRes.data.success) setPartners(partRes.data.data);
      } catch (e) {
        console.error('Error fetching partners', e);
      }
    };
    fetchData();

    // Default first due date 1 month from now
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    setFirstDueDate(d.toISOString().split('T')[0]);
  }, []);

  const handleCustomerChange = (cId) => {
    setCustomerId(cId);
    const selected = customers.find((c) => c._id === cId);
    if (selected && selected.referralPartnerId) {
      setReferralPartnerId(selected.referralPartnerId._id || selected.referralPartnerId);
    }
  };

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
      updated[index].unitPrice = prod.installmentSalePrice || 0;
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

  // Calculations
  const totalSaleAmount = items.reduce((acc, it) => acc + (it.quantity * it.unitPrice || 0), 0);
  const advance = parseFloat(advancePayment) || 0;
  const netFinanced = Math.max(0, totalSaleAmount - advance);
  const baseMonthly = duration > 0 ? Math.floor(netFinanced / duration) : 0;
  const roundingDiff = duration > 0 ? netFinanced - (baseMonthly * duration) : 0;

  let firstInstAmount = 0;
  let totalCollectedAtSale = advance;
  if (collectFirstInstallment) {
    firstInstAmount = baseMonthly;
    totalCollectedAtSale = advance + firstInstAmount;
  }

  const remainingBalance = Math.max(0, totalSaleAmount - totalCollectedAtSale);

  // Live schedule preview
  const previewSchedule = [];
  if (duration > 0 && totalSaleAmount > 0) {
    const baseDate = firstDueDate ? new Date(firstDueDate) : new Date();
    for (let i = 1; i <= duration; i++) {
      const isLast = i === duration;
      const amount = isLast ? baseMonthly + roundingDiff : baseMonthly;
      const isFirstCollected = collectFirstInstallment && i === 1;

      const d = new Date(baseDate);
      if (collectFirstInstallment) {
        if (i === 1) {
          d.setTime(new Date().getTime());
        } else {
          d.setMonth(baseDate.getMonth() + (i - 2));
        }
      } else {
        d.setMonth(baseDate.getMonth() + (i - 1));
      }

      previewSchedule.push({
        num: i,
        dueDate: d.toLocaleDateString('en-GB'),
        amount,
        status: isFirstCollected ? 'Paid at Sale' : 'Scheduled'
      });
    }
  }

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

    if (advance > totalSaleAmount) {
      setError('Advance payment cannot exceed the total sale price.');
      return;
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

      const res = await api.post('/sales/installment', {
        customerId,
        referralPartnerId: referralPartnerId || null,
        items: formattedItems,
        duration: parseInt(duration, 10),
        installmentDuration: parseInt(duration, 10),
        advancePayment: advance,
        firstInstallmentCollected: collectFirstInstallment,
        firstDueDate,
        paymentMethod,
        notes,
        saleDate
      });

      if (res.data.success) {
        setCreatedReceipt(res.data.advanceReceipt || res.data.firstInstReceipt);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create installment account');
    } finally {
      setLoading(false);
    }
  };

  const currency = profile?.currency || 'Rs.';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/installments')}
          className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Create New Installment Sale Plan</h1>
          <p className="text-xs text-slate-400">
            Supports single or multiple appliances, 3/6/9/10/12 months, optional advance and schedule generation
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
        {/* Customer & Referral Partner & Sale Date */}
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
              onChange={(e) => handleCustomerChange(e.target.value)}
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Referral Partner (Commission)
            </label>
            <select
              value={referralPartnerId}
              onChange={(e) => setReferralPartnerId(e.target.value)}
              className="w-full text-xs"
            >
              <option value="">None / Direct Customer</option>
              {partners.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.partnerName} ({p.partnerCode}) — {p.commissionRate}%
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Multi-Item Appliances Selection (Q1) */}
        <div className="glass-panel p-5 border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-display font-semibold text-white text-sm">
                Appliances in Installment Plan (Single or Multiple)
              </h3>
              <p className="text-[11px] text-slate-400">
                You can finance multiple electronic items under one unified customer plan
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-xs font-semibold rounded-lg border border-indigo-500/30 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Appliance</span>
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-indigo-400 font-bold">Appliance #{idx + 1}</span>
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
                      Appliance Product *
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      required
                      className="w-full text-xs"
                    >
                      <option value="">Select Electronic Appliance</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.productName} ({p.brand}) — Stock: {p.stockQuantity}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Installment Price ({currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      required
                      className="w-full text-xs font-mono font-bold text-indigo-300"
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
                  Line Financed Price: <strong>{currency} {(item.quantity * item.unitPrice).toLocaleString()}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Configuration & Advance (Q2) */}
        <div className="glass-panel p-5 border-slate-800 space-y-4">
          <h3 className="font-display font-semibold text-white text-sm border-b border-slate-800 pb-2">
            Plan Duration & Payment Options
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Installment Duration *
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {[3, 6, 9, 10, 12].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDuration(m)}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition ${
                      duration === m
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {m} Mo
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Advance Payment ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={advancePayment}
                onChange={(e) => setAdvancePayment(e.target.value)}
                placeholder="0 (Optional)"
                className="w-full text-sm font-mono font-bold"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Optional: Enter 0 for zero-advance financing
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                First Due Date
              </label>
              <input
                type="date"
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
                required
                className="w-full text-xs font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Date for the initial upcoming installment
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Collect 1st Installment Now?
              </label>
              <button
                type="button"
                onClick={() => setCollectFirstInstallment(!collectFirstInstallment)}
                className={`w-full py-2.5 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center space-x-2 ${
                  collectFirstInstallment
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span>{collectFirstInstallment ? '✓ Yes (Collect at Sale)' : '✗ No (Advance Only)'}</span>
              </button>
              <p className="text-[10px] text-slate-500 mt-1">
                If yes, Month 1 is marked paid immediately
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Financial Breakdown Summary */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-5 rounded-2xl border border-indigo-500/30 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-xs font-medium text-slate-400 block">Total Plan Selling Price</span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">
              {currency} {totalSaleAmount.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-xs font-medium text-emerald-400 block">Total Collected at Sale</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
              {currency} {totalCollectedAtSale.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">
              Advance: {currency} {advance.toLocaleString()} {collectFirstInstallment ? `+ Inst #1: ${currency} ${firstInstAmount.toLocaleString()}` : ''}
            </span>
          </div>

          <div>
            <span className="text-xs font-medium text-cyan-400 block">Monthly Installment</span>
            <span className="text-xl font-bold font-mono text-cyan-300 mt-1 block">
              {currency} {baseMonthly.toLocaleString()} / mo
            </span>
            <span className="text-[10px] text-slate-400">{duration} monthly installments</span>
          </div>

          <div>
            <span className="text-xs font-medium text-rose-400 block">Remaining Receivable</span>
            <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
              {currency} {remainingBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Live Installment Schedule Preview */}
        {previewSchedule.length > 0 && (
          <div className="glass-panel p-5 border-slate-800 space-y-3">
            <h3 className="font-display font-semibold text-white text-sm">
              Live Installment Payment Schedule ({duration} Months)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Installment #</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Amount Due</th>
                    <th className="py-2.5 px-3 text-center">Initial Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {previewSchedule.map((s) => (
                    <tr key={s.num} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-bold text-slate-300">Month #{s.num}</td>
                      <td className="py-2 px-3 text-slate-400">{s.dueDate}</td>
                      <td className="py-2 px-3 text-right font-bold text-white">
                        {currency} {s.amount.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold uppercase ${
                            s.status === 'Paid at Sale'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/installments')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01]"
          >
            <CalendarClock className="w-4 h-4" />
            <span>{loading ? 'Creating Installment Account...' : 'Confirm Plan & Generate Receipts'}</span>
          </button>
        </div>
      </form>

      {/* Instant Printable Receipt Preview */}
      {createdReceipt && (
        <ReceiptModal
          receipt={createdReceipt}
          onClose={() => {
            setCreatedReceipt(null);
            navigate('/installments');
          }}
          onPrinted={() => {}}
        />
      )}
    </div>
  );
}
