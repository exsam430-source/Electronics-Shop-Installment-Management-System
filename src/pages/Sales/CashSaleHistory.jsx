import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Search, Calendar, Receipt as ReceiptIcon, Eye } from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';
import ReceiptModal from '../../components/Receipt/ReceiptModal';

export default function CashSaleHistory() {
  const { profile } = useShop();
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await api.get('/sales/cash');
        if (res.data.success) {
          setSales(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const handleViewReceipt = async (sale) => {
    try {
      const res = await api.get(`/receipts/${sale.receiptId?._id || sale.receiptId}`);
      if (res.data.success) {
        setSelectedReceipt(res.data.data);
      }
    } catch (err) {
      alert('Could not retrieve receipt record.');
    }
  };

  const currency = profile?.currency || 'Rs.';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Cash Sales History</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Log of counter sales with profit realization and receipt reprints
          </p>
        </div>

        <button
          onClick={() => navigate('/sales/cash/new')}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Cash Sale</span>
        </button>
      </div>

      <div className="glass-panel overflow-hidden border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Sale #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Sold</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Realized Profit</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">
                    No cash sales recorded yet.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {sale.saleNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {new Date(sale.saleDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {sale.customerId?.customerName || 'Walk-in'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {sale.items?.map((it) => `${it.productName} (x${it.quantity})`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {currency} {sale.totalAmount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      +{currency} {sale.profit?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleViewReceipt(sale)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onPrinted={() => {}}
        />
      )}
    </div>
  );
}
