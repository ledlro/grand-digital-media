import React from 'react';
import { useDb } from '../context/DbContext';
import { Search, Sun, Moon, Sparkles, Menu } from 'lucide-react';

interface TopbarProps {
  onSearch: (query: string) => void;
  onToggleSidebar?: () => void;
}

export default function Topbar({ onSearch, onToggleSidebar }: TopbarProps) {
  const { currentUser, settings, saveSettings } = useDb();

  if (!currentUser) return null;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  const toggleDarkMode = () => {
    const nextDark = !settings.darkMode;
    saveSettings({
      ...settings,
      darkMode: nextDark
    });
    
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Sync initial dark mode class
  React.useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  return (
    <header className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 h-16 px-6 flex items-center justify-between z-30 transition-colors">
      <div className="flex items-center">
        {/* Sidebar toggle for mobile */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-500 mr-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Menu size={16} />
          </button>
        )}

        {/* Search Input Box */}
        <div className="relative w-80 max-w-full hidden sm:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
            <Search size={16} />
          </span>
          <input
            id="global-search"
            type="text"
            placeholder="Search orders, phone, customer, invoices..."
            onChange={handleSearchChange}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 pl-10 pr-4 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/80 transition-all"
          />
        </div>
      </div>

      {/* Topbar Right Panel */}
      <div className="flex items-center gap-4">
        {/* Quick Greeting */}
        <div className="hidden sm:flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-[10px] font-bold text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
          <Sparkles size={11} />
          Kunnamkulam Live Portal
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-9 h-9 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
          title={settings.darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {settings.darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Active Profile Info */}
        <div className="h-9 border-l border-slate-100 dark:border-slate-800 pl-4 flex items-center gap-2.5">
          <div className="text-right leading-none hidden md:block">
            <span className="block font-bold text-xs text-slate-800 dark:text-slate-200">
              {currentUser.name}
            </span>
            <span className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
              {currentUser.role} {currentUser.role === 'Owner' && '(KD)'}
            </span>
          </div>
          
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/10 uppercase">
            {currentUser.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
