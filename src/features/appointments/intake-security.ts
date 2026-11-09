import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export function intakeConfig() {
  const intakeKey = process.env.VETIA_APPOINTMENT_INTAKE_KEY?.trim();
  if (!intakeKey || !/^[0-9a-f]{64}$/.test(intakeKey)) return null;
  return { intakeKey };
}

/**
 * Creates an HMAC-signed intake token for public appointment requests.
 * Encodes the clinicId and an issue timestamp to ensure submissions originate
 * from legitimate page renders and exhibit realistic human timing.
 */
export function createIntakeToken(intakeKey: string, clinicId: string): string {
  const issuedAt = Date.now().toString(36);
  const payload = `${clinicId}:${issuedAt}`;
  const hmac = createHmac("sha256", intakeKey).update(payload).digest("hex").slice(0, 32);
  return `${payload}:${hmac}`;
}

/**
 * Verifies the intake token:
 * 1. Confirms HMAC integrity against the server's private intakeKey.
 * 2. Rejects submissions completed faster than minSeconds (automated bot scraping).
 * 3. Rejects submissions older than maxMinutes (stale forms / replay attacks).
 */
export function verifyIntakeToken(
  intakeKey: string,
  clinicId: string,
  token: string,
  minSeconds = 2,
  maxMinutes = 120
): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(":");
  if (parts.length !== 3) return false;
  const [tokenClinicId, issuedAtBase36, signature] = parts;
  if (tokenClinicId !== clinicId) return false;

  const payload = `${tokenClinicId}:${issuedAtBase36}`;
  const expectedHmac = createHmac("sha256", intakeKey).update(payload).digest("hex").slice(0, 32);
  if (signature.length !== expectedHmac.length) return false;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) return false;

  const issuedAt = parseInt(issuedAtBase36, 36);
  if (isNaN(issuedAt)) return false;
  const elapsedMs = Date.now() - issuedAt;

  // Protect against rapid headless bot scripts submitting instantly
  if (elapsedMs < minSeconds * 1000) return false;
  // Protect against replay attacks with stale tokens
  if (elapsedMs > maxMinutes * 60 * 1000) return false;

  return true;
}
