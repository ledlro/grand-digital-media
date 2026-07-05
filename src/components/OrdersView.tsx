import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { Order, Product, Staff } from '../types';
import { 
  Printer, 
  Edit, 
  Trash2, 
  Plus, 
  Phone, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  Save, 
  MessageSquare,
  Search,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function OrdersView({ searchFilter }: { searchFilter?: string }) {
  const { 
    orders, products, staffList, currentUser, settings,
    saveOrder, updateOrderStatus, deleteOrder, confirmAction
  } = useDb();

  const [search, setSearch] = useState(searchFilter || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [workItem, setWorkItem] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [rate, setRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [gstPercent, setGstPercent] = useState(18);
  const [advance, setAdvance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [designFileLink, setDesignFileLink] = useState('');
  const [remarks, setRemarks] = useState('');

  // Update local search state if prop changes
  useEffect(() => {
    if (searchFilter !== undefined) {
      setSearch(searchFilter);
    }
  }, [searchFilter]);

  if (!currentUser) return null;

  const isProdStaff = ['Editor', 'Staff'].includes(currentUser.role);
  const currency = settings.currency || '₹';

  // Money formatting
  const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');
  const money = (n: number) => `${currency} ${fmt(n)}`;

  // Filter & Search
  const filteredOrders = orders.filter(o => {
    const s = search.toLowerCase();
    const matchesSearch = !s || (
      o.id.toLowerCase().includes(s) ||
      o.customerName.toLowerCase().includes(s) ||
      o.phone.includes(s) ||
      (o.invoiceNumber || '').toLowerCase().includes(s) ||
      o.workItem.toLowerCase().includes(s) ||
      o.category.toLowerCase().includes(s)
    );
    const matchesStatus = !statusFilter || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  // Form autofill on product change
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setWorkItem(prod.name);
      setCategory(prod.category);
      setRate(prod.price);
      setGstPercent(prod.gstPercent);
    } else {
      setWorkItem('');
      setCategory('');
      setRate(0);
      setGstPercent(18);
    }
  };

  // Calculations for display inside modal
  const subtotal = quantity * rate - discount;
  const calculatedTotal = Math.max(0, subtotal + subtotal * (gstPercent / 100));
  const remainingBalance = Math.max(0, calculatedTotal - advance);

  const handleOpenModal = (orderId: string | null = null) => {
    if (orderId) {
      const o = orders.find(x => x.id === orderId);
      if (o) {
        setEditingOrderId(orderId);
        setCustomerName(o.customerName);
        setPhone(o.phone);
        setEmail(o.email || '');
        setAddress(o.address || '');
        setSelectedProductId(o.productId || '');
        setWorkItem(o.workItem);
        setCategory(o.category);
        setQuantity(o.quantity);
        setRate(o.rate);
        setDiscount(o.discount);
        setGstPercent(o.gstPercent);
        setAdvance(o.advance);
        setPaymentMethod(o.paymentMethod);
        setAssignedStaff(o.assignedStaff);
        setDeliveryDate(o.deliveryDate || '');
        setDeliveryTime(o.deliveryTime || '');
        setDesignFileLink(o.designFileLink || '');
        setRemarks(o.remarks || '');
      }
    } else {
      setEditingOrderId(null);
      setCustomerName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setSelectedProductId('');
      setWorkItem('');
      setCategory('');
      setQuantity(1);
      setRate(0);
      setDiscount(0);
      setGstPercent(18);
      setAdvance(0);
      setPaymentMethod('UPI');
      setAssignedStaff('');
      setDeliveryDate('');
      setDeliveryTime('');
      setDesignFileLink('');
      setRemarks('');
    }
    setIsModalOpen(true);
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !workItem.trim()) {
      alert('Please fill out customer name, phone, and work item.');
      return;
    }

    const payload = {
      id: editingOrderId,
      customerName,
      phone,
      email,
      address,
      productId: selectedProductId,
      workItem,
      category,
      quantity,
      rate,
      discount,
      gstPercent,
      advance,
      paymentMethod,
      assignedStaff,
      deliveryDate,
      deliveryTime,
      designFileLink,
      remarks,
      status: editingOrderId ? orders.find(x => x.id === editingOrderId)?.status : 'Pending',
      createdBy: editingOrderId ? orders.find(x => x.id === editingOrderId)?.createdBy : currentUser.username,
      createdTime: editingOrderId ? orders.find(x => x.id === editingOrderId)?.createdTime : undefined,
    };

    await saveOrder(payload);
    setIsModalOpen(false);
  };

  const handleAdvanceStatus = async (orderId: string, currentStatus: string, stages: string[]) => {
    const curIdx = stages.indexOf(currentStatus);
    if (curIdx === -1) return;
    const nextStatus = stages[curIdx + 1];
    if (nextStatus) {
      await updateOrderStatus(orderId, nextStatus);
    }
  };

  const handleDelete = async (orderId: string) => {
    confirmAction({
      title: 'Delete Order',
      message: `Are you sure you want to permanently delete order ${orderId}? This cannot be undone.`,
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: async () => {
        await deleteOrder(orderId);
      }
    });
  };

  const printInvoice = (order: Order) => {
    const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=110x110&chl=${encodeURIComponent(order.id + '|' + order.invoiceNumber)}`;
    
    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.invoiceNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 25px; }
          .logo { font-size: 24px; font-weight: 900; color: #2563eb; margin: 0 0 5px 0; }
          .shop-title { font-size: 20px; font-weight: 800; margin: 0 0 5px 0; }
          .shop-details, .client-details { font-size: 12px; color: #64748b; }
          .invoice-meta { text-align: right; }
          .invoice-title { font-size: 28px; font-weight: 900; color: #0f172a; margin: 0 0 5px 0; letter-spacing: -0.5px; }
          .client-box { background: #f8fafc; border-radius: 12px; padding: 15px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
          .client-title { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.5px; }
          .client-name { font-size: 14px; font-weight: 700; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; }
          .summary { display: flex; justify-content: flex-end; margin-bottom: 40px; }
          .summary-table { width: 280px; }
          .summary-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
          .summary-table .bold-row td { font-weight: 800; font-size: 14px; color: #0f172a; border-top: 2px solid #2563eb; }
          .footer { text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 50px; font-size: 11px; color: #94a3b8; }
          .qr { margin-top: 10px; }
          @media print {
            body { padding: 20px; }
            .client-box { background: #fff !important; border: 1px solid #cbd5e1; }
            th { background: #e2e8f0 !important; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <div class="logo">${settings.logo || 'GDM'}</div>
              <div class="shop-title">${settings.businessName || 'Grand Digital Media'}</div>
              <div class="shop-details">
                ${settings.address || 'Kunnamkulam, Kerala'}<br>
                Phone: ${settings.phone || ''} | Email: ${settings.email || ''}<br>
                GSTIN: ${settings.gstNumber || 'N/A'}
              </div>
            </div>
            <div class="invoice-meta">
              <div class="invoice-title">INVOICE</div>
              <div class="shop-details" style="font-size:13px; font-weight:bold; color:#0f172a; margin-bottom: 5px;">No: ${order.invoiceNumber}</div>
              <div class="shop-details">
                Date: ${new Date(order.date).toLocaleDateString()}<br>
                Order ID: ${order.id}
              </div>
              <div class="qr"><img src="${qrUrl}" width="80" height="80"></div>
            </div>
          </div>

          <div class="client-box">
            <div class="client-title">Billed To</div>
            <div class="client-name">${order.customerName}</div>
            <div class="client-details" style="margin-top:4px;">
              Phone: ${order.phone}<br>
              ${order.email ? `Email: ${order.email}<br>` : ''}
              ${order.address ? `Address: ${order.address}` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Description</th>
                <th style="text-align: right;">Qty</th>
                <th style="text-align: right;">Rate</th>
                <th style="text-align: right;">Discount</th>
                <th style="text-align: right;">GST</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 700;">
                  ${order.workItem}
                  <span style="display:block; font-size:11px; color:#64748b; font-weight:normal; margin-top:2px;">Category: ${order.category}</span>
                </td>
                <td style="text-align: right;">${order.quantity}</td>
                <td style="text-align: right;">${currency} ${order.rate}</td>
                <td style="text-align: right;">${currency} ${order.discount}</td>
                <td style="text-align: right;">${order.gstPercent}%</td>
                <td style="text-align: right; font-weight: 700;">${currency} ${fmt(order.total)}</td>
              </tr>
            </tbody>
          </table>

          <div class="summary">
            <table class="summary-table">
              <tr>
                <td style="color: #64748b;">Subtotal (excl. Tax)</td>
                <td style="text-align: right; font-weight: 600;">${currency} ${fmt(order.quantity * order.rate - order.discount)}</td>
              </tr>
              <tr>
                <td style="color: #64748b;">GST Amount</td>
                <td style="text-align: right; font-weight: 600;">${currency} ${fmt(order.total - (order.quantity * order.rate - order.discount))}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-weight: 700;">Grand Total</td>
                <td style="text-align: right; font-weight: 800; color: #2563eb;">${currency} ${fmt(order.total)}</td>
              </tr>
              <tr>
                <td style="color: #10b981; font-weight: 700;">Advance Paid</td>
                <td style="text-align: right; font-weight: 700; color: #10b981;">${currency} ${fmt(order.advance)}</td>
              </tr>
              <tr class="bold-row">
                <td>Balance Due</td>
                <td style="text-align: right;">${currency} ${fmt(order.balance)}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            ${settings.invoiceFooter || 'Thank you for your business!'}<br>
            <span style="font-size: 9px; display:block; margin-top:5px; color:#cbd5e1;">Generated via GDM Kunnamkulam ERP Utility</span>
          </div>
        </div>
      </body>
      </html>
    `;

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 500);
    }
  };

  const statusOpts = ['Pending', 'Designing', 'Printing', 'Lamination', 'Cutting', 'Creasing', 'Binding', 'Ready', 'Delivered', 'Cancelled'];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">Orders Ledger</h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">View active production jobs, modify statuses, print local invoices, or create custom orders.</p>
        </div>
        {!isProdStaff && (
          <button 
            onClick={() => handleOpenModal()}
            className="btn py-2.5 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer"
          >
            <Plus size={16} /> New Order Form
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search order number, phone, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* Status drop filters */}
        <div className="flex gap-2 flex-wrap w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === '' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            All States
          </button>
          {['Pending', 'Designing', 'Printing', 'Ready', 'Delivered', 'Cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === s 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">ID / Date</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Customer Info</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Work Item / Catalog</th>
                {!isProdStaff && <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Finance Summary</th>}
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Task Status</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Assigned / Delivery</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider">Workflow Controller</th>
                <th className="p-4 font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {paginatedOrders.map(order => {
                const isCancelled = order.status === 'Cancelled';
                const isDelivered = order.status === 'Delivered';
                const curIdx = order.stages.indexOf(order.status);
                const nextStage = order.stages[curIdx + 1];

                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    {/* ID / Date */}
                    <td className="p-4">
                      <div className="font-extrabold text-slate-800 dark:text-slate-200">{order.id}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{new Date(order.date).toLocaleDateString()}</div>
                      {order.invoiceNumber && (
                        <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] px-1.5 py-0.5 rounded mt-2 font-bold uppercase">
                          {order.invoiceNumber}
                        </span>
                      )}
                    </td>

                    {/* Customer Info */}
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-slate-300">{order.customerName}</div>
                      <div className="text-slate-400 dark:text-slate-500 font-semibold mt-1 flex items-center gap-1">
                        <Phone size={12} /> {order.phone}
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <a 
                          href={`tel:${order.phone.replace(/\D/g, '')}`}
                          className="p-1 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-all"
                          title="Call Client"
                        >
                          <Phone size={11} />
                        </a>
                        <a 
                          href={`https://wa.me/91${order.phone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-1.5 py-1 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </td>

                    {/* Work Item */}
                    <td className="p-4">
                      <div className="font-bold text-slate-700 dark:text-slate-300">{order.workItem}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Category: {order.category}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Qty: {order.quantity} x {currency}{order.rate}</div>
                      {order.designFileLink && (
                        <a 
                          href={order.designFileLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 mt-2 font-bold cursor-pointer"
                        >
                          Design Link <ExternalLink size={10} />
                        </a>
                      )}
                    </td>

                    {/* Finance Summary */}
                    {!isProdStaff && (
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{money(order.total)}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Adv: {money(order.advance)}</div>
                        <div className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold mt-0.5">Due: {money(order.balance)}</div>
                        <div className="mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            order.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            order.paymentStatus === 'Partial' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                            'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Task Status */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'Ready' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                        order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        order.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                        'bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse'
                      }`}>
                        {order.status}
                      </span>
                    </td>

                    {/* Assigned / Delivery */}
                    <td className="p-4">
                      <div className="text-slate-600 dark:text-slate-400 font-semibold">
                        {order.assignedStaff ? (
                          <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800 w-fit text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300">
                            👤 {order.assignedStaff}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Unassigned</span>
                        )}
                      </div>
                      
                      {order.deliveryDate ? (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                          📅 {order.deliveryDate} {order.deliveryTime && `@ ${order.deliveryTime}`}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic mt-2">No delivery date</div>
                      )}
                    </td>

                    {/* Workflow advancing logic */}
                    <td className="p-4">
                      {isProdStaff ? (
                        nextStage ? (
                          <button
                            onClick={() => handleAdvanceStatus(order.id, order.status, order.stages)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
                          >
                            Mark: {nextStage}
                          </button>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[10px] italic">No further steps</span>
                        )
                      ) : (
                        <select
                          value={order.status}
                          disabled={isCancelled || isDelivered}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 px-2 py-1.5 rounded-xl text-[11px] font-bold text-slate-800 dark:text-slate-200 focus:outline-none w-36 disabled:opacity-50"
                        >
                          {order.stages.map(stage => (
                            <option key={stage} value={stage}>{stage}</option>
                          ))}
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      )}
                    </td>

                    {/* Actions Panel */}
                    <td className="p-4 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => printInvoice(order)}
                          className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 cursor-pointer transition-all"
                          title="Print Local Invoice"
                        >
                          <Printer size={14} />
                        </button>
                        {!isProdStaff && (
                          <>
                            <button
                              onClick={() => handleOpenModal(order.id)}
                              className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 cursor-pointer transition-all"
                              title="Edit Details"
                            >
                              <Edit size={14} />
                            </button>
                            {(currentUser.role === 'Owner' || currentUser.role === 'Admin' || currentUser.role === 'Manager') && (
                              <button
                                onClick={() => handleDelete(order.id)}
                                className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 cursor-pointer transition-all"
                                title="Delete Order"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pager Panel */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/10">
            <span className="text-[11px] font-bold text-slate-400">Page {currentPage} of {totalPages} ({filteredOrders.length} orders total)</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FORM MODAL - ADD/EDIT ORDER */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Head */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200">
                  {editingOrderId ? `Edit Order #${editingOrderId}` : 'New Order Booking'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveOrder} className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Customer Section */}
                <div className="bg-blue-50/50 dark:bg-slate-800/30 border border-blue-500/10 p-4 rounded-xl space-y-3">
                  <h4 className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                    Client Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Customer Name</label>
                      <input 
                        type="text" 
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Name or Business Name"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Mobile Number"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Email ID</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="client@gmail.com"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Billing/Delivery Address</label>
                      <input 
                        type="text" 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street Address, Town"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Catalog Product Link */}
                {!editingOrderId && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Link Catalog Product</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold"
                    >
                      <option value="">-- Custom/Not in Catalog --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({currency}{p.price})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Job description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Work Item Description</label>
                    <input 
                      type="text" 
                      value={workItem}
                      onChange={(e) => setWorkItem(e.target.value)}
                      placeholder="e.g. Flex printing 10x8ft, 200 copies Wedding card"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Category</label>
                    <input 
                      type="text" 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Flex Printing, Sticker, Invitation"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Financial Ledger calculations */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Quantity</label>
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Rate ({currency})</label>
                    <input 
                      type="number" 
                      value={rate}
                      onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Discount ({currency})</label>
                    <input 
                      type="number" 
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">GST %</label>
                    <input 
                      type="number" 
                      value={gstPercent}
                      onChange={(e) => setGstPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Subtotals & Payment Adv */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Computed Total (incl. GST)</span>
                    <span className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1 block">
                      {money(calculatedTotal)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Advance Paid ({currency})</label>
                    <input 
                      type="number" 
                      value={advance}
                      onChange={(e) => setAdvance(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-xs font-extrabold text-emerald-600"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining Balance</span>
                    <span className="text-md font-extrabold text-rose-500 mt-1 block">
                      {money(remainingBalance)}
                    </span>
                  </div>
                </div>

                {/* Method, Staff and Deadlines */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold"
                    >
                      <option>UPI</option>
                      <option>Cash</option>
                      <option>Card</option>
                      <option>Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Assign Operator</label>
                    <select
                      value={assignedStaff}
                      onChange={(e) => setAssignedStaff(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold"
                    >
                      <option value="">-- Unassigned --</option>
                      {staffList.filter(s => ['Editor', 'Staff'].includes(s.role)).map(s => (
                        <option key={s.id} value={s.username}>{s.name} ({s.role})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Delivery Target Date</label>
                    <input 
                      type="date" 
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Delivery Target Time</label>
                    <input 
                      type="time" 
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Design File URL */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Design File Link (Google Drive / Cloud)</label>
                  <input 
                    type="url" 
                    value={designFileLink}
                    onChange={(e) => setDesignFileLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs"
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Production Details / Special Instructions</label>
                  <textarea 
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="E.g. Matte finish, Malayalam layout, gold leafing on border..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-xs"
                    rows={2}
                  />
                </div>

                {/* Foot buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
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
