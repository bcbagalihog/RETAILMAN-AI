const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

/**
 * Ensures the data directory exists.
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Safely reads a JSON file from the data vault.
 * @param {string} filename 
 * @param {any} fallback 
 * @returns {Promise<any>}
 */
async function readJSON(filename, fallback = []) {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const parentDir = path.dirname(filePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      await safeWriteJSON(filename, fallback);
      return fallback;
    }
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`[Vault Error] Failed reading ${filename}:`, err);
    return fallback;
  }
}

/**
 * Atomically writes a JSON file to prevent partial file corruptions.
 * @param {string} filename 
 * @param {any} data 
 * @returns {Promise<boolean>}
 */
async function safeWriteJSON(filename, data) {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  const parentDir = path.dirname(filePath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  const tempPath = path.join(parentDir, `${path.basename(filename)}.${Date.now()}.tmp`);

  try {
    const jsonStr = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(tempPath, jsonStr, 'utf-8');
    await fs.promises.rename(tempPath, filePath);
    return true;
  } catch (err) {
    console.error(`[Vault Error] Failed writing ${filename}:`, err);
    if (fs.existsSync(tempPath)) {
      try { await fs.promises.unlink(tempPath); } catch (_) {}
    }
    return false;
  }
}

module.exports = {
  readJSON,
  safeWriteJSON
};
