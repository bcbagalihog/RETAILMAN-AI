const fs = require("fs");
const path = require("path");

const BASE_DATA_DIR = path.join(__dirname, "../../data");

function resolveDataDir(tenantId) {
  if (!tenantId) {
    return BASE_DATA_DIR;
  }
  const safeTenantId = String(tenantId).replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(BASE_DATA_DIR, "tenants", safeTenantId);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function readJSON(filename, fallback = [], tenantId = null) {
  const targetDir = resolveDataDir(tenantId);
  ensureDir(targetDir);
  const filePath = path.join(targetDir, filename);

  try {
    const parentDir = path.dirname(filePath);
    ensureDir(parentDir);

    if (!fs.existsSync(filePath)) {
      await safeWriteJSON(filename, fallback, tenantId);
      return fallback;
    }
    const content = await fs.promises.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("[Vault Error] Failed reading " + filename + " (tenant: " + tenantId + "):", err);
    return fallback;
  }
}

async function safeWriteJSON(filename, data, tenantId = null) {
  const targetDir = resolveDataDir(tenantId);
  ensureDir(targetDir);
  const filePath = path.join(targetDir, filename);
  const parentDir = path.dirname(filePath);
  ensureDir(parentDir);

  const tempName = path.basename(filename) + "." + Date.now() + "." + Math.random().toString(36).substring(2, 7) + ".tmp";
  const tempPath = path.join(parentDir, tempName);

  try {
    const jsonStr = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(tempPath, jsonStr, "utf-8");
    await fs.promises.rename(tempPath, filePath);
    return true;
  } catch (err) {
    console.error("[Vault Error] Failed writing " + filename + " (tenant: " + tenantId + "):", err);
    if (fs.existsSync(tempPath)) {
      try { await fs.promises.unlink(tempPath); } catch (_) {}
    }
    return false;
  }
}

async function logSystemEvent(level, category, message, metadata = {}) {
  try {
    const logs = await readJSON("system_logs.json", []);
    const entry = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      level: level || "INFO",
      category: category || "GENERAL",
      message: message || "",
      metadata: metadata
    };
    logs.unshift(entry);
    if (logs.length > 500) logs.pop();
    await safeWriteJSON("system_logs.json", logs);
  } catch (err) {
    console.error("[System Log Error]:", err);
  }
}

module.exports = {
  readJSON,
  safeWriteJSON,
  logSystemEvent
};
