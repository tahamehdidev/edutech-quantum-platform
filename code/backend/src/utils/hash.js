import argon2 from "argon2";
import crypto from "node:crypto";
import { HASH_OPTIONS } from "../config/security.js";

export async function hashPassword(password) {
  return argon2.hash(password, HASH_OPTIONS);
}

export async function verifyPassword(hash, password) {
  return argon2.verify(hash, password);
}

// Computed once at server startup via initDummyHash() (03-security-architecture.md §1.3) -- its
// value is never meaningful, only its cost, so a login attempt against a nonexistent email takes
// the same time as one against a real account with a wrong password.
let dummyHash = null;

export async function initDummyHash() {
  dummyHash = await hashPassword(crypto.randomBytes(32).toString("hex"));
}

export function getDummyHash() {
  if (!dummyHash) {
    throw new Error("Dummy hash not initialized -- call initDummyHash() at server startup.");
  }
  return dummyHash;
}
