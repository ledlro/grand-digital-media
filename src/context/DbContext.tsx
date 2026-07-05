import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, Customer, Product, Workflow, Staff, Expense, InventoryItem, Settings, ActivityLog, Attendance } from '../types';
import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface DbContextType {
  orders: Order[];
  products: Product[];
  workflows: Workflow[];
  customers: Customer[];
  inventory: InventoryItem[];
  expenses: Expense[];
  staffList: Staff[];
  settings: Settings;
  logs: ActivityLog[];
  attendance: Attendance[];
  currentUser: Staff | null;
  
  login: (username: string, password: string) => Promise<{ success: boolean; message: string; user?: Staff }>;
  logout: () => void;
  
  saveProduct: (product: Partial<Product> & { name: string }) => void;
  deleteProduct: (id: string) => void;
  
  saveWorkflow: (workflow: { id?: string; name: string; stages: string[] }) => void;
  deleteWorkflow: (id: string) => void;
  
  saveCustomer: (customer: Partial<Customer> & { name: string; phone: string }) => Customer;
  deleteCustomer: (id: string) => void;
  
  saveOrder: (orderData: any) => Promise<string>;
  updateOrderStatus: (orderId: string, newStatus: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  
  saveInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (name: string) => void;
  
  saveExpense: (expense: Partial<Expense> & { category: string; amount: number }) => void;
  deleteExpense: (id: string) => void;
  
  saveStaff: (staff: Partial<Staff> & { name: string; username: string }, password?: string) => void;
  deleteStaff: (id: string) => void;
  
  saveSettings: (settings: Settings) => void;
  logActivity: (user: string, action: string, details: string) => void;
  
  saveAttendance: (record: Attendance) => void;
  saveMultipleAttendance: (records: Attendance[]) => void;
  
  confirmAction: (config: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
  }) => void;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

// Default seed data
const DEFAULT_SETTINGS: Settings = {
  businessName: "Grand Digital Media",
  logo: "GDM",
  gstNumber: "32AAAAA1111A1Z1",
  phone: "+91 98765 43210",
  email: "info.gdm@gmail.com",
  address: "Grand Tower, Main Road, Kunnamkulam, Thrissur, Kerala - 680503",
  website: "www.granddigitalmedia.in",
  invoiceFooter: "Thank you for choosing Grand Digital Media! Goods once printed cannot be returned.",
  currency: "₹",
  theme: "blue",
  darkMode: false,
};

const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: 'WF-0001',
    name: 'Standard Printing & Laminating',
    stages: ['Designing', 'Printing', 'Lamination', 'Cutting', 'Ready'],
    createdBy: 'admin',
    createdTime: new Date(2026, 5, 1).toISOString(),
  },
  {
    id: 'WF-0002',
    name: 'Invitation Card Printing',
    stages: ['Designing', 'Printing', 'Creasing', 'Binding', 'Ready'],
    createdBy: 'admin',
    createdTime: new Date(2026, 5, 2).toISOString(),
  },
  {
    id: 'WF-0003',
    name: 'LED Board Signage',
    stages: ['Designing', 'Frame Assembly', 'Flex Printing', 'Wiring', 'Testing', 'Ready'],
    createdBy: 'admin',
    createdTime: new Date(2026, 5, 3).toISOString(),
  }
];

const DEFAULT_PRODUCTS: Product[] = [
  { id: 'PRD-0001', name: 'Flex Banner (Star Media)', category: 'Flex Printing', price: 15, gstPercent: 18, description: 'High quality glossy star frontlit flex banner printing.', stock: 12000, workflowId: 'WF-0001' },
  { id: 'PRD-0002', name: 'Vinyl Sticker (Self Adhesive)', category: 'Sticker Printing', price: 35, gstPercent: 18, description: 'Waterproof self adhesive white glossy vinyl sticker sheets.', stock: 5000, workflowId: 'WF-0001' },
  { id: 'PRD-0003', name: 'Premium Wedding Invitation Card', category: 'Card Printing', price: 25, gstPercent: 12, description: 'Elegant folded wedding card on premium texture sheet.', stock: 2000, workflowId: 'WF-0002' },
  { id: 'PRD-0004', name: 'LED Sign Board (Custom)', category: 'Signage', price: 14500, gstPercent: 18, description: 'Waterproof outdoor LED display light board with aluminum framing.', stock: 8, workflowId: 'WF-0003' },
  { id: 'PRD-0005', name: 'Business Cards (Double Sided)', category: 'Commercial Print', price: 1.5, gstPercent: 12, description: 'Standard 350GSM card paper with matte lamination.', stock: 8500, workflowId: 'WF-0001' },
  { id: 'PRD-0006', name: 'Glossy Foam Board (5mm)', category: 'Indoor Display', price: 120, gstPercent: 18, description: 'Vinyl mount on lightweight durable foam sheet.', stock: 250, workflowId: 'WF-0001' }
];

