import React from 'react';
import { useDb } from '../context/DbContext';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default function LogsView() {
  const { logs, currentUser } = useDb();

  if (!currentUser) return null;

  // Security guard (Only Owner and Admin can read security logs)
  if (currentUser.role !== 'Owner' && currentUser.role !== 'Admin') {
    return (
      <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-500/10 p-6 rounded-2xl text-center max-w-md mx-auto my-12">
        <ShieldAlert className="text-red-500 mx-auto mb-2" size={24} />
        <h4 className="font-bold text-red-800 dark:text-red-400 text-sm">Access Restricted</h4>
        <p className="text-xs text-red-600 dark:text-red-500/80 mt-1">
          System telemetry and database change logs represent privileged data. Only Owner K. Devadas or Administrators can query these audit logs.
        </p>
      </div>
    );
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">System Audit Log</h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Query real-time database modifications, operator login history, and order state advancements.</p>
        </div>
      </div>

      {/* Logs Card List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Telemetry Logs ({logs.length} events logged)</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
            <RefreshCw size={10} className="animate-spin" /> Live Listening
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/40 max-h-[60vh] overflow-y-auto">
          {logs.map((log, idx) => {
            const isLogin = log.action.includes('LOGIN');
            const isDelete = log.action.includes('DELETE');
            const isStatus = log.action.includes('STATUS');

            return (
              <div key={idx} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      isLogin ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      isDelete ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black' :
                      isStatus ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {log.action}
                    </span>
                    <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      👤 {log.user}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {log.details}
                  </p>
                </div>
                <div className="text-right text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex sm:flex-col gap-1 sm:gap-0 mt-1 sm:mt-0">
                  <span>{formatDate(log.timestamp)}</span>
                  <span className="sm:mt-0.5">{formatTime(log.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
