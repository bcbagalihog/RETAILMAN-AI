const http = require('http');
const fs = require('fs');
const path = require('path');
const { readJSON, safeWriteJSON } = require('./src/utils/vault');

const PORT = process.env.PORT || 3850;
const HOST = '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME Types Map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper: Parse JSON Request Body
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Helper: Send JSON Response
function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// Server Creation
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // --- REST API ENDPOINTS ---
  
  // POST /api/upload (Save base64 camera / gallery photos to server uploads folder)
  if (method === 'POST' && pathname === '/api/upload') {
    try {
      const { files } = await getRequestBody(req);
      if (!files || !files.length) {
        return sendJSON(res, { success: false, message: 'No files provided' }, 400);
      }

      const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }

      const savedUrls = [];
      const timestamp = Date.now();

      for (let i = 0; i < files.length; i++) {
        const fileStr = files[i];
        if (fileStr.startsWith('http://') || fileStr.startsWith('https://') || fileStr.startsWith('/uploads/')) {
          // Already a web URL or upload path
          savedUrls.push(fileStr);
          continue;
        }

        // Match base64 data URI
        const matches = fileStr.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const fileName = `img_${timestamp}_${i}_${Math.floor(Math.random() * 1000)}.${ext}`;
          const filePath = path.join(UPLOADS_DIR, fileName);
          await fs.promises.writeFile(filePath, buffer);
          savedUrls.push(`/uploads/${fileName}`);
        } else {
          // Fallback url
          savedUrls.push(fileStr);
        }
      }

      return sendJSON(res, { success: true, urls: savedUrls });
    } catch (err) {
      console.error('[Upload Error]', err);
      return sendJSON(res, { success: false, message: err.message }, 500);
    }
  }

  // POST /api/products/delete (Delete Product)
  if (method === 'POST' && pathname === '/api/products/delete') {
    try {
      const { id } = await getRequestBody(req);
      let products = await readJSON('products.json', []);
      products = products.filter(p => p.id !== id);
      await safeWriteJSON('products.json', products);
      return sendJSON(res, { success: true, products });
    } catch (err) {
      return sendJSON(res, { success: false, message: err.message }, 500);
    }
  }

  // GET /api/products
  if (method === 'GET' && pathname === '/api/products') {
    const products = await readJSON('products.json', []);
    return sendJSON(res, { success: true, products });
  }

  // POST /api/products (Add / Edit Product)
  if (method === 'POST' && pathname === '/api/products') {
    try {
      const payload = await getRequestBody(req);
      let products = await readJSON('products.json', []);
      
      if (payload.id) {
        // Edit Existing
        const idx = products.findIndex(p => p.id === payload.id);
        if (idx !== -1) {
          products[idx] = { ...products[idx], ...payload };
        } else {
          products.push(payload);
        }
      } else {
        // Add New
        const newProduct = {
          id: `prod_${Date.now()}`,
          sku: payload.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          barcode: payload.barcode || `${Math.floor(880000000000 + Math.random() * 99999999)}`,
          name: payload.name || 'New Product',
          category: payload.category || 'General',
          cost_price: Number(payload.cost_price || 0),
          retail_price: Number(payload.retail_price || 0),
          stock_qty: Number(payload.stock_qty || 0),
          min_stock: Number(payload.min_stock || 5),
          fb_sync: Boolean(payload.fb_sync),
          images: payload.images && payload.images.length ? payload.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'],
          description: payload.description || ''
        };
        products.unshift(newProduct);
      }

      await safeWriteJSON('products.json', products);
      return sendJSON(res, { success: true, products });
    } catch (err) {
      return sendJSON(res, { success: false, message: err.message }, 400);
    }
  }

  // POST /api/pos/checkout (Complete POS Checkout & Deduct Inventory)
  if (method === 'POST' && pathname === '/api/pos/checkout') {
    try {
      const { items, payment_method, cashier, customer_name, discount = 0 } = await getRequestBody(req);
      
      if (!items || !items.length) {
        return sendJSON(res, { success: false, message: 'Cart is empty' }, 400);
      }

      let products = await readJSON('products.json', []);
      let invoices = await readJSON('invoices.json', []);
      let posSessions = await readJSON('pos_sessions.json', []);

      // Calculate totals and reduce stock
      let subtotal = 0;
      const invoiceItems = [];

      for (const cartItem of items) {
        const productIndex = products.findIndex(p => p.id === cartItem.id);
        if (productIndex !== -1) {
          const prod = products[productIndex];
          const qty = cartItem.qty || 1;
          
          // Deduct stock safely
          prod.stock_qty = Math.max(0, prod.stock_qty - qty);
          
          const lineTotal = prod.retail_price * qty;
          subtotal += lineTotal;
          invoiceItems.push({
            id: prod.id,
            name: prod.name,
            qty: qty,
            price: prod.retail_price
          });
        }
      }

      const total = Math.max(0, subtotal - discount);
      const invoiceNo = `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(100 + Math.random() * 900)}`;

      const newInvoice = {
        invoice_no: invoiceNo,
        date: new Date().toISOString(),
        customer_name: customer_name || 'Walk-in Customer',
        cashier: cashier || 'Ben (Manager)',
        items: invoiceItems,
        subtotal: subtotal,
        discount: discount,
        tax: 0,
        total: total,
        payment_method: payment_method || 'Cash',
        status: 'Paid'
      };

      // Save updated products and master invoice list
      await safeWriteJSON('products.json', products);
      invoices.unshift(newInvoice);
      await safeWriteJSON('invoices.json', invoices);

      // Folderize transaction per day in data/invoices_daily/YYYY-MM-DD.json
      const todayDateStr = newInvoice.date.slice(0, 10);
      const dailyFileName = `invoices_daily/${todayDateStr}.json`;
      let dailyInvoices = await readJSON(dailyFileName, []);
      dailyInvoices.unshift(newInvoice);
      await safeWriteJSON(dailyFileName, dailyInvoices);

      // Update current POS session totals
      if (posSessions.length > 0 && posSessions[0].status === 'OPEN') {
        posSessions[0].total_sales += total;
        await safeWriteJSON('pos_sessions.json', posSessions);
      }

      return sendJSON(res, { success: true, invoice: newInvoice, updated_products: products });
    } catch (err) {
      return sendJSON(res, { success: false, message: err.message }, 500);
    }
  }

  // GET /api/invoices?date=YYYY-MM-DD|all
  if (method === 'GET' && pathname === '/api/invoices') {
    const requestedDate = parsedUrl.searchParams.get('date');
    const todayStr = new Date().toISOString().slice(0, 10);
    const targetDate = requestedDate || todayStr;

    if (targetDate === 'all') {
      const allInvoices = await readJSON('invoices.json', []);
      return sendJSON(res, { success: true, invoices: allInvoices, date: 'all' });
    }

    const dailyFileName = `invoices_daily/${targetDate}.json`;
    let dailyInvoices = await readJSON(dailyFileName, null);

    if (!dailyInvoices) {
      // Fallback filter from master invoices list
      const allInvoices = await readJSON('invoices.json', []);
      dailyInvoices = allInvoices.filter(inv => inv.date && inv.date.slice(0, 10) === targetDate);
      // Auto folderize for fast future access
      if (dailyInvoices.length > 0) {
        await safeWriteJSON(dailyFileName, dailyInvoices);
      }
    }

    return sendJSON(res, { success: true, invoices: dailyInvoices, date: targetDate });
  }

  // GET /api/meta/catalog
  if (method === 'GET' && pathname === '/api/meta/catalog') {
    const catalogMeta = await readJSON('meta_catalog.json', {});
    const socialPosts = await readJSON('social_posts.json', []);
    const tenantMeta = await readJSON('tenants_meta.json', {});
    return sendJSON(res, { success: true, catalogMeta, socialPosts, tenantMeta });
  }

  // POST /api/meta/toggle-sync (Toggle individual product Meta publication)
  if (method === 'POST' && pathname === '/api/meta/toggle-sync') {
    try {
      const { product_id, fb_sync } = await getRequestBody(req);
      let products = await readJSON('products.json', []);
      const idx = products.findIndex(p => p.id === product_id);
      if (idx !== -1) {
        products[idx].fb_sync = Boolean(fb_sync);
        products[idx].fb_catalog_id = fb_sync ? `meta_cat_${Date.now()}` : null;
        await safeWriteJSON('products.json', products);

        // Update Meta catalog metrics
        let metaCatalog = await readJSON('meta_catalog.json', {});
        metaCatalog.synced_products_count = products.filter(p => p.fb_sync).length;
        metaCatalog.last_synced = new Date().toISOString();
        await safeWriteJSON('meta_catalog.json', metaCatalog);

        return sendJSON(res, { success: true, product: products[idx] });
      }
      return sendJSON(res, { success: false, message: 'Product not found' }, 404);
    } catch (err) {
      return sendJSON(res, { success: false, message: err.message }, 500);
    }
  }

  // POST /api/meta/post-ai (Generate AI Facebook caption and publish to FB Album)
  if (method === 'POST' && pathname === '/api/meta/post-ai') {
    try {
      const { product_id, fb_album = 'New Stock Arrivals 2026' } = await getRequestBody(req);
      const products = await readJSON('products.json', []);
      const prod = products.find(p => p.id === product_id);
      
      if (!prod) {
        return sendJSON(res, { success: false, message: 'Product not found' }, 404);
      }

      // Built-in AI Caption Copilot generator
      const aiCaptions = [
        `🔥 NEW ARRIVAL! Stay copped with our ${prod.name}! Only ₱${prod.retail_price.toLocaleString()}! Tap link or send DM to order! #RetailMan #NewIn #${prod.category.replace(/\s+/g,'')}`,
        `✨ RESTOCK ALERT! The highly requested ${prod.name} is back in stock (₱${prod.retail_price.toLocaleString()}). Get yours before it sells out! #ShopLocal #MetaCommerce`,
        `🛍️ FEATURED DROP: ${prod.name} - ${prod.description || 'High quality retail drop.'} Available now for ₱${prod.retail_price.toLocaleString()}. Free store pickup available!`
      ];

      const chosenCaption = aiCaptions[Math.floor(Math.random() * aiCaptions.length)];

      const newPost = {
        post_id: `fb_post_${Date.now()}`,
        product_id: prod.id,
        product_name: prod.name,
        created_at: new Date().toISOString(),
        caption: chosenCaption,
        fb_album: fb_album,
        likes: Math.floor(Math.random() * 20) + 5,
        comments: Math.floor(Math.random() * 8),
        shares: Math.floor(Math.random() * 4)
      };

      let socialPosts = await readJSON('social_posts.json', []);
      socialPosts.unshift(newPost);
      await safeWriteJSON('social_posts.json', socialPosts);

      return sendJSON(res, { success: true, post: newPost });
    } catch (err) {
      return sendJSON(res, { success: false, message: err.message }, 500);
    }
  }

  // GET /api/customers
  if (method === 'GET' && pathname === '/api/customers') {
    const customers = await readJSON('customers.json', []);
    return sendJSON(res, { success: true, customers });
  }

  // --- STATIC FILE SERVING ---
  let reqPath = pathname === '/' ? '/index.html' : pathname;
  let filePath = path.join(PUBLIC_DIR, reqPath);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA router
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('500 Internal Server Error');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

// Start Server
server.listen(PORT, HOST, () => {
  console.log(`\n===================================================`);
  console.log(` 🚀 RETAILMAN AI Server running!`);
  console.log(` 📱 Local Access:   http://localhost:${PORT}`);
  console.log(` 🌐 Network LAN:    http://192.168.x.x:${PORT}`);
  console.log(` 🔒 Data Vault:     ${path.join(__dirname, 'data')}`);
  console.log(`===================================================\n`);
});
