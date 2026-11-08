import Link from "next/link";
import { PublicHeader } from "@/components/vetia-ui";

export default function HomePage() {
  return <>
    <PublicHeader />
    <main className="vet-shell vet-page space-y-8">
      <section className="grid items-center gap-6 rounded-3xl bg-[var(--mint)] p-5 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-12">
        <div className="min-w-0">
          <p className="vet-eyebrow">Chincha · Pisco · Ica</p>
          <h1 className="mt-3 max-w-2xl text-[clamp(2.125rem,5.5vw,3.25rem)] leading-[1.08] font-bold tracking-tight">Encuentra una veterinaria para tu mascota</h1>
          <p className="vet-muted mt-4 max-w-lg text-lg">Consulta el directorio de veterinarias asociadas y coordina la atención directamente con la clínica.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link className="vet-button vet-button-primary" href="/veterinarias">Buscar veterinaria</Link>
            <Link className="vet-button vet-button-secondary" href="/asistente">Consultar al asistente</Link>
          </div>
        </div>
        <section className="vet-card">
          <h2 className="text-xl font-bold">Cómo funciona</h2>
          <ol className="vet-muted mt-3 list-decimal space-y-2 pl-5">
            <li>Elige una clínica en el directorio.</li>
            <li>Envía una solicitud si la opción está disponible.</li>
            <li>Coordina la fecha y hora con la clínica.</li>
          </ol>
          <p className="mt-3 text-sm">Puedes explorar el directorio sin crear una cuenta.</p>
        </section>
      </section>
      <section className="vet-card flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-xl font-bold">¿Tienes una veterinaria?</h2>
          <p className="vet-muted mt-1">Solicita incorporarte a la red de VetIA.</p></div>
        <Link className="vet-button vet-button-secondary" href="/account/clinic-applications">Registrar mi veterinaria</Link>
      </section>
      <footer className="vet-muted border-t border-[var(--line)] pt-4 text-sm">La orientación inicial no reemplaza la atención de un profesional veterinario.</footer>
    </main>
  </>;
}
