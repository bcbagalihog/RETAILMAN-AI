/**
 * RETAILMAN AI — Customer Directory Module (`window.App.Directory`)
 */
window.App = window.App || {};

window.App.Directory = {
  /**
   * Render Customers View (Max 20 Items per page)
   */
  async render() {
    const customers = window.App.state.customers || [];

    // Pagination (Max 20 Customers per page to avoid lag)
    const PAGE_SIZE = 20;
    const totalPages = Math.ceil(customers.length / PAGE_SIZE) || 1;
    let currentPage = window.App.state.customerPage || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    window.App.state.customerPage = currentPage;

    const pageCustomers = customers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return `
      <div class="card-panel">
        <div class="panel-header">
          <div class="panel-title">
            <i class="ph-bold ph-users-three" style="color:var(--fb-blue);"></i> Customer & Social Buyer Directory
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px;">
          ${pageCustomers.length === 0 ? `
            <div style="text-align:center; padding: 2rem; color:var(--text-muted);">No customer records found.</div>
          ` : pageCustomers.map(c => `
            <div style="background:var(--bg-surface); border:2px solid var(--border-color); border-radius:12px; padding:12px; display:flex; justify-content:space-between; align-items:center; box-shadow:2px 2px 0px #000;">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:44px; height:44px; background:var(--fb-blue-light); border:2px solid var(--fb-blue); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--fb-blue); font-weight:900; font-size:1.2rem;">
                  <i class="ph-bold ph-user"></i>
                </div>
                <div>
                  <div style="font-weight:900; font-size:0.95rem;">${c.name}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">${c.phone} • ${c.facebook_profile}</div>
                </div>
              </div>

              <div style="text-align:right;">
                <div style="font-family:var(--font-mono); font-weight:900; color:var(--emerald);">${window.App.formatMoney(c.total_spent)}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${c.total_orders} Orders • <span style="color:var(--amber); font-weight:bold;">★ ${c.loyalty_points} pts</span></div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Customer Pagination Bar (20 Customers Limit) -->
        ${totalPages > 1 ? `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; padding:10px; background:var(--bg-surface); border:2px solid var(--border-color); border-radius:10px; box-shadow:2px 2px 0px #000;">
            <button class="cat-pill" ${currentPage <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="window.App.Directory.changePage(${currentPage - 1})">
              ◀ Prev Page
            </button>
            <span style="font-size:0.8rem; font-weight:bold; font-family:var(--font-mono); color:var(--text-muted);">
              Page <strong>${currentPage}</strong> of <strong>${totalPages}</strong> (${customers.length} Customers)
            </span>
            <button class="cat-pill" ${currentPage >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="window.App.Directory.changePage(${currentPage + 1})">
              Next Page ▶
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  bindEvents() {},

  changePage(newPage) {
    window.App.state.customerPage = newPage;
    window.App.router.navigate('customers');
  }
};

