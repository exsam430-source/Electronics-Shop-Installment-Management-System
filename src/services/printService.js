/**
 * MR SOLVER Electronics Shop & Installment Management System
 * Universal High-Precision Printing & PDF Generation Service
 * Supports: Thermal 80mm, Thermal 58mm, A4 Invoices, Dashboard Summaries & Full Reports
 */

// Format currency
const formatCurr = (amount, currency = 'Rs.') => {
  const num = Number(amount) || 0;
  return `${currency} ${num.toLocaleString()}`;
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Core print runner:
 * Uses Electron print API if available, falls back to isolated iframe printing.
 */
export async function printHtmlDocument(fullHtml, options = {}) {
  // 1. Electron Desktop App Print
  if (window.electronAPI && typeof window.electronAPI.printReceipt === 'function') {
    try {
      const res = await window.electronAPI.printReceipt(fullHtml, options);
      if (res && res.success !== false) {
        return { success: true };
      }
    } catch (err) {
      console.warn('[Electron print failed, falling back to iframe print]:', err);
    }
  }

  // 2. Browser / Fallback: Isolated IFrame Print (prevents blank pages & style leakage)
  return new Promise((resolve) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.id = 'pos-print-frame-' + Date.now();

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(fullHtml);
      doc.close();

      iframe.contentWindow.focus();

      setTimeout(() => {
        try {
          iframe.contentWindow.print();
        } catch (e) {
          console.error('[Iframe print error]:', e);
        }

        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
          resolve({ success: true });
        }, 1500);
      }, 350);
    } catch (err) {
      console.error('[Fallback print error]:', err);
      window.print();
      resolve({ success: false, error: err.message });
    }
  });
}

/**
 * Save to PDF Runner:
 * In Electron, native printToPDF + Save Dialog.
 * In browser, triggers print dialog where user saves as PDF.
 */
export async function saveHtmlToPdf(fullHtml, options = {}) {
  if (window.electronAPI && typeof window.electronAPI.saveToPdf === 'function') {
    try {
      const res = await window.electronAPI.saveToPdf(fullHtml, options);
      return res;
    } catch (err) {
      console.warn('[Electron saveToPdf error, falling back to print]:', err);
    }
  }

  // Browser fallback
  return printHtmlDocument(fullHtml, options);
}

