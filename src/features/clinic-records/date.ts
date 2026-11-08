export function limaToday(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima" }).format(now);
}
