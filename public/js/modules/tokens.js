/**
 * RETAILMAN AI — Pay-As-You-Go Token Top-Up Store (`window.App.Tokens`)
 */
(function() {
  window.App = window.App || {};

  window.App.Tokens = {
    selectedPaymentMethod: 'GCash / Maya',

    init: function() {
      this.fetchBalance();
    },

    fetchBalance: async function() {
      try {
        const res = await window.App.api.get('/api/tokens/balance');
        if (res && res.success) {
          this.updateHeaderChip(res.tokensBalance, res.plan);
        }
      } catch (err) {
        console.warn('Token balance fetch failed');
      }
    },

    updateHeaderChip: function(balance, plan) {
      const chipCount = document.getElementById('header-token-count');
      if (!chipCount) return;

      if (plan === 'pro') {
        chipCount.innerHTML = 'Unlimited';
      } else {
        chipCount.innerHTML = balance !== undefined ? balance : '50';
      }
    },

    openStoreModal: async function() {
      let modal = document.getElementById('token-store-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'token-store-modal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
      }

      let balance = 50;
      let plan = 'free_plan';
      try {
        const res = await window.App.api.get('/api/tokens/balance');
        if (res && res.success) {
          balance = res.tokensBalance;
          plan = res.plan;
        }
      } catch (_) {}

      const isPro = plan === 'pro';

      modal.innerHTML = `
        <div class="modal-card nb-card" style="max-width:720px; width:94%;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <div>
              <h2 style="margin:0; font-family:var(--font-heading); font-weight:900; font-size:1.6rem; color:#fff;">
                🪙 Token Top-Up Store
              </h2>
              <div style="font-size:0.85rem; color:#888;">Top up tokens for sales invoices, Messenger receipts & AI captions.</div>
            </div>
            <button onclick="window.App.Tokens.closeModal()" style="background:none; border:none; color:#fff; font-size:1.6rem; cursor:pointer;">&times;</button>
          </div>

          <!-- Current Balance Banner -->
          <div style="background:linear-gradient(135deg, rgba(8,102,255,0.2) 0%, rgba(0,229,255,0.15) 100%); border:2px solid #0866FF; padding:1rem; border-radius:12px; margin-bottom:1.2rem; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:0.8rem; font-weight:800; color:#00E5FF; text-transform:uppercase;">CURRENT BALANCE</div>
              <div style="font-size:1.8rem; font-weight:900; color:#fff;">
                🪙 ` + (isPro ? 'UNLIMITED PRO' : balance + ' Tokens') + `
              </div>
            </div>
            <div style="font-size:0.82rem; color:#aaa; text-align:right;">
              ` + (isPro ? 'Active PRO Subscription' : '1 Token per Sale / Receipt') + `
            </div>
          </div>

          <!-- Payment Method Selector -->
          <div style="margin-bottom:1.2rem;">
            <label style="font-size:0.8rem; font-weight:800; color:#aaa; display:block; margin-bottom:0.4rem;">SELECT PAYMENT METHOD</label>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;">
              <button type="button" class="nb-btn ` + (this.selectedPaymentMethod === 'GCash / Maya' ? 'primary' : 'outline') + `" style="font-size:0.85rem; padding:8px;" onclick="window.App.Tokens.setPaymentMethod('GCash / Maya')">
                📱 GCash / Maya
              </button>
              <button type="button" class="nb-btn ` + (this.selectedPaymentMethod === 'Credit Card' ? 'primary' : 'outline') + `" style="font-size:0.85rem; padding:8px;" onclick="window.App.Tokens.setPaymentMethod('Credit Card')">
                💳 Credit Card
              </button>
              <button type="button" class="nb-btn ` + (this.selectedPaymentMethod === 'Google Play' ? 'primary' : 'outline') + `" style="font-size:0.85rem; padding:8px;" onclick="window.App.Tokens.setPaymentMethod('Google Play')">
                🛒 Google Play
              </button>
            </div>
          </div>

          <!-- Token Packs Grid -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.2rem;">
            
            <!-- Pack 1: Starter -->
            <div style="background:rgba(255,255,255,0.03); border:2px solid #333; border-radius:12px; padding:1rem; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="font-weight:900; font-size:1.1rem; color:#fff; margin-bottom:0.3rem;">Starter Pack</div>
                <div style="font-size:1.6rem; font-weight:900; color:#00E5FF; margin-bottom:0.6rem;">₱99 <span style="font-size:0.75rem; color:#888;">one-time</span></div>
                <ul style="list-style:none; padding:0; margin:0 0 1rem 0; font-size:0.82rem; color:#bbb; display:grid; gap:0.4rem;">
                  <li>🪙 <strong>500 Tokens</strong></li>
                  <li>✔️ Instant GCash/Maya Delivery</li>
                  <li>✔️ Never Expires</li>
                </ul>
              </div>
              <button class="nb-btn outline" style="width:100%; font-weight:900; padding:8px;" onclick="window.App.Tokens.buyPack('starter_500', 500, '₱99.00')">
                Buy 500 Tokens (₱99)
              </button>
            </div>

            <!-- Pack 2: Growth (Best Value) -->
            <div style="background:rgba(255,255,255,0.05); border:2px solid #00E5FF; box-shadow:0 0 12px rgba(0,229,255,0.25); border-radius:12px; padding:1rem; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
                  <span style="font-weight:900; font-size:1.1rem; color:#fff;">Growth Pack</span>
                  <span style="background:#00E5FF; color:#000; font-weight:900; font-size:0.65rem; padding:2px 6px; border-radius:4px;">BEST VALUE</span>
                </div>
                <div style="font-size:1.6rem; font-weight:900; color:#00E5FF; margin-bottom:0.6rem;">₱299 <span style="font-size:0.75rem; color:#888;">one-time</span></div>
                <ul style="list-style:none; padding:0; margin:0 0 1rem 0; font-size:0.82rem; color:#eee; display:grid; gap:0.4rem;">
                  <li>🪙 <strong>2,000 Tokens</strong></li>
                  <li>✔️ 4x Token Bonus</li>
                  <li>✔️ Never Expires</li>
                </ul>
              </div>
              <button class="nb-btn primary" style="width:100%; font-weight:900; padding:8px;" onclick="window.App.Tokens.buyPack('growth_2000', 2000, '₱299.00')">
                Buy 2,000 Tokens (₱299)
              </button>
            </div>

            <!-- Pack 3: PRO Unlimited -->
            <div style="background:linear-gradient(135deg, rgba(8,102,255,0.25) 0%, rgba(0,229,255,0.15) 100%); border:2px solid #0866FF; border-radius:12px; padding:1rem; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
                  <span style="font-weight:900; font-size:1.1rem; color:#00E5FF;"><i class="ph-bold ph-crown"></i> PRO Plan</span>
                  <span style="background:#0866FF; color:#fff; font-weight:900; font-size:0.65rem; padding:2px 6px; border-radius:4px;">UNLIMITED</span>
                </div>
                <div style="font-size:1.6rem; font-weight:900; color:#fff; margin-bottom:0.6rem;">₱499 <span style="font-size:0.75rem; color:#aaa;">/ month</span></div>
                <ul style="list-style:none; padding:0; margin:0 0 1rem 0; font-size:0.82rem; color:#eee; display:grid; gap:0.4rem;">
                  <li>👑 <strong>UNLIMITED Tokens</strong></li>
                  <li>👑 Unlimited Invoices</li>
                  <li>👑 Multi-Shop Cashiers</li>
                </ul>
              </div>
              <button class="nb-btn primary" style="width:100%; font-weight:900; padding:8px;" onclick="window.App.Tokens.buyPack('pro_unlimited', 999999, '₱499.00')">
                Upgrade to PRO (₱499)
              </button>
            </div>

          </div>

          <div style="text-align:center; font-size:0.8rem; color:#777;">
            Instant credit settlement via GCash, Maya E-Wallet, Card & Play Store.
          </div>
        </div>
      `;

      modal.style.display = 'flex';
    },

    setPaymentMethod: function(method) {
      this.selectedPaymentMethod = method;
      this.openStoreModal();
    },

    buyPack: async function(packId, amount, costLabel) {
      try {
        if (window.App.toast) window.App.toast('Processing ' + this.selectedPaymentMethod + ' checkout...', 'info');
        const res = await window.App.api.post('/api/tokens/topup', {
          pack_id: packId,
          amount: amount,
          payment_method: this.selectedPaymentMethod
        });

        if (res && res.success) {
          if (window.App.showNotification) window.App.showNotification(res.message, 'success');
          this.fetchBalance();
          this.closeModal();
          if (window.App.auth) window.App.auth.fetchProfile();
        } else {
          alert(res.message || 'Payment processing failed.');
        }
      } catch (err) {
        alert('Payment Error: ' + err.message);
      }
    },

    closeModal: function() {
      const modal = document.getElementById('token-store-modal');
      if (modal) modal.style.display = 'none';
    }
  };

  window.App.tokens = window.App.Tokens;

  document.addEventListener('DOMContentLoaded', () => {
    window.App.Tokens.init();
  });
})();
