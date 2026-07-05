import React, { useState, useRef } from 'react';
import { useDb } from '../context/DbContext';
import { BarChart3, TrendingUp, TrendingDown, Receipt, Printer, ShieldAlert, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReportsView() {
  const { orders, expenses, settings, currentUser } = useDb();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!currentUser) return null;

  // Security guard (Only Owner, Admin and Manager roles can view reports)
  if (!['Owner', 'Admin', 'Manager'].includes(currentUser.role)) {
    return (
      <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-500/10 p-6 rounded-2xl text-center max-w-md mx-auto my-12">
        <ShieldAlert className="text-red-500 mx-auto mb-2" size={24} />
        <h4 className="font-bold text-red-800 dark:text-red-400 text-sm">Access Restricted</h4>
        <p className="text-xs text-red-600 dark:text-red-500/80 mt-1">
          Analytical business report matrices, tax ledger sheets, and net yield metrics can only be audited by administrators.
        </p>
      </div>
    );
  }

  const currency = settings.currency || '₹';
  const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');
  const money = (n: number) => `${currency} ${fmt(n)}`;

  // Financial calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalReceived = orders
    .filter(o => o.paymentStatus === 'Paid')
    .reduce((sum, o) => sum + (o.total || 0), 0) + 
    orders
    .filter(o => o.paymentStatus === 'Partial')
    .reduce((sum, o) => sum + (o.advance || 0), 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Monthly breakdown
  const monthlyData: { [key: string]: { rev: number; exp: number } } = {};
  
  orders.forEach(o => {
    if (o && typeof o.date === 'string' && o.date.length >= 7) {
      const m = o.date.substring(0, 7); // YYYY-MM
      if (m && m.includes('-')) {
        if (!monthlyData[m]) monthlyData[m] = { rev: 0, exp: 0 };
        monthlyData[m].rev += (o.total || 0);
      }
    }
  });

  expenses.forEach(e => {
    if (e && typeof e.date === 'string' && e.date.length >= 7) {
      const m = e.date.substring(0, 7);
      if (m && m.includes('-')) {
        if (!monthlyData[m]) monthlyData[m] = { rev: 0, exp: 0 };
        monthlyData[m].exp += (e.amount || 0);
      }
    }
  });

  const sortedMonths = Object.keys(monthlyData).sort().slice(-6); // last 6 months

  // Expense categories breakdown
  const expenseCatTotals: { [key: string]: number } = {};
  expenses.forEach(e => {
    expenseCatTotals[e.category] = (expenseCatTotals[e.category] || 0) + e.amount;
  });

  const handleGeneratePdf = async () => {
    if (!reportRef.current || isGenerating) return;
    setIsGenerating(true);

    // Let React re-render first: reveal the letterhead header and hide the
    // on-screen action bar so neither shows up (or fails to show up) in the
    // captured image.
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeName = (settings.businessName || 'GDM').replace(/[^a-z0-9]+/gi, '-');
      const dateStamp = new Date().toISOString().substring(0, 10);
      pdf.save(`${safeName}-Business-Report-${dateStamp}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Could not generate the PDF report. Please try again, or take a screenshot as a fallback.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div ref={reportRef} className="space-y-6 print:p-8 print:bg-white print:text-black">
      {/* Header */}
      <div className={`${isGenerating ? 'hidden' : 'flex'} justify-between items-center flex-wrap gap-4 print:hidden`}>
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">Business Intelligence Report</h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Audit dynamic financial yield summaries, monthly margins, and categorical outflow charts.</p>
        </div>
        <button
          onClick={handleGeneratePdf}
          disabled={isGenerating}
          className="btn py-2.5 px-4 rounded-xl font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 shadow-lg shadow-slate-500/10 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Generating PDF...
            </>
          ) : (
            <>
              <Printer size={16} /> Download PDF Report
            </>
          )}
        </button>
      </div>

      {/* PRINT-ONLY HEADER (also shown during PDF capture) */}
      <div className={`${isGenerating ? 'block' : 'hidden print:block'} border-b-2 border-slate-900 pb-4 mb-6`}>
        <h1 className="text-3xl font-black">{settings.businessName || 'Grand Digital Media'}</h1>
        <p className="text-xs font-bold uppercase mt-1">Kunnamkulam, Kerala | GSTIN: {settings.gstNumber || '32AAAAA1111A1Z1'}</p>
        <h2 className="text-xl font-bold mt-4 uppercase tracking-wider">OFFICIAL REVENUE & P&L LEDGER SUMMARY REPORT</h2>
        <p className="text-[10px] text-slate-500 mt-1">Generated by Owner {currentUser.name} on {new Date().toLocaleString()}</p>
      </div>

      {/* Key summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <span className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-600">
            <TrendingUp size={24} />
          </span>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Business Order Booked</span>
            <span className="block text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">{money(totalRevenue)}</span>
          </div>
        </div>

        {/* Real Cash received */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <span className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600">
            <TrendingUp size={24} />
          </span>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Real Cash Liquid Received</span>
            <span className="block text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">{money(totalReceived)}</span>
          </div>
        </div>

        {/* Expense */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <span className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-600">
            <TrendingDown size={24} />
          </span>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total logged outflow (bills)</span>
            <span className="block text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">{money(totalExpenses)}</span>
          </div>
        </div>

        {/* Profit */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
          <span className={`p-3.5 rounded-2xl ${netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
            <BarChart3 size={24} />
          </span>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Yield / Yield Margin</span>
            <span className="block text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {money(netProfit)}
              <span className="text-[10px] ml-1.5 font-bold text-slate-400">({netMargin.toFixed(1)}%)</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Month-on-Month comparative charts (Pure CSS - robust, no loading glitches!) */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider mb-4">6-Month Trend Overview (Gross vs Outflow)</h3>
          
          <div className="space-y-4 pt-2">
            {sortedMonths.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6 font-semibold">Insufficient data to plot timeline.</p>
            ) : (
              sortedMonths.map(month => {
                const data = monthlyData[month];
                const maxVal = Math.max(...sortedMonths.map(m => Math.max(monthlyData[m].rev, monthlyData[m].exp)), 1);
                const revPct = (data.rev / maxVal) * 100;
                const expPct = (data.exp / maxVal) * 100;
                
                // Format Month
                const [year, mNum] = month.split('-');
                let monthLabel = month;
                if (year && mNum) {
                  const yVal = parseInt(year);
                  const mVal = parseInt(mNum);
                  if (!isNaN(yVal) && !isNaN(mVal) && mVal >= 1 && mVal <= 12) {
                    const dObj = new Date(yVal, mVal - 1, 1);
                    if (!isNaN(dObj.getTime())) {
                      monthLabel = `${dObj.toLocaleString('en-US', { month: 'short' })} ${year}`;
                    }
                  }
                }

                return (
                  <div key={month} className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{monthLabel}</span>
                    <div className="col-span-10 space-y-1.5">
                      {/* Revenue Bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${revPct}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 w-16 text-right font-mono">{money(data.rev)}</span>
                      </div>
                      {/* Expense Bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${expPct}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-rose-500 w-16 text-right font-mono">{money(data.exp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Categorical outflow breakdown */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-sm">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider mb-4">Expenditure breakdown by category</h3>

          <div className="space-y-4 pt-1">
            {Object.keys(expenseCatTotals).length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6 font-semibold">No operational expenditures recorded.</p>
            ) : (
              Object.keys(expenseCatTotals).map(cat => {
                const amt = expenseCatTotals[cat];
                const pct = totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <span>{cat}</span>
                      <span className="font-mono text-rose-500">{money(amt)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Orders Performance Audit Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <h4 className="font-extrabold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider">Recent Orders Ledger Log (Auditable)</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
                <th className="p-3 font-bold text-slate-400 uppercase">Order ID</th>
                <th className="p-3 font-bold text-slate-400 uppercase">Customer</th>
                <th className="p-3 font-bold text-slate-400 uppercase">Total Invoice Value</th>
                <th className="p-3 font-bold text-slate-400 uppercase">Status</th>
                <th className="p-3 font-bold text-slate-400 uppercase">Payment</th>
                <th className="p-3 font-bold text-slate-400 uppercase">Booked Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {orders.slice(-10).reverse().map(o => (
                <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                  <td className="p-3 font-black text-slate-800 dark:text-slate-200">{o.id}</td>
                  <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{o.customerName}</td>
                  <td className="p-3 font-extrabold text-slate-800 dark:text-slate-200">{money(o.total)}</td>
                  <td className="p-3">
                    <span className="font-bold uppercase text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-500 uppercase">{o.paymentStatus}</td>
                  <td className="p-3 text-slate-400">
                    {(() => {
                      if (!o.date) return 'N/A';
                      const dObj = new Date(o.date);
                      return isNaN(dObj.getTime()) ? 'N/A' : dObj.toLocaleDateString('en-IN');
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}