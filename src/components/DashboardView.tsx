import React from 'react';
import { useDb } from '../context/DbContext';
import { Order, InventoryItem, Customer } from '../types';
import { 
  Calendar, 
  TrendingUp, 
  Hourglass, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  Coins, 
  Receipt, 
  Wallet, 
  Flame, 
  AlertTriangle,
  UserCheck,
  ChevronRight,
  Award,
  TrendingDown,
  Check,
  CreditCard,
  ExternalLink,
  Clock,
  Sparkles,
  Layers,
  Search,
  Edit,
  Save,
  User,
  ShoppingBag,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DashboardView({ onViewChange }: { onViewChange: (view: string) => void }) {
  const { 
    orders, 
    expenses, 
    inventory, 
    customers, 
    currentUser, 
    settings, 
    staffList, 
    saveOrder, 
    updateOrderStatus, 
    saveExpense,
    logActivity  
  } = useDb();

  if (!currentUser) return null;

  // Role determinations
  const isOwnerOrAdmin = ['Owner', 'Admin'].includes(currentUser.role);
  const isManager = currentUser.role === 'Manager';
  const isCashier = currentUser.role === 'Cashier';
  const isEditorOrStaff = ['Editor', 'Staff'].includes(currentUser.role);

  const currency = settings.currency || '₹';

  // Helper formats
  const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');
  const money = (n: number) => `${currency} ${fmt(n)}`;

  // Date constants
  const todayStr = new Date().toISOString().substring(0, 10);
  const startOf = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().substring(0, 10);
  };
  
  const sevenDaysAgo = startOf(7);
  const currentYearMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const currentYear = new Date().getFullYear().toString();

  // Local state for Cashier & Staff dashboards
  const [settlingOrder, setSettlingOrder] = React.useState<Order | null>(null);
  const [settleMethod, setSettleMethod] = React.useState<string>('Cash');
  const [cashierSearch, setCashierSearch] = React.useState<string>('');

  // Cash drawer & Petty cash
  const [openingBalance, setOpeningBalance] = React.useState<number>(1000); // defaults to 1000
  const [cashExpAmount, setCashExpAmount] = React.useState<string>('');
  const [cashExpReason, setCashExpReason] = React.useState<string>('');
  const [cashExpCategory, setCashExpCategory] = React.useState<string>('Tea & Snacks');
  const [showShiftSummary, setShowShiftSummary] = React.useState<boolean>(false);
  const [expenseSuccess, setExpenseSuccess] = React.useState<string>('');

  const handleLogRegisterExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(cashExpAmount);
    if (isNaN(amt) || amt <= 0 || !cashExpReason.trim()) return;

    const newExp = {
      id: `EXP-${Date.now()}`,
      date: new Date().toISOString().substring(0, 10),
      category: cashExpCategory,
      description: `[Register Cash Pay] ${cashExpReason.trim()}`,
      amount: amt,
      addedBy: currentUser.username
    };

    await saveExpense(newExp);
    logActivity(
      currentUser.username,
      'LOG_EXPENSE',
      `Cashier registered direct petty cash payout of ${money(amt)} for "${cashExpReason.trim()}"`
    );

    setCashExpAmount('');
    setCashExpReason('');
    setExpenseSuccess(`Recorded payout of ${money(amt)} successfully!`);
    setTimeout(() => {
      setExpenseSuccess('');
    }, 4000);
  };

  const [editingDesignOrder, setEditingDesignOrder] = React.useState<Order | null>(null);
  const [newDesignLink, setNewDesignLink] = React.useState<string>('');
  
  const [staffSearchQuery, setStaffSearchQuery] = React.useState<string>('');
  const [staffStatusFilter, setStaffStatusFilter] = React.useState<string>('All');

  // ==========================================
  // SHARED STATISTICS CALCULATION
  // ==========================================
  const todayOrdersList = orders.filter(o => o.date.substring(0, 10) === todayStr);
  const todayOrdersCount = todayOrdersList.length;
  const todaySales = todayOrdersList.reduce((sum, o) => sum + o.total, 0);

  const pendingCount = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length;
  const readyCount = orders.filter(o => o.status === 'Ready').length;
  const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
  const cancelledCount = orders.filter(o => o.status === 'Cancelled').length;

  const weeklySales = orders
    .filter(o => o.date.substring(0, 10) >= sevenDaysAgo && o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const monthlySales = orders
    .filter(o => o.date.substring(0, 7) === currentYearMonth && o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const yearlySales = orders
    .filter(o => o.date.substring(0, 4) === currentYear && o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingPaymentsTotal = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.balance, 0);

  const monthlyExpensesTotal = expenses
    .filter(e => e.date.substring(0, 7) === currentYearMonth)
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyProfit = monthlySales - monthlyExpensesTotal;

  // Recent Orders (last 5)
  const recentOrders = [...orders].reverse().slice(0, 5);

  // Upcoming deliveries (within 3 days, not terminal)
  const threeDaysFromNow = startOf(-3);
  const upcomingDeliveries = orders.filter(o => {
    if (!o.deliveryDate) return false;
    return o.deliveryDate >= todayStr && 
           o.deliveryDate <= threeDaysFromNow && 
           !['Delivered', 'Cancelled'].includes(o.status);
  });

  // Low stock alerts
  const lowStockItems = inventory.filter(i => i.stock < i.minimumStock);

  // Top Customers by total purchase
  const sortedCustomers = [...customers]
    .sort((a, b) => b.totalPurchase - a.totalPurchase)
    .slice(0, 5);

  // Staff performance leaderboard calculation ("Who has finished the most work")
  const staffWorkFinished = React.useMemo(() => {
    const activeStaff = staffList || [];
    return activeStaff.map(staff => {
      const staffOrders = orders.filter(o => 
        o.assignedStaff && (
          o.assignedStaff.toLowerCase() === staff.username.toLowerCase() ||
          o.assignedStaff.toLowerCase() === staff.name.toLowerCase()
        )
      );
      const finishedCount = staffOrders.filter(o => o.status === 'Delivered').length;
      const inProgressCount = staffOrders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length;
      const totalAssigned = staffOrders.length;
      const completionRate = totalAssigned > 0 ? Math.round((finishedCount / totalAssigned) * 100) : 0;
      const totalRevenueContribution = staffOrders
        .filter(o => o.status === 'Delivered')
        .reduce((sum, o) => sum + (o.total || 0), 0);

      return {
        ...staff,
        finishedCount,
        inProgressCount,
        totalAssigned,
        completionRate,
        revenue: totalRevenueContribution
      };
    }).sort((a, b) => b.finishedCount - a.finishedCount);
  }, [staffList, orders]);

  // Sales velocity and weekday performance
  const weekdayAnalysis = React.useMemo(() => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const salesByDay = [0, 0, 0, 0, 0, 0, 0];
    const countByDay = [0, 0, 0, 0, 0, 0, 0];

    orders.forEach(o => {
      if (o.status !== 'Cancelled') {
        const d = new Date(o.date);
        if (!isNaN(d.getTime())) {
          const day = d.getDay();
          salesByDay[day] += o.total || 0;
          countByDay[day]++;
        }
      }
    });

    let minSales = Infinity;
    let minDayIdx = -1;
    let maxSales = -1;
    let maxDayIdx = -1;

    salesByDay.forEach((sales, idx) => {
      if (sales < minSales) {
        minSales = sales;
        minDayIdx = idx;
      }
      if (sales > maxSales) {
        maxSales = sales;
        maxDayIdx = idx;
      }
    });

    return {
      salesByDay,
      countByDay,
      weekdays,
      lowestDay: minDayIdx !== -1 ? weekdays[minDayIdx] : 'N/A',
      lowestSalesVal: minSales !== Infinity ? minSales : 0,
      highestDay: maxDayIdx !== -1 ? weekdays[maxDayIdx] : 'N/A',
      highestSalesVal: maxSales !== -1 ? maxSales : 0
    };
  }, [orders]);

  // Calendar date with lowest sales in the last 30 days
  const lowestSalesDayInMonth = React.useMemo(() => {
    const last30 = startOf(30);
    const salesByDate: { [dateStr: string]: number } = {};

    orders.forEach(o => {
      if (o.status !== 'Cancelled') {
        const dateStr = o.date.substring(0, 10);
        if (dateStr >= last30) {
          salesByDate[dateStr] = (salesByDate[dateStr] || 0) + (o.total || 0);
        }
      }
    });

    let minDate = 'N/A';
    let minVal = Infinity;

    Object.keys(salesByDate).forEach(d => {
      if (salesByDate[d] < minVal) {
        minVal = salesByDate[d];
        minDate = d;
      }
    });

    return {
      date: minDate,
      sales: minVal === Infinity ? 0 : minVal
    };
  }, [orders]);

  // Status distributions
  const totalNotCancelled = Math.max(1, pendingCount + readyCount + deliveredCount);
  const pendingPct = Math.round((pendingCount / totalNotCancelled) * 100);
  const readyPct = Math.round((readyCount / totalNotCancelled) * 100);
  const deliveredPct = Math.round((deliveredCount / totalNotCancelled) * 100);


  // ==========================================
  // CASHIER METRICS & HANDLERS
  // ==========================================
  const cashierMetrics = React.useMemo(() => {
    // Billings total today (Value of all invoices generated today)
    const todayOrders = orders.filter(o => o.date.substring(0, 10) === todayStr);
    const billingTotal = todayOrders.reduce((sum, o) => sum + o.total, 0);

    // Dynamic Daily collection calculation:
    // 1. Advances paid on orders created today
    // 2. Balances settled on any orders (new or older) today
    let cashCollected = 0;
    let digitalCollected = 0;

    orders.forEach(o => {
      const isCreatedToday = o.date.substring(0, 10) === todayStr;
      const isUpdatedToday = o.updatedTime && o.updatedTime.substring(0, 10) === todayStr;

      if (isCreatedToday) {
        // Today's advances/payments
        const method = o.paymentMethod || 'Cash';
        const isDigital = ['UPI', 'GPID', 'GPay', 'PhonePe', 'Online', 'Card'].includes(method);
        
        if (o.paymentStatus === 'Paid') {
          if (isDigital) digitalCollected += o.total;
          else cashCollected += o.total;
        } else {
          if (isDigital) digitalCollected += o.advance;
          else cashCollected += o.advance;
        }
      } else if (isUpdatedToday && o.paymentStatus === 'Paid') {
        // Older orders that got fully settled today (We assume the balance due was received today)
        const method = o.paymentMethod || 'Cash';
        const isDigital = ['UPI', 'GPID', 'GPay', 'PhonePe', 'Online', 'Card'].includes(method);
        
        if (isDigital) digitalCollected += o.total - o.advance;
        else cashCollected += o.total - o.advance;
      }
    });

    const outstandingDues = orders
      .filter(o => o.status !== 'Cancelled' && o.paymentStatus !== 'Paid')
      .reduce((sum, o) => sum + o.balance, 0);

    const awaitingSettleCount = orders.filter(o => o.status === 'Ready' && o.balance > 0).length;

    return {
      billingTotal,
      cashCollected,
      digitalCollected,
      totalCollected: cashCollected + digitalCollected,
      outstandingDues,
      awaitingSettleCount
    };
  }, [orders, todayStr]);

  const handleSettleBalance = async () => {
    if (!settlingOrder) return;
    
    // Create updated order
    const updatedOrder = {
      ...settlingOrder,
      advance: settlingOrder.total, // Fully paid
      balance: 0,
      paymentStatus: 'Paid' as const,
      paymentMethod: settleMethod,
      status: 'Delivered', // Deliver on settling
      updatedTime: new Date().toISOString()
    };

    await saveOrder(updatedOrder);
    logActivity(
      currentUser.username, 
      'BILL_SETTLE', 
      `Settled remaining balance ${money(settlingOrder.balance)} via ${settleMethod} and delivered Order ${settlingOrder.id} to ${settlingOrder.customerName}`
    );
    setSettlingOrder(null);
  };


  // ==========================================
  // STAFF / EDITOR METRICS & QUEUE FILTERING
  // ==========================================
  const myAssignedOrders = React.useMemo(() => {
    const userLower = currentUser.username.toLowerCase();
    const nameLower = currentUser.name.toLowerCase();
    
    return orders.filter(o => {
      const isAssigned = o.assignedStaff && (
        o.assignedStaff.toLowerCase() === userLower || 
        o.assignedStaff.toLowerCase() === nameLower
      );
      if (!isAssigned) return false;

      // Search matching
      const matchesSearch = staffSearchQuery.trim() === '' || 
        o.id.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        o.workItem.toLowerCase().includes(staffSearchQuery.toLowerCase());

      // Status matching
      const matchesStatus = staffStatusFilter === 'All' || o.status === staffStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, currentUser, staffSearchQuery, staffStatusFilter]);

  const staffActiveCount = React.useMemo(() => {
    const userLower = currentUser.username.toLowerCase();
    const nameLower = currentUser.name.toLowerCase();
    return orders.filter(o => 
      o.assignedStaff && 
      (o.assignedStaff.toLowerCase() === userLower || o.assignedStaff.toLowerCase() === nameLower) &&
      !['Delivered', 'Cancelled'].includes(o.status)
    ).length;
  }, [orders, currentUser]);

  const staffCompletedCount = React.useMemo(() => {
    const userLower = currentUser.username.toLowerCase();
    const nameLower = currentUser.name.toLowerCase();
    return orders.filter(o => 
      o.assignedStaff && 
      (o.assignedStaff.toLowerCase() === userLower || o.assignedStaff.toLowerCase() === nameLower) &&
      o.status === 'Ready'
    ).length;
  }, [orders, currentUser]);

  const staffTodayCompletedCount = React.useMemo(() => {
    const userLower = currentUser.username.toLowerCase();
    const nameLower = currentUser.name.toLowerCase();
    return orders.filter(o => 
      o.assignedStaff && 
      (o.assignedStaff.toLowerCase() === userLower || o.assignedStaff.toLowerCase() === nameLower) &&
      ['Ready', 'Delivered'].includes(o.status) &&
      o.updatedTime && o.updatedTime.substring(0, 10) === todayStr
    ).length;
  }, [orders, currentUser, todayStr]);

  const myNextDeadlineOrder = React.useMemo(() => {
    const userLower = currentUser.username.toLowerCase();
    const nameLower = currentUser.name.toLowerCase();
    const active = orders.filter(o => 
      o.assignedStaff && 
      (o.assignedStaff.toLowerCase() === userLower || o.assignedStaff.toLowerCase() === nameLower) &&
      !['Delivered', 'Cancelled'].includes(o.status) &&
      o.deliveryDate
    );
    if (active.length === 0) return null;
    return [...active].sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate))[0];
  }, [orders, currentUser]);

  const handleUpdateDesignLink = async () => {
    if (!editingDesignOrder) return;
    const updatedOrder = {
      ...editingDesignOrder,
      designFileLink: newDesignLink,
      updatedTime: new Date().toISOString()
    };
    await saveOrder(updatedOrder);
    logActivity(
      currentUser.username, 
      'DESIGN_LINK_UPDATE', 
      `Updated production asset link for Order ${editingDesignOrder.id}`
    );
    setEditingDesignOrder(null);
    setNewDesignLink('');
  };


  // ==========================================
  // SHARED STAT CARD CONFIGS
  // ==========================================
  const mainOwnerStats = [
    { label: "Today's Orders", val: todayOrdersCount, icon: Calendar, color: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-800' },
    { label: "Today's Sales", val: money(todaySales), icon: TrendingUp, color: 'bg-green-50 dark:bg-green-950/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/20' },
    { label: "Active Orders", val: pendingCount, icon: Hourglass, color: 'bg-amber-50 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/20' },
    { label: "Ready to Collect", val: readyCount, icon: CheckCircle2, color: 'bg-purple-50 dark:bg-purple-950/10 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/20' },
    { label: "Total Delivered", val: deliveredCount, icon: Truck, color: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-800' },
    { label: "Cancelled Tasks", val: cancelledCount, icon: XCircle, color: 'bg-rose-50 dark:bg-rose-950/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/20' }
  ];

  const financialCards = [
    { label: "Weekly Sales", val: money(weeklySales), icon: Coins, color: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700' },
    { label: "Monthly Revenue", val: money(monthlySales), icon: Receipt, color: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700' },
    { label: "Yearly Revenue", val: money(yearlySales), icon: TrendingUp, color: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700' },
    { label: "Pending Dues", val: money(pendingPaymentsTotal), icon: Wallet, color: 'bg-rose-50 dark:bg-rose-950/10 text-rose-600 border-rose-100 dark:border-rose-900/20' },
    { label: "Monthly Expenses", val: money(monthlyExpensesTotal), icon: Receipt, color: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700' },
    { label: "Monthly Profit", val: money(monthlyProfit), icon: Flame, color: monthlyProfit >= 0 ? 'bg-green-50 dark:bg-green-950/10 text-green-700 border-green-100 dark:border-green-900/20' : 'bg-rose-50 dark:bg-rose-950/10 text-rose-700 border-rose-100 dark:border-rose-900/20' }
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. GREETINGS BLOCK (SHARED) */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
              Welcome back, {currentUser.name}!
            </h2>
            <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
              {currentUser.role}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            GDM shop management console is operational. You are signed in as a shop{' '}
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">{currentUser.role}</span>.
          </p>
        </div>
        <div className="text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>


      {/* ==================================================================== */}
      {/* STAFF & EDITOR INTERACTIVE PRODUCTION DASHBOARD */}
      {/* ==================================================================== */}
      {isEditorOrStaff && (
        <div className="space-y-6">
          {/* Staff Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-28">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">My Active Jobs</span>
                <span className="p-1.5 rounded-lg border bg-amber-50 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/20">
                  <Hourglass size={14} />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">
                {staffActiveCount} <span className="text-[10px] font-semibold text-slate-400">jobs running</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-28">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Jobs Marked Ready</span>
                <span className="p-1.5 rounded-lg border bg-purple-50 dark:bg-purple-950/10 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/20">
                  <CheckCircle2 size={14} />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">
                {staffCompletedCount} <span className="text-[10px] font-semibold text-slate-400">total ready</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-28">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Finished Today</span>
                <span className="p-1.5 rounded-lg border bg-emerald-50 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/20">
                  <Sparkles size={14} />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">
                {staffTodayCompletedCount} <span className="text-[10px] font-semibold text-slate-400">completed today</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-28">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Next Deadline</span>
                <span className="p-1.5 rounded-lg border bg-rose-50 dark:bg-rose-950/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/20">
                  <Clock size={14} />
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-2 truncate">
                {myNextDeadlineOrder ? (
                  <div className="space-y-0.5">
                    <span className="block text-rose-600 font-extrabold">{myNextDeadlineOrder.deliveryDate}</span>
                    <span className="block text-[10px] text-slate-400 truncate">{myNextDeadlineOrder.workItem}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">No active deadlines</span>
                )}
              </div>
            </motion.div>
          </div>

          {/* Interactive assigned list */}
          <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">My Assigned Production Pipeline</h3>
                <p className="text-xs text-slate-400">Update workflow stages, design files, and complete your tasks</p>
              </div>

              {/* Filtering / Search tools */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    placeholder="Search my orders..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <select
                  value={staffStatusFilter}
                  onChange={(e) => setStaffStatusFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Stages</option>
                  <option value="Pending">Pending</option>
                  <option value="Designing">Designing</option>
                  <option value="Printing">Printing</option>
                  <option value="Ready">Ready</option>
                </select>
              </div>
            </div>

            {/* Design Link Inline Editor Overlay */}
            <AnimatePresence>
              {editingDesignOrder && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-end">
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block">Attach Design Roll/File Link (Order {editingDesignOrder.id})</span>
                    <input
                      type="text"
                      value={newDesignLink}
                      onChange={(e) => setNewDesignLink(e.target.value)}
                      placeholder="Paste Dropbox, Google Drive, or Canva URL here..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingDesignOrder(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Cancel</button>
                    <button onClick={handleUpdateDesignLink} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"><Save size={12} /> Save Asset</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {myAssignedOrders.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                <Check className="text-green-500 mx-auto" size={24} />
                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs">No active assignments found</h4>
                <p className="text-[11px] text-slate-400 max-w-[280px] mx-auto">
                  You are all caught up! If you have orders waiting, confirm they are assigned to your name in the main orders list.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myAssignedOrders.map(order => {
                  const currentStageIdx = order.stages.indexOf(order.status);
                  const nextStage = currentStageIdx !== -1 && currentStageIdx < order.stages.length - 1 
                    ? order.stages[currentStageIdx + 1] 
                    : null;

                  return (
                    <motion.div
                      layout
                      key={order.id}
                      className="border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl bg-slate-50/30 dark:bg-slate-800/10 space-y-3.5 hover:shadow-sm transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs text-blue-600">{order.id}</span>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold">{order.category}</span>
                          </div>
                          <span className="block font-black text-sm text-slate-700 dark:text-slate-200 mt-1">{order.workItem}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-bold text-rose-500 flex items-center gap-1 justify-end">
                            <Clock size={10} /> {order.deliveryDate || 'No date'}
                          </span>
                          <span className="block text-[9px] text-slate-400 mt-0.5">{order.deliveryTime || ''}</span>
                        </div>
                      </div>

                      {/* Customer Details & Remarks */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 p-2.5 rounded-lg text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Client:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{order.customerName}</span>
                        </div>
                        {order.remarks && (
                          <div className="border-t border-slate-50 dark:border-slate-800 pt-1.5 text-[11px]">
                            <span className="text-slate-400 block font-bold uppercase text-[9px] mb-0.5">Production Notes:</span>
                            <span className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">"{order.remarks}"</span>
                          </div>
                        )}
                      </div>

                      {/* Workflow visual progress line */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Stage Progress</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold overflow-x-auto pb-1">
                          {order.stages.map((stg, sIdx) => {
                            const isPast = sIdx < currentStageIdx;
                            const isCurrent = sIdx === currentStageIdx;
                            return (
                              <div key={stg} className="flex items-center gap-1 shrink-0">
                                <span className={`px-2 py-0.5 rounded font-black uppercase text-[8px] ${
                                  isCurrent ? 'bg-amber-500 text-white' :
                                  isPast ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' :
                                  'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}>
                                  {stg}
                                </span>
                                {sIdx < order.stages.length - 1 && <span className="text-slate-300">→</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions: Design Link + Settle Stage */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-50 dark:border-slate-800">
                        {/* Design File Buttons */}
                        {order.designFileLink ? (
                          <a
                            href={order.designFileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 flex items-center gap-1"
                          >
                            <ExternalLink size={10} /> View Design
                          </a>
                        ) : null}

                        <button
                          onClick={() => {
                            setEditingDesignOrder(order);
                            setNewDesignLink(order.designFileLink || '');
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1"
                        >
                          <Edit size={10} /> {order.designFileLink ? 'Update Link' : 'Attach Design Link'}
                        </button>

                        <div className="flex-1" />

                        {/* Dropdown status update */}
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="px-2 py-1.5 text-[10px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold cursor-pointer focus:outline-none"
                        >
                          {order.stages.map(stg => (
                            <option key={stg} value={stg}>{stg}</option>
                          ))}
                        </select>

                        {/* Fast forward stage */}
                        {nextStage && (
                          <button
                            onClick={() => updateOrderStatus(order.id, nextStage)}
                            className="px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-0.5"
                          >
                            Next <ChevronRight size={10} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}


      {/* ==================================================================== */}
      {/* CASHIER BILLING & PAYMENTS WORKSPACE */}
      {/* ==================================================================== */}
      {isCashier && (
        <div className="space-y-6">
          {/* Cashier Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-28">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Today's Billings</span>
                <span className="p-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-800">
                  <FileText size={14} />
                </span>
              </div>
              <div className="text-xl font-black text-slate-800 dark:text-slate-100 mt-2 truncate">
                {money(cashierMetrics.billingTotal)}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-28">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Payments Collected Today</span>
                <span className="p-1.5 rounded-lg border bg-green-50 dark:bg-green-950/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/20">
                  <Coins size={14} />
                </span>
              </div>
              <div className="text-xl font-black text-green-600 dark:text-green-400 mt-2 truncate">
                {money(cashierMetrics.totalCollected)}
                <span className="block text-[8px] font-bold text-slate-400 mt-0.5">
                  Cash: {money(cashierMetrics.totalCollected - cashierMetrics.digitalCollected)} · UPI/UPIs: {money(cashierMetrics.digitalCollected)}
                </span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-28">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Awaiting Settlement (Ready)</span>
                <span className="p-1.5 rounded-lg border bg-purple-50 dark:bg-purple-950/10 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/20">
                  <CheckCircle2 size={14} />
                </span>
              </div>
              <div className="text-xl font-black text-slate-800 dark:text-slate-100 mt-2">
                {cashierMetrics.awaitingSettleCount} <span className="text-[10px] font-semibold text-slate-400">orders pending pay</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-28">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Outstanding Shop Balances</span>
                <span className="p-1.5 rounded-lg border bg-rose-50 dark:bg-rose-950/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/20">
                  <Wallet size={14} />
                </span>
              </div>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-2 truncate">
                {money(cashierMetrics.outstandingDues)}
              </div>
            </motion.div>
          </div>

          {/* Settle Outstanding Billings Section */}
          <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Cashier Billing & Settle Desk</h3>
                <p className="text-xs text-slate-400">Receive cash/digital balance payments and hand over completed print orders</p>
              </div>

              {/* Cashier search bar */}
              <div className="relative w-full md:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={cashierSearch}
                  onChange={(e) => setCashierSearch(e.target.value)}
                  placeholder="Search invoice, client, or phone..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
                />
              </div>
            </div>

            {/* Billing Settlement Slider Overlay */}
            <AnimatePresence>
              {settlingOrder && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3.5"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Settle Balance & Release Order: <span className="text-blue-600">{settlingOrder.id}</span></h4>
                      <p className="text-[11px] text-slate-400">Confirm payment collection and deliver work item: <strong>{settlingOrder.workItem}</strong></p>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-slate-500">Remaining Balance Due:</span>
                      <span className="block text-lg font-black text-rose-600">{money(settlingOrder.balance)}</span>
                    </div>
                  </div>

                  {/* Settle Method selectors */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Payment Method Received</span>
                    <div className="grid grid-cols-3 gap-2">
                      {['Cash', 'UPI', 'Card'].map(method => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setSettleMethod(method)}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                            settleMethod === method 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          {method === 'Cash' && <Coins size={12} />}
                          {method === 'UPI' && <Sparkles size={12} />}
                          {method === 'Card' && <CreditCard size={12} />}
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSettlingOrder(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSettleBalance}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={12} /> Record Payment & Mark Delivered
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Outstanding order list */}
            {(() => {
              const outstandingOrders = orders.filter(o => {
                const isOutstanding = o.status !== 'Cancelled' && o.balance > 0;
                if (!isOutstanding) return false;

                const matchesSearch = cashierSearch.trim() === '' ||
                  o.id.toLowerCase().includes(cashierSearch.toLowerCase()) ||
                  o.customerName.toLowerCase().includes(cashierSearch.toLowerCase()) ||
                  o.phone.includes(cashierSearch);

                return matchesSearch;
              });

              if (outstandingOrders.length === 0) {
                return (
                  <div className="text-center py-10 border border-dashed border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5">
                    <CheckCircle2 className="text-green-500 mx-auto" size={24} />
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs">All Billings fully settled!</h4>
                    <p className="text-[11px] text-slate-400">There are no outstanding balances matching the search criteria.</p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-2.5">Order ID</th>
                        <th className="py-2.5">Customer & Contact</th>
                        <th className="py-2.5">Work Item</th>
                        <th className="py-2.5">Bill Total</th>
                        <th className="py-2.5">Paid Advance</th>
                        <th className="py-2.5 text-rose-500">Balance Due</th>
                        <th className="py-2.5">Stage</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {outstandingOrders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                          <td className="py-3 font-bold text-slate-800 dark:text-slate-300">{order.id}</td>
                          <td className="py-3">
                            <span className="block font-semibold text-slate-700 dark:text-slate-300">{order.customerName}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">{order.phone}</span>
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-400">{order.workItem}</td>
                          <td className="py-3 font-bold text-slate-700 dark:text-slate-300">{money(order.total)}</td>
                          <td className="py-3 text-green-600 dark:text-green-500 font-semibold">{money(order.advance)}</td>
                          <td className="py-3 text-rose-500 font-extrabold">{money(order.balance)}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded uppercase text-[9px] font-bold ${
                              order.status === 'Ready' ? 'bg-purple-100 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setSettlingOrder(order);
                                setSettleMethod(order.paymentMethod || 'Cash');
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-black bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                            >
                              Settle & Release
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          {/* New cashier features: Petty Cash & Shift Reconciliation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* 1. Cash Drawer & Register Payout Form */}
            <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Cash Register & Petty Cash Drawer</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Control on-hand store float and instant payouts</p>
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 font-extrabold px-2.5 py-1 rounded text-slate-600 dark:text-slate-400">
                  Drawer Active
                </span>
              </div>

              {/* Real-time cash-in-drawer calculation */}
              <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Expected Cash in Drawer</span>
                  <span className="block text-xl font-black text-slate-800 dark:text-slate-200 mt-1">
                    {money(
                      openingBalance + 
                      (cashierMetrics.cashCollected) - 
                      expenses.filter(e => e.addedBy === currentUser.username && e.date === todayStr && e.description.includes('[Register Cash Pay]')).reduce((sum, e) => sum + e.amount, 0)
                    )}
                  </span>
                  <span className="block text-[9px] text-slate-400 mt-0.5">
                    Opening float: {money(openingBalance)} · Cash collected: {money(cashierMetrics.cashCollected)}
                  </span>
                </div>
                <div className="text-right">
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-1">Set Float</label>
                  <input 
                    type="number" 
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 px-2 py-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded text-center text-xs font-extrabold focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Expense logging form */}
              <form onSubmit={handleLogRegisterExpense} className="space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Log Register Payout / Expense</span>
                
                {expenseSuccess && (
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/10 rounded-lg text-[10px] text-emerald-600 font-bold text-center">
                    {expenseSuccess}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-1">Payout Category</label>
                    <select
                      value={cashExpCategory}
                      onChange={(e) => setCashExpCategory(e.target.value)}
                      className="w-full text-[10px] font-bold p-2 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer text-slate-700 dark:text-slate-200"
                    >
                      <option value="Tea & Snacks">Tea & Snacks</option>
                      <option value="Ink & Supplies">Ink & Supplies</option>
                      <option value="Courier & Travel">Courier & Travel</option>
                      <option value="Customer Refund">Customer Refund</option>
                      <option value="Miscellaneous">Miscellaneous</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-1">Amount Paid</label>
                    <input
                      type="number"
                      required
                      value={cashExpAmount}
                      onChange={(e) => setCashExpAmount(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full text-[10px] font-bold p-2 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide mb-1">Payout Reason / Voucher Remarks</label>
                  <input
                    type="text"
                    required
                    value={cashExpReason}
                    onChange={(e) => setCashExpReason(e.target.value)}
                    placeholder="e.g. Courier for photo frames"
                    className="w-full text-[10px] font-semibold p-2 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] uppercase rounded-lg tracking-wide shadow-sm cursor-pointer transition-all"
                >
                  Log Register Payout
                </button>
              </form>

              {/* Today's payouts list */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Today's Register Payouts Log</span>
                {(() => {
                  const todayRegisterExp = expenses.filter(
                    e => e.addedBy === currentUser.username && 
                    e.date === todayStr && 
                    e.description.includes('[Register Cash Pay]')
                  );

                  if (todayRegisterExp.length === 0) {
                    return <span className="block text-[10px] text-slate-400 italic">No registered payouts made today.</span>;
                  }

                  return (
                    <div className="max-h-24 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800 pr-1">
                      {todayRegisterExp.map(e => (
                        <div key={e.id} className="py-1.5 flex justify-between text-[10px]">
                          <div>
                            <span className="font-extrabold text-slate-700 dark:text-slate-300 block">{e.description.replace('[Register Cash Pay] ', '')}</span>
                            <span className="text-[9px] text-slate-400 block font-semibold">{e.category}</span>
                          </div>
                          <span className="font-mono text-rose-500 font-extrabold">{money(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 2. Cashier Active Shift Reconciliation & Printable report */}
            <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Reconciliation & Shift Closing</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tally register collections and print your desk report</p>
                  </div>
                  <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
                    Active Shift
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                    <span>Cashier Desk float:</span>
                    <span className="font-mono">{money(openingBalance)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                    <span>Billed (Gross Value Booked):</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-extrabold">{money(cashierMetrics.billingTotal)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                    <span>Cash Collected Today:</span>
                    <span className="font-mono text-emerald-600 font-extrabold">+{money(cashierMetrics.cashCollected)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                    <span>UPI/UPIs Payments:</span>
                    <span className="font-mono text-emerald-600 font-extrabold">+{money(cashierMetrics.digitalCollected)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                    <span>Register Cash Payouts:</span>
                    <span className="font-mono text-rose-500 font-extrabold">
                      -{money(expenses.filter(e => e.addedBy === currentUser.username && e.date === todayStr && e.description.includes('[Register Cash Pay]')).reduce((sum, e) => sum + e.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setShowShiftSummary(true)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileText size={15} /> Generate & Print Shift Report
                </button>
                <p className="text-[9px] text-slate-400 text-center mt-2 font-semibold">Tally register collections precisely before ending shift.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHIFT SUMMARY PRINTABLE DIALOG OVERLAY */}
      <AnimatePresence>
        {showShiftSummary && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100"
            >
              <div id="shift-report-printable" className="p-8 space-y-6">
                {/* Print Header */}
                <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-500/10 px-3 py-1 rounded">Shift Report Summary</span>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-50">{settings.businessName || 'Grand Digital Media'}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{settings.address || 'Kunnamkulam, Kerala'}</p>
                </div>

                {/* Print Details */}
                <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wide">Cashier Desk:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{currentUser.name} (@{currentUser.username})</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wide">Date / Time:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-extrabold">
                      {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Financial Breakdowns */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Collection Reconciliation Ledger</span>
                  
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold">Opening Float:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{money(openingBalance)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold">Cash collections logged:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-bold font-mono">+{money(cashierMetrics.cashCollected)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold">UPI/Digital collections logged:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-bold font-mono">+{money(cashierMetrics.digitalCollected)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold">Petty cash register payouts:</span>
                      <span className="font-mono text-rose-500 font-mono">
                        -{money(expenses.filter(e => e.addedBy === currentUser.username && e.date === todayStr && e.description.includes('[Register Cash Pay]')).reduce((sum, e) => sum + e.amount, 0))}
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-t border-dashed border-slate-200 dark:border-slate-700 mt-2">
                      <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">Total collections processed:</span>
                      <span className="font-mono font-black text-green-600 text-sm font-mono">{money(cashierMetrics.totalCollected)}</span>
                    </div>

                    <div className="flex justify-between py-2.5 bg-slate-50 dark:bg-slate-800/40 px-3 rounded-xl">
                      <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide text-[10px]">Expected Cash in Drawer:</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                        {money(
                          openingBalance + 
                          cashierMetrics.cashCollected - 
                          expenses.filter(e => e.addedBy === currentUser.username && e.date === todayStr && e.description.includes('[Register Cash Pay]')).reduce((sum, e) => sum + e.amount, 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-center font-medium leading-relaxed italic border-t border-dashed border-slate-100 dark:border-slate-800 pt-4">
                  Report compiled and digitally signed by shop cashier @{currentUser.username}. Verify physical register cash balances before hand-over.
                </div>
              </div>

              {/* Printable overlay actions */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowShiftSummary(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 cursor-pointer"
                >
                  <FileText size={12} /> Print Desk Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ==================================================================== */}
      {/* OWNER, ADMINISTRATOR & MANAGER FULL SCALE METRICS / DASHBOARD */}
      {/* ==================================================================== */}
      {(isOwnerOrAdmin || isManager) && (
        <div className="space-y-6">
          {/* Main metric panels */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {mainOwnerStats.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={card.label}
                  className="border rounded-2xl p-4 flex flex-col justify-between h-32 transition-colors bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{card.label}</span>
                    <span className={`p-2 rounded-xl border ${card.color}`}>
                      <Icon size={16} />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    {card.val}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Financial details panel */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Financial Overview</h3>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {financialCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    key={card.label}
                    className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-28"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{card.label}</span>
                      <span className={`p-1.5 rounded-lg border ${card.color}`}>
                        <Icon size={12} />
                      </span>
                    </div>
                    <div className="text-md font-bold text-slate-800 dark:text-slate-100 mt-2 truncate">
                      {card.val}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Executive Analytics Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Executive Operations Command</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Staff Work Leaderboard */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Award className="text-amber-500" size={18} />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Staff Production & Work Finished Leaderboard</h4>
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">Sorted by completed jobs</span>
                </div>

                <div className="space-y-3">
                  {staffWorkFinished.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No staff records detected.</p>
                  ) : (
                    staffWorkFinished.map((staff, idx) => {
                      const maxFinished = Math.max(...staffWorkFinished.map(s => s.finishedCount), 1);
                      const finishPercentage = (staff.finishedCount / maxFinished) * 100;
                      return (
                        <div key={staff.id} className="flex items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                              idx === 0 ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
                              idx === 1 ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' :
                              'bg-slate-50 dark:bg-slate-900/50 text-slate-400'
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-700 dark:text-slate-300 truncate">{staff.name}</span>
                                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded uppercase font-bold">{staff.role}</span>
                              </div>
                              
                              {/* Visual completion progress bar */}
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      idx === 0 ? 'bg-amber-500' : 'bg-blue-500'
                                    }`} 
                                    style={{ width: `${finishPercentage}%` }} 
                                  />
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono font-bold">{staff.finishedCount} / {staff.totalAssigned} jobs</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right pl-2">
                            <span className="block text-[11px] font-black text-slate-700 dark:text-slate-300">
                              {money(staff.revenue)}
                            </span>
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Completed value</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Sales Velocity Breakdown and Lowest Sales Day */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="text-rose-500" size={18} />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Sales Velocity & Weekday Performance</h4>
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">Weekly Trend Analysis</span>
                </div>

                {/* Lowest sales highlight metrics */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <div className="space-y-1 border-r border-slate-100 dark:border-slate-800/80 pr-2">
                    <span className="block text-[9px] text-slate-400 uppercase font-black tracking-wider">Lowest Sales Weekday</span>
                    <span className="block text-xs font-black text-rose-500 uppercase">{weekdayAnalysis.lowestDay}</span>
                    <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">{money(weekdayAnalysis.lowestSalesVal)} cumulative</span>
                  </div>
                  <div className="space-y-1 pl-2">
                    <span className="block text-[9px] text-slate-400 uppercase font-black tracking-wider">Lowest Active Sales Date (30d)</span>
                    <span className="block text-xs font-black text-amber-500">
                      {lowestSalesDayInMonth.date !== 'N/A' 
                        ? new Date(lowestSalesDayInMonth.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
                        : 'No Data'}
                    </span>
                    <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      {money(lowestSalesDayInMonth.sales)} in orders
                    </span>
                  </div>
                </div>

                {/* Small weekday bar charts */}
                <div className="space-y-2 pt-1">
                  {weekdayAnalysis.weekdays.map((day, idx) => {
                    const sales = weekdayAnalysis.salesByDay[idx];
                    const maxSales = Math.max(...weekdayAnalysis.salesByDay, 1);
                    const barPercentage = (sales / maxSales) * 100;
                    const isLowest = day === weekdayAnalysis.lowestDay;
                    const isHighest = day === weekdayAnalysis.highestDay;

                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className="w-16 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{day.substring(0, 3)}</span>
                        <div className="flex-1 h-3 bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden relative">
                          <div 
                            className={`h-full rounded-lg transition-all duration-500 ${
                              isLowest ? 'bg-rose-500/80' : 
                              isHighest ? 'bg-emerald-500/80' :
                              'bg-slate-300 dark:bg-slate-700'
                            }`} 
                            style={{ width: `${barPercentage}%` }} 
                          />
                        </div>
                        <span className={`w-20 text-right text-[10px] font-bold font-mono ${
                          isLowest ? 'text-rose-500' :
                          isHighest ? 'text-emerald-500' :
                          'text-slate-600 dark:text-slate-400'
                        }`}>
                          {money(sales)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Visual pipeline and production distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent orders table */}
            <div className="lg:col-span-2 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Recent Orders</h3>
                <button 
                  onClick={() => onViewChange('orders')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
                >
                  View All <ChevronRight size={14} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5">Order ID</th>
                      <th className="py-2.5">Customer</th>
                      <th className="py-2.5">Work Item</th>
                      <th className="py-2.5">Total</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {recentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 font-bold text-slate-800 dark:text-slate-300">{order.id}</td>
                        <td className="py-3">
                          <div className="font-semibold text-slate-700 dark:text-slate-400">{order.customerName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{order.phone}</div>
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-400 font-medium">{order.workItem}</td>
                        <td className="py-3 font-bold text-slate-800 dark:text-slate-300">{money(order.total)}</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.status === 'Ready' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                            order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            order.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                            'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status donut chart */}
            <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4">Production Load Distribution</h3>
              
              <div className="flex justify-center items-center relative my-4">
                <svg width="180" height="180" viewBox="0 0 42 42" className="transform -rotate-90">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4.5" className="dark:stroke-slate-800" />
                  
                  {/* Ready slice */}
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#a855f7" strokeWidth="4.5" 
                    strokeDasharray={`${readyPct} ${100 - readyPct}`} strokeDashoffset="0" />
                  
                  {/* Pending / designing slice */}
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4.5" 
                    strokeDasharray={`${pendingPct} ${100 - pendingPct}`} strokeDashoffset={-readyPct} />

                  {/* Delivered slice */}
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="4.5" 
                    strokeDasharray={`${deliveredPct} ${100 - deliveredPct}`} strokeDashoffset={-(readyPct + pendingPct)} />
                </svg>

                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100">{totalNotCancelled}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Active</span>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-amber-500"></span>
                    <span className="text-slate-600 dark:text-slate-400">Designing & Printing</span>
                  </div>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{pendingCount} ({pendingPct}%)</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-purple-500"></span>
                    <span className="text-slate-600 dark:text-slate-400">Ready to Collect</span>
                  </div>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{readyCount} ({readyPct}%)</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
                    <span className="text-slate-600 dark:text-slate-400">Completed & Delivered</span>
                  </div>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{deliveredCount} ({deliveredPct}%)</span>
                </div>
              </div>
            </div>

          </div>

          {/* Lower segment: critical deliveries & stocks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Upcoming deliveries */}
            <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="text-amber-500" size={18} />
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Critical Deliveries (Next 3 Days)</h3>
              </div>
              {upcomingDeliveries.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500 font-medium">
                  No critical order deliveries due in the next 3 days. Clean slate!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-2.5">ID</th>
                        <th className="py-2.5">Customer</th>
                        <th className="py-2.5">Due Date</th>
                        <th className="py-2.5">Current Stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingDeliveries.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 font-bold text-blue-600">{order.id}</td>
                          <td className="py-2.5 font-medium text-slate-700 dark:text-slate-400">{order.customerName}</td>
                          <td className="py-2.5 text-rose-500 font-bold flex items-center gap-1.5">
                            <Calendar size={12} />
                            {order.deliveryDate} {order.deliveryTime && `@ ${order.deliveryTime}`}
                          </td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold uppercase text-[9px] tracking-wider">
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Stocks levels & VIP customers */}
            <div className="grid grid-cols-1 gap-6">
              
              {/* Low stock indicators */}
              <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="text-rose-500 animate-pulse" size={18} />
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Low Raw Materials alerts</h3>
                </div>
                {lowStockItems.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 font-medium">
                    All print rolls, inks, and blanks are above minimum stock levels.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lowStockItems.map(item => (
                      <div key={item.name} className="flex justify-between items-center bg-rose-500/5 border border-rose-500/10 px-3.5 py-2.5 rounded-xl">
                        <div>
                          <span className="block font-bold text-xs text-slate-800 dark:text-slate-200">{item.name}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">Supplier: {item.supplier}</span>
                        </div>
                        <div className="text-right">
                          <span className="block font-black text-rose-500 text-xs">{item.stock} left</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">Min required: {item.minimumStock}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* VIP Customers */}
              <div className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3">Top VIP Customers</h3>
                <div className="space-y-2">
                  {sortedCustomers.map((cust, idx) => (
                    <div key={cust.id} className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/50 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-500">
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="block font-bold text-xs text-slate-700 dark:text-slate-300">{cust.name}</span>
                          <span className="block text-[9px] text-slate-400">{cust.phone} · {cust.totalOrders} jobs</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-extrabold text-xs text-slate-800 dark:text-slate-200">
                          {money(cust.totalPurchase)}
                        </span>
                        {cust.pendingBalance > 0 && (
                          <span className="block text-[9px] font-bold text-rose-500 mt-0.5">
                            {money(cust.pendingBalance)} due
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
