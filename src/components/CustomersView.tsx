import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Customer } from '../types';
import { Plus, Edit, Phone, MessageSquare, Mail, MapPin, Landmark, Trash2, Search, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CustomersView() {
  const { customers, currentUser, settings, saveCustomer, deleteCustomer, confirmAction } = useDb();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustId, setEditingCustId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gst, setGst] = useState('');

  if (!currentUser) return null;

  const currency = settings.currency || '₹';
  const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');
  const money = (n: number) => `${currency} ${fmt(n)}`;

  // Filter
  const filteredCustomers = customers.filter(c => {
    const s = search.toLowerCase();
    return !s || 
           c.name.toLowerCase().includes(s) || 
           c.phone.includes(s) || 
           (c.email || '').toLowerCase().includes(s);
  });

  const handleOpenModal = (custId: string | null = null) => {
    if (custId) {
      const c = customers.find(x => x.id === custId);
      if (c) {
        setEditingCustId(custId);
        setName(c.name);
        setPhone(c.phone);
        setEmail(c.email || '');
        setAddress(c.address || '');
        setGst(c.gst || '');
      }
    } else {
      setEditingCustId(null);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setGst('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Please fill out customer name and phone.');
      return;
    }

    saveCustomer({
      id: editingCustId || undefined,
      name,
      phone,
      email,
      address,
      gst,
    });

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    confirmAction({
      title: 'Delete Customer',
      message: 'Are you sure you want to delete this customer? This will clear their historical spend logs from this directory.',
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: () => {
        deleteCustomer(id);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">Customer Directory</h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">View client lists, order frequencies, spending volumes, outstanding dues, and launch instant direct communications.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn py-2.5 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer"
        >
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Toolbar Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by customer name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(cust => {
          const rawPhone = cust.phone.replace(/\D/g, '');
          const waUrl = `https://wa.me/91${rawPhone}`;
          const telUrl = `tel:${rawPhone}`;

          return (
            <motion.div
              layout
              key={cust.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-200 dark:hover:border-slate-700/60 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2">
                {/* Header Name */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm leading-tight">{cust.name}</h3>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Customer ID: {cust.id}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModal(cust.id)}
                      className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-all cursor-pointer"
                    >
                      <Edit size={12} />
                    </button>
                    {(currentUser.role === 'Owner' || currentUser.role === 'Admin' || currentUser.role === 'Manager') && (
                      <button
                        onClick={() => handleDelete(cust.id)}
                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 transition-all cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub details */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold pt-1 border-t border-slate-50 dark:border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span>{cust.phone}</span>
                  </div>
                  {cust.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                  )}
                  {cust.address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                      <span className="leading-tight">{cust.address}</span>
                    </div>
                  )}
                  {cust.gst && (
                    <div className="flex items-center gap-2">
                      <Landmark size={13} className="text-slate-400 shrink-0" />
                      <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">GST: {cust.gst}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial metrics ledger box */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase">Jobs</span>
                  <span className="block text-xs font-black text-slate-700 dark:text-slate-300 mt-0.5">{cust.totalOrders}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase">Total Spend</span>
                  <span className="block text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5 truncate">{money(cust.totalPurchase)}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase">Dues</span>
                  <span className={`block text-xs font-black mt-0.5 truncate ${cust.pendingBalance > 0 ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    {money(cust.pendingBalance)}
                  </span>
                </div>
              </div>

              {/* Comm buttons shortcuts */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <a
                  href={telUrl}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition-all text-center"
                >
                  <Phone size={13} /> Voice Call
                </a>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all text-center cursor-pointer"
                >
                  <MessageSquare size={13} /> WhatsApp
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* FORM MODAL - ADD/EDIT CUSTOMER */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Head */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200">
                  {editingCustId ? 'Modify Client Details' : 'Add Client Record'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Full Customer Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alukkas Jewellers, Kunnamkulam"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold animate-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Mobile / Office Phone"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Email ID</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@domain.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">GST Registration Number</label>
                  <input 
                    type="text" 
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    placeholder="32XXXXX1234X1ZX"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Full Billing Address</label>
                  <textarea 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, Landmark, City, Pincode..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs"
                    rows={2}
                  />
                </div>

                {/* Foot */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/10 px-6 py-4 -mx-6 -mb-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10"
                  >
                    <Save size={14} /> Commit Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
