import Link from "next/link";
import { AssistantChat } from "@/features/assistant/chat";
import { assistantChallenge, assistantConfig } from "@/features/assistant/config";
import { Notice, PageIntro, PublicHeader } from "@/components/vetia-ui";

export const dynamic = "force-dynamic";

export default function AssistantPage() {
  const config = assistantConfig();
  return <><PublicHeader current="assistant" /><main className="vet-shell vet-page vet-narrow space-y-4">
    <PageIntro title="Asistente VetIA"><p>Orientación general para el cuidado animal. Consulta a un veterinario para una evaluación, un diagnóstico o un tratamiento.</p></PageIntro>
    <section className="vet-notice vet-notice-danger space-y-2">
      <h2 className="font-semibold">Si crees que es una urgencia</h2>
      <p>Busca atención veterinaria inmediata si tu mascota tiene dificultad para respirar, convulsiones, sangrado intenso, posible intoxicación o no puede orinar. Puedes llamar a un establecimiento cercano o acudir directamente.</p>
      <Link href="/veterinarias" className="inline-flex min-h-11 items-center font-semibold underline">Abrir el directorio</Link>
    </section>
    {config ? <>
      <p className="text-sm text-slate-700">Evita incluir nombres de personas, documentos, direcciones o teléfonos. VetIA no guarda el chat. Para responder, se envía al proveedor de IA el contexto reciente de la consulta. Los horarios y la disponibilidad se confirman directamente con la clínica.</p>
      <AssistantChat siteKey={config.turnstile.siteKey} challenge={assistantChallenge} />
    </> : <section className="vet-card space-y-3">
      <h2 className="text-xl font-bold">Consulta el directorio mientras tanto</h2>
      <Notice role="status">El asistente está temporalmente deshabilitado. El directorio sigue disponible.</Notice>
      <Link href="/veterinarias" className="vet-button vet-button-primary">Buscar veterinaria</Link>
    </section>}
  </main></>;
}
