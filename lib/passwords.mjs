// Password hashing with scrypt. Stored format: "<salt>:<hash>", both hex.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const HASH_LENGTH_IN_BYTES = 64;

export function hashPassword(plainPassword) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(plainPassword, salt, HASH_LENGTH_IN_BYTES).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(plainPassword, storedPasswordHash) {
  const [salt, storedHash] = storedPasswordHash.split(':');
  const expectedHash = Buffer.from(storedHash, 'hex');
  const actualHash = scryptSync(plainPassword, salt, HASH_LENGTH_IN_BYTES);
  return actualHash.length === expectedHash.length && timingSafeEqual(actualHash, expectedHash);
}
