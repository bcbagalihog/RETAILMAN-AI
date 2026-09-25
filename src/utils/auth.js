const crypto = require("crypto");
const path = require("path");
const { readJSON, safeWriteJSON } = require("./vault");

const JWT_SECRET = process.env.JWT_SECRET || "retailman_ai_super_secret_jwt_key_2026";
const USERS_FILE = "users.json";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return salt + ":" + hash;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const parts = storedHash.split(":");
  const salt = parts[0];
  const originalHash = parts[1];
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
}

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return Buffer.from(str, "base64").toString("utf-8");
}

function generateJWT(payload, expiresInHours = 720) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + (expiresInHours * 3600);
  const fullPayload = Object.assign({}, payload, { exp, iat: Math.floor(Date.now() / 1000) });

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(encodedHeader + "." + encodedPayload)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return encodedHeader + "." + encodedPayload + "." + signature;
}

function verifyJWT(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const encodedHeader = parts[0];
  const encodedPayload = parts[1];
  const signature = parts[2];

  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(encodedHeader + "." + encodedPayload)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}

async function registerTenant(email, password, storeName) {
  const users = await readJSON(USERS_FILE, []);
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some(u => u.email === normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const tenantId = "usr_" + crypto.randomBytes(6).toString("hex");
  const now = new Date();
  const trialEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const newUser = {
    tenantId,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    storeName: storeName || "My Retail Store",
    createdAt: now.toISOString(),
    subscription: {
      plan: "free_plan",
      status: "active",
      
      invoiceLimit: 50,
      tokensBalance: 50,
      monthlyInvoicesUsed: 0,
      updatedAt: now.toISOString()
    }
  };

  users.push(newUser);
  await safeWriteJSON(USERS_FILE, users);

  const token = generateJWT({ tenantId: newUser.tenantId, email: newUser.email, storeName: newUser.storeName });
  await initializeTenantVault(tenantId, storeName);

  return { user: sanitizeUser(newUser), token };
}

async function loginTenant(email, password) {
  const users = await readJSON(USERS_FILE, []);
  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find(u => u.email === normalizedEmail);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }

  const token = generateJWT({ tenantId: user.tenantId, email: user.email, storeName: user.storeName });
  return { user: sanitizeUser(user), token };
}

async function getTenantProfile(tenantId) {
  const users = await readJSON(USERS_FILE, []);
  const user = users.find(u => u.tenantId === tenantId);
  return user ? sanitizeUser(user) : null;
}

async function updateSubscription(tenantId, plan, invoiceLimit = 999999) {
  const users = await readJSON(USERS_FILE, []);
  const userIndex = users.findIndex(u => u.tenantId === tenantId);
  if (userIndex === -1) throw new Error("Tenant not found");

  users[userIndex].subscription = {
    plan,
    status: "active",
    invoiceLimit,
    updatedAt: new Date().toISOString()
  };

  await safeWriteJSON(USERS_FILE, users);
  return sanitizeUser(users[userIndex]);
}

async function incrementInvoiceUsage(tenantId) {
  const users = await readJSON(USERS_FILE, []);
  const userIndex = users.findIndex(u => u.tenantId === tenantId);
  if (userIndex !== -1) {
    const sub = users[userIndex].subscription || {};
    sub.monthlyInvoicesUsed = (sub.monthlyInvoicesUsed || 0) + 1;
    users[userIndex].subscription = sub;
    await safeWriteJSON(USERS_FILE, users);
  }
}

async function initializeTenantVault(tenantId, storeName) {
  const defaultProducts = [
    { id: "PRD-001", sku: "HD-SUN-01", name: "Graphic Sunset Hoodie", price: 850, category: "Apparel", stock: 25, unit: "pcs", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80" },
    { id: "PRD-002", sku: "BP-URB-02", name: "Urban Stealth Backpack", price: 1450, category: "Accessories", stock: 14, unit: "pcs", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80" },
    { id: "PRD-003", sku: "WT-LHR-03", name: "Classic Leather Analog Watch", price: 1950, category: "Gadgets", stock: 8, unit: "pcs", image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=400&q=80" }
  ];

  await safeWriteJSON("products.json", defaultProducts, tenantId);
  await safeWriteJSON("invoices.json", [], tenantId);
  await safeWriteJSON("customers.json", [], tenantId);
  await safeWriteJSON("config.json", { storeName, metaConnected: false }, tenantId);
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}


async function addTokens(tenantId, amount) {
  const users = await readJSON(USERS_FILE, []);
  let userIndex = users.findIndex(u => u.tenantId === tenantId);
  if (userIndex === -1) {
    const demoUser = {
      tenantId: tenantId,
      email: tenantId + "@retailman.local",
      passwordHash: "",
      storeName: "Main Store",
      createdAt: new Date().toISOString(),
      subscription: {
        plan: "free_plan",
        status: "active",
        tokensBalance: 50,
        monthlyInvoicesUsed: 0,
        updatedAt: new Date().toISOString()
      }
    };
    users.push(demoUser);
    userIndex = users.length - 1;
  }

  const sub = users[userIndex].subscription || {};
  sub.tokensBalance = (sub.tokensBalance !== undefined ? sub.tokensBalance : 50) + Number(amount);
  users[userIndex].subscription = sub;

  await safeWriteJSON(USERS_FILE, users);
  return sanitizeUser(users[userIndex]);
}

async function deductToken(tenantId) {
  const users = await readJSON(USERS_FILE, []);
  let userIndex = users.findIndex(u => u.tenantId === tenantId);
  if (userIndex === -1) {
    const demoUser = {
      tenantId: tenantId,
      email: tenantId + "@retailman.local",
      passwordHash: "",
      storeName: "Main Store",
      createdAt: new Date().toISOString(),
      subscription: {
        plan: "free_plan",
        status: "active",
        tokensBalance: 50,
        monthlyInvoicesUsed: 0,
        updatedAt: new Date().toISOString()
      }
    };
    users.push(demoUser);
    userIndex = users.length - 1;
  }

  const sub = users[userIndex].subscription || {};
  if (sub.plan === "pro") return true; // Pro plan has unlimited tokens
  if ((sub.tokensBalance !== undefined ? sub.tokensBalance : 50) <= 0) return false;

  sub.tokensBalance = Math.max(0, (sub.tokensBalance !== undefined ? sub.tokensBalance : 50) - 1);
  users[userIndex].subscription = sub;
  await safeWriteJSON(USERS_FILE, users);
  return true;
}

module.exports = {
  generateJWT,
  verifyJWT,
  registerTenant,
  loginTenant,
  getTenantProfile,
  updateSubscription,
  incrementInvoiceUsage,
  addTokens,
  deductToken
};
