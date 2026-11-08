import Link from "next/link";
import { PublicHeader } from "@/components/vetia-ui";

export default function HomePage() {
  return <>
    <PublicHeader />
    <main className="vet-shell vet-page space-y-4 sm:space-y-5">
      <section className="vet-hero">
          <p className="vet-eyebrow">Cuidado veterinario · Chincha, Pisco e Ica</p>
          <h1 className="mt-2 max-w-2xl text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.08] font-bold tracking-tight">Encuentra una veterinaria para tu mascota</h1>
          <p className="vet-muted mt-3 max-w-lg">Busca por ciudad, revisa la ficha y coordina la atención con la clínica. Puedes explorar sin crear una cuenta.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="vet-button vet-button-primary" href="/veterinarias">Buscar veterinaria</Link>
            <Link className="vet-button vet-button-secondary" href="/account/pets">Mis mascotas</Link>
          </div>
      </section>
      <section className="vet-card flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-lg font-bold">¿Tienes una veterinaria?</h2>
          <p className="vet-muted mt-1">Solicita incorporarte a la red de VetIA.</p></div>
        <Link className="vet-button vet-button-secondary" href="/account/clinic-applications">Registrar mi veterinaria</Link>
      </section>
      <footer className="vet-muted border-t border-[var(--line)] pt-4 text-sm">La orientación inicial no reemplaza la atención de un profesional veterinario.</footer>
    </main>
  </>;
}
