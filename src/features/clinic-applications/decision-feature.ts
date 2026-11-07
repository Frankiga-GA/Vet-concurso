import "server-only";

export function adminDecisionsEnabled() {
  return process.env.VETIA_ADMIN_DECISIONS_ENABLED === "true";
}
