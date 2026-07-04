import React from 'react';
import { useDb } from '../context/DbContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  FolderHeart, 
  Workflow, 
  Warehouse, 
  BadgeIndianRupee, 
  Contact, 
  BarChart3, 
  Settings, 
  LogOut,
  ScrollText,
  CalendarDays
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Owner', 'Admin', 'Manager', 'Cashier', 'Editor', 'Staff'] },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, roles: ['Owner', 'Admin', 'Manager', 'Cashier', 'Editor', 'Staff'] },
  { id: 'customers', label: 'Customers', icon: Users, roles: ['Owner', 'Admin', 'Manager', 'Cashier'] },
  { id: 'products', label: 'Products', icon: FolderHeart, roles: ['Owner', 'Admin', 'Manager'] },
  { id: 'workflows', label: 'Workflows', icon: Workflow, roles: ['Owner', 'Admin'] },
  { id: 'inventory', label: 'Inventory', icon: Warehouse, roles: ['Owner', 'Admin', 'Manager'] },
  { id: 'expenses', label: 'Expenses', icon: BadgeIndianRupee, roles: ['Owner', 'Admin', 'Manager'] },
  { id: 'staff', label: 'Staff Directory', icon: Contact, roles: ['Owner', 'Admin'] },
  { id: 'attendance', label: 'Attendance', icon: CalendarDays, roles: ['Owner', 'Admin', 'Manager'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['Owner', 'Admin', 'Manager'] },
  { id: 'logs', label: 'System Logs', icon: ScrollText, roles: ['Owner', 'Admin'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['Owner', 'Admin'] }
];

export default function Sidebar({ currentView, onViewChange, isOpen, onToggle }: SidebarProps) {
  const { currentUser, logout, settings } = useDb();

  if (!currentUser) return null;

  const filteredMenuItems = MENU_ITEMS.filter(item => 
    item.roles.includes(currentUser.role)
  );

  return (
    <>
      {/* Mobile Drawer backdrop */}
      {isOpen && (
        <div 
          onClick={onToggle}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] z-30 lg:hidden cursor-pointer"
        />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 h-screen flex flex-col justify-between p-5 transition-all duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
      {/* Brand Logo Header */}
      <div>
        <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white shrink-0 shadow-sm shadow-green-600/10">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <div className="leading-tight min-w-0">
            <span className="block font-semibold text-slate-900 dark:text-slate-100 tracking-tight text-sm truncate">{settings.businessName || 'Grand Digital Media'}</span>
            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-tight">Kunnamkulam, Kerala</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {filteredMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium tracking-tight transition-all duration-150 text-left cursor-pointer ${
                  isActive 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer with Logout */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs uppercase">
            {currentUser.name.charAt(0)}
          </div>
          <div className="leading-none min-w-0">
            <span className="block font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">{currentUser.name}</span>
            <span className="block text-[9px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-bold">{currentUser.role}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-all text-left cursor-pointer"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
    </>
  );
}
