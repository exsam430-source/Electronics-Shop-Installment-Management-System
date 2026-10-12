import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Layers,
  Edit,
  Eye,
  Sliders,
  CheckCircle,
  X
} from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';

export default function ProductList() {
  const { profile } = useShop();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Stock Adjustment Modal
  const [adjustModalProduct, setAdjustModalProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Stock intake');
  const [adjustSerials, setAdjustSerials] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  // View Units Modal
  const [viewUnitsProduct, setViewUnitsProduct] = useState(null);
  const [productUnits, setProductUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;
      if (lowStockOnly) params.lowStock = 'true';

      const res = await api.get('/products', { params });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('[Fetch products error]:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, selectedStatus, lowStockOnly]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustModalProduct || !adjustQty) return;

    setAdjustLoading(true);
    try {
      const serialList = adjustSerials
        ? adjustSerials.split('\n').map((s) => s.trim()).filter(Boolean)
        : [];

      await api.post(`/products/${adjustModalProduct._id}/adjust-stock`, {
        adjustmentQuantity: parseInt(adjustQty, 10),
        reason: adjustReason,
        serialNumbers: serialList
      });

      setAdjustModalProduct(null);
      setAdjustQty('');
      setAdjustSerials('');
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleViewUnits = async (prod) => {
    setViewUnitsProduct(prod);
    setLoadingUnits(true);
    try {
      const res = await api.get(`/products/${prod._id}`);
      if (res.data.success) {
        setProductUnits(res.data.units || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUnits(false);
    }
  };

  const currency = profile?.currency || 'Rs.';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Product Inventory & Stock</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage electronic appliances, individual serial units, and catalog prices
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/categories')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Manage Categories</span>
          </button>

          <button
            onClick={() => navigate('/products/new')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product name, code, brand, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 text-xs font-sans"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs py-1.5 px-3"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.categoryName}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs py-1.5 px-3"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              lowStockOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Low Stock Alert</span>
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="glass-panel overflow-hidden border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Product Name & Brand</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Purchase Cost</th>
                <th className="py-3 px-4 text-right">Cash Price</th>
                <th className="py-3 px-4 text-right">Installment Price</th>
                <th className="py-3 px-4 text-center">Stock Units</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                      {prod.productCode}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white text-sm">{prod.productName}</p>
                      <p className="text-[11px] text-slate-400">
                        {prod.brand} {prod.modelNumber ? `• ${prod.modelNumber}` : ''}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {prod.categoryId?.categoryName || 'General'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {currency} {prod.purchasePrice?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                      {currency} {prod.cashSalePrice?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-indigo-300">
                      {currency} {prod.installmentSalePrice?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold font-mono text-xs ${
                          prod.stockQuantity <= 0
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : prod.stockQuantity <= (profile?.lowStockThreshold || 2)
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {prod.stockQuantity} in stock
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleViewUnits(prod)}
                          title="View Serial Units"
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setAdjustModalProduct(prod);
                            setAdjustQty('');
                            setAdjustSerials('');
                          }}
                          title="Adjust Stock"
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/products/edit/${prod._id}`)}
                          title="Edit Product"
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
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

      {/* Adjust Stock Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-display font-semibold text-white text-base">
                  Adjust Stock Quantity
                </h3>
                <p className="text-xs text-slate-400">{adjustModalProduct.productName}</p>
              </div>
              <button
                onClick={() => setAdjustModalProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adjustment Quantity (+ to add, - to deduct)
                </label>
                <input
                  type="number"
                  placeholder="e.g. +5 or -2"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  required
                  className="w-full text-sm font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Current stock: <strong>{adjustModalProduct.stockQuantity}</strong> units.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adjustment Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manual warehouse intake, damaged in transit..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              {parseInt(adjustQty, 10) > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Serial Numbers (Optional - one per line):
                  </label>
                  <textarea
                    rows="3"
                    placeholder="SN-2026-001&#10;SN-2026-002"
                    value={adjustSerials}
                    onChange={(e) => setAdjustSerials(e.target.value)}
                    className="w-full text-xs font-mono"
                  />
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="w-1/3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="w-2/3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30"
                >
                  {adjustLoading ? 'Updating Stock...' : 'Save Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Units Modal */}
      {viewUnitsProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-display font-semibold text-white text-base">
                  Physical Unit Serial Numbers
                </h3>
                <p className="text-xs text-slate-400">
                  {viewUnitsProduct.productName} ({productUnits.length} total units logged)
                </p>
              </div>
              <button
                onClick={() => setViewUnitsProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingUnits ? (
                <p className="text-center text-slate-400 text-xs py-6">Loading unit serials...</p>
              ) : productUnits.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-6">No serial units logged for this product.</p>
              ) : (
                productUnits.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-white">{u.serialNumber}</span>
                      {u.notes && <p className="text-[10px] text-slate-400">{u.notes}</p>}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold uppercase ${
                        u.status === 'available'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : u.status === 'sold'
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
