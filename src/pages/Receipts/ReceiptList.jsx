import React, { useState, useEffect } from 'react';
import { Receipt as ReceiptIcon, Search, Printer, Eye, Calendar } from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';
import ReceiptModal from '../../components/Receipt/ReceiptModal';

export default function ReceiptList() {
  const { profile } = useShop();

  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await api.get('/receipts', { params });
      if (res.data.success) {
        setReceipts(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [search]);

  const currency = profile?.currency || 'Rs.';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Receipt Archives & Reprints</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Audited receipt storage with automatic duplicate/reprint watermarking (Q5 & Section 23.4)
        </p>
      </div>

      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shadow-md">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by receipt number (REC-000001) or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 text-xs font-sans"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {receipts.length} Stored Receipts
        </span>
      </div>

      <div className="glass-panel overflow-hidden border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Receipt Purpose</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-center">Print Count</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500 font-sans">
                    No receipts found.
                  </td>
                </tr>
              ) : (
                receipts.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-indigo-400">{rec.receiptNumber}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans">
                      {new Date(rec.receiptDate).toLocaleString('en-GB')}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-white">
                      {rec.customerName}
                    </td>
                    <td className="py-3 px-4 font-sans capitalize text-slate-300">
                      {rec.receiptType.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white text-sm">
                      {currency} {rec.amountPaid?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                          rec.printCount > 1
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {rec.printCount} {rec.printCount > 1 ? '(Duplicate)' : 'printed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <button
                        onClick={() => setSelectedReceipt(rec)}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/30 flex items-center space-x-1 mx-auto transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / Reprint</span>
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
          onPrinted={fetchReceipts}
        />
      )}
    </div>
  );
}
