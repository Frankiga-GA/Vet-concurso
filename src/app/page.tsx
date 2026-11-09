import Link from "next/link";
import { FeatureCard, PublicHeader, SiteFooter } from "@/components/vetia-ui";

const questions = [
  ["¿VetIA reemplaza a un veterinario?", "No. VetIA ofrece orientación inicial y te conecta con establecimientos reales. El diagnóstico y el tratamiento corresponden a un profesional veterinario."],
  ["¿Puedo buscar sin crear una cuenta?", "Sí. El directorio público puede consultarse libremente. La cuenta te permite guardar las fichas de tus mascotas y seguir tus gestiones."],
  ["¿Cómo aparecen las veterinarias?", "Cada establecimiento solicita incorporarse y pasa por una revisión antes de poder publicarse en el directorio."],
];

export default function HomePage() {
  return <>
    <PublicHeader />
    <main className="vet-main">
      <div className="vet-shell vet-page space-y-16">
        <section className="vet-hero vet-hero-grid">
          <div>
            <span className="vet-kicker">● Red veterinaria de Chincha, Pisco e Ica</span>
            <h1 className="vet-hero-title mt-5">Cuidar a tu mascota empieza con encontrar ayuda confiable.</h1>
            <p className="vet-hero-copy mt-5">VetIA reúne orientación responsable, fichas de tus mascotas y un directorio de veterinarias verificadas para ayudarte a dar el siguiente paso.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="vet-button vet-button-primary" href="/veterinarias">Buscar veterinaria <span aria-hidden="true">→</span></Link>
              <Link className="vet-button vet-button-secondary" href="/auth/login">Iniciar sesión</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--ink-soft)]">
              <span>✓ Directorio verificado</span><span>✓ Atención coordinada</span><span>✓ Datos protegidos</span>
            </div>
          </div>
          <div className="vet-hero-visual" aria-hidden="true">
            <div className="vet-orbit">🐾</div>
            <div className="vet-card vet-card-elevated mx-auto flex max-w-xs items-center gap-3 p-3">
              <span className="vet-icon-tile">⌖</span><div><p className="font-bold">Encuentra atención cercana</p><p className="vet-muted text-xs">Filtra por ciudad y servicios</p></div>
            </div>
          </div>
        </section>

        <section aria-labelledby="benefits-title">
          <div className="mb-6 max-w-2xl">
            <p className="vet-eyebrow">Todo en un mismo lugar</p>
            <h2 id="benefits-title" className="vet-section-title mt-2">Una experiencia pensada para propietarios y veterinarias</h2>
            <p className="vet-muted mt-3">Información clara, establecimientos reales y herramientas para organizar el cuidado cotidiano.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard icon="⌕" title="Directorio confiable" href="/veterinarias">Conoce servicios, horarios informativos y formas de contacto antes de elegir.</FeatureCard>
            <FeatureCard icon="♥" title="Mascotas organizadas" href="/account/pets">Guarda los datos básicos de tus mascotas y mantén sus fichas al día.</FeatureCard>
            <FeatureCard icon="✦" title="Orientación responsable" href="/asistente">Reconoce señales de alarma y encuentra atención profesional cuando corresponda.</FeatureCard>
          </div>
        </section>

        <section className="grid items-center gap-8 rounded-[1.75rem] bg-[var(--green-dark)] p-6 text-white shadow-[var(--shadow-md)] md:grid-cols-[.75fr_1.25fr] md:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.14em] text-emerald-200">Cómo funciona</p>
            <h2 className="vet-section-title mt-2">Del primer indicio a la atención adecuada</h2>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3">
            {[
              ["1", "Cuéntanos qué necesitas", "Busca directamente o consulta la orientación inicial."],
              ["2", "Compara veterinarias", "Revisa establecimientos aprobados por ciudad y servicio."],
              ["3", "Coordina la atención", "Envía una solicitud o contacta a la clínica para acordar el horario."],
            ].map(([step, title, copy]) => <li key={step} className="rounded-2xl border border-white/15 bg-white/8 p-4">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-200 font-bold text-[var(--green-dark)]">{step}</span>
              <h3 className="mt-4 font-bold">{title}</h3><p className="mt-1 text-sm text-emerald-50/80">{copy}</p>
            </li>)}
          </ol>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="vet-card vet-card-elevated p-6 md:p-9">
            <span className="vet-kicker">Para profesionales veterinarios</span>
            <h2 className="vet-section-title mt-4">Haz que tu clínica sea más fácil de encontrar y gestionar</h2>
            <p className="vet-muted mt-3 max-w-2xl">Solicita incorporarte a la red, completa tu perfil y organiza solicitudes de cita, clientes y pacientes desde un espacio privado.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="vet-button vet-button-primary" href="/account/clinic-applications">Registrar mi veterinaria</Link>
              <Link className="vet-button vet-button-secondary" href="/clinic">Ir al panel de clínica</Link>
            </div>
          </div>
          <div className="vet-card vet-card-soft p-6 md:p-8">
            <p className="vet-eyebrow">Confianza VetIA</p>
            <h2 className="vet-card-title mt-3">Solo perfiles revisados</h2>
            <p className="vet-muted mt-2 text-sm">Las solicitudes de incorporación, la activación y la publicación son procesos separados. Una clínica pendiente no aparece en el directorio.</p>
            <div className="mt-5 grid gap-3">
              <div className="vet-stat"><span className="text-sm text-[var(--muted)]">Cobertura inicial</span><span className="vet-stat-value">3 ciudades</span></div>
              <div className="vet-stat"><span className="text-sm text-[var(--muted)]">Privacidad</span><span className="vet-stat-value text-lg">Datos por clínica</span></div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl" aria-labelledby="faq-title">
          <div className="text-center"><p className="vet-eyebrow">Preguntas frecuentes</p><h2 id="faq-title" className="vet-section-title mt-2">Antes de empezar</h2></div>
          <div className="mt-6 grid gap-3">
            {questions.map(([question, answer]) => <details key={question} className="vet-card p-5">
              <summary className="cursor-pointer pr-4 font-bold">{question}</summary><p className="vet-muted mt-3 text-sm">{answer}</p>
            </details>)}
          </div>
        </section>
      </div>
    </main>
    <SiteFooter />
  </>;
}
