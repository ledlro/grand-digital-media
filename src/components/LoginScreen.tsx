import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { motion } from 'motion/react';
import { ShieldCheck, User, Lock, ArrowRight } from 'lucide-react';

export default function LoginScreen() {
  const { login } = useDb();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await login(username, password);
      if (!res.success) {
        setError(res.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-screen" className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 min-h-screen w-full px-4 transition-colors">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="login-card w-full max-w-[400px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-xl shadow-blue-600/5 text-slate-900 dark:text-slate-100"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="login-logo w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-lg mb-4 shadow-md shadow-blue-600/20">
            GDM
          </div>
          <h1 className="text-xl font-bold text-center tracking-tight text-slate-900 dark:text-slate-50">Grand Digital Media</h1>
          <p className="sub text-xs text-slate-500 dark:text-slate-400 mt-1 text-center font-medium">Kunnamkulam · Shop Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                <User size={15} />
              </span>
              <input 
                id="login-username"
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username" 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-950 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                <Lock size={15} />
              </span>
              <input 
                id="login-password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password" 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-950 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-red-600 dark:text-red-400 text-xs text-center font-medium bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 py-2 rounded-lg mt-2"
            >
              {error}
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all hover:bg-blue-700 active:scale-[0.98] mt-4 flex items-center justify-center gap-2 shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/15 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Login'}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400 dark:text-slate-500">
          <p className="flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck size={12} className="text-blue-500" /> Authorized staff portal.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
