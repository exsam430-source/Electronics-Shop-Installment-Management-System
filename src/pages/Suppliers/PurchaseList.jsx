import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Plus, Search, Calendar, Eye, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';

export default function PurchaseList() {
  const { profile } = useShop();
  const navigate = useNavigate();

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await api.get('/purchases');
        if (res.data.success) {
          setPurchases(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  const currency = profile?.currency || 'Rs.';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/suppliers')}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Purchase Orders History</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Wholesale inventory deliveries and supplier accounts
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/purchases/new')}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Entry</span>
        </button>
      </div>

      <div className="glass-panel overflow-hidden border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Purchase Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Items Count</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Payment Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">
                    No purchase records recorded yet.
                  </td>
                </tr>
              ) : (
                purchases.map((pur) => (
                  <tr key={pur._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                      {pur.purchaseNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(pur.purchaseDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {pur.supplierId?.supplierName || 'Unknown Supplier'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {pur.items?.length || 0} product lines
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {currency} {pur.totalAmount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400">
                      {currency} {pur.amountPaid?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                      {currency} {pur.balanceRemaining?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center font-mono capitalize text-slate-400">
                      {pur.paymentMethod}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
