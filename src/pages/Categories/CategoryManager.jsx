import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit, Check, X } from 'lucide-react';
import api from '../../services/api';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCatName) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/categories', {
        categoryName: newCatName,
        description: newCatDesc
      });
      if (res.data.success) {
        setNewCatName('');
        setNewCatDesc('');
        fetchCategories();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Product Categories</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Pre-loaded 17 electronic appliance classifications plus custom categories
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Add New Category */}
        <div className="glass-panel p-5 border-slate-800 h-fit">
          <h3 className="font-display font-semibold text-white text-sm mb-3 flex items-center space-x-2">
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Add New Category</span>
          </h3>

          {error && (
            <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Smart Watches, Geysers"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                rows="2"
                placeholder="Brief description of products in category"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/30 transition"
            >
              {submitting ? 'Adding...' : 'Save Category'}
            </button>
          </form>
        </div>

        {/* Right Table: Category Listing */}
        <div className="lg:col-span-2 glass-panel border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center">
            <h3 className="font-display font-semibold text-white text-sm">
              All Active Categories ({categories.length})
            </h3>
            <span className="text-xs text-indigo-400">Pre-loaded & Custom</span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[550px] overflow-y-auto">
            {categories.map((cat, idx) => (
              <div key={cat._id} className="p-3.5 px-5 flex items-center justify-between hover:bg-slate-800/30 transition">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono text-slate-500 w-6">#{idx + 1}</span>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{cat.categoryName}</h4>
                    {cat.description && (
                      <p className="text-[11px] text-slate-400">{cat.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {cat.isDefault && (
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      Pre-loaded
                    </span>
                  )}
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
