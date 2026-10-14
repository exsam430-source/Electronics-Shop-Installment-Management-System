import React, { useState } from 'react';
import { MessageSquare, X, Send, Copy, Check, ExternalLink, Globe, Smartphone, Bell, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

export default function WhatsAppModal({ customer, type = 'general', data, onClose }) {
  const { profile } = useShop();
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(type);

  if (!customer) return null;

  const currency = profile?.currency || 'Rs.';
  const shopName = profile?.shopName || 'MR SOLVER Electronics';

  const getCleanPhone = () => {
    let clean = (customer.whatsappNumber || customer.mobileNumber || '').replace(/[^0-9]/g, '');
    // Auto convert Pakistani 03XX-XXXXXXX to 923XXXXXXXXX
    if (clean.startsWith('03')) {
      clean = '92' + clean.substring(1);
    } else if (clean.startsWith('3') && clean.length === 10) {
      clean = '92' + clean;
    }
    return clean;
  };

  const getTemplateMessage = (tmpl) => {
    switch (tmpl) {
      case 'due_reminder':
        return `Assalam-o-Alaikum ${customer.customerName},\nThis is a gentle reminder from ${shopName} regarding your upcoming monthly installment of ${currency} ${data?.amount?.toLocaleString() || ''} due on ${data?.dueDate || ''}.\nPlease visit our shop or contact us at ${profile?.phone || profile?.mobile || ''} to complete your payment.\nThank you!`;
      case 'due_today':
        return `Assalam-o-Alaikum ${customer.customerName},\nYour electronics installment payment of ${currency} ${data?.amount?.toLocaleString() || ''} is DUE TODAY at ${shopName}.\nPlease ensure timely payment to keep your account active and in good standing.\nThank you!`;
      case 'overdue_alert':
        return `URGENT NOTICE: Assalam-o-Alaikum ${customer.customerName},\nYour installment account at ${shopName} has an overdue balance of ${currency} ${data?.remainingAmount?.toLocaleString() || ''} (Overdue by ${data?.daysOverdue || ''} days).\nPlease settle this payment immediately to avoid late fee penalties.\nShop Helpline: ${profile?.phone || profile?.mobile || ''}`;
      case 'payment_confirmation':
        return `Payment Received! Dear ${customer.customerName},\nWe have successfully received your payment of ${currency} ${data?.amount?.toLocaleString() || ''} (Receipt: ${data?.receiptNumber || ''}) at ${shopName}.\nRemaining balance: ${currency} ${data?.remainingBalance?.toLocaleString() || '0'}.\nThank you for shopping with us!`;
      case 'completion':
        return `Congratulations ${customer.customerName}! 🎉\nYour installment plan at ${shopName} is now 100% FULLY PAID & COMPLETED.\nThank you for being a valued customer. We look forward to serving you again!`;
      default:
        return `Assalam-o-Alaikum ${customer.customerName},\nGreetings from ${shopName}. We are at your service for all your electronics and installment needs.\nContact: ${profile?.phone || profile?.mobile || ''}`;
    }
  };

  const [message, setMessage] = useState(() => getTemplateMessage(type));

  const handleTemplateSwitch = (tmpl) => {
    setSelectedTemplate(tmpl);
    setMessage(getTemplateMessage(tmpl));
  };

  // Direct Option 1: WhatsApp Desktop App (No browser selection/intermediate page)
  const handleOpenDesktopApp = async () => {
    const cleanPhone = getCleanPhone();
    if (!cleanPhone) {
      alert('Please enter a valid mobile / WhatsApp number for this customer.');
      return;
    }

    if (window.electronAPI && window.electronAPI.openWhatsAppApp) {
      await window.electronAPI.openWhatsAppApp({ phone: cleanPhone, text: message });
      onClose();
    } else {
      // Direct protocol handler launch in browser
      window.location.href = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      setTimeout(() => onClose(), 800);
    }
  };

  // Direct Option 2: WhatsApp Web (Opens Inside Electron App with Modern Chrome 130 UA)
  const handleOpenWebInApp = async () => {
    const cleanPhone = getCleanPhone();
    if (!cleanPhone) {
      alert('Please enter a valid mobile / WhatsApp number for this customer.');
      return;
    }

    if (window.electronAPI && window.electronAPI.openWhatsAppWeb) {
      await window.electronAPI.openWhatsAppWeb({ phone: cleanPhone, text: message });
      onClose();
    } else {
      // Direct WhatsApp Web URL (bypassing wa.me landing page to avoid Chrome older warnings)
      const directWebUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      window.open(directWebUrl, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const targetPhone = customer.whatsappNumber || customer.mobileNumber || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-base">Send WhatsApp Notice</h3>
              <p className="text-xs text-slate-400 font-mono">
                To: <span className="text-white font-semibold font-sans">{customer.customerName}</span> ({targetPhone})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Template Pills */}
        <div className="px-6 pt-4 pb-1 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Templates:</span>
          {[
            { id: 'due_reminder', label: 'Due Reminder' },
            { id: 'due_today', label: 'Due Today' },
            { id: 'overdue_alert', label: 'Overdue Alert' },
            { id: 'payment_confirmation', label: 'Payment Receipt' },
            { id: 'general', label: 'General Message' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTemplateSwitch(t.id)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition ${
                selectedTemplate === t.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Message Editor */}
        <div className="p-6 space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Message Content (Editable):
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center space-x-1 transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Text'}</span>
              </button>
            </div>
            <textarea
              rows="6"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full text-xs font-sans leading-relaxed resize-none rounded-xl"
            />
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-start space-x-2">
            <span className="text-emerald-400 text-base leading-none">✓</span>
            <div>
              <strong className="text-slate-200">Direct Launch:</strong> Choose <strong>WhatsApp App</strong> to open your installed Windows WhatsApp directly without Chrome, or choose <strong>WhatsApp Web (In-App)</strong> to view WhatsApp Web directly inside the app without "Chrome is older" error.
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Action 1: Windows WhatsApp Desktop App */}
            <button
              type="button"
              onClick={handleOpenDesktopApp}
              title="Directly launch installed WhatsApp for Windows app"
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02]"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>WhatsApp App</span>
            </button>

            {/* Action 2: Inside-App WhatsApp Web Window */}
            <button
              type="button"
              onClick={handleOpenWebInApp}
              title="Open WhatsApp Web in internal app window with updated Chrome user agent"
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>WhatsApp Web (In-App)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
