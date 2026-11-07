import "server-only";
import { redirect } from "next/navigation";

export function applicationReadError(status: number) {
  if (status === 401) redirect("/auth/login?error=session-required");
  if (status === 403) return "Tu sesión no tiene permisos para consultar las solicitudes.";
  return "No pudimos consultar las solicitudes. Recarga la página para volver a intentarlo.";
}
