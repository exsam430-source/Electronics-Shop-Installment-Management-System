import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Search, ArrowLeft, Eye, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';
import WhatsAppModal from '../../components/WhatsApp/WhatsAppModal';

export default function CompletedAccounts() {
  const { profile } = useShop();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [whatsAppCustomer, setWhatsAppCustomer] = useState(null);

  useEffect(() => {
    const fetchCompleted = async () => {
      try {
        const res = await api.get('/installments/accounts', {
          params: { status: 'completed', search }
        });
        if (res.data.success) {
          setAccounts(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompleted();
  }, [search]);

  const currency = profile?.currency || 'Rs.';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/installments')}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Completed Accounts Archive</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              100% fully paid installment accounts with zero remaining balances
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Plan Ref</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-right">Total Financed</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500 font-sans">
                    No completed installment accounts found.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-cyan-400">{acc.saleNumber}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-white">
                      {acc.customerId?.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{acc.customerId?.mobileNumber}</td>
                    <td className="py-3 px-4 text-slate-400">{acc.installmentDuration} Months</td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      {currency} {acc.totalSaleAmount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      {currency} {acc.totalAmountPaid?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 uppercase">
                        ✓ Completed
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setWhatsAppCustomer(acc.customerId)}
                          title="Send Completion Greeting"
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg transition"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/installments/${acc._id}`)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
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

      {whatsAppCustomer && (
        <WhatsAppModal
          customer={whatsAppCustomer}
          type="completion"
          data={{}}
          onClose={() => setWhatsAppCustomer(null)}
        />
      )}
    </div>
  );
}
