import { hash, verify, type Options } from "@node-rs/argon2";

/*
 * Password hashing with Argon2id, at the OWASP-recommended minimum (19 MiB, 2 passes).
 *
 * Not marked "server-only": the seed script (run with tsx, outside Next.js) uses it too. It holds
 * no secrets, and its native module could not be bundled for the browser anyway.
 */

const OPTIONS: Options = {
  // Algorithm.Argon2id; the package declares it as a const enum, which isolatedModules cannot read.
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export const PASSWORD_MIN_LENGTH = 12;
/** Bounds the work an attacker can make us do per attempt. */
export const PASSWORD_MAX_LENGTH = 256;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    // A malformed hash is a failed check, never an error that reveals anything.
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

/**
 * Spends the same time as a real check when no account matches the email, so response times
 * do not reveal which addresses have accounts.
 */
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword("not-a-real-password-placeholder");
  await verifyPassword(await dummyHash, password);
  return false;
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}
