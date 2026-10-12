import React, { useState } from 'react';
import { MessageSquare, X, Send, Copy, Check } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export default function WhatsAppModal({ customer, type, data, onClose }) {
  const { profile } = useShop();
  const [copied, setCopied] = useState(false);

  if (!customer) return null;

  const phone = (customer.whatsappNumber || customer.mobileNumber || '').replace(/[^0-9]/g, '');
  const currency = profile?.currency || 'Rs.';
  const shopName = profile?.shopName || 'MR SOLVER Electronics';

  let defaultMessage = '';

  if (type === 'due_reminder') {
    defaultMessage = `Assalam-o-Alaikum ${customer.customerName},\nThis is a gentle reminder from ${shopName} regarding your upcoming monthly installment of ${currency} ${data?.amount?.toLocaleString() || ''} due on ${data?.dueDate || ''}.\nPlease visit our shop or contact us at ${profile?.phone || ''} to complete your payment.\nThank you!`;
  } else if (type === 'due_today') {
    defaultMessage = `Assalam-o-Alaikum ${customer.customerName},\nYour electronics installment payment of ${currency} ${data?.amount?.toLocaleString() || ''} is DUE TODAY at ${shopName}.\nPlease ensure timely payment to keep your account active and in good standing.\nThank you!`;
  } else if (type === 'overdue_alert') {
    defaultMessage = `URGENT NOTICE: Assalam-o-Alaikum ${customer.customerName},\nYour installment account at ${shopName} has an overdue balance of ${currency} ${data?.remainingAmount?.toLocaleString() || ''} (Overdue by ${data?.daysOverdue || ''} days).\nPlease settle this payment immediately to avoid late fee penalties.\nHelpline: ${profile?.phone || ''}`;
  } else if (type === 'payment_confirmation') {
    defaultMessage = `Payment Received! Dear ${customer.customerName},\nWe have successfully received your payment of ${currency} ${data?.amount?.toLocaleString() || ''} (Receipt: ${data?.receiptNumber || ''}) at ${shopName}.\nRemaining balance: ${currency} ${data?.remainingBalance?.toLocaleString() || '0'}.\nThank you for shopping with us!`;
  } else if (type === 'completion') {
    defaultMessage = `Congratulations ${customer.customerName}! 🎉\nYour installment plan at ${shopName} is now 100% FULLY PAID & COMPLETED.\nThank you for being a valued customer. We look forward to serving you again!`;
  } else {
    defaultMessage = `Assalam-o-Alaikum ${customer.customerName},\nGreetings from ${shopName}. We are at your service for all your electronics and installment needs.`;
  }

  const [message, setMessage] = useState(defaultMessage);

  const handleSendWhatsApp = () => {
    let cleanPhone = phone;
    // If Pakistani number starts with 03, convert to 923
    if (cleanPhone.startsWith('03')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-base">Send WhatsApp Message</h3>
              <p className="text-xs text-slate-400">To: {customer.customerName} ({customer.whatsappNumber || customer.mobileNumber})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Editor */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Message Content (Editable):
            </label>
            <textarea
              rows="6"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full text-xs font-sans leading-relaxed resize-none"
            />
          </div>

          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 text-[11px] text-slate-400">
            💡 Clicking <strong>Send via WhatsApp</strong> opens the customer's WhatsApp chat with this message pre-filled. No costly third-party API subscription required.
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
