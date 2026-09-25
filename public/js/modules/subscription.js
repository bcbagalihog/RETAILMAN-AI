/**
 * RETAILMAN AI — Subscription & SaaS Licensing Module (`window.App.Subscription`)
 */
(function() {
  window.App = window.App || {};

  window.App.Subscription = {
    init: function() {
      this.fetchStatus();
    },

    fetchStatus: async function() {
      try {
        const res = await window.App.api.get('/api/subscription/status');
        if (res && res.success && res.subscription) {
          this.updateHeaderBadge(res.subscription);
        }
      } catch (err) {
        console.warn('Subscription fetch failed');
      }
    },

    updateHeaderBadge: function(sub) {
      const pill = document.getElementById('sub-tier-badge');
      if (!pill) return;

      if (!sub || sub.plan === 'free_trial' || sub.plan === 'free_plan') {
        const used = sub ? (sub.monthlyInvoicesUsed || 0) : 0;
        const limit = sub ? (sub.invoiceLimit || 50) : 50;
        pill.className = 'sub-badge-pill trial';
        pill.innerHTML = `<i class="ph-bold ph-storefront"></i> Free Plan (` + used + `/` + limit + ` Sales)`;
      } else if (sub.plan === 'pro') {
        pill.className = 'sub-badge-pill pro';
        pill.innerHTML = `<i class="ph-bold ph-crown"></i> PRO Plan Active`;
      } else {
        pill.className = 'sub-badge-pill enterprise';
        pill.innerHTML = `<i class="ph-bold ph-sparkle"></i> Enterprise`;
      }
    },

    openModal: async function() {
      let modal = document.getElementById('subscription-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'subscription-modal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
      }

      let sub = { plan: 'free_plan', monthlyInvoicesUsed: 0, invoiceLimit: 50 };
      try {
        const res = await window.App.api.get('/api/subscription/status');
        if (res && res.subscription) sub = res.subscription;
      } catch (_) {}

      const isPro = sub.plan === 'pro';

      modal.innerHTML = `
        <div class="modal-card nb-card" style="max-width:680px; width:92%;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem;">
            <div>
              <h2 style="margin:0; font-family:var(--font-heading); font-weight:900; font-size:1.6rem; color:#fff;">
                <i class="ph-bold ph-crown" style="color:#FFE600;"></i> RETAILMAN AI Subscription
              </h2>
              <div style="font-size:0.85rem; color:#888;">Select the right plan to power your retail store and Facebook sales.</div>
            </div>
            <button onclick="window.App.Subscription.closeModal()" style="background:none; border:none; color:#fff; font-size:1.6rem; cursor:pointer;">&times;</button>
          </div>

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:1.2rem; margin-bottom:1.5rem;">
            <!-- Permanent Free Plan Card -->
            <div style="background:rgba(255,255,255,0.03); border:2px solid ` + (!isPro ? '#00E5FF' : '#333') + `; border-radius:14px; padding:1.2rem; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                  <span style="font-weight:900; font-size:1.1rem; color:#fff;">Permanent Free Plan</span>
                  ` + (!isPro ? '<span style="background:#00E5FF; color:#000; font-weight:900; font-size:0.7rem; padding:2px 6px; border-radius:4px;">ACTIVE</span>' : '') + `
                </div>
                <div style="font-size:1.5rem; font-weight:900; color:#fff; margin-bottom:0.8rem;">₱0 <span style="font-size:0.8rem; color:#888; font-weight:normal;">/ forever</span></div>
                
                <ul style="list-style:none; padding:0; margin:0 0 1rem 0; font-size:0.85rem; color:#bbb; display:grid; gap:0.5rem;">
                  <li><i class="ph-bold ph-check-circle" style="color:#00E5FF;"></i> 50 Monthly Sales Invoices</li>
                  <li><i class="ph-bold ph-check-circle" style="color:#00E5FF;"></i> 1 Facebook Page Sync</li>
                  <li><i class="ph-bold ph-check-circle" style="color:#00E5FF;"></i> POS & Stock Inventory</li>
                </ul>
              </div>
              <button disabled class="nb-btn outline" style="width:100%; opacity:0.6;">` + (!isPro ? 'Active Plan' : 'Free Plan') + `</button>
            </div>

            <!-- Pro Plan Card -->
            <div style="background:linear-gradient(135deg, rgba(8,102,255,0.2) 0%, rgba(0,229,255,0.1) 100%); border:3px solid #0866FF; box-shadow:0 0 20px rgba(8,102,255,0.3); border-radius:14px; padding:1.2rem; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                  <span style="font-weight:900; font-size:1.2rem; color:#00E5FF;"><i class="ph-bold ph-sparkle"></i> PRO PLAN</span>
                  <span style="background:#0866FF; color:#fff; font-weight:900; font-size:0.7rem; padding:2px 6px; border-radius:4px;">RECOMMENDED</span>
                </div>
                <div style="font-size:1.8rem; font-weight:900; color:#fff; margin-bottom:0.8rem;">₱499 <span style="font-size:0.85rem; color:#aaa; font-weight:normal;">/ month</span></div>

                <ul style="list-style:none; padding:0; margin:0 0 1.2rem 0; font-size:0.85rem; color:#eee; display:grid; gap:0.6rem;">
                  <li><i class="ph-bold ph-check-circle" style="color:#00E5FF;"></i> <strong>UNLIMITED</strong> Sales & Invoices</li>
                  <li><i class="ph-bold ph-check-circle" style="color:#00E5FF;"></i> <strong>UNLIMITED</strong> Facebook Pages</li>
                  <li><i class="ph-bold ph-check-circle" style="color:#00E5FF;"></i> Multi-Shop Staff Accounts</li>
                  <li><i class="ph-bold ph-check-circle" style="color:#00E5FF;"></i> Auto Messenger Receipts</li>
                  <li><i class="ph-bold ph-check-circle" style="color:#00E5FF;"></i> Financial Ledger Export</li>
                </ul>
              </div>

              <button onclick="window.App.Subscription.upgradeToPro()" class="nb-btn primary" style="width:100%; font-weight:900; font-size:1.05rem; padding:0.8rem;">
                ` + (isPro ? 'Manage Pro Subscription' : '<i class="ph-bold ph-lightning"></i> Upgrade to Pro Plan (₱499/mo)') + `
              </button>
            </div>
          </div>

          <div style="text-align:center; font-size:0.8rem; color:#777;">
            Secured by Google Play In-App Billing & 256-Bit Encrypted Payment Processing.
          </div>
        </div>
      `;

      modal.style.display = 'flex';
    },

    upgradeToPro: async function() {
      try {
        const res = await window.App.api.post('/api/subscription/upgrade', { plan: 'pro' });
        if (res && res.success) {
          if (window.App.showNotification) window.App.showNotification('🎉 Upgraded to PRO Plan! Unlimited features unlocked.', 'success');
          this.fetchStatus();
          this.closeModal();
          if (window.App.auth) window.App.auth.fetchProfile();
        } else {
          alert(res.message || 'Upgrade failed.');
        }
      } catch (err) {
        alert('Upgrade error: ' + err.message);
      }
    },

    closeModal: function() {
      const modal = document.getElementById('subscription-modal');
      if (modal) modal.style.display = 'none';
    }
  };

  window.App.subscription = window.App.Subscription;

  document.addEventListener('DOMContentLoaded', () => {
    window.App.Subscription.init();
  });
})();
