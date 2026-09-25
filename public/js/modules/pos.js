/**
 * RETAILMAN AI — POS Subsystem Module (`window.App.POS`)
 */
window.App = window.App || {};

window.App.POS = {
  /**
   * Render POS Mobile Grid View
   */
  async render() {
    const rawProducts = window.App.state.products || [];
    // Only show Active products in POS
    const products = rawProducts.filter(p => p.fb_sync !== false);
    const cart = window.App.state.cart || [];
    const activeCat = window.App.state.activeCategory || 'ALL';

    // Unique Categories
    const categories = ['ALL', ...new Set(products.map(p => p.category))];

    // Filter products
    let filteredProducts = activeCat === 'ALL' ? products : products.filter(p => p.category === activeCat);

    // Pagination (Max 20 Items per page to prevent lag)
    const PAGE_SIZE = 20;
    const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE) || 1;
    let currentPage = window.App.state.posPage || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    window.App.state.posPage = currentPage;

    const pageProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return `
      <!-- Search Input Bar -->
      <div class="search-box-wrap">
        <i class="ph-bold ph-magnifying-glass search-icon-left"></i>
        <input type="text" id="pos-search-input" class="search-input" placeholder="Search product name or SKU..." oninput="window.App.POS.handleSearch(this.value)" style="padding-right:15px;">
      </div>

      <!-- Category Filter Pills -->
      <div class="category-pill-row">
        ${categories.map(cat => `
          <button class="cat-pill ${activeCat === cat ? 'active' : ''}" onclick="window.App.POS.setCategory('${cat}')">
            ${cat}
          </button>
        `).join('')}
      </div>

      <!-- POS Product Cards Grid -->
      <div id="pos-product-grid" class="product-grid">
        ${pageProducts.length === 0 ? `
          <div style="grid-column: 1/-1; text-align:center; padding: 2rem; color:var(--text-muted);">
            No active products found in POS. Turn on "Publish to Catalog" in Inventory to activate products.
          </div>
        ` : pageProducts.map(p => `
          <div class="product-card" onclick="window.App.POS.addToCart('${p.id}')">
            <div class="product-img-wrap">
              <img src="${p.images[0]}" class="product-img" alt="${p.name}" loading="lazy">
              <span class="stock-tag ${p.stock_qty <= p.min_stock ? 'low' : ''}">
                ${p.stock_qty > 0 ? `In Stock: ${p.stock_qty}` : 'OUT OF STOCK'}
              </span>
            </div>
            <div class="product-info">
              <div class="product-name">${p.name}</div>
              <div class="product-meta-row">
                <div class="product-price">${window.App.formatMoney(p.retail_price)}</div>
                <div class="fb-sync-toggle" title="Active Meta Catalog Item">
                  <i class="ph-bold ph-infinity" style="color:var(--fb-blue); font-size:1.1rem;"></i>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- POS Pagination Bar (20 Items Limit) -->
      ${totalPages > 1 ? `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; padding:10px; background:var(--bg-surface); border:2px solid var(--border-color); border-radius:10px; box-shadow:2px 2px 0px #000;">
          <button class="cat-pill" ${currentPage <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="window.App.POS.changePage(${currentPage - 1})">
            ◀ Prev Page
          </button>
          <span style="font-size:0.8rem; font-weight:bold; font-family:var(--font-mono); color:var(--text-muted);">
            Page <strong>${currentPage}</strong> of <strong>${totalPages}</strong> (${filteredProducts.length} Items)
          </span>
          <button class="cat-pill" ${currentPage >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="window.App.POS.changePage(${currentPage + 1})">
            Next Page ▶
          </button>
        </div>
      ` : ''}
    `;
  },

  bindEvents() {
    this.updateDock();
  },

  changePage(newPage) {
    window.App.state.posPage = newPage;
    window.App.router.navigate('pos');
  },

  setCategory(cat) {
    window.App.state.posPage = 1;
    window.App.state.activeCategory = cat;
    window.App.router.navigate('pos');
  },

  handleSearch(query) {
    const q = query.toLowerCase().trim();
    const cards = document.querySelectorAll('#pos-product-grid .product-card');
    const products = window.App.state.products;

    cards.forEach((card, idx) => {
      const prod = products[idx];
      if (!prod) return;
      const match = (prod.name && prod.name.toLowerCase().includes(q)) || (prod.sku && prod.sku.toLowerCase().includes(q)) || (prod.barcode && String(prod.barcode).toLowerCase().includes(q));
      card.style.display = match ? 'flex' : 'none';
    });
  },

  simulateBarcodeScanner() {
    const products = window.App.state.products;
    if (!products.length) return;
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    window.App.toast(`📷 Scanned Barcode [${randomProduct.barcode}]: ${randomProduct.name}`, 'success');
    this.addToCart(randomProduct.id);
  },

  addToCart(productId) {
    const prod = window.App.state.products.find(p => p.id === productId);
    if (!prod) return;

    if (prod.stock_qty <= 0) {
      window.App.toast(`⚠️ Out of stock: ${prod.name}`, 'error');
      return;
    }

    const existingIndex = window.App.state.cart.findIndex(item => item.id === productId);
    if (existingIndex !== -1) {
      if (window.App.state.cart[existingIndex].qty >= prod.stock_qty) {
        window.App.toast(`Stock limit reached for ${prod.name}`, 'error');
        return;
      }
      window.App.state.cart[existingIndex].qty += 1;
    } else {
      window.App.state.cart.push({
        id: prod.id,
        name: prod.name,
        price: prod.retail_price,
        qty: 1,
        image: prod.images[0]
      });
    }

    window.App.toast(`Added ${prod.name} to Cart`, 'success');
    this.updateDock();
  },

  updateDock() {
    const cart = window.App.state.cart;
    const dock = document.getElementById('pos-sticky-dock');
    if (!dock) return;

    if (cart.length === 0) {
      dock.classList.add('hidden');
      return;
    }

    dock.classList.remove('hidden');
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    document.getElementById('dock-cart-count').innerText = totalCount;
    document.getElementById('dock-cart-total').innerText = window.App.formatMoney(totalPrice);
  },

  currentDiscount: 0,

  clearCart() {
    window.App.state.cart = [];
    this.currentDiscount = 0;
    this.updateDock();
    window.App.closeModal();
    window.App.toast('🛒 Cart cleared', 'info');
  },

  updateQty(index, delta) {
    const item = window.App.state.cart[index];
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      window.App.state.cart.splice(index, 1);
    }

    this.updateDock();
    if (window.App.state.cart.length === 0) {
      window.App.closeModal();
    } else {
      this.openCheckoutModal();
    }
  },

  applyPresetDiscount(amount) {
    const cart = window.App.state.cart;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    if (typeof amount === 'string' && amount.endsWith('%')) {
      const pct = parseFloat(amount) / 100;
      this.currentDiscount = Math.round(subtotal * pct);
    } else {
      this.currentDiscount = Number(amount || 0);
    }

    const discountInput = document.getElementById('checkout-discount-input');
    if (discountInput) {
      discountInput.value = this.currentDiscount;
    }

    this.updateCheckoutTotal();
  },

  updateCheckoutTotal() {
    const cart = window.App.state.cart;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountInput = document.getElementById('checkout-discount-input');
    this.currentDiscount = discountInput ? Math.max(0, parseFloat(discountInput.value || 0)) : 0;

    const total = Math.max(0, subtotal - this.currentDiscount);
    const totalEl = document.getElementById('checkout-total-due');
    if (totalEl) {
      totalEl.innerText = window.App.formatMoney(total);
    }
  },

  openCheckoutModal() {
    const cart = window.App.state.cart;
    if (!cart.length) {
      window.App.toast('Cart is empty!', 'error');
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const total = Math.max(0, subtotal - (this.currentDiscount || 0));

    const html = `
      <div style="display:flex; flex-direction:column; gap: 12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.85rem; color:var(--text-muted); font-weight:bold;">Cart Items (${cart.length}):</span>
          <button style="background:rgba(255,59,48,0.2); border:1px solid var(--coral); color:var(--coral); font-weight:bold; font-size:0.75rem; padding:4px 10px; border-radius:6px; cursor:pointer;" onclick="window.App.POS.clearCart()">
            <i class="ph-bold ph-trash"></i> Cancel & Clear Cart
          </button>
        </div>

        <div style="max-height: 180px; overflow-y: auto; border: 2px solid var(--border-color); border-radius: 10px; padding: 10px; background: var(--bg-input);">
          ${cart.map((item, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding: 6px 0; border-bottom: 1px solid #222;">
              <div style="flex:1; min-width:0; padding-right:8px;">
                <strong style="font-size:0.9rem; display:block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${item.name}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">${window.App.formatMoney(item.price)} each</div>
              </div>

              <!-- Quantity Controls (- 1 +) -->
              <div style="display:flex; align-items:center; gap: 6px;">
                <button style="background:var(--bg-card); border:1px solid var(--border-color); color:#FFF; width:26px; height:26px; border-radius:6px; font-weight:bold; cursor:pointer;" onclick="window.App.POS.updateQty(${idx}, -1)">-</button>
                <span style="font-family:var(--font-mono); font-weight:bold; width:20px; text-align:center;">${item.qty}</span>
                <button style="background:var(--bg-card); border:1px solid var(--border-color); color:#FFF; width:26px; height:26px; border-radius:6px; font-weight:bold; cursor:pointer;" onclick="window.App.POS.updateQty(${idx}, 1)">+</button>
                <span style="font-family:var(--font-mono); font-weight:800; min-width:70px; text-align:right; margin-left:6px;">${window.App.formatMoney(item.price * item.qty)}</span>
                <button style="background:none; border:none; color:var(--coral); font-weight:bold; font-size:1.1rem; cursor:pointer; padding-left:4px;" onclick="window.App.POS.removeFromCart(${idx})">✕</button>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Discount Calculator Row -->
        <div style="background:var(--bg-card); border:2px solid var(--border-color); border-radius:10px; padding:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label style="font-size:0.85rem; font-weight:700; color:var(--text-muted);">Apply Discount (₱):</label>
            <input type="number" id="checkout-discount-input" value="${this.currentDiscount || 0}" step="10" placeholder="0.00" style="width:110px; padding:6px; background:var(--bg-input); border:2px solid var(--border-color); color:var(--amber); border-radius:6px; font-family:var(--font-mono); font-weight:bold; text-align:right;" oninput="window.App.POS.updateCheckoutTotal()">
          </div>

          <div style="display:flex; gap:6px; justify-content:flex-end;">
            <button type="button" style="background:var(--bg-input); border:1px solid var(--border-color); color:#FFF; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; cursor:pointer;" onclick="window.App.POS.applyPresetDiscount(0)">₱0</button>
            <button type="button" style="background:var(--bg-input); border:1px solid var(--border-color); color:#FFF; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; cursor:pointer;" onclick="window.App.POS.applyPresetDiscount(50)">₱50</button>
            <button type="button" style="background:var(--bg-input); border:1px solid var(--border-color); color:#FFF; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; cursor:pointer;" onclick="window.App.POS.applyPresetDiscount(100)">₱100</button>
            <button type="button" style="background:var(--bg-input); border:1px solid var(--border-color); color:var(--amber); padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; cursor:pointer;" onclick="window.App.POS.applyPresetDiscount('10%')">10% OFF</button>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; font-family:var(--font-heading); font-size:1.3rem; font-weight:900; background:var(--bg-card); padding:10px; border-radius:10px; border:2px solid var(--fb-blue);">
          <span>TOTAL DUE:</span>
          <span id="checkout-total-due" style="color:var(--emerald); font-family:var(--font-mono);">${window.App.formatMoney(total)}</span>
        </div>

        <div>
          <label style="font-size:0.85rem; font-weight:700; color:var(--text-muted);">Select Payment Method:</label>
          <select id="checkout-payment-method" style="width:100%; margin-top:4px; padding:10px; background:var(--bg-input); border:2px solid var(--border-color); color:#FFF; border-radius:8px; font-weight:800;">
            <option value="Cash">💵 Cash</option>
            <option value="GCash / Maya">📱 GCash / Maya E-Wallet</option>
            <option value="Meta Checkout Link">🔵 Meta Shop / Facebook Pay</option>
          </select>
        </div>

        <button type="button" id="pos-submit-checkout-btn" class="btn-emerald" style="width:100%; justify-content:center; padding:14px; font-size:1.1rem; margin-top:8px; cursor:pointer; touch-action:manipulation; position:relative; z-index:100;" onclick="event.stopPropagation(); window.App.POS.processCheckout(this)">
          <i class="ph-bold ph-check-circle"></i> COMPLETE SALE & RECEIPT
        </button>
      </div>
    `;

    window.App.openModal('📱 Mobile POS Checkout', html);
  },

  removeFromCart(index) {
    window.App.state.cart.splice(index, 1);
    this.updateDock();
    if (window.App.state.cart.length === 0) {
      window.App.closeModal();
    } else {
      this.openCheckoutModal();
    }
  },

  async processCheckout(btnElement) {
    if (this.isProcessingCheckout) return;
    this.isProcessingCheckout = true;

    if (btnElement) {
      btnElement.disabled = true;
      btnElement.innerHTML = `<i class="ph-bold ph-circle-notch spinner"></i> Processing Sale...`;
    }

    try {
      const cart = window.App.state.cart;
      if (!cart || cart.length === 0) {
        if (window.App.toast) window.App.toast('Cart is empty', 'warning');
        this.isProcessingCheckout = false;
        if (btnElement) {
          btnElement.disabled = false;
          btnElement.innerHTML = `<i class="ph-bold ph-check-circle"></i> COMPLETE SALE & RECEIPT`;
        }
        return;
      }
      const methodSelect = document.getElementById('checkout-payment-method');
      const paymentMethod = methodSelect ? methodSelect.value : 'Cash';
      const discountInput = document.getElementById('checkout-discount-input');
      const discount = discountInput ? Math.max(0, parseFloat(discountInput.value || 0)) : 0;

      const payload = {
        cart: cart,
        items: cart,
        payment_method: paymentMethod,
        cashier: window.App.state.cashier || 'Manager',
        customer_name: 'Walk-in Retail Buyer',
        discount: discount
      };

      if (window.App.toast) window.App.toast('Processing transaction...', 'info');

      let res = null;
      if (window.App.api && typeof window.App.api.checkout === 'function') {
        res = await window.App.api.checkout(payload);
      } else if (window.App.API && typeof window.App.API.checkout === 'function') {
        res = await window.App.API.checkout(payload);
      } else {
        const token = localStorage.getItem('retailman_jwt_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        const fetchRes = await fetch('/api/checkout', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });
        res = await fetchRes.json();
      }

      if (res && res.success) {
        window.App.state.cart = [];
        this.currentDiscount = 0;
        if (window.App.refreshData) await window.App.refreshData();
        window.App.closeModal();
        this.updateDock();
        this.openReceiptModal(res.invoice);
      } else {
        if (window.App.toast) window.App.toast(`Checkout error: ${res ? res.message : 'Transaction failed'}`, 'error');
      }
    } catch (err) {
      if (window.App.toast) window.App.toast(`Checkout error: ${err.message}`, 'error');
    } finally {
      this.isProcessingCheckout = false;
      if (btnElement && document.body.contains(btnElement)) {
        btnElement.disabled = false;
        btnElement.innerHTML = `<i class="ph-bold ph-check-circle"></i> COMPLETE SALE & RECEIPT`;
      }
    }
  },

  simulateThermalPrint(invoice) {
    window.App.toast('🖨️ Receipt sent to Bluetooth / USB Thermal Printer!', 'success');
  },

  openReceiptModal(invoice) {
    const sellerStoreName = (window.App.state.metaCatalog.page_name || 'RetailMan Official Store').toUpperCase();

    const html = `
      <div id="receipt-printable-area" style="font-family:var(--font-mono); background:#FFF; color:#000; padding:15px; border-radius:10px; font-size:0.85rem; border:3px solid #000; box-shadow:4px 4px 0px #000;">
        <div style="text-align:center; font-weight:900; font-size:1.15rem; border-bottom:2px dashed #000; padding-bottom:8px; margin-bottom:8px;">
          ${sellerStoreName}<br>
          <span style="font-size:0.75rem; font-weight:normal;">Official Facebook Social Commerce Store</span><br>
          <span style="font-size:0.68rem; font-weight:normal; color:#555;">Powered by RETAILMAN AI</span>
        </div>
        <div><strong>Receipt No:</strong> ${invoice.invoice_no}</div>
        <div><strong>Date:</strong> ${new Date(invoice.date).toLocaleString()}</div>
        <div><strong>Cashier:</strong> ${invoice.cashier}</div>
        <div><strong>Payment:</strong> ${invoice.payment_method}</div>
        <div style="border-bottom:1px dashed #000; margin: 8px 0;"></div>
        
        ${invoice.items.map(item => `
          <div style="display:flex; justify-content:space-between;">
            <span>${item.name} ×${item.qty}</span>
            <span>₱${(item.price * item.qty).toLocaleString()}</span>
          </div>
        `).join('')}

        ${invoice.discount > 0 ? `
          <div style="display:flex; justify-content:space-between; color:#D32F2F; margin-top:4px;">
            <span>Discount Applied:</span>
            <span>-₱${invoice.discount.toLocaleString()}</span>
          </div>
        ` : ''}
        
        <div style="border-bottom:2px dashed #000; margin: 8px 0;"></div>
        <div style="display:flex; justify-content:space-between; font-weight:900; font-size:1.05rem;">
          <span>TOTAL PAID:</span>
          <span>₱${invoice.total.toLocaleString()}</span>
        </div>
        <div style="text-align:center; margin-top:12px; font-size:0.75rem;">
          Thank you for shopping with us!<br>See you again on Facebook & Instagram!
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:8px; margin-top:12px;">
        <button class="btn-primary-blue" style="justify-content:center; padding:12px; font-size:1rem; font-weight:900;" onclick="window.App.sendReceiptToMessenger(${JSON.stringify(invoice).replace(/"/g, '&quot;')})">
          <i class="ph-bold ph-messenger-logo" style="font-size:1.3rem;"></i> 💬 SEND RECEIPT TO MESSENGER
        </button>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
          <button class="btn-emerald" style="justify-content:center; padding:9px; font-size:0.8rem;" onclick="window.App.downloadReceiptImage(${JSON.stringify(invoice).replace(/"/g, '&quot;')})">
            <i class="ph-bold ph-download-simple"></i> 💾 Save PNG File
          </button>
          <button style="background:var(--bg-card); border:2px solid var(--border-color); color:#FFF; border-radius:8px; font-weight:bold; font-size:0.8rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;" onclick="window.App.POS.simulateThermalPrint(${JSON.stringify(invoice).replace(/"/g, '&quot;')})">
            <i class="ph-bold ph-printer"></i> 🖨️ Thermal Print
          </button>
        </div>
      </div>
    `;

    window.App.openModal('🧾 Sale Thermal Receipt', html);
  },

  openPinModal() {
    const html = `
      <div style="display:flex; flex-direction:column; gap:12px; text-align:center;">
        <i class="ph-bold ph-lock-key" style="font-size:3rem; color:var(--fb-blue);"></i>
        <p style="font-size:0.9rem; color:var(--text-muted);">Enter 4-Digit Cashier Staff PIN to switch active user:</p>
        <input type="password" id="cashier-pin-input" maxlength="4" placeholder="••••" style="width:140px; margin:0 auto; font-size:1.8rem; text-align:center; letter-spacing:8px; padding:10px; background:var(--bg-input); border:3px solid var(--fb-blue); color:#FFF; border-radius:12px;">
        <button class="btn-primary-blue" style="justify-content:center;" onclick="window.App.POS.verifyPin()">
          Unlock POS Terminal
        </button>
      </div>
    `;
    window.App.openModal('🔑 Cashier Staff Switch', html);
  },

  verifyPin() {
    const input = document.getElementById('cashier-pin-input');
    if (input && input.value === '1234') {
      window.App.toast('Unlocked! Switched Cashier to Ben', 'success');
      window.App.closeModal();
    } else {
      window.App.toast('Invalid PIN. Use default: 1234', 'error');
    }
  }
};
