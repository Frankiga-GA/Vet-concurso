import "server-only";

export function clinicPublicationEnabled() {
  return process.env.VETIA_CLINIC_PUBLICATION_ENABLED === "true";
}
