export interface Order {
  id: string; // Order ID
  date: string; // Order Date
  customerId: string; // Customer ID
  customerName: string; // Customer Name
  phone: string; // Phone
  email: string; // Email
  address: string; // Address
  productId: string; // Product ID
  workItem: string; // Work Item (Product Name)
  category: string; // Category
  quantity: number; // Quantity
  rate: number; // Rate
  discount: number; // Discount
  gstPercent: number; // GST %
  total: number; // Total
  advance: number; // Advance
  balance: number; // Balance
  paymentMethod: string; // Payment Method
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid'; // Payment Status
  deliveryDate: string; // Delivery Date
  deliveryTime: string; // Delivery Time
  status: string; // Order Status (e.g., Pending, Designing, Printing, Ready, Delivered, Cancelled)
  stages: string[]; // Workflow Stages sequence
  assignedStaff: string; // Assigned Staff username or name
  designFileLink: string; // Design File Link
  remarks: string; // Remarks
  invoiceNumber: string; // Invoice Number
  createdBy: string; // Created By
  createdTime: string; // Created Time
  updatedTime: string; // Updated Time
}

export interface Customer {
  id: string; // Customer ID
  name: string; // Customer Name
  phone: string; // Phone
  email: string; // Email
  address: string; // Address
  gst: string; // GST
  totalOrders: number; // Total Orders
  totalPurchase: number; // Total Purchase
  pendingBalance: number; // Pending Balance
  lastOrder: string; // Last Order Date
}

export interface Product {
  id: string; // Product ID
  name: string; // Product Name
  category: string; // Category
  price: number; // Price
  gstPercent: number; // GST
  description: string; // Description
  stock: number; // Stock
  workflowId: string; // Workflow ID
}

export interface Workflow {
  id: string; // Workflow ID
  name: string; // Workflow Name
  stages: string[]; // Stages (e.g., ["Designing", "Printing", "Lamination", "Cutting", "Binding"])
  createdBy: string; // Created By
  createdTime: string; // Created Time
}

export interface Staff {
  id: string; // Staff ID
  name: string; // Name
  username: string; // Username
  role: 'Owner' | 'Admin' | 'Manager' | 'Cashier' | 'Editor' | 'Staff'; // Role
  phone: string; // Phone
  email: string; // Email
  status: 'Active' | 'Inactive'; // Status
  password?: string; // Optional custom login password
}

export interface Expense {
  id: string; // Expense ID
  date: string; // Date
  category: string; // Category (Rent, Ink, Electricity, etc.)
  description: string; // Description
  amount: number; // Amount
  addedBy: string; // Added By
}

export interface InventoryItem {
  name: string; // Item (Item Name)
  stock: number; // Stock
  minimumStock: number; // Minimum Stock
  stockIn: number; // Stock In
  stockOut: number; // Stock Out
  supplier: string; // Supplier
  lastUpdated: string; // Last Updated
}

export interface Settings {
  businessName: string;
  logo: string;
  gstNumber: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  invoiceFooter: string;
  currency: string;
  theme: string;
  darkMode: boolean;
}

export interface ActivityLog {
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface Attendance {
  id: string; // YYYY-MM-DD-staffId
  date: string; // YYYY-MM-DD
  staffId: string;
  staffName: string;
  status: 'Present' | 'Absent' | 'Leave' | 'Public Holiday';
  checkIn?: string; // HH:MM
  checkOut?: string; // HH:MM
  notes?: string;
  markedBy: string;
}

