import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { InventoryItem } from '../types';
import { Plus, Edit, Trash2, Save, X, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InventoryView() {
  const { inventory, saveInventoryItem, deleteInventoryItem, currentUser, confirmAction } = useDb();

  // Load inventory list directly from DbContext
  const inventoryList = inventory || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemName, setEditingItemName] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [stock, setStock] = useState(0);
  const [minimumStock, setMinimumStock] = useState(0);
  const [stockIn, setStockIn] = useState(0);
  const [stockOut, setStockOut] = useState(0);
  const [supplier, setSupplier] = useState('');

  if (!currentUser) return null;

  // Security check (only Owner, Admin & Manager roles)
  if (!['Owner', 'Admin', 'Manager'].includes(currentUser.role)) {
    return (
      <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-500/10 p-6 rounded-2xl text-center max-w-md mx-auto my-12">
        <Info className="text-red-500 mx-auto mb-2" size={24} />
        <h4 className="font-bold text-red-800 dark:text-red-400 text-sm">Access Denied</h4>
        <p className="text-xs text-red-600 dark:text-red-500/80 mt-1">
          Raw materials and inventory stock records can only be managed by administrators and shop managers.
        </p>
      </div>
    );
  }

  const handleOpenModal = (itemName: string | null = null) => {
    if (itemName) {
      const item = inventoryList.find(i => i.name.toLowerCase() === itemName.toLowerCase());
      if (item) {
        setEditingItemName(itemName);
        setName(item.name);
        setStock(item.stock);
        setMinimumStock(item.minimumStock);
        setStockIn(item.stockIn);
        setStockOut(item.stockOut);
        setSupplier(item.supplier || '');
      }
    } else {
      setEditingItemName(null);
      setName('');
      setStock(0);
      setMinimumStock(0);
      setStockIn(0);
      setStockOut(0);
      setSupplier('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || stock < 0 || minimumStock < 0) {
      alert('Please enter valid name, stock levels, and threshold limits.');
      return;
    }

    saveInventoryItem({
      name,
      stock,
      minimumStock,
      stockIn,
      stockOut,
      supplier,
      lastUpdated: new Date().toISOString()
    });

    setIsModalOpen(false);
  };

  const handleDelete = (itemName: string) => {
    confirmAction({
      title: 'Delete Inventory Item',
      message: `Are you sure you want to delete inventory item "${itemName}"?`,
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: () => {
        deleteInventoryItem(itemName);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">Workshop Inventory</h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Track raw printing sheets, LED lights, framing supplies, solvent inks, and receive low-stock alerts before runs block.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn py-2.5 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer"
        >
          <Plus size={16} /> New Material Entry
        </button>
      </div>

      {/* Inventory table list */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Item Description</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Current Stock</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Threshold limit</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Stock In (Total)</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Stock Out (Total)</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Supplier Address</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Last Sync</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {inventoryList.map(item => {
                const isLow = item.stock < item.minimumStock;
                return (
                  <tr 
                    key={item.name} 
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${
                      isLow ? 'bg-rose-500/5 dark:bg-rose-950/5' : ''
                    }`}
                  >
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        {item.name}
                        {isLow && (
                          <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[8px] font-black uppercase tracking-wider animate-pulse">
                            <AlertTriangle size={10} /> Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-black text-sm text-slate-700 dark:text-slate-300">
                      <span className={isLow ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-500 dark:text-slate-400">Min: {item.minimumStock}</td>
                    <td className="p-4 font-medium text-slate-500 dark:text-slate-400">+{item.stockIn}</td>
                    <td className="p-4 text-rose-500 font-medium">-{item.stockOut}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-semibold">{item.supplier || 'N/A'}</td>
                    <td className="p-4 text-slate-400 dark:text-slate-500">{new Date(item.lastUpdated).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => handleOpenModal(item.name)}
                          className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 cursor-pointer transition-all"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.name)}
                          className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 cursor-pointer transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200">
                  {editingItemName ? 'Update Stock Card' : 'Add Inventory Entry'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Item Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Star Media Flex Roll (10ft x 100ft)"
                    disabled={!!editingItemName}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold disabled:opacity-50"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Current Stock Count</label>
                    <input 
                      type="number" 
                      value={stock}
                      onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Minimum Alert level</label>
                    <input 
                      type="number" 
                      value={minimumStock}
                      onChange={(e) => setMinimumStock(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Stock In</label>
                    <input 
                      type="number" 
                      value={stockIn}
                      onChange={(e) => setStockIn(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Stock Out</label>
                    <input 
                      type="number" 
                      value={stockOut}
                      onChange={(e) => setStockOut(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Primary Supplier Name</label>
                  <input 
                    type="text" 
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="e.g. Classic Media Cochin"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold"
                  />
                </div>

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
                    <Save size={14} /> Commit Stock Card
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
