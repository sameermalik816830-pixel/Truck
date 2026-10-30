const crypto = require("crypto");

const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const verhoeff = (num) => {
  let c = 0;
  const digits = String(num).split("").reverse().map(Number);
  digits.forEach((n, i) => {
    c = d[c][p[i % 8][n]];
  });
  return c === 0;
};

const normalizeAadhaar = (v) => String(v || "").replace(/[\s-]/g, "");

const isValidAadhaar = (v) => {
  const n = normalizeAadhaar(v);
  return /^[2-9]\d{11}$/.test(n) && verhoeff(n);
};

const secret = () => process.env.AADHAAR_SECRET || process.env.JWT_SECRET || "change-me";
const encKey = () => crypto.createHash("sha256").update(`aadhaar-enc:${secret()}`).digest();

const hashAadhaar = (n) => crypto.createHmac("sha256", secret()).update(normalizeAadhaar(n)).digest("hex");

const encryptAadhaar = (n) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encKey(), iv);
  const enc = Buffer.concat([cipher.update(normalizeAadhaar(n), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString("hex")).join(":");
};

const decryptAadhaar = (payload) => {
  const [iv, tag, enc] = String(payload).split(":").map((h) => Buffer.from(h, "hex"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", encKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
};

const last4 = (n) => normalizeAadhaar(n).slice(-4);

module.exports = { normalizeAadhaar, isValidAadhaar, hashAadhaar, encryptAadhaar, decryptAadhaar, last4 };
