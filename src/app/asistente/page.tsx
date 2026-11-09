import Link from "next/link";
import { AssistantChat } from "@/features/assistant/chat";
import { assistantChallenge, assistantConfig } from "@/features/assistant/config";
import { PageIntro, PublicHeader, SiteFooter } from "@/components/vetia-ui";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  await requireUser(true);
  const config = assistantConfig();
  return <><PublicHeader current="assistant" /><main className="vet-shell vet-page vet-assistant-page space-y-5">
    <div className="vet-assistant-intro"><PageIntro title="Asistente VetIA" label="Orientación inicial"><p>Cuéntame qué observas en tu mascota. Te ayudaré a identificar cuándo conviene buscar atención profesional.</p></PageIntro><span className="vet-assistant-disclaimer">La orientación digital no reemplaza una evaluación veterinaria.</span></div>
    {config ? <>
      <AssistantChat siteKey={config.turnstile.siteKey} challenge={assistantChallenge} />
    </> : <section className="vet-chat mx-auto w-full max-w-3xl">
      <div className="vet-chat-header flex items-center gap-3"><span className="vet-icon-tile">✦</span><div><h2 className="vet-card-title">Asistente VetIA</h2><span role="status" className="vet-badge vet-badge-pending mt-1">Temporalmente deshabilitado</span></div></div>
      <div className="vet-chat-body grid place-items-center text-center"><div className="max-w-md"><span className="vet-empty-icon mx-auto">✦</span><h3 className="vet-section-title mt-4">Estamos preparando una experiencia segura</h3><p className="vet-muted mt-2">Mientras validamos el proveedor de IA, puedes encontrar establecimientos aprobados en el directorio.</p><Link href="/veterinarias" className="vet-button vet-button-primary mt-5">Buscar veterinaria</Link></div></div>
    </section>}
  </main><SiteFooter /></>;
}
