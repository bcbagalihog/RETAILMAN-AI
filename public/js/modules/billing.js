/**
 * RETAILMAN AI — Billing & Financial Ledger Module (`window.App.Billing`)
 */
window.App = window.App || {};

window.App.Billing = {
  selectedDate: new Date().toISOString().slice(0, 10),

  /**
   * Render Billing & Invoice View (Folderized Daily Transactions)
   */
  async render() {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (!this.selectedDate) this.selectedDate = todayStr;

    // Fetch invoices for selected date from server daily vault
    const invRes = await window.App.API.getInvoices(this.selectedDate);
    const invoices = invRes.success ? invRes.invoices : [];

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const invoiceCount = invoices.length;
    const avgTicket = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;

    const isToday = this.selectedDate === todayStr;

    // Pagination (Max 20 Receipts per page to avoid lag)
    const PAGE_SIZE = 20;
    const totalPages = Math.ceil(invoices.length / PAGE_SIZE) || 1;
    let currentPage = window.App.state.billingPage || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    window.App.state.billingPage = currentPage;

    const pageInvoices = invoices.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return `
      <div class="card-panel">
        <div class="panel-header">
          <div class="panel-title">
            <i class="ph-bold ph-receipt" style="color:var(--fb-blue);"></i> Daily Financial Ledger
          </div>
        </div>

        <!-- Date Selector Control Bar -->
        <div style="background:var(--bg-surface); border:2px solid var(--border-color); border-radius:12px; padding:10px; margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; box-shadow:2px 2px 0px #000;">
          <div style="display:flex; align-items:center; gap:6px;">
            <i class="ph-bold ph-calendar" style="color:var(--fb-blue); font-size:1.1rem;"></i>
            <span style="font-size:0.8rem; font-weight:bold; color:var(--text-muted);">Date:</span>
            <input type="date" id="billing-date-picker" value="${this.selectedDate === 'all' ? todayStr : this.selectedDate}" style="background:var(--bg-input); border:2px solid var(--border-color); color:#FFF; padding:5px 8px; border-radius:8px; font-family:var(--font-mono); font-size:0.8rem; font-weight:bold;" onchange="window.App.Billing.setDate(this.value)">
          </div>

          <!-- Quick Date Pills (Today & All Time Only) -->
          <div style="display:flex; gap:6px;">
            <button class="cat-pill ${isToday ? 'active' : ''}" style="padding:4px 10px; font-size:0.75rem;" onclick="window.App.Billing.setDate('${todayStr}')">
              📅 Today
            </button>
            <button class="cat-pill ${this.selectedDate === 'all' ? 'active' : ''}" style="padding:4px 10px; font-size:0.75rem;" onclick="window.App.Billing.setDate('all')">
              📜 All Time
            </button>
          </div>
        </div>

        <!-- Revenue Metrics for Selected Date (Compact & No Overlap) -->
        <div style="display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-bottom: 1rem;">
          <div style="background:var(--bg-surface); padding:8px 4px; border-radius:10px; border:2px solid var(--border-color); text-align:center; min-width:0;">
            <div style="font-size:0.65rem; color:var(--text-muted); font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${this.selectedDate === 'all' ? 'TOTAL SALES' : 'REVENUE'}</div>
            <div style="font-family:var(--font-mono); font-size:1.05rem; font-weight:900; color:var(--emerald); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${window.App.formatMoney(totalRevenue)}</div>
          </div>
          <div style="background:var(--bg-surface); padding:8px 4px; border-radius:10px; border:2px solid var(--border-color); text-align:center; min-width:0;">
            <div style="font-size:0.65rem; color:var(--text-muted); font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">COUNT</div>
            <div style="font-family:var(--font-mono); font-size:1.05rem; font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${invoiceCount}</div>
          </div>
          <div style="background:var(--bg-surface); padding:8px 4px; border-radius:10px; border:2px solid var(--border-color); text-align:center; min-width:0;">
            <div style="font-size:0.65rem; color:var(--text-muted); font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">AVG TICKET</div>
            <div style="font-family:var(--font-mono); font-size:1.05rem; font-weight:900; color:var(--fb-blue); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${window.App.formatMoney(avgTicket)}</div>
          </div>
        </div>

        <!-- Daily Invoices List -->
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${invoices.length === 0 ? `
            <div style="text-align:center; padding: 2.5rem 1rem; color:var(--text-muted); background:var(--bg-surface); border:2px dashed var(--border-color); border-radius:12px;">
              <i class="ph-bold ph-receipt" style="font-size:2.5rem; color:var(--border-color); margin-bottom:8px; display:block;"></i>
              No sales transactions recorded for <strong>${this.selectedDate}</strong>.<br>
              <span style="font-size:0.8rem;">Pick another date using the calendar above or complete a sale in POS.</span>
            </div>
          ` : pageInvoices.map(inv => `
            <div style="background:var(--bg-surface); border:2px solid var(--border-color); border-radius:12px; padding:12px; display:flex; justify-content:space-between; align-items:center; box-shadow:2px 2px 0px #000;">
              <div>
                <div style="font-weight:900; font-size:0.95rem; font-family:var(--font-mono); color:var(--fb-blue);">${inv.invoice_no}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${new Date(inv.date).toLocaleString()} • ${inv.cashier}</div>
                <div style="font-size:0.75rem; color:#AAA; margin-top:2px;">
                  Payment: <strong>${inv.payment_method}</strong> | Items: ${inv.items ? inv.items.length : 0}
                </div>
              </div>

              <div style="text-align:right;">
                <div style="font-family:var(--font-mono); font-weight:900; font-size:1.1rem; color:var(--emerald);">${window.App.formatMoney(inv.total)}</div>
                <button style="margin-top:4px; background:var(--bg-input); border:1px solid var(--border-color); color:#FFF; padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:bold; cursor:pointer;" onclick="window.App.POS.openReceiptModal(${JSON.stringify(inv).replace(/"/g, '&quot;')})">
                  <i class="ph-bold ph-receipt"></i> View Receipt
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Billing Pagination Bar (20 Receipts Limit) -->
        ${totalPages > 1 ? `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; padding:10px; background:var(--bg-surface); border:2px solid var(--border-color); border-radius:10px; box-shadow:2px 2px 0px #000;">
            <button class="cat-pill" ${currentPage <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="window.App.Billing.changePage(${currentPage - 1})">
              ◀ Prev Page
            </button>
            <span style="font-size:0.8rem; font-weight:bold; font-family:var(--font-mono); color:var(--text-muted);">
              Page <strong>${currentPage}</strong> of <strong>${totalPages}</strong> (${invoices.length} Receipts)
            </span>
            <button class="cat-pill" ${currentPage >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="window.App.Billing.changePage(${currentPage + 1})">
              Next Page ▶
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  bindEvents() {},

  changePage(newPage) {
    window.App.state.billingPage = newPage;
    window.App.router.navigate('billing');
  },

  setDate(dateStr) {
    window.App.state.billingPage = 1;
    this.selectedDate = dateStr;
    window.App.router.navigate('billing');
  }
};

