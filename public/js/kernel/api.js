/**
 * RETAILMAN AI — API Client Wrapper
 */
window.App = window.App || {};

window.App.API = {
  getHeaders: function(extraHeaders = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, extraHeaders);
    const token = localStorage.getItem('retailman_jwt_token');
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    return headers;
  },

  async request(url, options = {}) {
    options.headers = this.getHeaders(options.headers || {});
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (_) {
        return { success: false, message: 'Invalid JSON response from server' };
      }

      if (res.status === 402 || (data && data.upgrade_required)) {
        if (window.App.Subscription) {
          window.App.Subscription.openModal();
        }
      }

      return data;
    } catch (err) {
      console.error('[API Error] ' + url + ' failed:', err);
      return { success: false, message: err.message };
    }
  },

  async get(url) {
    return this.request(url, { method: 'GET' });
  },

  async post(url, body = {}) {
    return this.request(url, { method: 'POST', body: JSON.stringify(body) });
  },

  async getProducts() {
    return this.get('/api/products');
  },

  async saveProduct(productData) {
    return this.post('/api/products', productData);
  },

  async checkout(checkoutPayload) {
    return this.post('/api/checkout', checkoutPayload);
  },

  async getInvoices(date) {
    const url = date ? `/api/invoices?date=${encodeURIComponent(date)}` : '/api/invoices';
    return this.get(url);
  },

  async getMetaStatus() {
    return this.get('/api/meta/catalog');
  },

  async toggleMetaSync(productId, fbSync) {
    return this.post('/api/meta/toggle-sync', { product_id: productId, fb_sync: fbSync });
  },

  async generateAiPost(productId, fbAlbum) {
    return this.post('/api/meta/post-ai', { product_id: productId, fb_album: fbAlbum });
  },

  async getCustomers() {
    return this.get('/api/customers');
  }
};

window.App.api = window.App.API;
