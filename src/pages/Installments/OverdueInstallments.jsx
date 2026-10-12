import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Phone,
  MessageSquare,
  CreditCard,
  Calendar,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';
import WhatsAppModal from '../../components/WhatsApp/WhatsAppModal';

export default function OverdueInstallments() {
  const { profile } = useShop();
  const navigate = useNavigate();

  const [overdueList, setOverdueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [whatsAppTarget, setWhatsAppTarget] = useState(null);

  const fetchOverdue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/installments/overdue');
      if (res.data.success) {
        setOverdueList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, []);

  const currency = profile?.currency || 'Rs.';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/installments')}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-display font-bold text-2xl text-white">Overdue Installments Monitor</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {overdueList.length} Accounts Overdue
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Overdue installments with days overdue, penalty fee indicators, and 1-click WhatsApp alerts
            </p>
          </div>
        </div>
      </div>

      {/* Overdue Table */}
      <div className="glass-panel overflow-hidden border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Sale Plan</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Installment #</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Days Overdue</th>
                <th className="py-3 px-4 text-right">Overdue Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {overdueList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-emerald-400 font-sans">
                    ✓ Great news! No overdue installments at this moment.
                  </td>
                </tr>
              ) : (
                overdueList.map((item) => (
                  <tr key={item.scheduleId} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-indigo-400">
                      {item.sale?.saleNumber}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-white">
                      {item.customer?.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {item.customer?.mobileNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      Month #{item.installmentNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(item.dueDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        {item.daysOverdue} days
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400 text-sm">
                      {currency} {item.remainingAmount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() =>
                            setWhatsAppTarget({
                              customer: item.customer,
                              data: {
                                remainingAmount: item.remainingAmount,
                                daysOverdue: item.daysOverdue
                              }
                            })
                          }
                          title="Send WhatsApp Overdue Notice"
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/30 flex items-center space-x-1 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Alert</span>
                        </button>
                        <button
                          onClick={() => navigate(`/installments/${item.sale?._id}`)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
                        >
                          Pay
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

      {/* WhatsApp Modal */}
      {whatsAppTarget && (
        <WhatsAppModal
          customer={whatsAppTarget.customer}
          type="overdue_alert"
          data={whatsAppTarget.data}
          onClose={() => setWhatsAppTarget(null)}
        />
      )}
    </div>
  );
}
