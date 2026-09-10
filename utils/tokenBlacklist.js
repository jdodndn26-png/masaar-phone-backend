const jwt = require("jsonwebtoken");
const TokenBlacklist = require("../models/TokenBlacklist");

/**
 * إضافة token للقائمة السوداء (MongoDB - يعمل مع multi-instance)
 * @param {string} token - JWT token
 */
async function addToBlacklist(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded?.exp) return false;

    const expiresAt = new Date(decoded.exp * 1000);
    if (expiresAt <= new Date()) return true;

    await TokenBlacklist.updateOne(
      { token },
      { token, expiresAt },
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.error(`خطأ في إضافة token للقائمة السوداء: ${err.message}`);
    return false;
  }
}

/**
 * التحقق من وجود token في القائمة السوداء
 * @param {string} token - JWT token
 * @returns {Promise<boolean>}
 */
async function isBlacklisted(token) {
  try {
    const doc = await TokenBlacklist.findOne({ token }).lean();
    return !!doc;
  } catch {
    return false;
  }
}

module.exports = { addToBlacklist, isBlacklisted };
