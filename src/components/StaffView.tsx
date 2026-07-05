import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Staff } from '../types';
import { Plus, Edit, Trash2, Save, X, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function StaffView() {
  const { staffList, currentUser, saveStaff, deleteStaff, confirmAction } = useDb();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Staff');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  if (!currentUser) return null;

  // Security guard (Only Owner or Admin role can view/manage staff)
  if (currentUser.role !== 'Owner' && currentUser.role !== 'Admin') {
    return (
      <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-500/10 p-6 rounded-2xl text-center max-w-md mx-auto my-12">
        <ShieldAlert className="text-red-500 mx-auto mb-2" size={24} />
        <h4 className="font-bold text-red-800 dark:text-red-400 text-sm">Access Denied</h4>
        <p className="text-xs text-red-600 dark:text-red-500/80 mt-1">
          Staff personnel listings and authorization credentials represent critical security parameters. Only Owner or Administrator can manage this console.
        </p>
      </div>
    );
  }

  const handleOpenModal = (stfId: string | null = null) => {
    if (stfId) {
      const s = staffList.find(x => x.id === stfId);
      if (s) {
        setEditingStaffId(stfId);
        setName(s.name);
        setUsername(s.username);
        setPassword(''); // Always reset password input for editing (only input if overriding!)
        setRole(s.role);
        setPhone(s.phone || '');
        setEmail(s.email || '');
        setStatus(s.status || 'Active');
      }
    } else {
      setEditingStaffId(null);
      setName('');
      setUsername('');
      setPassword('');
      setRole('Staff');
      setPhone('');
      setEmail('');
      setStatus('Active');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      alert('Please fill out full name and active login username.');
      return;
    }
    if (!editingStaffId && !password.trim()) {
      alert('Password is required for registration of new personnel.');
      return;
    }

    saveStaff({
      id: editingStaffId || undefined,
      name,
      username: username.toLowerCase().trim(),
      role: role as any,
      phone,
      email,
      status,
    }, password || undefined);

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const target = staffList.find(s => s.id === id);
    if (target?.role === 'Owner') {
      alert('Root owner credentials cannot be severed.');
      return;
    }
    if (target?.role === 'Admin' && currentUser.role !== 'Owner') {
      alert('Only the Owner can delete Administrator accounts.');
      return;
    }
    confirmAction({
      title: 'Delete Staff Credentials',
      message: `Permanently delete account credentials for ${target?.name}? This will block their subsequent access.`,
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: () => {
        deleteStaff(id);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">Staff Credentials Console</h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Register workshop editors, counter cashiers, managers, and set access parameters.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn py-2.5 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer"
        >
          <Plus size={16} /> Register Staff
        </button>
      </div>

      {/* Staff Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map(stf => {
          const isOwner = stf.role === 'Owner';
          const activePass = stf.password || (stf.username === 'admin' ? 'admin123' : `${stf.username}123`);
          return (
            <motion.div
              layout
              key={stf.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-200 dark:hover:border-slate-700/60 transition-all"
            >
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      {stf.role}
                    </span>
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-1.5">{stf.name}</h3>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModal(stf.id)}
                      className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-all cursor-pointer"
                    >
                      <Edit size={12} />
                    </button>
                    {!isOwner && (
                      <button
                        onClick={() => handleDelete(stf.id)}
                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 transition-all cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Properties */}
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 font-semibold border-t border-slate-50 dark:border-slate-800/50 pt-2">
                  <div>Username: <span className="font-bold text-slate-800 dark:text-slate-200">{stf.username}</span></div>
                  <div>Phone: <span>{stf.phone || 'N/A'}</span></div>
                  {stf.email && <div>Email: <span className="truncate block">{stf.email}</span></div>}
                </div>
              </div>

              {/* Status and Default Credentials Hints */}
              <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/50 flex justify-between items-center">
                <div className="text-[10px] text-slate-400 font-medium">
                  Active Pass: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300 font-bold">{activePass}</code>
                </div>
                <div className="flex items-center gap-1">
                  {stf.status === 'Active' ? (
                    <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600">
                      <CheckCircle size={12} /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-xs font-bold text-rose-500">
                      <XCircle size={12} /> Suspended
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* REGISTER FORM MODAL */}
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
                  {editingStaffId ? 'Edit Staff parameters' : 'Register Shop Staff'}
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
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Login Username</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. ramesh"
                      disabled={!!editingStaffId && username === 'admin'}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold disabled:opacity-55"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      {editingStaffId ? 'Override Password' : 'Login Password'}
                    </label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingStaffId ? 'Leave blank to retain' : 'Enter login password'}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                      required={!editingStaffId}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Assign Security Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                    >
                      <option value="Owner">Owner</option>
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Cashier">Cashier</option>
                      <option value="Editor">Editor (Designer)</option>
                      <option value="Staff">Staff (Operator)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Staff Access Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                    >
                      <option value="Active">Active / Enabled</option>
                      <option value="Inactive">Suspended / Blocked</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="94XXXXXXXX"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Email ID</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@domain.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold"
                    />
                  </div>
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
                    <Save size={14} /> Save Staff Card
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
