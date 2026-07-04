import React, { useState, useEffect } from 'react';
import { DbProvider, useDb } from './context/DbContext';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardView from './components/DashboardView';
import OrdersView from './components/OrdersView';
import ProductsView from './components/ProductsView';
import WorkflowsView from './components/WorkflowsView';
import CustomersView from './components/CustomersView';
import InventoryView from './components/InventoryView';
import ExpensesView from './components/ExpensesView';
import StaffView from './components/StaffView';
import AttendanceView from './components/AttendanceView';
import SettingsView from './components/SettingsView';
import LogsView from './components/LogsView';
import ReportsView from './components/ReportsView';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { currentUser, settings } = useDb();
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchFilter, setSearchFilter] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto close sidebar on smaller viewports on initial load
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!currentUser) {
    return <LoginScreen />;
  }

  // Map settings.theme to Tailwind color classes
  const getThemeClass = () => {
    switch (settings.theme) {
      case 'emerald':
        return 'theme-emerald';
      case 'indigo':
        return 'theme-indigo';
      default:
        return 'theme-blue';
    }
  };

  const handleSearchSubmit = (query: string) => {
    setSearchFilter(query);
    setCurrentView('orders');
  };

  const handleViewChange = (view: string) => {
    setSearchFilter(''); // clear search filter on navigation
    setCurrentView(view);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false); // Auto close sidebar on mobile
    }
  };

  // Render view router
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onViewChange={handleViewChange} />;
      case 'orders':
        return <OrdersView searchFilter={searchFilter} />;
      case 'products':
        return <ProductsView />;
      case 'workflows':
        return <WorkflowsView />;
      case 'customers':
        return <CustomersView />;
      case 'inventory':
        return <InventoryView />;
      case 'expenses':
        return <ExpensesView />;
      case 'staff':
        return <StaffView />;
      case 'attendance':
        return <AttendanceView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      case 'logs':
        return <LogsView />;
      default:
        return <DashboardView onViewChange={handleViewChange} />;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors ${getThemeClass()}`}>
      
      {/* Drawer Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={handleViewChange} 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main viewport area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Universal Headbar */}
        <Topbar 
          onSearch={handleSearchSubmit} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Dynamic page container */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DbProvider>
      <AppContent />
    </DbProvider>
  );
}
