/**
 * RETAILMAN AI — Global App Kernel & State Management
 */
window.App = window.App || {};

// Central Global Application State
window.App.state = {
  activeTab: 'pos',
  cashier: 'Store Cashier',
  cashierPin: '1234',
  cart: [], // [{ id, name, price, qty, image }]
  products: [],
  invoices: [],
  customers: [],
  metaCatalog: {},
  socialPosts: [],
  activeCategory: 'ALL'
};

/**
 * Global App Initialization
 */
window.App.init = async function() {
  console.log('🚀 Bootstrapping RETAILMAN AI App...');
  
  // Load initial dataset from backend REST API
  await window.App.refreshData();

  // Initialize SPA Router
  if (window.App.router) {
    window.App.router.init();
  }
};

/**
 * Refresh state from backend REST APIs
 */
window.App.refreshData = async function() {
  const prodRes = await window.App.API.getProducts();
  if (prodRes.success) {
    window.App.state.products = prodRes.products;
  }

  const invRes = await window.App.API.getInvoices();
  if (invRes.success) {
    window.App.state.invoices = invRes.invoices;
  }

  const metaRes = await window.App.API.getMetaStatus();
  if (metaRes.success) {
    window.App.state.metaCatalog = metaRes.catalogMeta || {};
    window.App.state.socialPosts = metaRes.socialPosts || [];
  }

  const custRes = await window.App.API.getCustomers();
  if (custRes.success) {
    window.App.state.customers = custRes.customers || [];
  }
};

/**
 * Currency Formatter (PHP / USD)
 */
