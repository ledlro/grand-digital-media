import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Settings } from '../types';
import { Save, Info, Check, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SettingsView() {
  const { settings, saveSettings, currentUser } = useDb();

  const [businessName, setBusinessName] = useState(settings.businessName || '');
  const [logo, setLogo] = useState(settings.logo || '');
  const [gstNumber, setGstNumber] = useState(settings.gstNumber || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [email, setEmail] = useState(settings.email || '');
  const [address, setAddress] = useState(settings.address || '');
  const [website, setWebsite] = useState(settings.website || '');
  const [invoiceFooter, setInvoiceFooter] = useState(settings.invoiceFooter || '');
  const [currency, setCurrency] = useState(settings.currency || '₹');
  const [theme, setTheme] = useState(settings.theme || 'blue');

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!currentUser) return null;

  // Security guard (Only Owner, Admin and Manager roles can alter parameters)
  if (!['Owner', 'Admin', 'Manager'].includes(currentUser.role)) {
    return (
      <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-500/10 p-6 rounded-2xl text-center max-w-md mx-auto my-12">
        <ShieldAlert className="text-red-500 mx-auto mb-2" size={24} />
        <h4 className="font-bold text-red-800 dark:text-red-400 text-sm">Access Restricted</h4>
        <p className="text-xs text-red-600 dark:text-red-500/80 mt-1">
          Shop settings, billing formats, and company credentials can only be reconfigured by Owners or Managers.
        </p>
      </div>
    );
  }

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings({
      businessName,
      logo,
      gstNumber,
      phone,
      email,
      address,
      website,
      invoiceFooter,
      currency,
      theme,
      darkMode: settings.darkMode || false
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">General settings</h2>
        <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Configure your official shop header information, invoice terms, taxation values, and regional preferences.</p>
      </div>

      {/* Settings Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSaveSettings} className="space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Business Name</label>
              <input 
                type="text" 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Company logo text</label>
              <input 
                type="text" 
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">State GST Registration No.</label>
              <input 
                type="text" 
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="e.g. 32AAAAA1111A1Z1"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Currency Symbol</label>
                <input 
                  type="text" 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Theme Accent</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                >
                  <option value="blue">Slate Blue</option>
                  <option value="indigo">Royal Purple</option>
                  <option value="emerald">Classic Green</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Official Contact Phone</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Billing Email ID</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Official Address</label>
            <textarea 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-medium"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Invoice Disclaimers / Footer Terms</label>
            <textarea 
              value={invoiceFooter}
              onChange={(e) => setInvoiceFooter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-medium"
              rows={2}
            />
          </div>

          {/* Alert Success Banner */}
          <AnimatePresence>
            {savedSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/10 p-3 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5"
              >
                <Check size={16} /> Parameters saved to memory cache and local storage successfully.
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action trigger */}
          <div className="pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-5 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-lg shadow-blue-500/15 cursor-pointer"
            >
              <Save size={16} /> Save Configuration
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