const DEFAULT_STAFF: Staff[] = [
  { id: 'STF-0001', name: 'K. Devadas (KD)', username: 'devadas', role: 'Owner', phone: '9447012345', email: 'devadas.gdm@gmail.com', status: 'Active', password: 'devadas123' },
  { id: 'STF-0002', name: 'Rinto Paul', username: 'rinto', role: 'Manager', phone: '9846123456', email: 'rinto.gdm@gmail.com', status: 'Active', password: 'rinto123' },
  { id: 'STF-0003', name: 'Aswathi V.', username: 'aswathi', role: 'Cashier', phone: '9946234567', email: 'aswathi.gdm@gmail.com', status: 'Active', password: 'aswathi123' },
  { id: 'STF-0004', name: 'Manu Mohan', username: 'manu', role: 'Editor', phone: '9746345678', email: 'manu.gdm@gmail.com', status: 'Active', password: 'manu123' },
  { id: 'STF-0005', name: 'Shaji Kunnamkulam', username: 'shaji', role: 'Staff', phone: '9546456789', email: 'shaji.gdm@gmail.com', status: 'Active', password: 'shaji123' },
  { id: 'STF-0006', name: 'System Administrator', username: 'admin', role: 'Admin', phone: '9000000000', email: 'admin@granddigitalmedia.in', status: 'Active', password: 'grandadmin2026' }
];


const DEFAULT_CUSTOMERS: Customer[] = [
  { id: 'CUST-0001', name: 'Malabar Gold & Diamonds', phone: '9847055443', email: 'malabar.kkm@malabargroup.com', address: 'Main Road, Kunnamkulam', gst: '32AABCM1234F1ZA', totalOrders: 14, totalPurchase: 45000, pendingBalance: 12000, lastOrder: '2026-07-01' },
  { id: 'CUST-0002', name: 'Thrissur Co-operative Bank', phone: '9446152433', email: 'tcb.kkm@gmail.com', address: 'Town Hall Circle, Kunnamkulam', gst: '', totalOrders: 5, totalPurchase: 18500, pendingBalance: 0, lastOrder: '2026-06-28' },
  { id: 'CUST-0003', name: 'Elite Supermarket', phone: '9961234891', email: 'purchase@elitesuper.in', address: 'Guruvayur Road, Kunnamkulam', gst: '32AAAFE5678H2Z3', totalOrders: 28, totalPurchase: 112400, pendingBalance: 4500, lastOrder: '2026-07-03' },
  { id: 'CUST-0004', name: 'PVS Hospital', phone: '9845012311', email: 'info@pvshospital.com', address: 'Wadakkanchery Road, Kunnamkulam', gst: '', totalOrders: 8, totalPurchase: 22800, pendingBalance: 0, lastOrder: '2026-06-15' },
  { id: 'CUST-0005', name: 'Royal Wedding Palace', phone: '9544988771', email: 'contact@royalpalace.in', address: 'Adoor Road, Kunnamkulam', gst: '32KKKAA4455C1ZW', totalOrders: 3, totalPurchase: 65000, pendingBalance: 25000, lastOrder: '2026-07-02' }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'GDM-2026-00001',
    date: '2026-06-25T10:30:00Z',
    customerId: 'CUST-0002',
    customerName: 'Thrissur Co-operative Bank',
    phone: '9446152433',
    email: 'tcb.kkm@gmail.com',
    address: 'Town Hall Circle, Kunnamkulam',
    productId: 'PRD-0001',
    workItem: 'Flex Banner (Star Media)',
    category: 'Flex Printing',
    quantity: 400, // 400 sq ft
    rate: 15,
    discount: 500,
    gstPercent: 18,
    total: 6490, // (400*15 - 500) * 1.18 = 5500 * 1.18 = 6490
    advance: 6490,
    balance: 0,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    deliveryDate: '2026-06-27',
    deliveryTime: '16:00',
    status: 'Delivered',
    stages: ['Pending', 'Designing', 'Printing', 'Lamination', 'Cutting', 'Ready', 'Delivered'],
    assignedStaff: 'shaji',
    designFileLink: 'https://drive.google.com/drive/folders/1abc123xyz',
    remarks: 'Bank inaugural banner - high clarity required.',
    invoiceNumber: 'INV-2026-0001',
    createdBy: 'aswathi',
    createdTime: '2026-06-25T10:30:00Z',
    updatedTime: '2026-06-27T17:00:00Z'
  },
  {
    id: 'GDM-2026-00002',
    date: '2026-07-01T11:15:00Z',
    customerId: 'CUST-0001',
    customerName: 'Malabar Gold & Diamonds',
    phone: '9847055443',
    email: 'malabar.kkm@malabargroup.com',
    address: 'Main Road, Kunnamkulam',
    productId: 'PRD-0002',
    workItem: 'Vinyl Sticker (Self Adhesive)',
    category: 'Sticker Printing',
    quantity: 100, // 100 units
    rate: 35,
    discount: 0,
    gstPercent: 18,
    total: 4130, // 3500 * 1.18 = 4130
    advance: 2000,
    balance: 2130,
    paymentMethod: 'Cash',
    paymentStatus: 'Partial',
    deliveryDate: '2026-07-05',
    deliveryTime: '11:00',
    status: 'Printing',
    stages: ['Pending', 'Designing', 'Printing', 'Lamination', 'Cutting', 'Ready', 'Delivered'],
    assignedStaff: 'manu',
    designFileLink: 'https://drive.google.com/drive/folders/2sticker456',
    remarks: 'Store label stickers - gold color foil accent.',
    invoiceNumber: 'INV-2026-0002',
    createdBy: 'rinto',
    createdTime: '2026-07-01T11:15:00Z',
    updatedTime: '2026-07-02T15:30:00Z'
  },
  {
    id: 'GDM-2026-00003',
    date: '2026-07-02T14:20:00Z',
    customerId: 'CUST-0005',
    customerName: 'Royal Wedding Palace',
    phone: '9544988771',
    email: 'contact@royalpalace.in',
    address: 'Adoor Road, Kunnamkulam',
    productId: 'PRD-0003',
    workItem: 'Premium Wedding Invitation Card',
    category: 'Card Printing',
    quantity: 1000,
    rate: 25,
    discount: 2000,
    gstPercent: 12,
    total: 25760, // (25000 - 2000) * 1.12 = 23000 * 1.12 = 25760
    advance: 10000,
    balance: 15760,
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Partial',
    deliveryDate: '2026-07-08',
    deliveryTime: '15:00',
    status: 'Designing',
    stages: ['Pending', 'Designing', 'Printing', 'Creasing', 'Binding', 'Ready', 'Delivered'],
    assignedStaff: 'manu',
    designFileLink: 'https://drive.google.com/drive/folders/weddingcard789',
    remarks: 'Text in Malayalam. Embossed gold printing.',
    invoiceNumber: 'INV-2026-0003',
    createdBy: 'aswathi',
    createdTime: '2026-07-02T14:20:00Z',
    updatedTime: '2026-07-02T14:20:00Z'
  },
  {
    id: 'GDM-2026-00004',
    date: '2026-07-03T09:45:00Z',
    customerId: 'CUST-0003',
    customerName: 'Elite Supermarket',
    phone: '9961234891',
    email: 'purchase@elitesuper.in',
    address: 'Guruvayur Road, Kunnamkulam',
    productId: 'PRD-0001',
    workItem: 'Flex Banner (Star Media)',
    category: 'Flex Printing',
    quantity: 150,
    rate: 15,
    discount: 250,
    gstPercent: 18,
    total: 2360, // (2250 - 250) * 1.18 = 2000 * 1.18 = 2360
    advance: 2360,
    balance: 0,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    deliveryDate: '2026-07-04',
    deliveryTime: '18:00',
    status: 'Ready',
    stages: ['Pending', 'Designing', 'Printing', 'Lamination', 'Cutting', 'Ready', 'Delivered'],
    assignedStaff: 'shaji',
    designFileLink: 'https://drive.google.com/drive/folders/elitedf101',
    remarks: 'Weekend promo banner - very urgent.',
    invoiceNumber: 'INV-2026-0004',
    createdBy: 'admin',
    createdTime: '2026-07-03T09:45:00Z',
    updatedTime: '2026-07-04T10:00:00Z'
  }
];

