import React, { useState } from 'react';
import { Printer, Download, X, Check, Copy } from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';
import { generateReceiptHtml, printHtmlDocument, saveHtmlToPdf } from '../../services/printService';

export default function ReceiptModal({ receipt, onClose, onPrinted }) {
  const { profile } = useShop();
  const [printFormat, setPrintFormat] = useState(profile?.printerType || 'thermal_80');
  const [printing, setPrinting] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);

  if (!receipt) return null;

  const handlePrint = async () => {
    setPrinting(true);
    try {
      try {
        await api.post(`/receipts/${receipt._id}/print`);
        if (onPrinted) onPrinted();
      } catch (e) {
        console.warn('Receipt print count update:', e);
      }

      const fullHtml = generateReceiptHtml(receipt, profile, printFormat);
      await printHtmlDocument(fullHtml, {
        marginsType: 1,
        printBackground: true
      });
    } catch (err) {
      console.error('[Print error]:', err);
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setSavingPdf(true);
    try {
      const fullHtml = generateReceiptHtml(receipt, profile, printFormat);
      await saveHtmlToPdf(fullHtml, {
        filename: `Receipt_${receipt.receiptNumber}.pdf`,
        pageSize: printFormat === 'a4' ? 'A4' : undefined
      });
    } catch (err) {
      console.error('[PDF save error]:', err);
    } finally {
      setSavingPdf(false);
    }
  };

  const isDuplicate = receipt.printCount > 0;
  const currency = profile?.currency || 'Rs.';

  return (
    <div className="receipt-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center space-x-3">
            <Printer className="w-5 h-5 text-indigo-400" />
            <h3 className="font-display font-semibold text-white text-base">
              Receipt Preview — {receipt.receiptNumber}
            </h3>
          </div>

          {/* Printer format toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Format:</span>
            <select
              value={printFormat}
              onChange={(e) => setPrintFormat(e.target.value)}
              className="text-xs py-1 px-2.5 bg-slate-800 border-slate-700 rounded-md text-white font-mono"
            >
              <option value="thermal_80">Thermal 80mm POS</option>
              <option value="thermal_58">Thermal 58mm Mini</option>
              <option value="a4">A4 Full Page</option>
            </select>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/70 flex justify-center">
          <div
            id="printable-receipt"
            className={`bg-white text-black p-6 rounded shadow-lg ${
              printFormat === 'thermal_58'
                ? 'receipt-thermal-58 w-[240px] text-[10px] font-mono'
                : printFormat === 'a4'
                ? 'receipt-a4 w-full text-xs font-sans'
                : 'receipt-thermal-80 w-[340px] text-xs font-mono'
            }`}
          >
            {/* Header / Shop Info */}
            <div className="text-center border-b border-black/20 pb-3 mb-3">
              {isDuplicate && (
                <div className="inline-block px-2 py-0.5 mb-1.5 border border-dashed border-red-600 text-red-600 font-bold text-[10px] tracking-widest uppercase">
                  *** DUPLICATE / REPRINT ***
                </div>
              )}
              <h2 className="font-bold text-base uppercase tracking-wider text-black">
                {profile?.shopName || 'MR SOLVER ELECTRONICS'}
              </h2>
              {profile?.receiptHeader && (
                <p className="text-[10px] italic text-neutral-600 mb-1">{profile.receiptHeader}</p>
              )}
              <p className="text-[11px] text-neutral-700">{profile?.address}</p>
              <p className="text-[11px] text-neutral-700">Phone: {profile?.phone || profile?.mobile}</p>
            </div>

            {/* Receipt Title */}
            <div className="text-center font-bold text-[13px] border-b border-dashed border-black/30 pb-2 mb-2 uppercase">
              {receipt.receiptType === 'cash_sale' && 'CASH SALE RECEIPT'}
              {receipt.receiptType === 'advance_payment' && 'ADVANCE PAYMENT RECEIPT'}
              {receipt.receiptType === 'installment_payment' && 'INSTALLMENT PAYMENT RECEIPT'}
            </div>

            {/* Meta Info */}
            <div className="text-[11px] space-y-0.5 border-b border-dashed border-black/20 pb-2 mb-2">
              <div className="flex justify-between">
                <span>Receipt No:</span>
                <span className="font-bold">{receipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(receipt.receiptDate).toLocaleString('en-GB')}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-semibold">{receipt.customerName}</span>
              </div>
              {receipt.customerMobile && (
                <div className="flex justify-between">
                  <span>Mobile:</span>
                  <span>{receipt.customerMobile}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="capitalize">{receipt.paymentMethod || 'Cash'}</span>
              </div>
            </div>

            {/* Product Details */}
            {receipt.items && receipt.items.length > 0 && (
              <div className="border-b border-dashed border-black/20 pb-2 mb-2">
                <div className="font-bold text-[11px] mb-1">ITEMS PURCHASED:</div>
                {receipt.items.map((item, idx) => (
                  <div key={idx} className="mb-1 text-[11px]">
                    <div className="font-medium text-black">
                      {item.productName} {item.brand ? `(${item.brand})` : ''}
                    </div>
                    {item.serialNumber && (
                      <div className="text-[10px] text-neutral-600">S/N: {item.serialNumber}</div>
                    )}
                    <div className="flex justify-between text-neutral-800">
                      <span>{item.quantity} × {currency} {item.unitPrice?.toLocaleString()}</span>
                      <span className="font-semibold">{currency} {item.totalPrice?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Installment Plan Info (if installment receipt) */}
            {receipt.installmentInfo && receipt.installmentInfo.totalInstallments && (
              <div className="border-b border-dashed border-black/20 pb-2 mb-2 text-[11px] bg-neutral-100 p-2 rounded">
                <div className="flex justify-between font-semibold">
                  <span>Installment No:</span>
                  <span>
                    #{receipt.installmentInfo.installmentNumber || 1} of {receipt.installmentInfo.totalInstallments}
                  </span>
                </div>
                {receipt.installmentInfo.monthlyAmount && (
                  <div className="flex justify-between">
                    <span>Monthly Amount:</span>
                    <span>{currency} {receipt.installmentInfo.monthlyAmount?.toLocaleString()}</span>
                  </div>
                )}
                {receipt.installmentInfo.nextDueDate && (
                  <div className="flex justify-between font-bold text-neutral-900 mt-1">
                    <span>Next Due Date:</span>
                    <span>{new Date(receipt.installmentInfo.nextDueDate).toLocaleDateString('en-GB')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Financial Summary */}
            <div className="space-y-1 text-[11px] pt-1 border-b border-black/20 pb-3 mb-2">
              <div className="flex justify-between font-bold">
                <span>TOTAL AMOUNT:</span>
                <span>{currency} {receipt.totalAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-[13px] border-y border-black/10 py-1">
                <span>AMOUNT PAID:</span>
                <span>{currency} {receipt.amountPaid?.toLocaleString()}</span>
              </div>
              {receipt.changeReturned > 0 && (
                <div className="flex justify-between text-neutral-800">
                  <span>CHANGE RETURNED:</span>
                  <span>{currency} {receipt.changeReturned?.toLocaleString()}</span>
                </div>
              )}
              {receipt.remainingBalance > 0 && (
                <div className="flex justify-between font-bold text-red-700">
                  <span>REMAINING BALANCE:</span>
                  <span>{currency} {receipt.remainingBalance?.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-neutral-600 space-y-1">
              <p>{profile?.receiptFooter || 'Thank you for your purchase!'}</p>
              <p className="font-mono text-[9px] text-neutral-400">Software: MR SOLVER • Offline Edition</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between no-print">
          <div className="text-xs text-slate-400">
            Print Count: <span className="text-slate-200 font-bold">{receipt.printCount}</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={savingPdf}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold rounded-lg transition hover:scale-[1.02]"
              title="Save Receipt as PDF file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{savingPdf ? 'Saving...' : 'Save PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Printer className="w-4 h-4" />
              <span>{printing ? 'Printing...' : 'Print Receipt Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