window.App.formatMoney = function(amount) {
  return '₱' + Number(amount || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Global Modal Controls
 */
window.App.openModal = function(title, htmlContent) {
  document.getElementById('modal-title').innerText = title;
  document.getElementById('modal-body').innerHTML = htmlContent;
  document.getElementById('modal-overlay').classList.remove('hidden');
};

window.App.closeModal = function(e) {
  if (e && e.target !== document.getElementById('modal-overlay') && !e.target.closest('.modal-close-btn')) {
    return;
  }
  document.getElementById('modal-overlay').classList.add('hidden');
};

/**
 * Notification Toast Banner
 */
window.App.toast = function(message, type = 'info') {
  const existing = document.getElementById('app-toast');
  if (existing) existing.remove();

  const toastEl = document.createElement('div');
  toastEl.id = 'app-toast';
  toastEl.style.position = 'fixed';
  toastEl.style.top = '74px';
  toastEl.style.left = '50%';
  toastEl.style.transform = 'translateX(-50%)';
  toastEl.style.backgroundColor = type === 'success' ? '#00D26A' : type === 'error' ? '#FF3B30' : '#0866FF';
  toastEl.style.color = type === 'success' ? '#000' : '#FFF';
  toastEl.style.padding = '10px 20px';
  toastEl.style.borderRadius = '10px';
  toastEl.style.fontWeight = '800';
  toastEl.style.border = '2px solid #000';
  toastEl.style.boxShadow = '3px 3px 0px #000';
  toastEl.style.zIndex = '2000';
  toastEl.style.fontSize = '0.9rem';
  toastEl.innerText = message;

  document.body.appendChild(toastEl);

  setTimeout(() => {
    if (toastEl) toastEl.remove();
  }, 2800);
};

/**
 * Store & App Settings Modal
 */
window.App.openSettingsModal = async function() {
  const metaCatalog = window.App.state.metaCatalog || {};
  const currentSellerName = metaCatalog.page_name || 'RetailMan Official Store';

  const user = window.App.auth ? window.App.auth.getUser() : null;
  const isPro = user && user.subscription && user.subscription.plan === 'pro';

  let shopUsersHtml = '';
  if (isPro) {
    let shopUsers = [];
    try {
      const res = await window.App.api.get('/api/shop-users');
      if (res && res.shopUsers) shopUsers = res.shopUsers;
    } catch (_) {}

    const usersList = shopUsers.map(u => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:8px; border:1px solid #333; margin-top:4px;">
        <div>
          <div style="font-weight:900; font-size:0.9rem; color:#fff;">${u.name} <span style="font-size:0.75rem; color:#00E5FF; font-weight:normal;">(${u.role})</span></div>
          <div style="font-size:0.75rem; color:#aaa;">Shop Outlet: ${u.shop_branch} | PIN: ${u.pin}</div>
        </div>
      </div>
    `).join('');

    shopUsersHtml = `
      <div style="background:rgba(8,102,255,0.08); border:2px solid #0866FF; padding:1rem; border-radius:12px; margin-top:1rem;">
        <div style="font-weight:900; font-size:1rem; color:#00E5FF; margin-bottom:0.6rem;">
          <i class="ph-bold ph-users-three"></i> Multi-Shop Accounts & Cashiers (PRO Enabled)
        </div>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:8px;">
          <input type="text" id="add-user-name" placeholder="Staff/Cashier Name" class="nb-input" style="padding:6px 10px; font-size:0.85rem;">
          <input type="text" id="add-user-branch" placeholder="Shop Branch (e.g. Downtown Outlet)" class="nb-input" style="padding:6px 10px; font-size:0.85rem;">
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:8px;">
          <select id="add-user-role" class="nb-input" style="padding:6px 10px; font-size:0.85rem; background:#18191a; color:#fff;">
            <option value="Cashier">Role: Cashier</option>
            <option value="Manager">Role: Store Manager</option>
            <option value="Clerk">Role: Inventory Clerk</option>
          </select>
          <input type="password" id="add-user-pin" placeholder="Staff PIN (4 digits)" maxlength="4" class="nb-input" style="padding:6px 10px; font-size:0.85rem;">
        </div>
        <button class="nb-btn primary" style="width:100%; font-weight:900; font-size:0.85rem; padding:6px;" onclick="window.App.addShopUser()">
          + Add Shop Account User
        </button>

        <div style="margin-top:0.8rem;">
          <div style="font-size:0.8rem; font-weight:800; color:#888; margin-bottom:4px;">Active Shop Users (${shopUsers.length}):</div>
          ${usersList || '<div style="font-size:0.8rem; color:#666;">No additional shop accounts added yet.</div>'}
        </div>
      </div>
    `;
  } else {
    shopUsersHtml = `
      <div style="background:linear-gradient(135deg, rgba(8,102,255,0.15) 0%, rgba(0,229,255,0.1) 100%); border:2px dashed #0866FF; padding:1.2rem; border-radius:12px; margin-top:1rem; text-align:center;">
        <div style="font-weight:900; font-size:1.05rem; color:#00E5FF; margin-bottom:0.3rem;">
          <i class="ph-bold ph-users-three"></i> Multi-Shop & Multi-Cashier Accounts
        </div>
        <div style="font-size:0.82rem; color:#aaa; margin-bottom:0.6rem;">
          Add multiple cashier & staff accounts for different shop outlets (Downtown Outlet, Suburban Outlet, etc.).
        </div>
        <div style="display:inline-block; background:rgba(255,230,0,0.15); color:#FFE600; border:1px solid #FFE600; padding:2px 8px; border-radius:6px; font-weight:800; font-size:0.75rem; margin-bottom:0.8rem;">
          REQUIRES PRO SUBSCRIPTION
        </div>
        <button class="nb-btn primary" style="width:100%; font-weight:900; padding:0.6rem;" onclick="window.App.closeModal(); window.App.Subscription.openModal();">
          <i class="ph-bold ph-lightning"></i> Upgrade to PRO Plan (₱499/mo)
        </button>
      </div>
    `;
  }

  const html = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div>
        <label style="font-size:0.85rem; font-weight:700; color:var(--text-muted);">Facebook Page / Seller Store Name (Used on Receipts & Posts):</label>
        <input type="text" id="settings-store-name" value="${currentSellerName}" style="width:100%; margin-top:4px; padding:10px; background:var(--bg-input); border:2px solid var(--border-color); color:#FFF; border-radius:8px; font-weight:bold;">
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
        <div>
          <label style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">Active Cashier Name</label>
          <input type="text" id="settings-cashier-name" value="${window.App.state.cashier}" style="width:100%; padding:8px; background:var(--bg-input); border:2px solid var(--border-color); color:#FFF; border-radius:8px; font-weight:bold;">
        </div>
        <div>
          <label style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">Staff Unlock PIN</label>
          <input type="password" id="settings-cashier-pin" value="${window.App.state.cashierPin}" maxlength="4" style="width:100%; padding:8px; background:var(--bg-input); border:2px solid var(--border-color); color:#FFF; border-radius:8px; font-family:var(--font-mono); text-align:center;">
        </div>
      </div>

      ${shopUsersHtml}

      <button class="btn-emerald" style="justify-content:center; padding:12px; margin-top:6px;" onclick="window.App.saveSettings()">
        <i class="ph-bold ph-floppy-disk"></i> SAVE SETTINGS & STORE PROFILE
      </button>
    </div>
  `;

  window.App.openModal('⚙️ Store & App Settings', html);
};

window.App.addShopUser = async function() {
  const name = document.getElementById('add-user-name').value;
  const branch = document.getElementById('add-user-branch').value;
  const role = document.getElementById('add-user-role').value;
  const pin = document.getElementById('add-user-pin').value;

  if (!name || !pin) {
    alert('Please provide Staff Name and Staff PIN.');
    return;
  }

  try {
    const res = await window.App.api.post('/api/shop-users', { name, shop_branch: branch, role, pin });
    if (res && res.success) {
      if (window.App.showNotification) window.App.showNotification('Shop Account User Added!', 'success');
      window.App.openSettingsModal();
    } else {
      alert(res.message || 'Failed adding user');
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
};

window.App.saveSettings = function() {
  const storeNameInput = document.getElementById('settings-store-name');
  const cashierInput = document.getElementById('settings-cashier-name');
  const pinInput = document.getElementById('settings-cashier-pin');

  if (storeNameInput && storeNameInput.value) {
    window.App.state.metaCatalog.page_name = storeNameInput.value.trim();
  }
  if (cashierInput && cashierInput.value) {
    window.App.state.cashier = cashierInput.value.trim();
  }
  if (pinInput && pinInput.value) {
    window.App.state.cashierPin = pinInput.value.trim();
  }

  window.App.toast('Settings updated successfully!', 'success');
  window.App.closeModal();
};

/**
 * Direct Download Receipt PNG Image File
 */
window.App.downloadReceiptImage = function(invoice) {
  window.App.toast('Generating receipt PNG for download...', 'info');

  const canvas = document.createElement('canvas');
  canvas.width = 540;
  canvas.height = 760;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // Header Title
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  const sellerName = (window.App.state.metaCatalog.page_name || 'RetailMan Official Store').toUpperCase();
  ctx.fillText(sellerName, canvas.width / 2, 55);

  ctx.font = '14px monospace';
  ctx.fillText('Official Facebook Commerce Store', canvas.width / 2, 80);
  ctx.fillText('Powered by RETAILMAN AI', canvas.width / 2, 100);

  // Dashed Line
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(30, 115);
  ctx.lineTo(canvas.width - 30, 115);
  ctx.stroke();

  // Invoice Meta
  ctx.textAlign = 'left';
  ctx.font = '15px monospace';
  let y = 145;
  ctx.fillText(`Receipt No : ${invoice.invoice_no}`, 35, y); y += 24;
  ctx.fillText(`Date       : ${new Date(invoice.date).toLocaleString()}`, 35, y); y += 24;
  ctx.fillText(`Cashier    : ${invoice.cashier}`, 35, y); y += 24;
  ctx.fillText(`Payment    : ${invoice.payment_method}`, 35, y); y += 30;

  // Dashed Line
  ctx.beginPath();
  ctx.moveTo(30, y);
  ctx.lineTo(canvas.width - 30, y);
  ctx.stroke();
  y += 30;

  // Items List
  ctx.font = 'bold 15px monospace';
  invoice.items.forEach(item => {
    ctx.fillText(`${item.name} x${item.qty}`, 35, y);
    ctx.textAlign = 'right';
    ctx.fillText(`₱${(item.price * item.qty).toLocaleString()}`, canvas.width - 35, y);
    ctx.textAlign = 'left';
    y += 26;
  });

  if (invoice.discount > 0) {
    y += 6;
    ctx.fillText(`Discount Applied:`, 35, y);
    ctx.textAlign = 'right';
    ctx.fillText(`-₱${invoice.discount.toLocaleString()}`, canvas.width - 35, y);
    ctx.textAlign = 'left';
    y += 26;
  }

  y += 10;
  ctx.beginPath();
  ctx.moveTo(30, y);
  ctx.lineTo(canvas.width - 30, y);
  ctx.stroke();
  y += 40;

  // Total Paid
  ctx.font = 'bold 22px monospace';
  ctx.fillText('TOTAL PAID:', 35, y);
  ctx.textAlign = 'right';
  ctx.fillText(`₱${invoice.total.toLocaleString()}`, canvas.width - 35, y);

  y += 50;
  ctx.textAlign = 'center';
  ctx.font = '14px monospace';
  ctx.fillText('Thank you for your purchase!', canvas.width / 2, y); y += 20;
  ctx.fillText('See you again on Facebook & Instagram!', canvas.width / 2, y);

  // Trigger file download directly
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `receipt-${invoice.invoice_no}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.App.toast(`💾 Receipt downloaded: receipt-${invoice.invoice_no}.png`, 'success');
};

/**
 * Renders Receipt to Canvas and Embeds PNG Image in Modal
 */
window.App.generateReceiptImageModal = function(invoice) {
  window.App.toast('Rendering receipt image...', 'info');

  const canvas = document.createElement('canvas');
  canvas.width = 540;
  canvas.height = 760;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // Header Title
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  const sellerName = (window.App.state.metaCatalog.page_name || 'RetailMan Official Store').toUpperCase();
  ctx.fillText(sellerName, canvas.width / 2, 55);

  ctx.font = '14px monospace';
  ctx.fillText('Official Facebook Commerce Store', canvas.width / 2, 80);
  ctx.fillText('Powered by RETAILMAN AI', canvas.width / 2, 100);

  // Dashed Line
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(30, 115);
  ctx.lineTo(canvas.width - 30, 115);
  ctx.stroke();

  // Invoice Meta
  ctx.textAlign = 'left';
  ctx.font = '15px monospace';
  let y = 145;
  ctx.fillText(`Receipt No : ${invoice.invoice_no}`, 35, y); y += 24;
  ctx.fillText(`Date       : ${new Date(invoice.date).toLocaleString()}`, 35, y); y += 24;
  ctx.fillText(`Cashier    : ${invoice.cashier}`, 35, y); y += 24;
  ctx.fillText(`Payment    : ${invoice.payment_method}`, 35, y); y += 30;

  // Dashed Line
  ctx.beginPath();
  ctx.moveTo(30, y);
  ctx.lineTo(canvas.width - 30, y);
  ctx.stroke();
  y += 30;

  // Items List
  ctx.font = 'bold 15px monospace';
  invoice.items.forEach(item => {
    ctx.fillText(`${item.name} x${item.qty}`, 35, y);
    ctx.textAlign = 'right';
    ctx.fillText(`₱${(item.price * item.qty).toLocaleString()}`, canvas.width - 35, y);
    ctx.textAlign = 'left';
    y += 26;
  });

  if (invoice.discount > 0) {
    y += 6;
    ctx.fillText(`Discount Applied:`, 35, y);
    ctx.textAlign = 'right';
    ctx.fillText(`-₱${invoice.discount.toLocaleString()}`, canvas.width - 35, y);
    ctx.textAlign = 'left';
    y += 26;
  }

  y += 10;
  ctx.beginPath();
  ctx.moveTo(30, y);
  ctx.lineTo(canvas.width - 30, y);
  ctx.stroke();
  y += 40;

  // Total Paid
  ctx.font = 'bold 22px monospace';
  ctx.fillText('TOTAL PAID:', 35, y);
  ctx.textAlign = 'right';
  ctx.fillText(`₱${invoice.total.toLocaleString()}`, canvas.width - 35, y);

  y += 50;
  ctx.textAlign = 'center';
  ctx.font = '14px monospace';
  ctx.fillText('Thank you for your purchase!', canvas.width / 2, y); y += 20;
  ctx.fillText('See you again on Facebook & Instagram!', canvas.width / 2, y);

  const imgDataUrl = canvas.toDataURL('image/png');

  const html = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:12px; text-align:center;">
      <div style="font-size:0.85rem; color:var(--emerald); font-weight:bold;">
        📱 Press & hold image to Save to Photos or Copy to Messenger
      </div>
      <img src="${imgDataUrl}" style="width:100%; max-width:380px; border-radius:12px; border:3px solid #000; box-shadow:4px 4px 0px #000;" alt="Sale Receipt">
      <button class="btn-emerald" style="width:100%; justify-content:center;" onclick="window.App.downloadReceiptImage(${JSON.stringify(invoice).replace(/"/g, '&quot;')})">
        <i class="ph-bold ph-download-simple"></i> 💾 Direct Download Image File
      </button>
    </div>
  `;

  window.App.openModal('📷 Saved Sale Receipt Image', html);
};

/**
 * Dispatch Digital Sale Receipt to Facebook Messenger
 */
window.App.sendReceiptToMessenger = function(invoice) {
  const sellerStoreName = (window.App.state.metaCatalog.page_name || 'RetailMan Official Store').toUpperCase();
  const itemsFormatted = invoice.items.map(i => `• ${i.name} x${i.qty} — ₱${(i.price * i.qty).toLocaleString()}`).join('\n');
  const discountText = invoice.discount > 0 ? `\nDiscount Applied: -₱${invoice.discount.toLocaleString()}` : '';

  const receiptMessageText = 
`🧾 ${sellerStoreName} — OFFICIAL RECEIPT
------------------------------------------------
Receipt No : ${invoice.invoice_no}
Date       : ${new Date(invoice.date).toLocaleString()}
Cashier    : ${invoice.cashier}
Payment    : ${invoice.payment_method}

ITEMS PURCHASED:
${itemsFormatted}${discountText}
------------------------------------------------
TOTAL PAID : ₱${invoice.total.toLocaleString()}
------------------------------------------------
Thank you for shopping with us!
Powered by RETAILMAN AI Social Commerce`;

  // Auto copy text to clipboard
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(receiptMessageText).catch(() => {});
  }

  const html = `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div style="background:var(--bg-input); border:2px solid var(--fb-blue); border-radius:10px; padding:10px; display:flex; align-items:center; gap:10px;">
        <i class="ph-bold ph-messenger-logo" style="font-size:2.2rem; color:var(--fb-blue);"></i>
        <div>
          <div style="font-weight:900; font-size:0.95rem;">Send Receipt to Meta Messenger</div>
          <div style="font-size:0.75rem; color:var(--emerald); font-weight:bold;">
            ✅ Formatted Digital Receipt copied to Clipboard!
          </div>
        </div>
      </div>

      <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:10px;">
        <label style="font-size:0.75rem; font-weight:bold; color:var(--text-muted); display:block; margin-bottom:4px;">Preview Messenger Message Text:</label>
        <textarea readonly style="width:100%; height:130px; background:var(--bg-input); border:1px solid #333; color:#FFF; font-family:var(--font-mono); font-size:0.75rem; padding:8px; border-radius:6px; resize:none;">${receiptMessageText}</textarea>
      </div>

      <div style="display:flex; flex-direction:column; gap:8px; margin-top:4px;">
        <a href="https://m.me/" target="_blank" rel="noopener noreferrer" class="btn-primary-blue" style="justify-content:center; padding:12px; font-weight:900; text-decoration:none; text-align:center;" onclick="window.App.toast('Opening Facebook Messenger...', 'success')">
          <i class="ph-bold ph-paper-plane-tilt"></i> OPEN MESSENGER CHAT NOW
        </a>

        ${navigator.share ? `
          <button class="btn-emerald" style="justify-content:center; padding:10px; font-weight:bold;" onclick="navigator.share({ title: 'Sale Receipt ${invoice.invoice_no}', text: \`${receiptMessageText.replace(/`/g, '\\`')}\` }).catch(() => {})">
            <i class="ph-bold ph-share-network"></i> 📲 Mobile Native Share (Messenger / Viber / Direct)
          </button>
        ` : ''}
      </div>
    </div>
  `;

  window.App.openModal('💬 Dispatched to Facebook Messenger', html);
  window.App.toast('📋 Receipt text copied! Ready to paste in Messenger.', 'success');
};


