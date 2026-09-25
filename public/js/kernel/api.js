/**
 * RETAILMAN AI — API Client Wrapper
 */
window.App = window.App || {};

window.App.API = {
  /**
   * Fetch product catalog
   */
  async getProducts() {
    try {
      const res = await fetch('/api/products');
      return await res.json();
    } catch (err) {
      console.error('[API Error] getProducts failed:', err);
      return { success: false, products: [] };
    }
  },

  /**
   * Upload camera or gallery photos to server
   */
  async uploadPhotos(filesArray) {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filesArray })
      });
      return await res.json();
    } catch (err) {
      console.error('[API Error] uploadPhotos failed:', err);
      return { success: false, urls: [] };
    }
  },

  /**
   * Add or edit product
   */
  async saveProduct(productData) {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      return await res.json();
    } catch (err) {
      console.error('[API Error] saveProduct failed:', err);
      return { success: false, message: err.message };
    }
  },

  /**
   * Delete product
   */
  async deleteProduct(productId) {
    try {
      const res = await fetch('/api/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId })
      });
      return await res.json();
    } catch (err) {
      console.error('[API Error] deleteProduct failed:', err);
      return { success: false, message: err.message };
    }
  },

  /**
   * POS Checkout Sale
   */
  async checkout(checkoutPayload) {
    try {
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload)
      });
      return await res.json();
    } catch (err) {
      console.error('[API Error] checkout failed:', err);
      return { success: false, message: err.message };
    }
  },

  /**
   * Fetch Invoices (by date YYYY-MM-DD, 'all', or default today)
   */
  async getInvoices(date) {
    try {
      const url = date ? `/api/invoices?date=${encodeURIComponent(date)}` : '/api/invoices';
      const res = await fetch(url);
      return await res.json();
    } catch (err) {
      console.error('[API Error] getInvoices failed:', err);
      return { success: false, invoices: [] };
    }
  },

  /**
   * Fetch Meta Catalog & Social Posts
   */
  async getMetaStatus() {
    try {
      const res = await fetch('/api/meta/catalog');
      return await res.json();
    } catch (err) {
      console.error('[API Error] getMetaStatus failed:', err);
      return { success: false };
    }
  },

  /**
   * Toggle Meta Catalog Publication
   */
  async toggleMetaSync(productId, fbSync) {
    try {
      const res = await fetch('/api/meta/toggle-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, fb_sync: fbSync })
      });
      return await res.json();
    } catch (err) {
      console.error('[API Error] toggleMetaSync failed:', err);
      return { success: false };
    }
  },

  /**
   * Generate AI Facebook Caption Post
   */
  async generateAiPost(productId, fbAlbum) {
    try {
      const res = await fetch('/api/meta/post-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, fb_album: fbAlbum })
      });
      return await res.json();
    } catch (err) {
      console.error('[API Error] generateAiPost failed:', err);
      return { success: false };
    }
  },

  /**
   * Fetch Customers
   */
  async getCustomers() {
    try {
      const res = await fetch('/api/customers');
      return await res.json();
    } catch (err) {
      console.error('[API Error] getCustomers failed:', err);
      return { success: false, customers: [] };
    }
  }
};