const DEFAULT_INVENTORY: InventoryItem[] = [
  { name: 'Star Flex Roll (10ft x 100ft)', stock: 3, minimumStock: 5, stockIn: 10, stockOut: 7, supplier: 'Classic Media Cochin', lastUpdated: new Date().toISOString() },
  { name: 'Glossy Sticker Roll (4ft x 150ft)', stock: 12, minimumStock: 4, stockIn: 15, stockOut: 3, supplier: 'StickMark Bangalore', lastUpdated: new Date().toISOString() },
  { name: 'Premium Invitation Blank (Gold-trimmed)', stock: 1500, minimumStock: 500, stockIn: 2000, stockOut: 500, supplier: 'FinePaper Coimbatore', lastUpdated: new Date().toISOString() },
  { name: 'LED Driver 12V 10A Waterproof', stock: 2, minimumStock: 10, stockIn: 25, stockOut: 23, supplier: 'SignSupply Ernakulam', lastUpdated: new Date().toISOString() },
  { name: 'High-Density Foam Board 5mm (8ft x 4ft)', stock: 15, minimumStock: 20, stockIn: 50, stockOut: 35, supplier: 'SignSupply Ernakulam', lastUpdated: new Date().toISOString() },
  { name: 'Eco-Solvent Cyan Ink (1 Liter)', stock: 8, minimumStock: 3, stockIn: 12, stockOut: 4, supplier: 'Roland India Distributor', lastUpdated: new Date().toISOString() }
];

const DEFAULT_EXPENSES: Expense[] = [
  { id: 'EXP-0001', date: '2026-06-05', category: 'Raw Materials', description: 'Bought 10 Flex Rolls and 5 Sticker Rolls', amount: 14500, addedBy: 'rinto' },
  { id: 'EXP-0002', date: '2026-06-10', category: 'Electricity', description: 'KSEB Office Electricity Bill June', amount: 8400, addedBy: 'rinto' },
  { id: 'EXP-0003', date: '2026-06-15', category: 'Rent', description: 'Shop Space Monthly Rent (KD Towers)', amount: 22000, addedBy: 'admin' },
  { id: 'EXP-0004', date: '2026-06-20', category: 'Salaries', description: 'Salary Advance for Manu', amount: 5000, addedBy: 'admin' },
  { id: 'EXP-0005', date: '2026-06-25', category: 'Maintenance', description: 'Printer Head Cleaning Fluid & Solvent', amount: 3200, addedBy: 'rinto' }
];

