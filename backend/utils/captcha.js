const crypto = require("crypto");
const svgCaptcha = require("svg-captcha");

const TTL_MS = 5 * 60 * 1000;
const MAX_PENDING = 5000;

const store = new Map();

const purgeExpired = () => {
  const now = Date.now();
  for (const [id, v] of store) if (v.expires <= now) store.delete(id);
};

const createCaptcha = () => {
  purgeExpired();
  if (store.size >= MAX_PENDING) {
    for (const id of store.keys()) {
      store.delete(id);
      if (store.size < MAX_PENDING * 0.9) break;
    }
  }
  const { data, text } = svgCaptcha.create({
    size: 5,
    ignoreChars: "0oO1iIlL",
    noise: 3,
    color: true,
    width: 150,
    height: 48,
    fontSize: 52,
    background: "#f3f6fb",
  });
  const id = crypto.randomBytes(16).toString("hex");
  store.set(id, { text: text.toLowerCase(), expires: Date.now() + TTL_MS });
  return { id, svg: data };
};

const verifyCaptcha = (id, answer) => {
  if (typeof id !== "string" || typeof answer !== "string") return false;
  const entry = store.get(id);
  store.delete(id);
  if (!entry || entry.expires <= Date.now()) return false;
  const given = answer.trim().toLowerCase();
  if (given.length !== entry.text.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(entry.text));
};

module.exports = { createCaptcha, verifyCaptcha, _store: store };