// ============================================================================
// 1. RECEIPT HTML GENERATOR (Thermal 80mm, Thermal 58mm, A4 Full Page)
// ============================================================================
export function generateReceiptHtml(receipt, profile = {}, format = 'thermal_80') {
  if (!receipt) return '';

  const currency = profile?.currency || 'Rs.';
  const isDuplicate = (receipt.printCount || 0) > 0;
  const isThermal58 = format === 'thermal_58';
  const isA4 = format === 'a4';

  const widthStyle = isThermal58
    ? 'width: 54mm; max-width: 54mm; font-size: 10px; font-family: "Courier New", Courier, monospace;'
    : isA4
    ? 'width: 210mm; max-width: 210mm; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;'
    : 'width: 76mm; max-width: 76mm; font-size: 12px; font-family: "Courier New", Courier, monospace;';

  const pageMargin = isA4 ? 'margin: 12mm;' : 'margin: 2mm auto;';

  let receiptTitle = 'SALES RECEIPT';
  if (receipt.receiptType === 'cash_sale') receiptTitle = 'CASH SALE RECEIPT';
  else if (receipt.receiptType === 'advance_payment') receiptTitle = 'INSTALLMENT BOOKING & ADVANCE';
  else if (receipt.receiptType === 'installment_payment') receiptTitle = 'INSTALLMENT PAYMENT RECEIPT';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${receiptTitle} - ${receipt.receiptNumber}</title>
  <style>
    @page {
      size: ${isA4 ? 'A4' : 'auto'};
      margin: ${isA4 ? '10mm' : '0'};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      background: #ffffff;
      color: #000000;
      line-height: 1.35;
      padding: ${isA4 ? '15px' : '4px'};
    }
    .receipt-container {
      ${widthStyle}
      ${pageMargin}
      background: #ffffff;
      color: #000000;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .bold { font-weight: bold; }
    .dashed-divider {
      border-bottom: 1px dashed #000000;
      margin: 6px 0;
    }
    .solid-divider {
      border-bottom: 1.5px solid #000000;
      margin: 8px 0;
    }
    .double-divider {
      border-bottom: 3px double #000000;
      margin: 8px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    .badge-duplicate {
      display: inline-block;
      padding: 2px 6px;
      margin-bottom: 4px;
      border: 1px dashed #b91c1c;
      color: #b91c1c;
      font-weight: bold;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .shop-title {
      font-size: ${isA4 ? '22px' : isThermal58 ? '13px' : '16px'};
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-title {
      font-size: ${isA4 ? '15px' : isThermal58 ? '11px' : '13px'};
      font-weight: bold;
      text-transform: uppercase;
      margin: 4px 0;
      letter-spacing: 0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
    }
    th {
      border-bottom: 1px dashed #000000;
      padding: 4px 2px;
      font-size: ${isA4 ? '12px' : isThermal58 ? '9px' : '11px'};
      text-transform: uppercase;
    }
    td {
      padding: 4px 2px;
      vertical-align: top;
      font-size: ${isA4 ? '12px' : isThermal58 ? '9px' : '11px'};
    }
    .summary-box {
      margin-top: 6px;
      padding-top: 4px;
    }
    .grand-total {
      font-size: ${isA4 ? '16px' : isThermal58 ? '11px' : '14px'};
      font-weight: bold;
    }
    .installment-box {
      background: #f4f4f5;
      border: 1px dashed #71717a;
      padding: 6px;
      margin: 6px 0;
      border-radius: 4px;
    }
    .signature-area {
      margin-top: ${isA4 ? '35px' : '20px'};
      display: flex;
      justify-content: space-between;
      font-size: 10px;
    }
    .sign-line {
      width: ${isA4 ? '180px' : '110px'};
      border-top: 1px solid #000000;
      text-align: center;
      padding-top: 4px;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    ${isDuplicate ? '<div class="text-center"><span class="badge-duplicate">*** DUPLICATE / REPRINT ***</span></div>' : ''}
    
    <!-- Shop Branding Header -->
    <div class="text-center">
      <div class="shop-title">${profile?.shopName || 'MR SOLVER ELECTRONICS'}</div>
      ${profile?.receiptHeader ? `<div style="font-size: 10px; font-style: italic; margin-top: 2px;">${profile.receiptHeader}</div>` : ''}
      <div style="font-size: 10px; margin-top: 2px;">${profile?.address || ''}</div>
      <div style="font-size: 10px;">Phone: ${profile?.phone || profile?.mobile || ''}</div>
    </div>

    <div class="solid-divider"></div>
    <div class="text-center doc-title">${receiptTitle}</div>
    <div class="dashed-divider"></div>

    <!-- Receipt Metadata -->
    <div class="row">
      <span>Receipt No:</span>
      <span class="bold">${receipt.receiptNumber}</span>
    </div>
    <div class="row">
      <span>Date & Time:</span>
      <span>${formatDate(receipt.receiptDate)}</span>
    </div>
    <div class="row">
      <span>Customer:</span>
      <span class="bold">${receipt.customerName || 'Walk-in Customer'}</span>
    </div>
    ${receipt.customerMobile ? `
    <div class="row">
      <span>Mobile:</span>
      <span>${receipt.customerMobile}</span>
    </div>` : ''}
    <div class="row">
      <span>Payment Method:</span>
      <span style="text-transform: capitalize;">${receipt.paymentMethod || 'Cash'}</span>
    </div>

    <!-- Items Table (if any) -->
    ${receipt.items && receipt.items.length > 0 ? `
    <div class="dashed-divider"></div>
    <table>
      <thead>
        <tr>
          <th class="text-left" style="width: 45%;">Item</th>
          <th class="text-center" style="width: 15%;">Qty</th>
          <th class="text-right" style="width: 20%;">Rate</th>
          <th class="text-right" style="width: 20%;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${receipt.items.map(it => `
          <tr>
            <td class="text-left">
              <span class="bold">${it.productName}</span>
              ${it.brand ? ` (${it.brand})` : ''}
              ${it.serialNumber ? `<div style="font-size: 9px; color: #52525b;">S/N: ${it.serialNumber}</div>` : ''}
            </td>
            <td class="text-center">${it.quantity}</td>
            <td class="text-right">${Number(it.unitPrice || 0).toLocaleString()}</td>
            <td class="text-right bold">${Number(it.totalPrice || (it.quantity * it.unitPrice) || 0).toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    <!-- Installment Info Box (if applicable) -->
    ${receipt.installmentInfo && receipt.installmentInfo.totalInstallments ? `
    <div class="installment-box">
      <div class="row">
        <span class="bold">Installment Plan:</span>
        <span class="bold">Installment #${receipt.installmentInfo.installmentNumber || 1} of ${receipt.installmentInfo.totalInstallments}</span>
      </div>
      ${receipt.installmentInfo.monthlyAmount ? `
      <div class="row">
        <span>Monthly Installment:</span>
        <span>${formatCurr(receipt.installmentInfo.monthlyAmount, currency)}</span>
      </div>` : ''}
      ${receipt.installmentInfo.nextDueDate ? `
      <div class="row" style="margin-top: 3px; font-weight: bold;">
        <span>Next Due Date:</span>
        <span>${new Date(receipt.installmentInfo.nextDueDate).toLocaleDateString('en-GB')}</span>
      </div>` : ''}
    </div>
    ` : ''}

    <!-- Financial Totals -->
    <div class="dashed-divider"></div>
    <div class="summary-box">
      <div class="row">
        <span>Total Amount:</span>
        <span class="bold">${formatCurr(receipt.totalAmount, currency)}</span>
      </div>
      <div class="row grand-total" style="margin: 4px 0; padding: 2px 0;">
        <span>Amount Paid:</span>
        <span>${formatCurr(receipt.amountPaid, currency)}</span>
      </div>
      ${Number(receipt.changeReturned) > 0 ? `
      <div class="row">
        <span>Change Returned:</span>
        <span>${formatCurr(receipt.changeReturned, currency)}</span>
      </div>` : ''}
      ${Number(receipt.remainingBalance) > 0 ? `
      <div class="row bold" style="color: #b91c1c;">
        <span>Remaining Balance:</span>
        <span>${formatCurr(receipt.remainingBalance, currency)}</span>
      </div>` : ''}
    </div>

    <div class="double-divider"></div>

    <!-- Footer Note -->
    <div class="text-center" style="font-size: 10px; margin-top: 6px;">
      <div>${profile?.receiptFooter || 'Thank you for your business! Please visit again.'}</div>
      <div style="font-size: 8px; color: #71717a; margin-top: 4px;">
        Generated by MR SOLVER Electronics Shop Manager • Offline System
      </div>
    </div>

    <!-- Signatures -->
    <div class="signature-area">
      <div class="sign-line">Customer Signature</div>
      <div class="sign-line">Authorized Sign & Stamp</div>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// 2. DASHBOARD EXECUTIVE SUMMARY HTML GENERATOR
// ============================================================================
export function generateDashboardSummaryHtml(stats, profile = {}, filterLabel = 'Business Position Summary') {
  const currency = profile?.currency || 'Rs.';
  const now = new Date().toLocaleString('en-GB');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Dashboard Financial Summary - ${profile?.shopName || 'MR SOLVER'}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #ffffff; color: #0f172a; padding: 10px; font-size: 12px; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; }
    .shop-name { font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .shop-sub { font-size: 11px; color: #475569; margin-top: 3px; }
    .report-title { font-size: 15px; font-weight: bold; text-transform: uppercase; margin-top: 10px; color: #1e1b4b; }
    .filter-badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-top: 4px; }
    
    .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #0f172a; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin: 14px 0 8px 0; }
    
    .grid-3 { display: flex; gap: 10px; margin-bottom: 12px; }
    .card { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background: #f8fafc; }
    .card-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; }
    .card-val { font-size: 18px; font-weight: bold; margin-top: 4px; color: #0f172a; font-family: monospace; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #334155; }
    td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    
    .footer { margin-top: 35px; border-top: 1px solid #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
    .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
    .sign-box { width: 200px; border-top: 1px solid #000; text-align: center; padding-top: 4px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="shop-name">${profile?.shopName || 'MR SOLVER ELECTRONICS'}</div>
    <div class="shop-sub">${profile?.address || ''} • Phone: ${profile?.phone || profile?.mobile || ''}</div>
    <div class="report-title">EXECUTIVE BUSINESS FINANCIAL POSITION & AUDIT SUMMARY</div>
    <div class="filter-badge">PERIOD: ${filterLabel} • GENERATED: ${now}</div>
  </div>

  <!-- SECTION 1: PROFIT & REVENUE TRIAD -->
  <div class="section-title">1. Profit & Revenue Triad (Verified Figures)</div>
  <div class="grid-3">
    <div class="card" style="border-left: 4px solid #4f46e5;">
      <div class="card-title">Expected Gross Profit</div>
      <div class="card-val">${formatCurr(stats?.profit?.expectedProfit, currency)}</div>
      <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Total theoretical margin across all sales</div>
    </div>
    <div class="card" style="border-left: 4px solid #059669; background: #f0fdf4;">
      <div class="card-title" style="color: #059669;">Realized Net Profit</div>
      <div class="card-val" style="color: #059669;">${formatCurr(stats?.profit?.realizedProfit, currency)}</div>
      <div style="font-size: 9px; color: #059669; margin-top: 2px;">Cash sales + settled accounts</div>
    </div>
    <div class="card" style="border-left: 4px solid #d97706; background: #fffbeb;">
      <div class="card-title" style="color: #d97706;">Pending Locked Profit</div>
      <div class="card-val" style="color: #d97706;">${formatCurr(stats?.profit?.pendingProfit, currency)}</div>
      <div style="font-size: 9px; color: #d97706; margin-top: 2px;">Remaining profit locked in active plans</div>
    </div>
  </div>

  <!-- SECTION 2: SALES & CASH FLOW OVERVIEW -->
  <div class="section-title">2. Sales & Cash Flow Matrix</div>
  <table>
    <thead>
      <tr>
        <th>Metric Classification</th>
        <th class="text-right">Transaction Count</th>
        <th class="text-right">Total Financial Volume</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="bold">Cash Sales Volume</td>
        <td class="text-right">${stats?.sales?.cashSalesCount || 0} invoices</td>
        <td class="text-right bold font-mono">${formatCurr(stats?.sales?.totalCashRevenue, currency)}</td>
      </tr>
      <tr>
        <td class="bold">Installment Sales Volume</td>
        <td class="text-right">${stats?.sales?.installmentSalesCount || 0} contracts</td>
        <td class="text-right bold font-mono">${formatCurr(stats?.sales?.totalInstallmentRevenue, currency)}</td>
      </tr>
      <tr style="background: #f8fafc;">
        <td class="bold" style="color: #1e1b4b;">Total Combined Sales Turnover</td>
        <td class="text-right bold">${(stats?.sales?.cashSalesCount || 0) + (stats?.sales?.installmentSalesCount || 0)}</td>
        <td class="text-right bold font-mono" style="font-size: 13px; color: #1e1b4b;">${formatCurr(stats?.sales?.totalRevenue, currency)}</td>
      </tr>
      <tr>
        <td class="bold">Total Collections Recovered</td>
        <td class="text-right">${stats?.collections?.paymentsCount || 0} receipts</td>
        <td class="text-right bold font-mono" style="color: #059669;">${formatCurr(stats?.collections?.totalCollections, currency)}</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 3: INSTALLMENT RECOVERY & EXPOSURE -->
  <div class="section-title">3. Installment Ledger & Balances Exposure</div>
  <div class="grid-3">
    <div class="card">
      <div class="card-title">Active Accounts</div>
      <div class="card-val">${stats?.installments?.activeAccountsCount || 0}</div>
      <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Ongoing installment contracts</div>
    </div>
    <div class="card" style="background: #fef2f2; border-color: #fecaca;">
      <div class="card-title" style="color: #dc2626;">Total Outstanding Balances</div>
      <div class="card-val" style="color: #dc2626;">${formatCurr(stats?.installments?.totalOutstandingBalance, currency)}</div>
      <div style="font-size: 9px; color: #dc2626; margin-top: 2px;">Receivable from installment customers</div>
    </div>
    <div class="card" style="background: #fef2f2; border-color: #fca5a5;">
      <div class="card-title" style="color: #b91c1c;">Overdue Critical Balances</div>
      <div class="card-val" style="color: #b91c1c;">${formatCurr(stats?.installments?.totalOverdueAmount, currency)}</div>
      <div style="font-size: 9px; color: #b91c1c; margin-top: 2px;">${stats?.installments?.overdueAccountsCount || 0} overdue accounts</div>
    </div>
  </div>

  <!-- SECTION 4: INVENTORY ASSETS VALUATION -->
  <div class="section-title">4. Physical Stock Valuation</div>
  <table>
    <thead>
      <tr>
        <th>Asset Category</th>
        <th class="text-right">Stock Units</th>
        <th class="text-right">Valuation Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Total Electronic Appliances on Hand</td>
        <td class="text-right bold">${stats?.stock?.totalStockUnits || 0} units</td>
        <td class="text-right bold font-mono">${formatCurr(stats?.stock?.totalStockValue, currency)}</td>
      </tr>
      <tr>
        <td>Low Stock Alert Items</td>
        <td class="text-right bold" style="color: #d97706;">${stats?.stock?.lowStockCount || 0} products</td>
        <td class="text-right" style="color: #64748b;">Requires supplier replenishment</td>
      </tr>
    </tbody>
  </table>

  <!-- SIGNATURES -->
  <div class="signatures">
    <div class="sign-box">Prepared By (Staff / Operator)</div>
    <div class="sign-box">Audited & Approved (Proprietor)</div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <span>MR SOLVER Learning Hub & Software House • Electronics Shop Manager</span>
    <span>Printed on: ${now}</span>
  </div>
</body>
</html>`;
}

// ============================================================================
// 3. REPORTS HUB AUDIT-READY HTML GENERATOR
// ============================================================================
export function generateReportHtml(reportType, data, profile = {}, meta = {}) {
  const currency = profile?.currency || 'Rs.';
  const now = new Date().toLocaleString('en-GB');

  let reportTitle = 'BUSINESS REPORT';
  let tableContent = '';

  if (reportType === 'monthly') {
    reportTitle = `MONTHLY EXECUTIVE BUSINESS SUMMARY — ${meta.monthName || ''} ${meta.year || ''}`;
    const s = data?.summary || {};
    tableContent = `
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <div style="flex: 1; border: 1px solid #cbd5e1; padding: 10px; background: #f8fafc; border-radius: 6px;">
          <div style="font-size: 10px; color: #64748b; font-weight: bold;">TOTAL SALES REVENUE</div>
          <div style="font-size: 18px; font-weight: bold; margin-top: 4px;">${formatCurr(s.totalRevenue, currency)}</div>
          <div style="font-size: 9px; color: #64748b;">Cash: ${formatCurr(s.totalCashRevenue, currency)} | Inst: ${formatCurr(s.totalInstRevenue, currency)}</div>
        </div>
        <div style="flex: 1; border: 1px solid #059669; padding: 10px; background: #f0fdf4; border-radius: 6px;">
          <div style="font-size: 10px; color: #059669; font-weight: bold;">ACTUAL COLLECTIONS</div>
          <div style="font-size: 18px; font-weight: bold; color: #059669; margin-top: 4px;">${formatCurr(s.totalCollections, currency)}</div>
          <div style="font-size: 9px; color: #059669;">${s.paymentsCount || 0} collection transactions</div>
        </div>
        <div style="flex: 1; border: 1px solid #4f46e5; padding: 10px; background: #eef2ff; border-radius: 6px;">
          <div style="font-size: 10px; color: #4f46e5; font-weight: bold;">EXPECTED PROFIT</div>
          <div style="font-size: 18px; font-weight: bold; color: #4f46e5; margin-top: 4px;">${formatCurr(s.expectedProfit, currency)}</div>
        </div>
        <div style="flex: 1; border: 1px solid #0891b2; padding: 10px; background: #ecfeff; border-radius: 6px;">
          <div style="font-size: 10px; color: #0891b2; font-weight: bold;">COMMISSIONS PAID</div>
          <div style="font-size: 18px; font-weight: bold; color: #0891b2; margin-top: 4px;">${formatCurr(s.totalCommissionPaid, currency)}</div>
        </div>
      </div>
    `;
  } else if (reportType === 'sales') {
    reportTitle = 'SALES PERFORMANCE & TRANSACTIONS REPORT';
    const cash = data?.cashSales || [];
    const inst = data?.installmentSales || [];
    tableContent = `
      <div style="margin-bottom: 15px;">
        <h4 style="font-size: 12px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase;">1. Cash Sales (${cash.length} Invoices)</h4>
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th class="text-right">Total Amount</th>
              <th class="text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            ${cash.length === 0 ? '<tr><td colspan="6" class="text-center">No cash sales in period</td></tr>' : cash.map(c => `
              <tr>
                <td class="bold font-mono">${c.invoiceNumber}</td>
                <td>${new Date(c.saleDate).toLocaleDateString('en-GB')}</td>
                <td>${c.customerId?.customerName || c.customerName || 'Walk-in'}</td>
                <td>${(c.items || []).map(i => `${i.productName} (x${i.quantity})`).join(', ')}</td>
                <td class="text-right bold font-mono">${formatCurr(c.totalAmount, currency)}</td>
                <td class="text-right bold font-mono" style="color: #059669;">${formatCurr(c.profit, currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h4 style="font-size: 12px; font-weight: bold; margin: 16px 0 6px 0; text-transform: uppercase;">2. Installment Sales (${inst.length} Contracts)</h4>
        <table>
          <thead>
            <tr>
              <th>Sale #</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Duration</th>
              <th class="text-right">Total Amount</th>
              <th class="text-right">Advance Paid</th>
              <th class="text-right">Remaining Balance</th>
            </tr>
          </thead>
          <tbody>
            ${inst.length === 0 ? '<tr><td colspan="8" class="text-center">No installment sales in period</td></tr>' : inst.map(s => `
              <tr>
                <td class="bold font-mono">${s.saleNumber}</td>
                <td>${new Date(s.saleDate).toLocaleDateString('en-GB')}</td>
                <td>${s.customerId?.customerName || 'Customer'}</td>
                <td>${(s.items || []).map(i => `${i.productName} (x${i.quantity})`).join(', ')}</td>
                <td>${s.installmentDuration} Months</td>
                <td class="text-right bold font-mono">${formatCurr(s.totalSaleAmount, currency)}</td>
                <td class="text-right bold font-mono" style="color: #059669;">${formatCurr(s.advancePayment, currency)}</td>
                <td class="text-right bold font-mono" style="color: #b91c1c;">${formatCurr(s.totalRemainingBalance, currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (reportType === 'collections') {
    reportTitle = 'INSTALLMENT COLLECTIONS & PAYMENTS REPORT';
    const payments = data?.payments || [];
    tableContent = `
      <div style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 12px; font-weight: bold;">Total Transactions: ${data?.count || payments.length}</span>
          <span style="font-size: 14px; font-weight: bold; color: #059669;">Total Recovered: ${formatCurr(data?.totalCollected, currency)}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Payment #</th>
              <th>Receipt #</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Payment Mode</th>
              <th class="text-right">Amount Recovered</th>
            </tr>
          </thead>
          <tbody>
            ${payments.length === 0 ? '<tr><td colspan="6" class="text-center">No collections recorded in period</td></tr>' : payments.map(p => `
              <tr>
                <td class="bold font-mono">${p.paymentNumber}</td>
                <td class="font-mono">${p.receiptId?.receiptNumber || '—'}</td>
                <td>${new Date(p.paymentDate).toLocaleDateString('en-GB')}</td>
                <td>${p.customerId?.customerName || 'Customer'}</td>
                <td style="text-transform: capitalize;">${p.paymentMethod || 'cash'}</td>
                <td class="text-right bold font-mono" style="color: #059669;">${formatCurr(p.amount, currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else if (reportType === 'profit') {
    reportTitle = 'PROFIT MARGIN & VERIFIED TRIAD ANALYSIS REPORT';
    const s = data?.summary || {};
    tableContent = `
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <div style="flex: 1; border: 1px solid #4f46e5; padding: 12px; background: #eef2ff; border-radius: 6px;">
          <div style="font-size: 11px; font-weight: bold; color: #4f46e5;">EXPECTED PROFIT</div>
          <div style="font-size: 20px; font-weight: bold; margin-top: 4px;">${formatCurr(s.expectedProfit, currency)}</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Sum of (Sale Price - Purchase Cost) across all registered sales</div>
        </div>
        <div style="flex: 1; border: 1px solid #059669; padding: 12px; background: #f0fdf4; border-radius: 6px;">
          <div style="font-size: 11px; font-weight: bold; color: #059669;">REALIZED NET PROFIT</div>
          <div style="font-size: 20px; font-weight: bold; color: #059669; margin-top: 4px;">${formatCurr(s.realizedProfit, currency)}</div>
          <div style="font-size: 9px; color: #059669; margin-top: 2px;">Cash sales + completed installment accounts</div>
        </div>
        <div style="flex: 1; border: 1px solid #d97706; padding: 12px; background: #fffbeb; border-radius: 6px;">
          <div style="font-size: 11px; font-weight: bold; color: #d97706;">PENDING LOCKED PROFIT</div>
          <div style="font-size: 20px; font-weight: bold; color: #d97706; margin-top: 4px;">${formatCurr(s.pendingProfit, currency)}</div>
          <div style="font-size: 9px; color: #d97706; margin-top: 2px;">Remaining margin pending active installments</div>
        </div>
      </div>
    `;
  } else if (reportType === 'stock') {
    reportTitle = 'INVENTORY & STOCK VALUATION AUDIT REPORT';
    const s = data?.summary || {};
    const prods = data?.products || [];
    tableContent = `
      <div style="display: flex; gap: 10px; margin-bottom: 12px;">
        <div style="flex: 1; border: 1px solid #cbd5e1; padding: 10px; background: #f8fafc; border-radius: 6px;">
          <div style="font-size: 10px; color: #64748b; font-weight: bold;">TOTAL PHYSICAL UNITS</div>
          <div style="font-size: 18px; font-weight: bold; margin-top: 4px;">${s.totalStockUnits || 0} units</div>
        </div>
        <div style="flex: 1; border: 1px solid #0891b2; padding: 10px; background: #ecfeff; border-radius: 6px;">
          <div style="font-size: 10px; color: #0891b2; font-weight: bold;">PURCHASE VALUATION</div>
          <div style="font-size: 18px; font-weight: bold; color: #0891b2; margin-top: 4px;">${formatCurr(s.totalStockValue, currency)}</div>
        </div>
        <div style="flex: 1; border: 1px solid #d97706; padding: 10px; background: #fffbeb; border-radius: 6px;">
          <div style="font-size: 10px; color: #d97706; font-weight: bold;">LOW STOCK WARNINGS</div>
          <div style="font-size: 18px; font-weight: bold; color: #d97706; margin-top: 4px;">${s.lowStockCount || 0} items</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product Code</th>
            <th>Appliance Name</th>
            <th>Brand</th>
            <th>Category</th>
            <th class="text-center">Stock Qty</th>
            <th class="text-right">Purchase Price</th>
            <th class="text-right">Cash Sale Price</th>
            <th class="text-right">Total Valuation</th>
          </tr>
        </thead>
        <tbody>
          ${prods.map(p => `
            <tr>
              <td class="bold font-mono">${p.productCode}</td>
              <td class="bold">${p.productName}</td>
              <td>${p.brand}</td>
              <td>${p.categoryId?.categoryName || 'General'}</td>
              <td class="text-center bold ${p.stockQuantity <= 2 ? 'color-warn' : ''}">${p.stockQuantity}</td>
              <td class="text-right font-mono">${formatCurr(p.purchasePrice, currency)}</td>
              <td class="text-right font-mono">${formatCurr(p.cashSalePrice, currency)}</td>
              <td class="text-right bold font-mono">${formatCurr(p.stockQuantity * p.purchasePrice, currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${reportTitle} - ${profile?.shopName || 'MR SOLVER'}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #ffffff; color: #0f172a; padding: 8px; font-size: 11px; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; }
    .shop-name { font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .shop-sub { font-size: 10px; color: #475569; margin-top: 2px; }
    .report-title { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-top: 8px; color: #1e1b4b; }
    .meta-line { font-size: 9px; color: #64748b; margin-top: 4px; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; font-size: 10px; text-transform: uppercase; color: #334155; }
    td { border: 1px solid #cbd5e1; padding: 5px 6px; font-size: 10px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .bold { font-weight: bold; }
    .font-mono { font-family: monospace; }
    .color-warn { color: #d97706; font-weight: bold; }
    
    .signatures { display: flex; justify-content: space-between; margin-top: 35px; }
    .sign-box { width: 180px; border-top: 1px solid #000; text-align: center; padding-top: 4px; font-size: 10px; }
    .footer { margin-top: 25px; border-top: 1px solid #cbd5e1; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div class="shop-name">${profile?.shopName || 'MR SOLVER ELECTRONICS'}</div>
    <div class="shop-sub">${profile?.address || ''} • Phone: ${profile?.phone || profile?.mobile || ''}</div>
    <div class="report-title">${reportTitle}</div>
    <div class="meta-line">Generated on: ${now} • Official Audit Copy</div>
  </div>

  ${tableContent}

  <div class="signatures">
    <div class="sign-box">Prepared By</div>
    <div class="sign-box">Authorized Sign & Stamp</div>
  </div>

  <div class="footer">
    <span>MR SOLVER Learning Hub & Software House • Electronics Shop Manager</span>
    <span>Printed on: ${now}</span>
  </div>
</body>
</html>`;
}
