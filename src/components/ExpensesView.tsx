import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Expense } from '../types';
import { Plus, Edit, Trash2, Save, X, Info, Receipt, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ExpensesView() {
  const { expenses, currentUser, settings, saveExpense, deleteExpense, confirmAction } = useDb();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [category, setCategory] = useState('Raw Materials');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);

  if (!currentUser) return null;

  // Security guard (Only Owner, Admin & Manager roles)
  if (!['Owner', 'Admin', 'Manager'].includes(currentUser.role)) {
    return (
      <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-500/10 p-6 rounded-2xl text-center max-w-md mx-auto my-12">
        <Info className="text-red-500 mx-auto mb-2" size={24} />
        <h4 className="font-bold text-red-800 dark:text-red-400 text-sm">Access Restricted</h4>
        <p className="text-xs text-red-600 dark:text-red-500/80 mt-1">
          Cash outflow ledger records and expense items are restricted to Owners, Managers, and Administrators.
        </p>
      </div>
    );
  }

  const currency = settings.currency || '₹';
  const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');
  const money = (n: number) => `${currency} ${fmt(n)}`;

  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthlyExpenses = expenses.filter(e => e.date.substring(0, 7) === currentMonth);
  const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleOpenModal = (expId: string | null = null) => {
    if (expId) {
      const e = expenses.find(x => x.id === expId);
      if (e) {
        setEditingExpId(expId);
        setDate(e.date);
        setCategory(e.category);
        setDescription(e.description);
        setAmount(e.amount);
      }
    } else {
      setEditingExpId(null);
      setDate(new Date().toISOString().substring(0, 10));
      setCategory('Raw Materials');
      setDescription('');
      setAmount(0);
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) {
      alert('Please fill out a valid description and a positive amount.');
      return;
    }

    saveExpense({
      id: editingExpId || undefined,
      date,
      category,
      description,
      amount
    });

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    confirmAction({
      title: 'Delete Expense Record',
      message: 'Are you sure you want to delete this expense record? This will modify the net profit balances for this month.',
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: () => {
        deleteExpense(id);
      }
    });
  };

  const categories = ['Raw Materials', 'Electricity', 'Rent', 'Salaries', 'Maintenance', 'Others'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">Expenses Ledger</h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Record cash outlays for suppliers, utility payments, space rent, and raw material replenishments.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn py-2.5 px-4 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-lg shadow-rose-500/10 cursor-pointer"
        >
          <Plus size={16} /> Log Expense
        </button>
      </div>

      {/* Summary metric card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <span className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-600">
            <TrendingDown size={24} />
          </span>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">This Month's Outflow</span>
            <span className="block text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">{money(monthlyTotal)}</span>
          </div>
        </div>
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <span className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500">
            <Receipt size={24} />
          </span>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total logged records</span>
            <span className="block text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">{expenses.length} bills</span>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Expense ID</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Bill Date</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Expenditure Description</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Logged By</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Total Outflow</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 font-extrabold text-slate-800 dark:text-slate-200">{exp.id}</td>
                  <td className="p-4 font-semibold text-slate-600 dark:text-slate-400">
                    {new Date(exp.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="p-4">
                    <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-700 dark:text-slate-300 max-w-xs truncate" title={exp.description}>
                    {exp.description}
                  </td>
                  <td className="p-4 font-bold text-slate-500 uppercase tracking-wider">👤 {exp.addedBy}</td>
                  <td className="p-4 font-extrabold text-rose-500 text-sm">{money(exp.amount)}</td>
                  <td className="p-4 text-right">
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => handleOpenModal(exp.id)}
                        className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 cursor-pointer transition-all"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 cursor-pointer transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL - ADD/EDIT EXPENSE */}
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
                  {editingExpId ? 'Edit Outflow Bill' : 'Log Business Outflow'}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Bill Date</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Outflow Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Amount Paid ({currency})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-black text-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Bill Description / Details</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Purchased 10 units solvent cyan ink cartridge, invoiced from Roland"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold"
                    rows={3}
                    required
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
                    <Save size={14} /> Commit Bill
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
