import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const PREFIX = "scrypt$1";
const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const normalized = String(password || "");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(normalized, salt, KEY_LENGTH).toString("hex");

  return `${PREFIX}$${salt}$${hash}`;
}

export function isHashedPassword(value: string | null | undefined) {
  return String(value || "").startsWith(`${PREFIX}$`);
}

export function verifyPassword(password: string, stored: string | null | undefined) {
  const saved = String(stored || "");
  const raw = String(password || "");

  if (!saved) return false;

  if (!isHashedPassword(saved)) {
    return saved === raw;
  }

  const [, , salt, hash] = saved.split("$");
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(raw, salt, expected.length);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function needsPasswordRehash(stored: string | null | undefined) {
  return !isHashedPassword(stored);
}
