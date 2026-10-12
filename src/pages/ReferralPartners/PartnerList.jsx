import React, { useState, useEffect } from 'react';
import { Handshake, Plus, DollarSign, Phone, Eye, X, CheckCircle, FileText } from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';

export default function PartnerList() {
  const { profile } = useShop();

  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Partner Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPartner, setNewPartner] = useState({
    partnerName: '',
    mobileNumber: '',
    whatsappNumber: '',
    commissionRate: '1',
    notes: ''
  });

  // Pay Commission Modal
  const [payModalPartner, setPayModalPartner] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNotes, setPayNotes] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  // View Breakdown Modal
  const [viewPartner, setViewPartner] = useState(null);
  const [partnerCommissions, setPartnerCommissions] = useState([]);
  const [partnerPayments, setPartnerPayments] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/referral-partners');
      if (res.data.success) {
        setPartners(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/referral-partners', newPartner);
      if (res.data.success) {
        setShowAddModal(false);
        setNewPartner({
          partnerName: '',
          mobileNumber: '',
          whatsappNumber: '',
          commissionRate: '1',
          notes: ''
        });
        fetchPartners();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create referral partner');
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payModalPartner || !payAmount) return;

    setPayLoading(true);
    try {
      await api.post(`/referral-partners/${payModalPartner._id}/pay`, {
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        notes: payNotes
      });
      setPayModalPartner(null);
      setPayAmount('');
      setPayNotes('');
      fetchPartners();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to settle commission');
    } finally {
      setPayLoading(false);
    }
  };

  const handleViewBreakdown = async (partner) => {
    setViewPartner(partner);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/referral-partners/${partner._id}`);
      if (res.data.success) {
        setPartnerCommissions(res.data.commissions || []);
        setPartnerPayments(res.data.payments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const currency = profile?.currency || 'Rs.';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Referral Partners & Commissions</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Independent agents earning 1% commission on cash & installment sales (preserved upon returns)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register Referral Partner</span>
        </button>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map((partner) => (
          <div key={partner._id} className="glass-panel p-5 border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs font-bold text-cyan-400">{partner.partnerCode}</span>
                <span className="text-[10px] bg-indigo-500/15 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-500/20">
                  Rate: {partner.commissionRate}%
                </span>
              </div>

              <h3 className="font-display font-bold text-white text-base">{partner.partnerName}</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{partner.mobileNumber}</p>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Earned</span>
                  <span className="font-mono text-xs font-bold text-white">
                    {currency} {partner.totalCommissionEarned?.toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Paid</span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {currency} {partner.totalCommissionPaid?.toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-amber-400 block">Payable</span>
                  <span className="font-mono text-xs font-bold text-amber-400">
                    {currency} {partner.commissionBalance?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => handleViewBreakdown(partner)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Sales Breakdown</span>
              </button>

              <button
                onClick={() => {
                  setPayModalPartner(partner);
                  setPayAmount(partner.commissionBalance > 0 ? partner.commissionBalance.toString() : '');
                }}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/30 transition"
              >
                Pay Commission
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold text-white text-base">Register Referral Partner</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Partner Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif Ali"
                  value={newPartner.partnerName}
                  onChange={(e) => setNewPartner({ ...newPartner, partnerName: e.target.value })}
                  className="w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="0300 1234567"
                    value={newPartner.mobileNumber}
                    onChange={(e) => setNewPartner({ ...newPartner, mobileNumber: e.target.value })}
                    className="w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newPartner.commissionRate}
                    onChange={(e) => setNewPartner({ ...newPartner, commissionRate: e.target.value })}
                    className="w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Electrician, Local Technician"
                  value={newPartner.notes}
                  onChange={(e) => setNewPartner({ ...newPartner, notes: e.target.value })}
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
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Commission Modal */}
      {payModalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-display font-semibold text-white text-base">Pay Referral Commission</h3>
                <p className="text-xs text-slate-400">{payModalPartner.partnerName}</p>
              </div>
              <button onClick={() => setPayModalPartner(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Outstanding Commission:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {currency} {payModalPartner.commissionBalance?.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Payout Amount ({currency}) *
                </label>
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
                  <option value="mobile_wallet">Mobile Wallet (EasyPaisa/JazzCash)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Voucher / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Month-end commission settlement"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalPartner(null)}
                  className="w-1/3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/30"
                >
                  {payLoading ? 'Processing...' : 'Confirm Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Breakdown Modal */}
      {viewPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display font-semibold text-white text-base">
                  Commission History — {viewPartner.partnerName} ({viewPartner.partnerCode})
                </h3>
                <p className="text-xs text-slate-400">Sale-by-sale earned commissions & settlement records</p>
              </div>
              <button onClick={() => setViewPartner(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <h4 className="text-xs font-semibold text-cyan-400 mb-2 uppercase tracking-wider">
                  Referred Sales & Commission Earned
                </h4>
                {loadingDetails ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Loading breakdown...</p>
                ) : partnerCommissions.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No sales attributed to this partner yet.</p>
                ) : (
                  <div className="space-y-2">
                    {partnerCommissions.map((c) => (
                      <div key={c._id} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-indigo-400">{c.saleNumber}</span>
                            <span className="text-[10px] text-slate-400 capitalize">({c.saleType.replace('_', ' ')})</span>
                          </div>
                          <p className="text-slate-300 font-medium mt-0.5">
                            Customer: {c.customerName} • {c.productDetails}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Sale Date: {new Date(c.saleDate).toLocaleDateString('en-GB')} • Selling Price: {currency} {c.sellingPrice?.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-white block">
                            +{currency} {c.commissionAmount?.toLocaleString()}
                          </span>
                          <span className={`text-[10px] uppercase font-bold ${
                            c.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {partnerPayments.length > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">
                    Commission Payouts History
                  </h4>
                  <div className="space-y-2">
                    {partnerPayments.map((p) => (
                      <div key={p._id} className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/80 text-xs flex justify-between items-center font-mono">
                        <div>
                          <span className="text-slate-300">{p.paymentNumber}</span>
                          <span className="text-[10px] text-slate-500 ml-2 font-sans">{new Date(p.paymentDate).toLocaleDateString('en-GB')}</span>
                        </div>
                        <span className="font-bold text-emerald-400">Paid: {currency} {p.amount?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