const DEFAULT_LOGS: ActivityLog[] = [
  { timestamp: '2026-07-04T09:00:00Z', user: 'system', action: 'INIT_SYSTEM', details: 'Database bootstrapped and populated with seed data' },
  { timestamp: '2026-07-04T09:15:00Z', user: 'admin', action: 'LOGIN', details: 'Owner K. Devadas logged in from workspace' },
  { timestamp: '2026-07-04T10:00:00Z', user: 'shaji', action: 'ORDER_STATUS_CHANGE', details: 'GDM-2026-00004 advanced to Ready' }
];

const DEFAULT_ATTENDANCE: Attendance[] = [
  { id: '2026-07-03-STF-0002', date: '2026-07-03', staffId: 'STF-0002', staffName: 'Rinto Paul', status: 'Present', checkIn: '09:00', checkOut: '18:00', markedBy: 'admin', notes: 'Regular shift' },
  { id: '2026-07-03-STF-0003', date: '2026-07-03', staffId: 'STF-0003', staffName: 'Aswathi V.', status: 'Present', checkIn: '09:15', checkOut: '17:30', markedBy: 'admin', notes: '' },
  { id: '2026-07-03-STF-0004', date: '2026-07-03', staffId: 'STF-0004', staffName: 'Manu Mohan', status: 'Present', checkIn: '08:45', checkOut: '18:15', markedBy: 'admin', notes: '' },
  { id: '2026-07-03-STF-0005', date: '2026-07-03', staffId: 'STF-0005', staffName: 'Shaji Kunnamkulam', status: 'Present', checkIn: '09:00', checkOut: '17:45', markedBy: 'admin', notes: '' }
];

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
  } | null>(null);

  const confirmAction = (config: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
  }) => {
    setConfirmConfig(config);
  };

  // Load from Firestore (cloud) or fallback to LocalStorage (offline-first)
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // ---- One-time seeding guard ----
        // Previously, any collection found empty (snap.empty) was
        // auto-reseeded with sample data on every login — including when
        // a user had deliberately deleted everything. That made deletions
        // look like they "didn't work" because the defaults silently came
        // back on next login. This marker document makes seeding happen
        // ONLY the very first time the app ever runs against this
        // Firestore project, never again afterward, no matter how empty
        // a collection becomes later.
        const seedStatusRef = doc(db, 'meta', 'seedStatus');
        const seedStatusSnap = await getDoc(seedStatusRef);
        const alreadySeeded = seedStatusSnap.exists();

        // Load settings
        const settingsSnap = await getDocs(collection(db, 'settings'));
        let finalSettings = DEFAULT_SETTINGS;
        if (settingsSnap.empty) {
          if (!alreadySeeded) {
            await setDoc(doc(db, 'settings', 'appSettings'), DEFAULT_SETTINGS);
          }
        } else {
          const found = settingsSnap.docs.find(d => d.id === 'appSettings');
          if (found) {
            finalSettings = found.data() as Settings;
          }
        }
        setSettings(finalSettings);
        localSet('settings', finalSettings);

        // Helper to load a collection, seeding defaults ONLY on first-ever run
        const loadCollection = async (colName: string, defaults: any[]) => {
          const snap = await getDocs(collection(db, colName));
          if (snap.empty) {
            if (alreadySeeded) {
              // Collection is legitimately empty (e.g. user deleted
              // everything) — respect that, do not resurrect defaults.
              return [];
            }
            // First-ever run for this project: seed defaults to Firestore
            for (const item of defaults) {
              const docId = item.id || item.name || 'default_id';
              await setDoc(doc(db, colName, docId), item);
            }
            return defaults;
          }
          return snap.docs.map(d => d.data());
        };

        const loadedWorkflows = await loadCollection('workflows', DEFAULT_WORKFLOWS);
        setWorkflows(loadedWorkflows as Workflow[]);
        localSet('workflows', loadedWorkflows);

        const loadedProducts = await loadCollection('products', DEFAULT_PRODUCTS);
        setProducts(loadedProducts as Product[]);
        localSet('products', loadedProducts);

        const loadedStaff = await loadCollection('staff', DEFAULT_STAFF);
        setStaffList(loadedStaff as Staff[]);
        localSet('staffList', loadedStaff);

        const loadedCustomers = await loadCollection('customers', DEFAULT_CUSTOMERS);
        setCustomers(loadedCustomers as Customer[]);
        localSet('customers', loadedCustomers);

        const loadedOrders = await loadCollection('orders', DEFAULT_ORDERS);
        setOrders(loadedOrders as Order[]);
        localSet('orders', loadedOrders);

        const loadedInventory = await loadCollection('inventory', DEFAULT_INVENTORY);
        setInventory(loadedInventory as InventoryItem[]);
        localSet('inventory', loadedInventory);

        const loadedExpenses = await loadCollection('expenses', DEFAULT_EXPENSES);
        setExpenses(loadedExpenses as Expense[]);
        localSet('expenses', loadedExpenses);

        const loadedAttendance = await loadCollection('attendance', DEFAULT_ATTENDANCE);
        setAttendance(loadedAttendance as Attendance[]);
        localSet('attendance', loadedAttendance);

        const loadedLogs = await loadCollection('logs', DEFAULT_LOGS);
        const sortedLogs = (loadedLogs as ActivityLog[]).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLogs(sortedLogs);
        localSet('logs', sortedLogs);

        // Record that seeding has happened (only writes the first time —
        // subsequent runs see alreadySeeded = true and skip all reseeding).
        if (!alreadySeeded) {
          await setDoc(seedStatusRef, { seededAt: new Date().toISOString() });
        }

        console.log('Successfully connected and synchronized with cloud Firestore database.');

      } catch (err) {
        console.warn('Could not connect to Firebase. Falling back to local storage:', err);
        const localGet = (key: string, defaults: any) => {
          const data = localStorage.getItem(`gdm_${key}`);
          if (data) {
            try {
              return JSON.parse(data);
            } catch (e) {
              console.error(`Error parsing key ${key}`, e);
              return defaults;
            }
          }
          localStorage.setItem(`gdm_${key}`, JSON.stringify(defaults));
          return defaults;
        };

        setOrders(localGet('orders', DEFAULT_ORDERS));
        setProducts(localGet('products', DEFAULT_PRODUCTS));
        setWorkflows(localGet('workflows', DEFAULT_WORKFLOWS));
        setCustomers(localGet('customers', DEFAULT_CUSTOMERS));
        setInventory(localGet('inventory', DEFAULT_INVENTORY));
        setExpenses(localGet('expenses', DEFAULT_EXPENSES));
        setStaffList(localGet('staffList', DEFAULT_STAFF));
        setAttendance(localGet('attendance', DEFAULT_ATTENDANCE));
        setSettings(localGet('settings', DEFAULT_SETTINGS));
        setLogs(localGet('logs', DEFAULT_LOGS));
      }

      // Session recovery
      const activeSession = sessionStorage.getItem('gdm_active_user');
      if (activeSession) {
        try {
          setCurrentUser(JSON.parse(activeSession));
        } catch (e) {}
      }
    };

    loadAllData();
  }, []);

  // Sync to local storage and Firestore on changes
  const localSet = (key: string, val: any) => {
    localStorage.setItem(`gdm_${key}`, JSON.stringify(val));
  };

  const syncSet = async (colName: string, docId: string, val: any) => {
    try {
      await setDoc(doc(db, colName, docId), val);
    } catch (e) {
      console.warn(`Firestore sync write failed for ${colName}/${docId}:`, e);
    }
  };

  const syncDelete = async (colName: string, docId: string) => {
    try {
      await deleteDoc(doc(db, colName, docId));
    } catch (e) {
      console.warn(`Firestore sync delete failed for ${colName}/${docId}:`, e);
    }
  };

  const logActivity = (user: string, action: string, details: string) => {
    const newLog: ActivityLog = {
      timestamp: new Date().toISOString(),
      user,
      action,
      details,
    };
    const updated = [newLog, ...logs].slice(0, 500); // keep last 500
    setLogs(updated);
    localSet('logs', updated);
    
    // Background sync to Firestore
    const logId = `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    syncSet('logs', logId, newLog);
  };

  // Auth Operations
  const login = async (username: string, password: string): Promise<{ success: boolean; message: string; user?: Staff }> => {
    const cleanUser = username.trim().toLowerCase();
    const user = staffList.find(s => s.username.toLowerCase() === cleanUser);
    
    if (!user) {
      logActivity('system', 'LOGIN_FAILED', `Invalid username attempted: ${username}`);
      return { success: false, message: 'Invalid username or password' };
    }
    
    if (user.status !== 'Active') {
      return { success: false, message: 'Account is deactivated. Please contact K. Devadas.' };
    }

    // Password verification logic: check custom saved password, fallback to default formulaic password
    const expectedPassword = user.password || (user.username === 'admin' ? 'grandadmin2026' : `${user.username}123`);
    if (password !== expectedPassword) {
      logActivity(user.username, 'LOGIN_FAILED', 'Incorrect password entered');
      return { success: false, message: 'Invalid username or password' };
    }

    setCurrentUser(user);
    sessionStorage.setItem('gdm_active_user', JSON.stringify(user));
    logActivity(user.username, 'LOGIN', 'Successful sign in');
    return { success: true, message: 'Welcome back!', user };
  };

  const logout = () => {
    if (currentUser) {
      logActivity(currentUser.username, 'LOGOUT', 'User signed out');
    }
    setCurrentUser(null);
    sessionStorage.removeItem('gdm_active_user');
  };

  // Products CRUD
  const saveProduct = (product: Partial<Product> & { name: string }) => {
    let updated: Product[];
    const isNew = !product.id;
    const prodId = product.id || `PRD-${String(products.length + 1).padStart(4, '0')}`;
    
    const newProduct: Product = {
      id: prodId,
      name: product.name,
      category: product.category || 'General',
      price: Number(product.price) || 0,
      gstPercent: Number(product.gstPercent) || 0,
      description: product.description || '',
      stock: Number(product.stock) || 0,
      workflowId: product.workflowId || '',
    };

    if (isNew) {
      updated = [...products, newProduct];
    } else {
      updated = products.map(p => p.id === prodId ? newProduct : p);
    }

    setProducts(updated);
    localSet('products', updated);
    syncSet('products', prodId, newProduct);
    logActivity(currentUser?.username || 'admin', isNew ? 'CREATE_PRODUCT' : 'UPDATE_PRODUCT', `${newProduct.name} (₹${newProduct.price})`);
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    localSet('products', updated);
    syncDelete('products', id);
    logActivity(currentUser?.username || 'admin', 'DELETE_PRODUCT', `Deleted product ID: ${id}`);
  };

  // Workflows CRUD
  const saveWorkflow = (workflow: { id?: string; name: string; stages: string[] }) => {
    let updated: Workflow[];
    const isNew = !workflow.id;
    const wfId = workflow.id || `WF-${String(workflows.length + 1).padStart(4, '0')}`;
    
    const newWf: Workflow = {
      id: wfId,
      name: workflow.name,
      stages: workflow.stages,
      createdBy: currentUser?.username || 'admin',
      createdTime: isNew ? new Date().toISOString() : workflows.find(w => w.id === wfId)?.createdTime || new Date().toISOString(),
    };

    if (isNew) {
      updated = [...workflows, newWf];
    } else {
      updated = workflows.map(w => w.id === wfId ? newWf : w);
    }

    setWorkflows(updated);
    localSet('workflows', updated);
    syncSet('workflows', wfId, newWf);
    logActivity(currentUser?.username || 'admin', isNew ? 'CREATE_WORKFLOW' : 'UPDATE_WORKFLOW', `${newWf.name} with ${newWf.stages.length} stages`);
  };

  const deleteWorkflow = (id: string) => {
    // Check if in use
    const inUse = products.some(p => p.workflowId === id);
    if (inUse) {
      alert('Cannot delete: This workflow is assigned to one or more active catalog products.');
      return;
    }
    const updated = workflows.filter(w => w.id !== id);
    setWorkflows(updated);
    localSet('workflows', updated);
    syncDelete('workflows', id);
    logActivity(currentUser?.username || 'admin', 'DELETE_WORKFLOW', `Deleted workflow ID: ${id}`);
  };

  // Customers CRUD
  const saveCustomer = (customer: Partial<Customer> & { name: string; phone: string }): Customer => {
    let updated: Customer[];
    const custId = customer.id || `CUST-${String(customers.length + 1).padStart(4, '0')}`;
    
    const existingCust = customers.find(c => c.id === custId || c.phone === customer.phone);
    
    const newCust: Customer = {
      id: existingCust?.id || custId,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || existingCust?.email || '',
      address: customer.address || existingCust?.address || '',
      gst: customer.gst || existingCust?.gst || '',
      totalOrders: Number(customer.totalOrders) !== undefined ? Number(customer.totalOrders) : (existingCust?.totalOrders || 0),
      totalPurchase: Number(customer.totalPurchase) !== undefined ? Number(customer.totalPurchase) : (existingCust?.totalPurchase || 0),
      pendingBalance: Number(customer.pendingBalance) !== undefined ? Number(customer.pendingBalance) : (existingCust?.pendingBalance || 0),
      lastOrder: customer.lastOrder || existingCust?.lastOrder || '',
    };

    if (existingCust) {
      updated = customers.map(c => c.id === existingCust.id ? newCust : c);
    } else {
      updated = [...customers, newCust];
    }

    setCustomers(updated);
    localSet('customers', updated);
    syncSet('customers', newCust.id, newCust);
    logActivity(currentUser?.username || 'admin', existingCust ? 'UPDATE_CUSTOMER' : 'CREATE_CUSTOMER', `${newCust.name} (${newCust.phone})`);
    return newCust;
  };

  const deleteCustomer = (id: string) => {
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    localSet('customers', updated);
    syncDelete('customers', id);
    logActivity(currentUser?.username || 'admin', 'DELETE_CUSTOMER', `Deleted customer ID: ${id}`);
  };

  // Orders CRUD
  const saveOrder = async (orderData: any): Promise<string> => {
    const isNew = !orderData.id;
    let orderId = orderData.id;
    
    if (isNew) {
      const year = new Date().getFullYear();
      const prefix = `GDM-${year}-`;
      const sameYearOrders = orders.filter(o => o.id.startsWith(prefix));
      let maxNum = 0;
      sameYearOrders.forEach(o => {
        const parts = o.id.split('-');
        const num = parseInt(parts[parts.length - 1], 10);
        if (num > maxNum) maxNum = num;
      });
      orderId = `${prefix}${String(maxNum + 1).padStart(5, '0')}`;
    }

    // Auto find/create customer
    const savedCustomer = saveCustomer({
      name: orderData.customerName,
      phone: orderData.phone,
      email: orderData.email || '',
      address: orderData.address || '',
    });

    // Workflow setup
    let stages = ['Pending', 'Ready', 'Delivered'];
    if (orderData.productId) {
      const prod = products.find(p => p.id === orderData.productId);
      if (prod && prod.workflowId) {
        const wf = workflows.find(w => w.id === prod.workflowId);
        if (wf) {
          stages = ['Pending', ...wf.stages];
          // Ensure Ready & Delivered are at the tail appropriately
          if (!stages.includes('Ready')) stages.push('Ready');
          if (!stages.includes('Delivered')) stages.push('Delivered');
        }
      }
    }

    const subtotal = (Number(orderData.quantity) || 0) * (Number(orderData.rate) || 0) - (Number(orderData.discount) || 0);
    const calculatedTotal = Math.max(0, subtotal + subtotal * ((Number(orderData.gstPercent) || 0) / 100));
    const advancePaid = Number(orderData.advance) || 0;
    const remainingBalance = Math.max(0, calculatedTotal - advancePaid);
    const payStatus = remainingBalance <= 0 ? 'Paid' : (advancePaid > 0 ? 'Partial' : 'Unpaid');

    const newOrder: Order = {
      id: orderId,
      date: orderData.date || new Date().toISOString(),
      customerId: savedCustomer.id,
      customerName: orderData.customerName,
      phone: orderData.phone,
      email: orderData.email || '',
      address: orderData.address || '',
      productId: orderData.productId || '',
      workItem: orderData.workItem,
      category: orderData.category || 'General',
      quantity: Number(orderData.quantity) || 1,
      rate: Number(orderData.rate) || 0,
      discount: Number(orderData.discount) || 0,
      gstPercent: Number(orderData.gstPercent) || 0,
      total: Math.round(calculatedTotal * 100) / 100,
      advance: advancePaid,
      balance: Math.round(remainingBalance * 100) / 100,
      paymentMethod: orderData.paymentMethod || 'Cash',
      paymentStatus: payStatus as any,
      deliveryDate: orderData.deliveryDate || '',
      deliveryTime: orderData.deliveryTime || '',
      status: orderData.status || 'Pending',
      stages: stages,
      assignedStaff: orderData.assignedStaff || '',
      designFileLink: orderData.designFileLink || '',
      remarks: orderData.remarks || '',
      invoiceNumber: orderData.invoiceNumber || (isNew ? `INV-${new Date().getFullYear()}-${String(orders.length + 1).padStart(4, '0')}` : ''),
      createdBy: orderData.createdBy || currentUser?.username || 'admin',
      createdTime: orderData.createdTime || new Date().toISOString(),
      updatedTime: new Date().toISOString()
    };

    let updatedOrders: Order[];
    if (isNew) {
      updatedOrders = [...orders, newOrder];
    } else {
      updatedOrders = orders.map(o => o.id === orderId ? newOrder : o);
    }

    setOrders(updatedOrders);
    localSet('orders', updatedOrders);
    syncSet('orders', orderId, newOrder);

    // Update customer stats
    const custOrders = updatedOrders.filter(o => o.customerId === savedCustomer.id);
    const totalPurchase = custOrders.reduce((sum, o) => sum + o.total, 0);
    const totalPending = custOrders.reduce((sum, o) => sum + o.balance, 0);

    saveCustomer({
      id: savedCustomer.id,
      name: savedCustomer.name,
      phone: savedCustomer.phone,
      totalOrders: custOrders.length,
      totalPurchase: Math.round(totalPurchase * 100) / 100,
      pendingBalance: Math.round(totalPending * 100) / 100,
      lastOrder: newOrder.date.substring(0, 10),
    });

    logActivity(currentUser?.username || 'admin', isNew ? 'CREATE_ORDER' : 'UPDATE_ORDER', `Order ID: ${orderId} for ${newOrder.customerName} - Total: ₹${newOrder.total}`);
    return orderId;
  };

  const updateOrderStatus = async (orderId: string, newStatus: string): Promise<void> => {
    let targetOrder: Order | undefined;
    const updated = orders.map(o => {
      if (o.id === orderId) {
        targetOrder = {
          ...o,
          status: newStatus,
          updatedTime: new Date().toISOString()
        };
        return targetOrder;
      }
      return o;
    });
    setOrders(updated);
    localSet('orders', updated);
    if (targetOrder) {
      await syncSet('orders', orderId, targetOrder);
    }
    logActivity(currentUser?.username || 'admin', 'ORDER_STATUS_CHANGE', `${orderId} -> ${newStatus}`);
  };

  const deleteOrder = async (orderId: string): Promise<void> => {
    const o = orders.find(x => x.id === orderId);
    if (!o) return;
    const updated = orders.filter(x => x.id !== orderId);
    setOrders(updated);
    localSet('orders', updated);
    await syncDelete('orders', orderId);
    logActivity(currentUser?.username || 'admin', 'DELETE_ORDER', `Deleted order ID: ${orderId}`);
  };

  // Inventory CRUD
  const saveInventoryItem = (item: InventoryItem) => {
    let updated: InventoryItem[];
    const existing = inventory.find(i => i.name.toLowerCase() === item.name.toLowerCase());
    
    const newItem: InventoryItem = {
      name: item.name,
      stock: Number(item.stock) || 0,
      minimumStock: Number(item.minimumStock) || 0,
      stockIn: Number(item.stockIn) || 0,
      stockOut: Number(item.stockOut) || 0,
      supplier: item.supplier || '',
      lastUpdated: new Date().toISOString(),
    };

    if (existing) {
      updated = inventory.map(i => i.name.toLowerCase() === item.name.toLowerCase() ? newItem : i);
    } else {
      updated = [...inventory, newItem];
    }

    setInventory(updated);
    localSet('inventory', updated);
    syncSet('inventory', newItem.name, newItem);
    logActivity(currentUser?.username || 'admin', 'SAVE_INVENTORY', `${newItem.name} - Stock: ${newItem.stock}`);
  };

  const deleteInventoryItem = (name: string) => {
    const updated = inventory.filter(i => i.name.toLowerCase() !== name.toLowerCase());
    setInventory(updated);
    localSet('inventory', updated);
    syncDelete('inventory', name);
    logActivity(currentUser?.username || 'admin', 'DELETE_INVENTORY', `Deleted material: ${name}`);
  };

  // Expenses CRUD
  const saveExpense = (expense: Partial<Expense> & { category: string; amount: number }) => {
    let updated: Expense[];
    const isNew = !expense.id;
    const expId = expense.id || `EXP-${String(expenses.length + 1).padStart(4, '0')}`;

    const newExpense: Expense = {
      id: expId,
      date: expense.date || new Date().toISOString().substring(0, 10),
      category: expense.category,
      description: expense.description || '',
      amount: Number(expense.amount) || 0,
      addedBy: expense.addedBy || currentUser?.username || 'admin',
    };

    if (isNew) {
      updated = [...expenses, newExpense];
    } else {
      updated = expenses.map(e => e.id === expId ? newExpense : e);
    }

    setExpenses(updated);
    localSet('expenses', updated);
    syncSet('expenses', expId, newExpense);
    logActivity(currentUser?.username || 'admin', isNew ? 'CREATE_EXPENSE' : 'UPDATE_EXPENSE', `${newExpense.category} - ₹${newExpense.amount}`);
  };

  const deleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    localSet('expenses', updated);
    syncDelete('expenses', id);
    logActivity(currentUser?.username || 'admin', 'DELETE_EXPENSE', `Deleted expense ID: ${id}`);
  };

  // Staff CRUD
  const saveStaff = (staff: Partial<Staff> & { name: string; username: string }, password?: string) => {
    let updated: Staff[];
    const isNew = !staff.id;
    const staffId = staff.id || `STF-${String(staffList.length + 1).padStart(4, '0')}`;
    const existing = staffList.find(s => s.id === staffId);

    const newStaff: Staff = {
      id: staffId,
      name: staff.name,
      username: staff.username.trim().toLowerCase(),
      role: staff.role || 'Staff',
      phone: staff.phone || '',
      email: staff.email || '',
      status: staff.status || 'Active',
      password: password || existing?.password || (staff.username.trim().toLowerCase() === 'admin' ? 'admin123' : `${staff.username.trim().toLowerCase()}123`)
    };

    if (isNew) {
      updated = [...staffList, newStaff];
    } else {
      updated = staffList.map(s => s.id === staffId ? newStaff : s);
    }

    setStaffList(updated);
    localSet('staffList', updated);
    syncSet('staff', staffId, newStaff);
    logActivity(currentUser?.username || 'admin', isNew ? 'CREATE_STAFF' : 'UPDATE_STAFF', `${newStaff.name} as ${newStaff.role}`);
  };

  const deleteStaff = (id: string) => {
    const updated = staffList.filter(s => s.id !== id);
    setStaffList(updated);
    localSet('staffList', updated);
    syncDelete('staff', id);
    logActivity(currentUser?.username || 'admin', 'DELETE_STAFF', `Deleted staff ID: ${id}`);
  };

  // Attendance CRUD
  const saveAttendance = (record: Attendance) => {
    const exists = attendance.some(a => a.id === record.id);
    let updated: Attendance[];
    if (exists) {
      updated = attendance.map(a => a.id === record.id ? record : a);
    } else {
      updated = [...attendance, record];
    }
    setAttendance(updated);
    localSet('attendance', updated);
    syncSet('attendance', record.id, record);
    logActivity(currentUser?.username || 'admin', 'MARK_ATTENDANCE', `${record.staffName} marked as ${record.status} on ${record.date}`);
  };

  const saveMultipleAttendance = (records: Attendance[]) => {
    const updated = [...attendance];
    for (const record of records) {
      const idx = updated.findIndex(a => a.id === record.id);
      if (idx > -1) {
        updated[idx] = record;
      } else {
        updated.push(record);
      }
      syncSet('attendance', record.id, record);
    }
    setAttendance(updated);
    localSet('attendance', updated);
    logActivity(currentUser?.username || 'admin', 'MARK_ATTENDANCE_BATCH', `Updated attendance batch of ${records.length} records`);
  };

  // Settings CRUD
  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localSet('settings', newSettings);
    syncSet('settings', 'appSettings', newSettings);
    logActivity(currentUser?.username || 'admin', 'UPDATE_SETTINGS', 'Business and local billing configurations updated.');
  };

  return (
    <DbContext.Provider value={{
      orders, products, workflows, customers, inventory, expenses, staffList, settings, logs, attendance, currentUser,
      login, logout,
      saveProduct, deleteProduct,
      saveWorkflow, deleteWorkflow,
      saveCustomer, deleteCustomer,
      saveOrder, updateOrderStatus, deleteOrder,
      saveInventoryItem, deleteInventoryItem,
      saveExpense, deleteExpense,
      saveStaff, deleteStaff,
      saveAttendance, saveMultipleAttendance,
      saveSettings, logActivity, confirmAction
    }}>
      {children}

      {/* Reusable, highly aesthetic Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmConfig && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4 text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{confirmConfig.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{confirmConfig.message}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmConfig(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {confirmConfig.cancelText || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmConfig.onConfirm();
                    setConfirmConfig(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer ${
                    confirmConfig.isDanger !== false
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {confirmConfig.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DbContext.Provider>
  );
};

export const useDb = () => {
  const context = useContext(DbContext);
  if (context === undefined) {
    throw new Error('useDb must be used within a DbProvider');
  }
  return context;
};