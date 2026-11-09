type RateEntry = { lastAt: number; count: number; resetAt: number };
const ipRateRecords = new Map<string, RateEntry>();
const userRateRecords = new Map<string, RateEntry>();

export function _resetRateLimitsForTesting() {
  ipRateRecords.clear();
  userRateRecords.clear();
}

export function checkServerRateLimit(
  type: "ip" | "user",
  key: string,
  maxRequests = 10,
  windowMs = 60_000,
  minIntervalMs = 2_000
): { ok: boolean; reason?: string } {
  const map = type === "ip" ? ipRateRecords : userRateRecords;
  const now = Date.now();
  const entry = map.get(key);

  if (!entry || now > entry.resetAt) {
    map.set(key, { lastAt: now, count: 1, resetAt: now + windowMs });
    if (map.size > 5000) {
      for (const [k, v] of map) {
        if (now > v.resetAt) map.delete(k);
      }
    }
    return { ok: true };
  }

  // Reject bot/rapid requests (disabled in test suite for sub-millisecond execution)
  if (process.env.NODE_ENV !== "test" && now - entry.lastAt < minIntervalMs) {
    return { ok: false, reason: "Espera unos segundos antes de enviar otra consulta." };
  }

  entry.lastAt = now;
  entry.count += 1;

  if (entry.count > maxRequests) {
    return { ok: false, reason: "Límite de consultas excedido. Intenta más tarde o usa el directorio." };
  }

  return { ok: true };
}
