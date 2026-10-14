import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, ArrowLeft, Save, AlertCircle, Camera, Trash2, Upload } from 'lucide-react';
import api from '../../services/api';

export default function CustomerForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assignedId, setAssignedId] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhoto: '',
    mobileNumber: '',
    whatsappNumber: '',
    cnic: '',
    address: '',
    guarantorName: '',
    guarantorMobile: '',
    referralPartnerId: '',
    registrationDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const partRes = await api.get('/referral-partners');
        if (partRes.data.success) {
          setPartners(partRes.data.data);
        }

        if (isEditing) {
          const custRes = await api.get(`/customers/${id}`);
          if (custRes.data.success) {
            const c = custRes.data.data;
            setAssignedId(c.customerId || '');
            const parsedDate = c.registrationDate 
              ? new Date(c.registrationDate).toISOString().split('T')[0]
              : (c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

            setFormData({
              customerName: c.customerName || '',
              customerPhoto: c.customerPhoto || '',
              mobileNumber: c.mobileNumber || '',
              whatsappNumber: c.whatsappNumber || '',
              cnic: c.cnic || '',
              address: c.address || '',
              guarantorName: c.guarantorName || '',
              guarantorMobile: c.guarantorMobile || '',
              referralPartnerId: c.referralPartnerId?._id || c.referralPartnerId || '',
              registrationDate: parsedDate
            });
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load initial data.');
      }
    };
    fetchData();
  }, [id, isEditing]);

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

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, customerPhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, customerPhoto: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.mobileNumber.trim()) {
      setError('Customer name and mobile number are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerName: formData.customerName.trim(),
        customerPhoto: formData.customerPhoto || '',
        mobileNumber: formData.mobileNumber.trim(),
        whatsappNumber: (formData.whatsappNumber || formData.mobileNumber).trim(),
        cnic: (formData.cnic || '').trim(),
        address: (formData.address || '').trim(),
        guarantorName: (formData.guarantorName || '').trim(),
        guarantorMobile: (formData.guarantorMobile || '').trim(),
        referralPartnerId: formData.referralPartnerId || null
      };

      if (isEditing) {
        const res = await api.put(`/customers/${id}`, payload);
        if (res.data.success) {
          navigate('/customers');
        }
      } else {
        const res = await api.post('/customers', payload);
        if (res.data.success) {
          navigate('/customers');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer');
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
          <h1 className="font-display font-bold text-2xl text-white">
            {isEditing ? `Edit Customer (${assignedId})` : 'Register New Customer'}
          </h1>
          <p className="text-xs text-slate-400">
            {isEditing
              ? 'Update customer information, contact details and profile photo'
              : 'Auto-generates SB-XXXX format ID with profile image and WhatsApp integration'}
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
        {/* Customer Profile Photo Upload Box */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center space-x-4">
          <div className="relative group shrink-0">
            {formData.customerPhoto ? (
              <img
                src={formData.customerPhoto}
                alt="Customer Profile"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/60 shadow-lg shadow-indigo-500/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500">
                <Camera className="w-6 h-6 mb-1 text-slate-400" />
                <span className="text-[10px]">No Photo</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1.5">
            <p className="text-xs font-semibold text-slate-200">Customer Photo</p>
            <p className="text-[11px] text-slate-400">
              Upload customer profile picture (PNG, JPG, max 5MB). Useful for identification & installments.
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-sm transition">
                <Upload className="w-3.5 h-3.5" />
                <span>{formData.customerPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {formData.customerPhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-medium transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Customer Registration Date *
            </label>
            <input
              type="date"
              name="registrationDate"
              value={formData.registrationDate}
              onChange={handleChange}
              required
              className="w-full text-sm font-mono text-indigo-300"
            />
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              CNIC / ID Card Number (Optional)
            </label>
            <input
              type="text"
              name="cnic"
              placeholder="35201-1234567-1"
              value={formData.cnic}
              onChange={handleChange}
              className="w-full text-sm font-mono"
            />
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
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Residential Address (Optional)
          </label>
          <input
            type="text"
            name="address"
            placeholder="House / Shop address, City"
            value={formData.address}
            onChange={handleChange}
            className="w-full text-sm"
          />
        </div>

        <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-3">
          <p className="text-xs font-semibold text-slate-300">Guarantor Information (Optional for Installments)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Guarantor Name</label>
              <input
                type="text"
                name="guarantorName"
                placeholder="Guarantor full name"
                value={formData.guarantorName}
                onChange={handleChange}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Guarantor Mobile</label>
              <input
                type="text"
                name="guarantorMobile"
                placeholder="0300 0000000"
                value={formData.guarantorMobile}
                onChange={handleChange}
                className="w-full text-xs font-mono"
              />
            </div>
          </div>
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
            <span>{loading ? 'Saving...' : isEditing ? 'Update Customer' : 'Save Customer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
