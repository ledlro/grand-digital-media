import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Product } from '../types';
import { Plus, Edit, Trash2, Save, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ProductsView() {
  const { products, workflows, currentUser, settings, saveProduct, deleteProduct, confirmAction } = useDb();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState(0);
  const [gstPercent, setGstPercent] = useState(18);
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState(0);
  const [minimumStock, setMinimumStock] = useState(0);
  const [stockIn, setStockIn] = useState(0);
  const [stockOut, setStockOut] = useState(0);
  const [supplier, setSupplier] = useState('');
  const [workflowId, setWorkflowId] = useState('');

  if (!currentUser) return null;

  // Security guard
  if (!['Owner', 'Admin', 'Manager'].includes(currentUser.role)) {
    return (
      <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-500/10 p-6 rounded-2xl text-center max-w-md mx-auto my-12">
        <Info className="text-red-500 mx-auto mb-2" size={24} />
        <h4 className="font-bold text-red-800 dark:text-red-400 text-sm">Access Restricted</h4>
        <p className="text-xs text-red-600 dark:text-red-500/80 mt-1">
          Catalog and Product settings can only be altered by owners or shop managers. Please contact administrator if this is an error.
        </p>
      </div>
    );
  }

  const currency = settings.currency || '₹';

  const handleOpenModal = (prodId: string | null = null) => {
    if (prodId) {
      const p = products.find(x => x.id === prodId);
      if (p) {
        setEditingProdId(prodId);
        setName(p.name);
        setCategory(p.category);
        setPrice(p.price);
        setGstPercent(p.gstPercent);
        setDescription(p.description || '');
        setStock(p.stock);
        setMinimumStock(p.minimumStock || 0);
        setStockIn(p.stockIn || 0);
        setStockOut(p.stockOut || 0);
        setSupplier(p.supplier || '');
        setWorkflowId(p.workflowId || '');
      }
    } else {
      setEditingProdId(null);
      setName('');
      setCategory('');
      setPrice(0);
      setGstPercent(18);
      setDescription('');
      setStock(0);
      setMinimumStock(0);
      setStockIn(0);
      setStockOut(0);
      setSupplier('');
      setWorkflowId('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price < 0 || stock < 0) {
      alert('Please fill in valid name, positive price, and stock quantity.');
      return;
    }

    saveProduct({
      id: editingProdId || undefined,
      name,
      category,
      price,
      gstPercent,
      description,
      stock,
      minimumStock,
      stockIn,
      stockOut,
      supplier,
      workflowId
    });

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    confirmAction({
      title: 'Delete Product',
      message: 'Are you sure you want to delete this catalog item? This will sever references from future order quick-fills.',
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: () => {
        deleteProduct(id);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">Product Catalog</h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Configure standard shop materials, base pricing, GST brackets, and map them to production workflows.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn py-2.5 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer"
        >
          <Plus size={16} /> New Product Catalog
        </button>
      </div>

      {/* Grid List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Product ID</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Product Name / Description</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Base Rate</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">GST Bracket</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Virtual Stock</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Supplier</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Production Pipe</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {products.map(p => {
                const boundWf = workflows.find(w => w.id === p.workflowId);
                const isLow = p.stock < (p.minimumStock || 0);
                return (
                  <tr key={p.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${isLow ? 'bg-rose-500/5 dark:bg-rose-950/5' : ''}`}>
                    <td className="p-4 font-extrabold text-slate-800 dark:text-slate-200">{p.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-slate-300">{p.name}</div>
                      {p.description && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[280px] leading-relaxed truncate" title={p.description}>
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-400">{p.category}</td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                      {currency} {p.price.toFixed(2)}
                    </td>
                    <td className="p-4 font-bold text-slate-500 dark:text-slate-400">{p.gstPercent}% GST</td>
                    <td className="p-4 font-bold text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className={isLow ? 'text-rose-600 dark:text-rose-400' : ''}>{p.stock.toLocaleString()} units</span>
                        {isLow && (
                          <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[8px] font-black uppercase tracking-wider animate-pulse">
                            Low
                          </span>
                        )}
                      </div>
                      {(p.minimumStock ?? 0) > 0 && (
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Min: {p.minimumStock}</div>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-semibold">{p.supplier || 'N/A'}</td>
                    <td className="p-4">
                      {boundWf ? (
                        <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider">
                          🔄 {boundWf.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No workflow bound</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => handleOpenModal(p.id)}
                          className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 cursor-pointer transition-all"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
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

      {/* FORM MODAL - ADD/EDIT PRODUCT */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Head */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200">
                  {editingProdId ? 'Edit Catalog Product' : 'Add Catalog Product'}
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
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Product Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Star Glossy Flex 10x8ft"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Category</label>
                    <input 
                      type="text" 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Flex Printing"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Base Price / sq.ft or Unit ({currency})</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">GST Bracket %</label>
                    <input 
                      type="number" 
                      value={gstPercent}
                      onChange={(e) => setGstPercent(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="e.g. 18"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Initial Stock Count</label>
                    <input 
                      type="number" 
                      value={stock}
                      onChange={(e) => setStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Minimum Alert Level</label>
                    <input 
                      type="number" 
                      value={minimumStock}
                      onChange={(e) => setMinimumStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                    />
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
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Stock In</label>
                    <input 
                      type="number" 
                      value={stockIn}
                      onChange={(e) => setStockIn(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Stock Out</label>
                    <input 
                      type="number" 
                      value={stockOut}
                      onChange={(e) => setStockOut(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Workflow Pipeline</label>
                  <select
                    value={workflowId}
                    onChange={(e) => setWorkflowId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold"
                  >
                    <option value="">-- No Workflow / Immediate ready --</option>
                    {workflows.map(wf => (
                      <option key={wf.id} value={wf.id}>{wf.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Product Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter item specs and billing properties..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs"
                    rows={2}
                  />
                </div>

                {/* Foot */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/10 px-6 py-4">
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
                    <Save size={14} /> Commit Changes
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