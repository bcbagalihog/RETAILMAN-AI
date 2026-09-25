/**
 * RETAILMAN AI — Inventory Subsystem Module (`window.App.Inventory`)
 */
window.App = window.App || {};

window.App.Inventory = {
  /**
   * Render Inventory Module View
   */
  async render() {
    const products = window.App.state.products || [];

    const totalItems = products.length;
    const lowStockCount = products.filter(p => p.stock_qty <= p.min_stock).length;
    const fbSyncedCount = products.filter(p => p.fb_sync).length;

    // Pagination (Max 20 Items per page to avoid lag)
    const PAGE_SIZE = 20;
    const totalPages = Math.ceil(products.length / PAGE_SIZE) || 1;
    let currentPage = window.App.state.inventoryPage || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    window.App.state.inventoryPage = currentPage;

    const pageProducts = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return `
      <div class="card-panel">
        <div class="panel-header">
          <div class="panel-title">
            <i class="ph-bold ph-package" style="color:var(--fb-blue);"></i> Inventory Stocks
          </div>
          <button class="btn-emerald" onclick="window.App.Inventory.openAddModal()">
            <i class="ph-bold ph-plus-circle"></i> Add Product
          </button>
        </div>

        <!-- Inventory Metrics Banner (Compact & Overflow Safe) -->
        <div style="display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-bottom: 1rem;">
          <div style="background:var(--bg-surface); padding:8px 4px; border-radius:10px; border:2px solid var(--border-color); text-align:center; min-width:0;">
            <div style="font-size:0.65rem; color:var(--text-muted); font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">TOTAL SKUS</div>
            <div style="font-family:var(--font-mono); font-size:1.1rem; font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${totalItems}</div>
          </div>
          <div style="background:var(--bg-surface); padding:8px 4px; border-radius:10px; border:2px solid var(--border-color); text-align:center; min-width:0;">
            <div style="font-size:0.65rem; color:var(--amber); font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">LOW STOCK</div>
            <div style="font-family:var(--font-mono); font-size:1.1rem; font-weight:900; color:var(--amber); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${lowStockCount}</div>
          </div>
          <div style="background:var(--bg-surface); padding:8px 4px; border-radius:10px; border:2px solid var(--border-color); text-align:center; min-width:0;">
            <div style="font-size:0.65rem; color:var(--fb-blue); font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">META SYNCED</div>
            <div style="font-family:var(--font-mono); font-size:1.1rem; font-weight:900; color:var(--fb-blue); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${fbSyncedCount}</div>
          </div>
        </div>

        <!-- Product Inventory Cards List -->
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${pageProducts.map(p => `
            <div style="background:var(--bg-surface); border:2px solid var(--border-color); border-radius:12px; padding:12px; display:flex; gap:12px; align-items:center; box-shadow:2px 2px 0px #000;">
              <!-- Photo Thumbnail with Carousel Badge -->
              <div style="width:70px; height:70px; position:relative; flex-shrink:0; border-radius:8px; overflow:hidden; border:2px solid #000;">
                <img src="${p.images[0]}" style="width:100%; height:100%; object-fit:cover;" alt="${p.name}">
                ${p.images.length > 1 ? `<span style="position:absolute; bottom:2px; right:2px; background:rgba(0,0,0,0.8); color:#FFF; font-size:0.65rem; padding:1px 4px; border-radius:4px; font-weight:bold;">📷 ${p.images.length}</span>` : ''}
              </div>

              <!-- Product Details -->
              <div style="flex:1; min-width:0;">
                <div style="font-weight:800; font-size:0.95rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${p.name}</div>
                <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">SKU: ${p.sku} • Barcode: ${p.barcode}</div>
                <div style="display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-top:6px;">
                  <span style="font-family:var(--font-mono); font-weight:900; color:var(--emerald); font-size:1rem;">${window.App.formatMoney(p.retail_price)}</span>
                  <span style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">Cost: ${window.App.formatMoney(p.cost_price)}</span>
                  <span style="background:${p.stock_qty <= p.min_stock ? 'rgba(255,184,0,0.15)' : 'rgba(0,210,106,0.15)'}; color:${p.stock_qty <= p.min_stock ? 'var(--amber)' : 'var(--emerald)'}; border:1px solid ${p.stock_qty <= p.min_stock ? 'var(--amber)' : 'var(--emerald)'}; font-weight:800; font-size:0.75rem; padding:2px 6px; border-radius:6px; white-space:nowrap;">Stock: ${p.stock_qty}</span>
                </div>
              </div>

              <!-- Actions & Meta Catalog Switch -->
              <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                <label class="fb-sync-toggle" title="Toggle Active Status in POS & Meta Catalog">
                  <span style="font-size:0.7rem; color:var(--text-muted); margin-right:4px;">${p.fb_sync ? 'Active' : 'Inactive'}</span>
                  <input type="checkbox" class="switch-input" ${p.fb_sync ? 'checked' : ''} onchange="window.App.Inventory.toggleMetaSync('${p.id}', this.checked)">
                  <span class="switch-slider"></span>
                </label>

                <div style="display:flex; gap:6px;">
                  <button style="background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-main); padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:bold; cursor:pointer;" onclick="window.App.Inventory.openEditModal('${p.id}')">
                    <i class="ph-bold ph-pencil-simple"></i> Edit
                  </button>
                  <button style="background:rgba(255,59,48,0.2); border:1px solid var(--coral); color:var(--coral); padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:bold; cursor:pointer;" onclick="window.App.Inventory.deleteProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')">
                    <i class="ph-bold ph-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Inventory Pagination Bar (20 SKUs Limit) -->
        ${totalPages > 1 ? `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; padding:10px; background:var(--bg-surface); border:2px solid var(--border-color); border-radius:10px; box-shadow:2px 2px 0px #000;">
            <button class="cat-pill" ${currentPage <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="window.App.Inventory.changePage(${currentPage - 1})">
              ◀ Prev Page
            </button>
            <span style="font-size:0.8rem; font-weight:bold; font-family:var(--font-mono); color:var(--text-muted);">
              Page <strong>${currentPage}</strong> of <strong>${totalPages}</strong> (${products.length} SKUs)
            </span>
            <button class="cat-pill" ${currentPage >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="window.App.Inventory.changePage(${currentPage + 1})">
              Next Page ▶
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  bindEvents() {},

  changePage(newPage) {
    window.App.state.inventoryPage = newPage;
    window.App.router.navigate('inventory');
  },

  async deleteProduct(productId, name) {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    window.App.toast('Deleting product from vault...', 'info');
    const res = await window.App.API.deleteProduct(productId);
    if (res.success) {
      window.App.toast(`Deleted ${name}`, 'success');
      await window.App.refreshData();
      window.App.router.navigate('inventory');
    } else {
      window.App.toast(`Delete error: ${res.message}`, 'error');
    }
  },

  async toggleMetaSync(productId, isChecked) {
    const res = await window.App.API.toggleMetaSync(productId, isChecked);
    if (res.success) {
      window.App.toast(isChecked ? 'Published to Meta Catalog!' : 'Removed from Meta Catalog', 'info');
      await window.App.refreshData();
    }
  },

  currentPhotos: [],

  openAddModal() {
    this.currentPhotos = [];
    this.renderFormModal({});
  },

  openEditModal(productId) {
    const prod = window.App.state.products.find(p => p.id === productId);
    if (prod) {
      this.currentPhotos = prod.images ? [...prod.images] : [];
      this.renderFormModal(prod);
    }
  },

  renderFormModal(prod = {}) {
    const isEdit = Boolean(prod.id);
    if (!this.currentPhotos || !this.currentPhotos.length) {
      this.currentPhotos = prod.images ? [...prod.images] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'];
    }

    const html = `
      <form id="inventory-form" style="display:flex; flex-direction:column; gap:10px;" onsubmit="window.App.Inventory.handleSave(event)">
        <input type="hidden" name="id" value="${prod.id || ''}">
        
        <div>
          <label style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">Product Name</label>
          <input type="text" name="name" value="${prod.name || ''}" required style="width:100%; padding:8px; background:var(--bg-input); border:2px solid var(--border-color); color:#FFF; border-radius:8px; font-weight:bold;">
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">SKU Code</label>
            <input type="text" name="sku" value="${prod.sku || ''}" placeholder="AUTO-GENERATED" style="width:100%; padding:8px; background:var(--bg-input); border:2px solid var(--border-color); color:#FFF; border-radius:8px; font-family:var(--font-mono);">
          </div>
          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">Category</label>
            <select name="category" style="width:100%; padding:8px; background:var(--bg-input); border:2px solid var(--border-color); color:#FFF; border-radius:8px; font-weight:bold;">
              <option value="Apparel" ${prod.category === 'Apparel' ? 'selected' : ''}>Apparel</option>
              <option value="Gadgets" ${prod.category === 'Gadgets' ? 'selected' : ''}>Gadgets</option>
              <option value="Accessories" ${prod.category === 'Accessories' ? 'selected' : ''}>Accessories</option>
              <option value="Footwear" ${prod.category === 'Footwear' ? 'selected' : ''}>Footwear</option>
            </select>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8px;">
          <div>
            <label style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">Retail Price (₱)</label>
            <input type="number" step="0.01" name="retail_price" value="${prod.retail_price || 0}" required style="width:100%; padding:8px; background:var(--bg-input); border:2px solid var(--border-color); color:#FFF; border-radius:8px; font-family:var(--font-mono); font-weight:bold;">
          </div>
          <div>
            <label style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">Cost Price (₱)</label>
            <input type="number" step="0.01" name="cost_price" value="${prod.cost_price || 0}" style="width:100%; padding:8px; background:var(--bg-input); border:2px solid var(--border-color); color:#FFF; border-radius:8px; font-family:var(--font-mono);">
          </div>
          <div>
            <label style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">Stock Qty</label>
            <input type="number" name="stock_qty" value="${prod.stock_qty || 0}" required style="width:100%; padding:8px; background:var(--bg-input); border:2px solid var(--border-color); color:#FFF; border-radius:8px; font-family:var(--font-mono); font-weight:bold;">
          </div>
        </div>

        <!-- Mobile Camera & Phone Gallery Upload Zone -->
        <div>
          <label style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">Product Image Gallery (Up to 10 Photos)</label>
          
          <!-- Input 1: Phone Photo Gallery (NO capture attribute = opens photo library) -->
          <input type="file" id="form-gallery-input" accept="image/*" multiple style="display:none" onchange="window.App.Inventory.handleFileSelect(event)">
          
          <!-- Input 2: Phone Camera Capture (capture=environment) -->
          <input type="file" id="form-camera-input" accept="image/*" capture="environment" style="display:none" onchange="window.App.Inventory.handleFileSelect(event)">
          
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin: 6px 0;">
            <button type="button" class="btn-primary-blue" style="justify-content:center; padding:10px; font-size:0.85rem;" onclick="document.getElementById('form-gallery-input').click()">
              <i class="ph-bold ph-image"></i> 🖼️ Pick Gallery
            </button>
            <button type="button" class="btn-primary-blue" style="justify-content:center; padding:10px; font-size:0.85rem; background:#2D3748;" onclick="document.getElementById('form-camera-input').click()">
              <i class="ph-bold ph-camera"></i> 📷 Take Photo
            </button>
          </div>

          <!-- Thumbnails Preview Grid -->
          <div id="photo-preview-grid" style="display:flex; gap:8px; overflow-x:auto; padding:6px 0;">
            ${this.renderPhotoPreviews()}
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
          <input type="checkbox" id="form-fb-sync" ${prod.fb_sync ? 'checked' : ''}>
          <label for="form-fb-sync" style="font-size:0.85rem; font-weight:bold; color:var(--fb-blue);">Publish directly to Facebook Commerce Catalog</label>
        </div>

        <button type="submit" id="save-product-submit-btn" class="btn-emerald" style="justify-content:center; padding:12px; margin-top:8px;">
          <i class="ph-bold ph-floppy-disk"></i> SAVE PRODUCT TO VAULT
        </button>
      </form>
    `;

    window.App.openModal(isEdit ? '✏️ Edit Product Listing' : '📦 Create New Inventory Item', html);
  },

  renderPhotoPreviews() {
    if (!this.currentPhotos || !this.currentPhotos.length) {
      return `<span style="font-size:0.75rem; color:var(--text-dim);">No photos selected yet.</span>`;
    }
    return this.currentPhotos.map((url, idx) => `
      <div style="position:relative; width:64px; height:64px; border-radius:8px; overflow:hidden; border:2px solid var(--fb-blue); flex-shrink:0; background:#000;">
        <img src="${url}" style="width:100%; height:100%; object-fit:cover;">
        <button type="button" style="position:absolute; top:2px; right:2px; background:rgba(255,59,48,0.9); color:#FFF; border:none; border-radius:50%; width:20px; height:20px; font-size:0.75rem; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;" onclick="window.App.Inventory.removePhoto(${idx})">✕</button>
      </div>
    `).join('');
  },

  async handleFileSelect(e) {
    const files = e.target.files;
    if (!files || !files.length) return;

    window.App.toast(`Optimizing ${files.length} photo(s)...`, 'info');

    for (let i = 0; i < files.length; i++) {
      if (this.currentPhotos.length >= 10) break;
      const file = files[i];
      try {
        const compressedBase64 = await this.compressImageFile(file);
        if (compressedBase64) {
          this.currentPhotos.push(compressedBase64);
        }
      } catch (err) {
        console.error('[Image Compress Error]', err);
      }
    }

    document.getElementById('photo-preview-grid').innerHTML = this.renderPhotoPreviews();
    window.App.toast('Photos ready! Tap Save to store in server.', 'success');
  },

  /**
   * Resizes & compresses smartphone photos on canvas to max 1200px / JPEG 0.8
   */
  compressImageFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round(height * (MAX_SIZE / width));
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round(width * (MAX_SIZE / height));
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  },

  removePhoto(index) {
    this.currentPhotos.splice(index, 1);
    document.getElementById('photo-preview-grid').innerHTML = this.renderPhotoPreviews();
  },

  async handleSave(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('save-product-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = '⏳ Uploading & Saving...';
    }

    const form = e.target;
    const formData = new FormData(form);
    
    if (!this.currentPhotos || !this.currentPhotos.length) {
      window.App.toast('Please add at least 1 photo for this product!', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i> SAVE PRODUCT TO VAULT';
      }
      return;
    }

    window.App.toast('Uploading photos to server uploads folder...', 'info');

    try {
      // Upload compressed base64 files to server /public/uploads/
      const uploadRes = await window.App.API.uploadPhotos(this.currentPhotos);
      const savedImageUrls = uploadRes.success && uploadRes.urls.length ? uploadRes.urls : this.currentPhotos;

      const payload = {
        id: formData.get('id') || undefined,
        name: formData.get('name'),
        sku: formData.get('sku'),
        category: formData.get('category'),
        retail_price: parseFloat(formData.get('retail_price')),
        cost_price: parseFloat(formData.get('cost_price')),
        stock_qty: parseInt(formData.get('stock_qty')),
        fb_sync: document.getElementById('form-fb-sync').checked,
        images: savedImageUrls
      };

      const res = await window.App.API.saveProduct(payload);
      if (res.success) {
        window.App.toast('Product & photos saved to Vault!', 'success');
        await window.App.refreshData();
        window.App.closeModal();
        window.App.router.navigate('inventory');
      } else {
        window.App.toast(`Save error: ${res.message}`, 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i> SAVE PRODUCT TO VAULT';
        }
      }
    } catch (err) {
      window.App.toast(`Upload failed: ${err.message}`, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i> SAVE PRODUCT TO VAULT';
      }
    }
  }
};
