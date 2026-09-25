const http = require("http");
const fs = require("fs");
const path = require("path");
const { readJSON, safeWriteJSON } = require("./src/utils/vault");
const {
  verifyJWT,
  registerTenant,
  loginTenant,
  getTenantProfile,
  updateSubscription,
  incrementInvoiceUsage
} = require("./src/utils/auth");

const PORT = process.env.PORT || 3850;
const HOST = "0.0.0.0";
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Extract Tenant Context from Authorization Header
  let tenantId = "default_demo";
  let authUser = null;

  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const payload = verifyJWT(token);
    if (payload && payload.tenantId) {
      tenantId = payload.tenantId;
      authUser = payload;
    }
  }

  // --- AUTH & SUBSCRIPTION API ROUTES ---
  if (method === "POST" && pathname === "/api/auth/register") {
    try {
      const { email, password, storeName } = await getRequestBody(req);
      if (!email || !password) {
        return sendJSON(res, { success: false, message: "Email and password are required." }, 400);
      }
      const result = await registerTenant(email, password, storeName);
      return sendJSON(res, Object.assign({ success: true }, result));
    } catch (err) {
      return sendJSON(res, { success: false, message: err.message }, 400);
    }
  }

  if (method === "POST" && pathname === "/api/auth/login") {
    try {
      const { email, password } = await getRequestBody(req);
      if (!email || !password) {
        return sendJSON(res, { success: false, message: "Email and password are required." }, 400);
      }
      const result = await loginTenant(email, password);
      return sendJSON(res, Object.assign({ success: true }, result));
    } catch (err) {
      return sendJSON(res, { success: false, message: err.message }, 400);
    }
  }

  if (method === "GET" && pathname === "/api/auth/me") {
    if (!authUser) {
      return sendJSON(res, { success: false, message: "Unauthenticated" }, 401);
    }
    const profile = await getTenantProfile(authUser.tenantId);
    return sendJSON(res, { success: true, user: profile });
  }

  if (method === "GET" && pathname === "/api/subscription/status") {
    const profile = await getTenantProfile(tenantId);
    if (!profile) {
      return sendJSON(res, {
        success: true,
        subscription: { plan: "free_trial", status: "active", invoiceLimit: 50, monthlyInvoicesUsed: 0 }
      });
    }
    return sendJSON(res, { success: true, subscription: profile.subscription, storeName: profile.storeName });
  }

  if (method === "POST" && pathname === "/api/subscription/upgrade") {
    try {
      const { plan = "pro" } = await getRequestBody(req);
      const updatedProfile = await updateSubscription(tenantId, plan, 999999);
      return sendJSON(res, { success: true, message: "Successfully upgraded to Pro Plan!", subscription: updatedProfile.subscription });
    } catch (err) {
      return sendJSON(res, { success: false, message: err.message }, 400);
    }
  }

  // --- CORE ERP API ROUTES (TENANT ISOLATED) ---

  if (method === "GET" && pathname === "/api/products") {
    const products = await readJSON("products.json", [], tenantId);
    return sendJSON(res, { success: true, products, tenantId });
  }

  if (method === "POST" && pathname === "/api/products") {
    try {
      const productData = await getRequestBody(req);
      let products = await readJSON("products.json", [], tenantId);

      if (productData.id) {
        const index = products.findIndex(p => p.id === productData.id);
        if (index !== -1) {
          products[index] = Object.assign({}, products[index], productData, { updated_at: new Date().toISOString() });
        } else {
          products.unshift(productData);
        }
      } else {
        const newProduct = Object.assign({}, productData, {
          id: "PRD-" + String(Date.now()).slice(-6),
          created_at: new Date().toISOString()
        });
        products.unshift(newProduct);
      }

      await safeWriteJSON("products.json", products, tenantId);
      return sendJSON(res, { success: true, products });
    } catch (err) {
      return sendJSON(res, { success: false, message: err.message }, 500);
    }
  }

  if (method === "GET" && pathname === "/api/pos/session") {
    let posSessions = await readJSON("pos_sessions.json", [], tenantId);
    if (posSessions.length === 0) {
      const defaultSession = {
        session_id: "POS-SESS-" + Date.now(),
        opened_at: new Date().toISOString(),
        cashier: authUser ? authUser.storeName : "Main Cashier",
        starting_cash: 2000,
        total_sales: 0,
        status: "OPEN"
      };
      posSessions.push(defaultSession);
      await safeWriteJSON("pos_sessions.json", posSessions, tenantId);
    }
    return sendJSON(res, { success: true, session: posSessions[0] });
  }

  if (method === "POST" && pathname === "/api/checkout") {
    try {
      const profile = await getTenantProfile(tenantId);
      if (profile && profile.subscription) {
        const sub = profile.subscription;
        if (sub.plan === "free_trial" && (sub.monthlyInvoicesUsed || 0) >= (sub.invoiceLimit || 50)) {
          return sendJSON(res, {
            success: false,
            upgrade_required: true,
            message: "Free Trial limit reached (50/50 invoices processed). Please upgrade to Pro Plan for unlimited sales processing!"
          }, 402);
        }
      }

      const { cart = [], payment_method = "Cash", customer_name = "Walk-in", cashier = "Manager", discount = 0 } = await getRequestBody(req);
      let products = await readJSON("products.json", [], tenantId);
      let invoices = await readJSON("invoices.json", [], tenantId);
      let posSessions = await readJSON("pos_sessions.json", [], tenantId);

      let subtotal = 0;
      const invoiceItems = [];

      for (const cartItem of cart) {
        const prodIndex = products.findIndex(p => p.id === cartItem.id || p.sku === cartItem.sku);
        if (prodIndex !== -1) {
          const prod = products[prodIndex];
          const qty = cartItem.qty || 1;
          prod.stock = Math.max(0, (prod.stock || prod.stock_qty || 0) - qty);

          const price = prod.price || prod.retail_price || 0;
          const lineTotal = price * qty;
          subtotal += lineTotal;
          invoiceItems.push({
            id: prod.id,
            name: prod.name,
            qty: qty,
            price: price
          });
        }
      }

      const total = Math.max(0, subtotal - discount);
      const invoiceNo = "INV-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + Math.floor(100 + Math.random() * 900);

      const newInvoice = {
        invoice_no: invoiceNo,
        date: new Date().toISOString(),
        customer_name: customer_name,
        cashier: cashier,
        items: invoiceItems,
        subtotal: subtotal,
        discount: discount,
        total: total,
        payment_method: payment_method,
        status: "Paid"
      };

      await safeWriteJSON("products.json", products, tenantId);
      invoices.unshift(newInvoice);
      await safeWriteJSON("invoices.json", invoices, tenantId);

      const todayDateStr = newInvoice.date.slice(0, 10);
      const dailyFileName = "invoices_daily/" + todayDateStr + ".json";
      let dailyInvoices = await readJSON(dailyFileName, [], tenantId);
      dailyInvoices.unshift(newInvoice);
      await safeWriteJSON(dailyFileName, dailyInvoices, tenantId);

      if (posSessions.length > 0 && posSessions[0].status === "OPEN") {
        posSessions[0].total_sales += total;
        await safeWriteJSON("pos_sessions.json", posSessions, tenantId);
      }

      await incrementInvoiceUsage(tenantId);

      return sendJSON(res, { success: true, invoice: newInvoice, updated_products: products });
    } catch (err) {
      return sendJSON(res, { success: false, message: err.message }, 500);
    }
  }

  if (method === "GET" && pathname === "/api/invoices") {
    const requestedDate = parsedUrl.searchParams.get("date");
    const todayStr = new Date().toISOString().slice(0, 10);
    const targetDate = requestedDate || todayStr;

    if (targetDate === "all") {
      const allInvoices = await readJSON("invoices.json", [], tenantId);
      return sendJSON(res, { success: true, invoices: allInvoices, date: "all" });
    }

    const dailyFileName = "invoices_daily/" + targetDate + ".json";
    let dailyInvoices = await readJSON(dailyFileName, null, tenantId);

    if (!dailyInvoices) {
      const allInvoices = await readJSON("invoices.json", [], tenantId);
      dailyInvoices = allInvoices.filter(inv => inv.date && inv.date.slice(0, 10) === targetDate);
      if (dailyInvoices.length > 0) {
        await safeWriteJSON(dailyFileName, dailyInvoices, tenantId);
      }
    }

    return sendJSON(res, { success: true, invoices: dailyInvoices, date: targetDate });
  }

  if (method === "GET" && pathname === "/api/customers") {
    const customers = await readJSON("customers.json", [], tenantId);
    return sendJSON(res, { success: true, customers });
  }

  // --- STATIC FILE SERVING ---
  let reqPath = pathname === "/" ? "/index.html" : pathname;
  let filePath = path.join(PUBLIC_DIR, reqPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    return res.end("403 Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(PUBLIC_DIR, "index.html");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        return res.end("500 Internal Server Error");
      }
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log();
});
