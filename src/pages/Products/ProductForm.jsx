import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, ArrowLeft, Save, AlertCircle, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';

export default function ProductForm() {
  const { profile } = useShop();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pricingWarning, setPricingWarning] = useState('');

  const [formData, setFormData] = useState({
    productName: '',
    categoryId: '',
    brand: '',
    modelNumber: '',
    description: '',
    purchasePrice: '',
    cashSalePrice: '',
    installmentSalePrice: '',
    initialStock: '1',
    serialNumbers: '',
    supplierId: '',
    warrantyDuration: '12' // 12 months default
  });

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [catRes, supRes] = await Promise.all([
          api.get('/categories'),
          api.get('/suppliers')
        ]);
        if (catRes.data.success) setCategories(catRes.data.data);
        if (supRes.data.success) setSuppliers(supRes.data.data);

        if (isEdit) {
          const prodRes = await api.get(`/products/${id}`);
          if (prodRes.data.success) {
            const p = prodRes.data.data;
            setFormData({
              productName: p.productName || '',
              categoryId: p.categoryId?._id || p.categoryId || '',
              brand: p.brand || '',
              modelNumber: p.modelNumber || '',
              description: p.description || '',
              purchasePrice: p.purchasePrice?.toString() || '',
              cashSalePrice: p.cashSalePrice?.toString() || '',
              installmentSalePrice: p.installmentSalePrice?.toString() || '',
              initialStock: p.stockQuantity?.toString() || '0',
              serialNumbers: '',
              supplierId: p.supplierId?._id || p.supplierId || '',
              warrantyDuration: p.warrantyDuration?.toString() || '0'
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadPrerequisites();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Check pricing rules
      const purchase = parseFloat(next.purchasePrice) || 0;
      const cash = parseFloat(next.cashSalePrice) || 0;
      const inst = parseFloat(next.installmentSalePrice) || 0;

      if (cash > 0 && purchase > 0 && cash < purchase) {
        setPricingWarning('Warning: Cash selling price is below purchase cost!');
      } else if (inst > 0 && cash > 0 && inst < cash) {
        setPricingWarning('Installment price must be equal or higher than cash price.');
      } else {
        setPricingWarning('');
      }

      return next;
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const purchase = parseFloat(formData.purchasePrice) || 0;
    const cash = parseFloat(formData.cashSalePrice) || 0;
    const inst = parseFloat(formData.installmentSalePrice) || 0;

    if (inst < cash) {
      setError('Installment Sale Price must be greater than or equal to Cash Sale Price.');
      return;
    }

    setLoading(true);
    try {
      const serialList = formData.serialNumbers
        ? formData.serialNumbers.split('\n').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        productName: formData.productName,
        categoryId: formData.categoryId,
        brand: formData.brand,
        modelNumber: formData.modelNumber,
        description: formData.description,
        purchasePrice: purchase,
        cashSalePrice: cash,
        installmentSalePrice: inst,
        supplierId: formData.supplierId || null,
        warrantyDuration: parseInt(formData.warrantyDuration, 10) || 0
      };

      if (!isEdit) {
        payload.initialStock = parseInt(formData.initialStock, 10) || 0;
        payload.serialNumbers = serialList;
        await api.post('/products', payload);
      } else {
        await api.put(`/products/${id}`, payload);
      }

      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const currency = profile?.currency || 'Rs.';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/products')}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">
              {isEdit ? 'Edit Product Catalog Item' : 'Register New Electronic Product'}
            </h1>
            <p className="text-xs text-slate-400">
              Provide hardware specifications, model, pricing structure and serial tracking
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {pricingWarning && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{pricingWarning}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 border-slate-800 space-y-6">
        {/* Basic Details */}
        <div>
          <h3 className="font-display font-semibold text-white text-sm mb-3 border-b border-slate-800 pb-2">
            1. Appliance Details & Identification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="productName"
                placeholder="e.g. Dawlance Inverter Refrigerator 350L"
                value={formData.productName}
                onChange={handleChange}
                required
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category *
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                className="w-full text-sm"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Manufacturer Brand *
              </label>
              <input
                type="text"
                name="brand"
                placeholder="e.g. Dawlance, Haier, Samsung, Gree"
                value={formData.brand}
                onChange={handleChange}
                required
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Model Number (Optional)
              </label>
              <input
                type="text"
                name="modelNumber"
                placeholder="e.g. 9178-LF / E-Star"
                value={formData.modelNumber}
                onChange={handleChange}
                className="w-full text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Pricing Matrix */}
        <div>
          <h3 className="font-display font-semibold text-white text-sm mb-3 border-b border-slate-800 pb-2">
            2. Three-Tier Pricing Matrix ({currency})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Purchase Cost (Cost to Shop) *
              </label>
              <input
                type="number"
                name="purchasePrice"
                placeholder="e.g. 45000"
                value={formData.purchasePrice}
                onChange={handleChange}
                required
                min="0"
                className="w-full text-sm font-mono font-semibold"
              />
              <p className="text-[10px] text-slate-500 mt-1">Used to calculate exact profit</p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-emerald-500/20">
              <label className="block text-xs font-semibold text-emerald-400 mb-1">
                Cash Sale Price *
              </label>
              <input
                type="number"
                name="cashSalePrice"
                placeholder="e.g. 52000"
                value={formData.cashSalePrice}
                onChange={handleChange}
                required
                min="0"
                className="w-full text-sm font-mono font-semibold text-emerald-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">Full instant counter price</p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-indigo-500/20">
              <label className="block text-xs font-semibold text-indigo-400 mb-1">
                Installment Sale Price *
              </label>
              <input
                type="number"
                name="installmentSalePrice"
                placeholder="e.g. 62000"
                value={formData.installmentSalePrice}
                onChange={handleChange}
                required
                min="0"
                className="w-full text-sm font-mono font-semibold text-indigo-300"
              />
              <p className="text-[10px] text-slate-500 mt-1">Financed plan selling price (≥ Cash)</p>
            </div>
          </div>
        </div>

        {/* Stock & Serial Numbers */}
        {!isEdit && (
          <div>
            <h3 className="font-display font-semibold text-white text-sm mb-3 border-b border-slate-800 pb-2">
              3. Initial Physical Stock & Unit Serial Numbers (Q8)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Initial Stock Quantity
                </label>
                <input
                  type="number"
                  name="initialStock"
                  min="0"
                  value={formData.initialStock}
                  onChange={handleChange}
                  className="w-full text-sm font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Total physical units currently on shelf
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Serial Numbers (Optional — one per line):
                </label>
                <textarea
                  rows="3"
                  name="serialNumbers"
                  placeholder="SN-DW-2026-001&#10;SN-DW-2026-002"
                  value={formData.serialNumbers}
                  onChange={handleChange}
                  className="w-full text-xs font-mono resize-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  If left blank, sequential serial numbers will be generated automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warranty & Supplier */}
        <div>
          <h3 className="font-display font-semibold text-white text-sm mb-3 border-b border-slate-800 pb-2">
            4. Supplier & Warranty Coverage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Supplier Source
              </label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className="w-full text-sm"
              >
                <option value="">Select Supplier (Optional)</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.supplierName} ({s.supplierCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Warranty Duration (Months)
              </label>
              <input
                type="number"
                name="warrantyDuration"
                min="0"
                placeholder="e.g. 12 (1 year), 36 (3 years)"
                value={formData.warrantyDuration}
                onChange={handleChange}
                className="w-full text-sm font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">0 for no warranty</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01]"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Catalog Item...' : isEdit ? 'Update Product' : 'Register Product'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
