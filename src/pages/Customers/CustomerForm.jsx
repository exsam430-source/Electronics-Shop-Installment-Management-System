import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function CustomerForm() {
  const navigate = useNavigate();

  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    whatsappNumber: '',
    referralPartnerId: ''
  });

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await api.get('/referral-partners');
        if (res.data.success) {
          setPartners(res.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPartners();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobileNumber') {
      // Auto-sync WhatsApp number if user hasn't explicitly diverged it
      setFormData((prev) => ({
        ...prev,
        mobileNumber: value,
        whatsappNumber: prev.whatsappNumber === prev.mobileNumber || !prev.whatsappNumber ? value : prev.whatsappNumber
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
      setError('Customer name and mobile number are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/customers', {
        customerName: formData.customerName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        whatsappNumber: (formData.whatsappNumber || formData.mobileNumber).trim(),
        referralPartnerId: formData.referralPartnerId || null
      });
      if (res.data.success) {
        navigate('/customers');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Register New Customer</h1>
          <p className="text-xs text-slate-400">
            Simplified fast registration with auto-populated WhatsApp contact
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel p-6 border-slate-800 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Customer Full Name *
          </label>
          <input
            type="text"
            name="customerName"
            placeholder="e.g. Muhammad Ali"
            value={formData.customerName}
            onChange={handleChange}
            required
            className="w-full text-sm font-semibold"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mobile Number *
            </label>
            <input
              type="text"
              name="mobileNumber"
              placeholder="0300 1234567"
              value={formData.mobileNumber}
              onChange={handleChange}
              required
              className="w-full text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              WhatsApp Number (Auto-fill)
            </label>
            <input
              type="text"
              name="whatsappNumber"
              placeholder="0300 1234567"
              value={formData.whatsappNumber}
              onChange={handleChange}
              className="w-full text-sm font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Auto-fills from mobile; edit only if different.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Referral Partner (Optional)
          </label>
          <select
            name="referralPartnerId"
            value={formData.referralPartnerId}
            onChange={handleChange}
            className="w-full text-sm"
          >
            <option value="">No Referral Partner (Direct Walk-in)</option>
            {partners.map((p) => (
              <option key={p._id} value={p._id}>
                {p.partnerName} ({p.partnerCode}) — {p.commissionRate || 1}% Commission
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500 mt-1">
            Partner receives 1% commission on all cash & installment purchases.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Registering...' : 'Save Customer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
