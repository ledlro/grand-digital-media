import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Workflow } from '../types';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, X, Save, ShieldAlert, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function WorkflowsView() {
  const { workflows, currentUser, saveWorkflow, deleteWorkflow, confirmAction } = useDb();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWfId, setEditingWfId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [stageInput, setStageInput] = useState('');
  const [stagesList, setStagesList] = useState<string[]>([]);

  if (!currentUser) return null;

  // Security guard (Only Owner or Admin role can edit workflows)
  if (currentUser.role !== 'Owner' && currentUser.role !== 'Admin') {
    return (
      <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-500/10 p-6 rounded-2xl text-center max-w-md mx-auto my-12">
        <ShieldAlert className="text-red-500 mx-auto mb-2" size={24} />
        <h4 className="font-bold text-red-800 dark:text-red-400 text-sm">Access Denied</h4>
        <p className="text-xs text-red-600 dark:text-red-500/80 mt-1">
          Production workflow configurations represent critical business process pipelines. Only Owner or Administrator can alter these routes.
        </p>
      </div>
    );
  }

  const handleOpenModal = (wfId: string | null = null) => {
    if (wfId) {
      const w = workflows.find(x => x.id === wfId);
      if (w) {
        setEditingWfId(wfId);
        setName(w.name);
        setStagesList([...w.stages]);
      }
    } else {
      setEditingWfId(null);
      setName('');
      setStagesList([]);
    }
    setStageInput('');
    setIsModalOpen(true);
  };

  const handleAddStage = () => {
    const cleanStage = stageInput.trim();
    if (!cleanStage) return;
    if (stagesList.includes(cleanStage)) {
      alert('This stage name already exists in the workflow sequence.');
      return;
    }
    setStagesList([...stagesList, cleanStage]);
    setStageInput('');
  };

  const handleRemoveStage = (index: number) => {
    setStagesList(stagesList.filter((_, i) => i !== index));
  };

  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    const nextIdx = index + (direction === 'up' ? -1 : 1);
    if (nextIdx < 0 || nextIdx >= stagesList.length) return;

    const swapped = [...stagesList];
    const temp = swapped[index];
    swapped[index] = swapped[nextIdx];
    swapped[nextIdx] = temp;
    setStagesList(swapped);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a workflow name.');
      return;
    }
    if (stagesList.length === 0) {
      alert('A production workflow must contain at least one intermediate stage.');
      return;
    }

    saveWorkflow({
      id: editingWfId || undefined,
      name,
      stages: stagesList
    });

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    confirmAction({
      title: 'Delete Workflow',
      message: 'Are you sure you want to delete this workflow? Active catalog items pointing to this workflow might experience state mismatches.',
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: () => {
        deleteWorkflow(id);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">Production Pipeline Workflows</h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Map out exact linear stages that jobs must go through. Editors and printers advance these sequentially, one step at a time.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn py-2.5 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer"
        >
          <Plus size={16} /> New Workflow
        </button>
      </div>

      {/* Info notice */}
      <div className="bg-blue-50/50 dark:bg-slate-800/30 border border-blue-500/10 p-4 rounded-xl text-xs text-blue-700 dark:text-blue-400 flex items-start gap-2.5">
        <Sparkles size={16} className="mt-0.5 shrink-0" />
        <div>
          <strong>Note on Workflow Sequences:</strong> Every custom pipeline automatically starts at <strong>Pending</strong> and ends at <strong>Delivered</strong>. Adding intermediate stages below binds operators to follow the sequence strictly (e.g. <em>Pending ➔ Designing ➔ Printing ➔ Ready ➔ Delivered</em>).
        </div>
      </div>

      {/* Workflows Cards */}
      <div className="space-y-4">
        {workflows.map(wf => {
          const fullStages = ['Pending', ...wf.stages];
          if (!fullStages.includes('Ready')) fullStages.push('Ready');
          if (!fullStages.includes('Delivered')) fullStages.push('Delivered');

          return (
            <motion.div
              layout
              key={wf.id}
              className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">{wf.name}</h3>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Pipeline ID: {wf.id} · Created by {wf.createdBy}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(wf.id)}
                    className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 cursor-pointer"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(wf.id)}
                    className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Progress Pipeline Flow display */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {fullStages.map((stage, idx) => (
                  <React.Fragment key={stage}>
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                      stage === 'Pending' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
                      stage === 'Delivered' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      stage === 'Ready' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                      'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                      {stage}
                    </span>
                    {idx < fullStages.length - 1 && (
                      <span className="text-slate-300 dark:text-slate-700 font-bold text-xs select-none">➔</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* WORKFLOW FORM MODAL */}
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
                  {editingWfId ? 'Edit Production Workflow' : 'Construct Production Workflow'}
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
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Workflow Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Flex Printing Standard, Album Binding"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>

                {/* Add Stage Inputs */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Add Intermediate Stage</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={stageInput}
                      onChange={(e) => setStageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddStage();
                        }
                      }}
                      placeholder="e.g. Lamination, Cutting, Framing"
                      className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddStage}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Stages Sequence list chips with Up/Down buttons */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Interactive Stages Sequence</label>
                  <div className="space-y-2 mt-2">
                    {stagesList.length === 0 ? (
                      <span className="text-slate-400 italic text-xs">No intermediate stages added. Pipeline will jump from Pending to Ready.</span>
                    ) : (
                      stagesList.map((stage, i) => (
                        <div key={stage} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            <span className="text-slate-400 font-semibold mr-1.5">{i+1}.</span>
                            {stage}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {/* Reorder up */}
                            <button
                              type="button"
                              onClick={() => handleMoveStage(i, 'up')}
                              disabled={i === 0}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30"
                            >
                              <ArrowUp size={12} />
                            </button>
                            {/* Reorder down */}
                            <button
                              type="button"
                              onClick={() => handleMoveStage(i, 'down')}
                              disabled={i === stagesList.length - 1}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30"
                            >
                              <ArrowDown size={12} />
                            </button>
                            {/* Remove stage */}
                            <button
                              type="button"
                              onClick={() => handleRemoveStage(i)}
                              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Foot buttons */}
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
                    <Save size={14} /> Commit Pipeline
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
