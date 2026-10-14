import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  Printer,
  Shield,
  HardDrive,
  Key,
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  Upload,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import { useShop } from '../../context/ShopContext';

export default function Settings() {
  const { profile, refreshProfile } = useShop();

  const [activeTab, setActiveTab] = useState('profile'); // profile | printer | penalty | backup | password | logs
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Business Profile Form (Q11)
  const [profileForm, setProfileForm] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    currency: 'Rs.',
    receiptHeader: '',
    receiptFooter: '',
    logo: ''
  });

  // 2. Printer Type (Q5)
  const [printerType, setPrinterType] = useState('thermal_80');

  // 3. Late Fee Settings (Q9)
  const [lateFeeForm, setLateFeeForm] = useState({
    enabled: false,
    type: 'fixed',
    amount: 500,
    percentage: 2,
    graceDays: 10,
    frequency: 'once'
  });

  // 4. Auto-Backup Settings (Q12)
  const [backupForm, setBackupForm] = useState({
    enabled: true,
    frequency: 'weekly',
    day: 'Monday',
    time: '23:00',
    keepLast: 12
  });

  // Backup Logs & Actions
  const [backupLogs, setBackupLogs] = useState([]);
  const [backingUp, setBackingUp] = useState(false);
  const [restorePath, setRestorePath] = useState('');

  // Password Change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Activity Logs
  const [activityLogs, setActivityLogs] = useState([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (profile && !initialized) {
      setProfileForm({
        shopName: profile.shopName || '',
        ownerName: profile.ownerName || '',
        phone: profile.phone || '',
        mobile: profile.mobile || '',
        email: profile.email || '',
        address: profile.address || '',
        city: profile.city || '',
        currency: profile.currency || 'Rs.',
        receiptHeader: profile.receiptHeader || '',
        receiptFooter: profile.receiptFooter || '',
        logo: profile.logo || ''
      });
      setPrinterType(profile.printerType || 'thermal_80');
      if (profile.lateFeeSettings) {
        setLateFeeForm({ ...profile.lateFeeSettings });
      }
      if (profile.autoBackup) {
        setBackupForm({ ...profile.autoBackup });
      }
      setInitialized(true);
    }
  }, [profile, initialized]);

  useEffect(() => {
    if (activeTab === 'backup') fetchBackupLogs();
    if (activeTab === 'logs') fetchActivityLogs();
  }, [activeTab]);

  const fetchBackupLogs = async () => {
    try {
      const res = await api.get('/backups/logs');
      if (res.data.success) setBackupLogs(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await api.get('/settings/activity-logs');
      if (res.data.success) setActivityLogs(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm((prev) => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.put('/settings/profile', profileForm);
      if (res.data.success) {
        setSuccessMsg('Business Profile updated successfully!');
        if (res.data.profile) {
          try {
            localStorage.setItem('eshop_cached_profile', JSON.stringify(res.data.profile));
          } catch (err) {}
        }
        await refreshProfile();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrinter = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/settings/profile', { printerType });
      setSuccessMsg('Printer preferences saved.');
      await refreshProfile();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLateFee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/settings/late-fee', lateFeeForm);
      setSuccessMsg('Late Fee / Overdue Penalty settings saved.');
      await refreshProfile();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAutoBackup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/settings/auto-backup', backupForm);
      setSuccessMsg('Automatic backup schedule updated.');
      await refreshProfile();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualBackup = async () => {
    setBackingUp(true);
    try {
      const res = await api.post('/backups/manual');
      if (res.data.success) {
        alert(`Backup completed successfully!\nFile: ${res.data.data.fileName}\nSize: ${res.data.data.size}`);
        fetchBackupLogs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Backup failed');
    } finally {
      setBackingUp(false);
    }
  };

  const [selectedBackupFile, setSelectedBackupFile] = useState(null);
  const [uploadingRestore, setUploadingRestore] = useState(false);

  const handleDownloadBackup = (filePathOrName) => {
    const fileName = filePathOrName.includes('/') || filePathOrName.includes('\\')
      ? filePathOrName.split(/[/\\]/).pop()
      : filePathOrName;
    const token = localStorage.getItem('eshop_token');
    const downloadUrl = `/api/backups/download/${encodeURIComponent(fileName)}`;
    
    // Trigger browser download via anchor
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', fileName);
    // Include auth token via fetch blob or direct header
    fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('File download failed');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => alert('Failed to download backup: ' + err.message));
  };

  const handleFileUploadRestore = async (e) => {
    e.preventDefault();
    if (!selectedBackupFile) {
      alert('Please choose a backup file to restore.');
      return;
    }

    if (
      !window.confirm(
        `WARNING: Restoring from "${selectedBackupFile.name}" will completely overwrite all current database records. Do you wish to continue?`
      )
    ) {
      return;
    }

    setUploadingRestore(true);
    try {
      const formData = new FormData();
      formData.append('backupFile', selectedBackupFile);

      const res = await api.post('/backups/upload-restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        alert('Database restored successfully! Reloading application...');
        window.location.reload();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Restore failed. Please verify the backup file.');
    } finally {
      setUploadingRestore(false);
    }
  };

  const handleRestoreSubmit = async (e) => {
    e.preventDefault();
    if (!restorePath) return;

    if (
      !window.confirm(
        'WARNING: Restoring will overwrite all current database records with the selected backup file. Do you wish to continue?'
      )
    ) {
      return;
    }

    try {
      const res = await api.post('/backups/restore', { backupPath: restorePath });
      if (res.data.success) {
        alert('Database restored successfully! Reloading application...');
        window.location.reload();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Restoration failed');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (res.data.success) {
        setSuccessMsg('Administrator password changed successfully.');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">System Settings & Administration</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure business branding, thermal/A4 printers, overdue penalties, and automated backups
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'profile', label: 'Business Profile (Q11)', icon: Store },
          { id: 'printer', label: 'Printer Setup (Q5)', icon: Printer },
          { id: 'penalty', label: 'Late Fee Settings (Q9)', icon: Shield },
          { id: 'backup', label: 'Backup & Restore (Q12)', icon: HardDrive },
          { id: 'password', label: 'Admin Security', icon: Key },
          { id: 'logs', label: 'Activity Audit Log', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSuccessMsg('');
                setErrorMsg('');
              }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: BUSINESS PROFILE (Q11) */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="glass-panel p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-display font-semibold text-white text-base">Shop Identity & Receipt Headers</h3>
              <p className="text-xs text-slate-400">Updates reflect across receipts, window title, and reports in real-time</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Shop / App Name *</label>
              <input
                type="text"
                required
                value={profileForm.shopName}
                onChange={(e) => setProfileForm({ ...profileForm, shopName: e.target.value })}
                className="w-full text-sm font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Name</label>
              <input
                type="text"
                value={profileForm.ownerName}
                onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Printed)</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile / WhatsApp</label>
              <input
                type="text"
                value={profileForm.mobile}
                onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Shop Address</label>
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={profileForm.city}
                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={profileForm.currency}
                onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}
                className="w-full text-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Shop Logo</label>
              <div className="flex items-center space-x-3">
                {profileForm.logo && (
                  <div className="flex items-center space-x-2">
                    <img src={profileForm.logo} alt="Logo" className="w-10 h-10 object-contain rounded-lg border border-slate-700 bg-slate-950" />
                    <button
                      type="button"
                      onClick={() => setProfileForm((prev) => ({ ...prev, logo: '' }))}
                      className="px-2 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[10px] font-semibold rounded transition"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="text-xs file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-300"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Receipt Sub-Header Motto</label>
              <input
                type="text"
                value={profileForm.receiptHeader}
                onChange={(e) => setProfileForm({ ...profileForm, receiptHeader: e.target.value })}
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Receipt Footer Terms</label>
              <input
                type="text"
                value={profileForm.receiptFooter}
                onChange={(e) => setProfileForm({ ...profileForm, receiptFooter: e.target.value })}
                className="w-full text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: PRINTER CONFIGURATION (Q5) */}
      {activeTab === 'printer' && (
        <form onSubmit={handleSavePrinter} className="glass-panel p-6 border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-display font-semibold text-white text-base">Receipt Printer Hardware Mode (Q5)</h3>
            <p className="text-xs text-slate-400">Select default layout; template automatically adjusts dimensions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'thermal_80',
                name: 'Thermal 80mm POS',
                desc: 'Standard commercial 80mm roll printer. High density, clean spacing.'
              },
              {
                id: 'thermal_58',
                name: 'Thermal 58mm Mini',
                desc: 'Compact 58mm mobile/counter receipt printer. Condensed monospace.'
              },
              {
                id: 'a4',
                name: 'A4 Full Page Laser/Inkjet',
                desc: 'Full size A4 page format with tabular invoices and signatures.'
              }
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => setPrinterType(p.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition ${
                  printerType === p.id
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-sm text-white">{p.name}</span>
                  <input
                    type="radio"
                    name="printerType"
                    checked={printerType === p.id}
                    onChange={() => setPrinterType(p.id)}
                    className="accent-indigo-500"
                  />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition"
            >
              Save Printer Preference
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: LATE FEE / OVERDUE PENALTY SETTINGS (Q9) */}
      {activeTab === 'penalty' && (
        <form onSubmit={handleSaveLateFee} className="glass-panel p-6 border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-display font-semibold text-white text-base">Overdue Penalty & Late Fee Policy (Q9)</h3>
            <p className="text-xs text-slate-400">Optional penalty applied when installment payment is delayed</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">Enable Overdue Late Fee Penalty</p>
              <p className="text-[11px] text-slate-400">When enabled, penalty will be automatically calculated after grace period</p>
            </div>
            <input
              type="checkbox"
              checked={lateFeeForm.enabled}
              onChange={(e) => setLateFeeForm({ ...lateFeeForm, enabled: e.target.checked })}
              className="w-5 h-5 accent-indigo-500 cursor-pointer"
            />
          </div>

          {lateFeeForm.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fee Calculation Type</label>
                <select
                  value={lateFeeForm.type}
                  onChange={(e) => setLateFeeForm({ ...lateFeeForm, type: e.target.value })}
                  className="w-full text-xs"
                >
                  <option value="fixed">Fixed Amount ({profile?.currency || 'Rs.'})</option>
                  <option value="percentage">Percentage (%) of Installment</option>
                </select>
              </div>

              {lateFeeForm.type === 'fixed' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fixed Fee Amount</label>
                  <input
                    type="number"
                    min="0"
                    value={lateFeeForm.amount}
                    onChange={(e) => setLateFeeForm({ ...lateFeeForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono font-bold"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fee Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={lateFeeForm.percentage}
                    onChange={(e) => setLateFeeForm({ ...lateFeeForm, percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Grace Period (Days Overdue)</label>
                <input
                  type="number"
                  min="0"
                  value={lateFeeForm.graceDays}
                  onChange={(e) => setLateFeeForm({ ...lateFeeForm, graceDays: parseInt(e.target.value, 10) || 0 })}
                  className="w-full text-xs font-mono"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition"
            >
              Save Penalty Rules
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: BACKUP & RESTORATION (Q12) */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Manual Backup Trigger */}
          <div className="glass-panel p-6 border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-white text-base">Instant Manual Database Backup</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generates compressed .eshop_backup file of all collections with timestamp
              </p>
            </div>
            <button
              onClick={handleManualBackup}
              disabled={backingUp}
              className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/30 transition"
            >
              <HardDrive className="w-4 h-4" />
              <span>{backingUp ? 'Creating Backup...' : 'Backup Now'}</span>
            </button>
          </div>

          {/* Auto Backup Configuration */}
          <form onSubmit={handleSaveAutoBackup} className="glass-panel p-6 border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display font-semibold text-white text-sm">Automated Scheduled Backup (Q12)</h3>
                <p className="text-xs text-slate-400">Background node-cron automated snapshot scheduler</p>
              </div>
              <input
                type="checkbox"
                checked={backupForm.enabled}
                onChange={(e) => setBackupForm({ ...backupForm, enabled: e.target.checked })}
                className="w-5 h-5 accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Frequency</label>
                <select
                  value={backupForm.frequency}
                  onChange={(e) => setBackupForm({ ...backupForm, frequency: e.target.value })}
                  className="w-full text-xs"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly (Recommended)</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {backupForm.frequency === 'weekly' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Scheduled Day</label>
                  <select
                    value={backupForm.day}
                    onChange={(e) => setBackupForm({ ...backupForm, day: e.target.value })}
                    className="w-full text-xs"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Backup Time (Shop Closing)</label>
                <input
                  type="time"
                  value={backupForm.time}
                  onChange={(e) => setBackupForm({ ...backupForm, time: e.target.value })}
                  className="w-full text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Keep Last Snapshots</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={backupForm.keepLast}
                  onChange={(e) => setBackupForm({ ...backupForm, keepLast: parseInt(e.target.value, 10) || 12 })}
                  className="w-full text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
              >
                Save Schedule
              </button>
            </div>
          </form>

          {/* Restore from File (Easy File Picker + Fallback Path) */}
          <div className="glass-panel p-6 border-slate-800 space-y-4">
            <div>
              <h3 className="font-display font-semibold text-white text-sm">Restore Database from Backup File</h3>
              <p className="text-xs text-amber-400 mt-0.5">
                Select your saved <code className="text-white">.eshop_backup</code> or <code className="text-white">.json</code> snapshot file to restore all shop records.
              </p>
            </div>

            {/* Easy File Upload Restore */}
            <form onSubmit={handleFileUploadRestore} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Option 1: Choose Backup File from Computer (Recommended)</label>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <input
                  type="file"
                  accept=".eshop_backup,.json"
                  onChange={(e) => setSelectedBackupFile(e.target.files[0] || null)}
                  className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!selectedBackupFile || uploadingRestore}
                  className="w-full sm:w-auto shrink-0 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/30 transition"
                >
                  {uploadingRestore ? 'Restoring Database...' : 'Restore Selected File'}
                </button>
              </div>
            </form>

            {/* Manual Path Fallback */}
            <form onSubmit={handleRestoreSubmit} className="pt-2">
              <label className="block text-[11px] text-slate-400 mb-1">Option 2: Or enter custom full system path (Advanced)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. C:\backups\backup_2026.eshop_backup"
                  value={restorePath}
                  onChange={(e) => setRestorePath(e.target.value)}
                  className="flex-1 text-xs font-mono"
                />
                <button
                  type="submit"
                  disabled={!restorePath}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium rounded-xl transition"
                >
                  Restore Path
                </button>
              </div>
            </form>
          </div>

          {/* Backup History Logs */}
          <div className="glass-panel overflow-hidden border-slate-800">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 font-semibold text-xs text-slate-300 flex justify-between items-center">
              <span>Backup History & Logs ({backupLogs.length})</span>
              <button
                type="button"
                onClick={fetchBackupLogs}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
            <div className="divide-y divide-slate-800/60 font-mono text-xs max-h-56 overflow-y-auto">
              {backupLogs.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs font-sans">No backups recorded yet. Click "Backup Now" above.</div>
              ) : (
                backupLogs.map((log) => (
                  <div key={log._id} className="p-3 px-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-200">{new Date(log.backupDate).toLocaleString('en-GB')}</span>
                      <span className="text-slate-500 ml-2">({log.backupType})</span>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-xs">{log.backupPath}</div>
                    </div>
                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="text-indigo-400 font-bold">{log.backupSize}</span>
                      <span className={`px-2 py-0.5 rounded uppercase text-[9px] font-sans font-bold ${
                        log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {log.status}
                      </span>
                      {log.status === 'success' && (
                        <button
                          type="button"
                          onClick={() => handleDownloadBackup(log.backupPath)}
                          className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded text-[10px] font-sans font-medium transition"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PASSWORD CHANGE */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword} className="glass-panel p-6 border-slate-800 space-y-4 max-w-lg">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-display font-semibold text-white text-base">Change Administrator Password</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">New Password *</label>
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full text-xs font-mono"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition"
            >
              Update Password
            </button>
          </div>
        </form>
      )}

      {/* TAB 6: ACTIVITY AUDIT LOG */}
      {activeTab === 'logs' && (
        <div className="glass-panel overflow-hidden border-slate-800">
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 font-semibold text-xs text-slate-300">
            System Activity Audit Trail ({activityLogs.length} Events)
          </div>
          <div className="divide-y divide-slate-800/60 font-mono text-xs max-h-[500px] overflow-y-auto">
            {activityLogs.map((log) => (
              <div key={log._id} className="p-3 px-5 flex items-center justify-between hover:bg-slate-800/30 transition">
                <div>
                  <span className="text-slate-400 font-sans text-[11px] mr-2">
                    {new Date(log.timestamp).toLocaleString('en-GB')}
                  </span>
                  <span className="text-indigo-400 font-semibold uppercase text-[10px] mr-2">
                    [{log.module}]
                  </span>
                  <span className="text-slate-200 font-sans">{log.description}</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  {log.action}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
