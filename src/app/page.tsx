import Link from "next/link";
import { PublicHeader, SiteFooter } from "@/components/vetia-ui";

const cities = [
  {
    name: "Chincha",
    slug: "Chincha",
    description: "Atención de animales menores, medicina preventiva y consultorios verificados.",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Pisco",
    slug: "Pisco",
    description: "Red de atención veterinaria costera, urgencias y control sanitario.",
    image: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Ica",
    slug: "Ica",
    description: "Centros clínicos integrales, especialidades quirúrgicas y diagnóstico veterinario.",
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80",
  },
];

const specialties = [
  "Consulta general",
  "Vacunación y desparasitación",
  "Cirugías",
  "Emergencias",
  "Profilaxis y odontología",
  "Dermatología",
];

const questions = [
  [
    "¿VetIA reemplaza la atención de un médico veterinario?",
    "Bajo ninguna circunstancia. VetIA ofrece orientación preventiva inicial y facilita el contacto con establecimientos formales. El diagnóstico, prescripción y tratamiento son competencia exclusiva de un médico veterinario colegiado (CMVP).",
  ],
  [
    "¿Puedo consultar el directorio y buscar clínicas sin tener cuenta?",
    "Sí. El directorio de veterinarias en Chincha, Pisco e Ica es de acceso público y libre. Crear una cuenta gratuita te permite registrar las fichas de tus mascotas, recordar sus datos y coordinar solicitudes con mayor rapidez.",
  ],
  [
    "¿Cómo se verifica que una veterinaria sea formal?",
    "Cada establecimiento pasa por un proceso de acreditación administrativa donde se revisa su RUC activo en SUNAT, su personería jurídica o natural, y la colegiatura del médico veterinario responsable ante el CMVP antes de publicarse en el directorio.",
  ],
  [
    "¿El asistente de inteligencia artificial receta medicamentos?",
    "No. Por principios éticos y de seguridad animal, el asistente VetIA tiene prohibido sugerir dosis o prescribir fármacos. Su función es ayudarte a reconocer señales de alarma y orientarte sobre cuándo acudir de inmediato al consultorio.",
  ],
  [
    "¿Cómo puede una clínica registrarse en VetIA?",
    "Cualquier establecimiento con RUC y médico veterinario colegiado en la Región Ica puede iniciar sesión, enviar su solicitud de acreditación adjuntando sus datos y documentos de sustento, y acceder a un panel privado para gestionar pacientes y citas.",
  ],
];

export default function HomePage() {
  return (
    <>
      <PublicHeader />

      <main className="vet-main overflow-x-hidden">
        <div className="vet-shell vet-page space-y-14 sm:space-y-20 md:space-y-24">

          {/* ==================== HERO SECTION ==================== */}
          <section className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] border border-[rgb(18_99_77/18%)] bg-gradient-to-br from-[#e8f5ee] via-[#f7fbf8] to-[#fbf6ec] p-5 sm:p-10 lg:p-14 shadow-[var(--shadow-md)]">
            <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4 sm:space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-800/15 bg-white/90 px-3 py-1 text-[11px] sm:text-xs font-bold text-[var(--green-dark)] shadow-xs backdrop-blur-sm">
                  <span className="vet-badge-dot" />
                  <span>Red activa en Chincha, Pisco e Ica</span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-5xl lg:text-[3.5rem] leading-[1.12]">
                  Cuidar a tu mascota empieza con encontrar ayuda confiable.
                </h1>

                <p className="max-w-xl text-sm sm:text-base lg:text-lg text-[var(--ink-soft)] leading-relaxed">
                  Conoce veterinarias con acreditación formal, organiza las fichas médicas de tus mascotas y recibe orientación responsable para actuar a tiempo.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                  <Link
                    href="/veterinarias"
                    className="vet-button vet-button-primary !w-full sm:!w-auto text-sm sm:text-base px-6 py-3 shadow-md"
                  >
                    <span>Buscar veterinaria</span>
                    <span aria-hidden="true">→</span>
                  </Link>

                  <a
                    href="#como-funciona"
                    className="vet-button vet-button-secondary !w-full sm:!w-auto text-sm sm:text-base px-5 py-3"
                  >
                    <span>Conocer VetIA</span>
                    <span aria-hidden="true">↓</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs font-semibold text-[var(--muted)]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span>Clínicas con RUC y CMVP</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span>Fichas médicas privadas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span>Sin recetas automáticas</span>
                  </div>
                </div>
              </div>

              {/* Visual Hero Showcase */}
              <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
                <div className="vet-hero-img-wrap aspect-[16/11] sm:aspect-[16/12] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1200&q=80"
                    alt="Médica veterinaria examinando con cariño a un cachorro"
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                </div>

                {/* Floating Badges - Desktop */}
                <div className="hidden sm:block vet-glass-card absolute -top-4 -right-4 rounded-xl p-3 shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--green)] text-white text-sm">
                      ✓
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-[var(--green-dark)] leading-tight">Acreditación formal</p>
                      <p className="text-[11px] text-[var(--muted)]">SUNAT y CMVP validados</p>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block vet-glass-card absolute -bottom-5 -left-4 max-w-[260px] rounded-xl p-3.5 shadow-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🐕</span>
                    <div>
                      <p className="text-xs font-bold text-[var(--ink)]">Salud y bienestar animal</p>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5">Atención coordinada y transparente</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Badges - Clean grid under image */}
                <div className="grid grid-cols-2 gap-2 pt-3 sm:hidden">
                  <div className="rounded-xl border border-slate-200/90 bg-white/95 p-2.5 shadow-xs">
                    <p className="text-[11px] font-extrabold text-[var(--green-dark)]">✓ Acreditación formal</p>
                    <p className="text-[10px] text-[var(--muted)]">SUNAT y CMVP</p>
                  </div>
                  <div className="rounded-xl border border-slate-200/90 bg-white/95 p-2.5 shadow-xs">
                    <p className="text-[11px] font-extrabold text-[var(--green-dark)]">🐕 Cuidado verificado</p>
                    <p className="text-[10px] text-[var(--muted)]">Atención ética</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== BENEFICIOS (BENTO GRID) ==================== */}
          <section id="beneficios" aria-labelledby="beneficios-title" className="space-y-6 sm:space-y-8">
            <div className="max-w-2xl">
              <p className="vet-eyebrow">Todo en un mismo lugar</p>
              <h2 id="beneficios-title" className="vet-section-title mt-1.5">
                Una experiencia pensada para el bienestar de tus compañeros
              </h2>
              <p className="vet-muted mt-2 text-sm sm:text-base">
                Conectamos a dueños responsables con profesionales de la salud animal en un ecosistema claro y accesible.
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Card 1 */}
              <Link
                href="/veterinarias"
                className="vet-card vet-card-action group flex flex-col justify-between p-5 sm:p-7 border-slate-200/80"
              >
                <div className="space-y-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-lg text-[var(--green)] transition group-hover:scale-105">
                    <svg className="h-6 w-6 text-[var(--green)]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A2.25 2.25 0 0018.25 8.167H5.75A2.25 2.25 0 003.5 10.333V21" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--ink)]">Directorio con respaldo real</h3>
                  <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                    Accede a clínicas con RUC activo y médico colegiado verificado en Chincha, Pisco e Ica. Conoce especialidades, horarios y ubicación antes de salir.
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--green)]">
                  <span>Ver veterinarias</span>
                  <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                </div>
              </Link>

              {/* Card 2 */}
              <Link
                href="/account/pets"
                className="vet-card vet-card-action group flex flex-col justify-between p-5 sm:p-7 border-slate-200/80"
              >
                <div className="space-y-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-lg text-[var(--green)] transition group-hover:scale-105">
                    <svg className="h-6 w-6 text-[var(--green)]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--ink)]">Fichas de salud al alcance</h3>
                  <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                    Registra los datos básicos de tus perros y gatos: edad, peso, vacunas y notas relevantes. Toda la información lista para compartirla en su próxima consulta.
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--green)]">
                  <span>Gestionar mascotas</span>
                  <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                </div>
              </Link>

              {/* Card 3 */}
              <Link
                href="/asistente"
                className="vet-card vet-card-action group flex flex-col justify-between p-5 sm:p-7 border-slate-200/80 sm:col-span-2 lg:col-span-1"
              >
                <div className="space-y-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-lg text-[var(--green)] transition group-hover:scale-105">
                    <svg className="h-6 w-6 text-[var(--green)]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--ink)]">Orientación inicial responsable</h3>
                  <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                    Resuelve dudas iniciales sobre comportamientos, alimentación y signos de alarma. El asistente nunca receta ni inventa diagnósticos: te guía con prudencia hacia un profesional.
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--green)]">
                  <span>Consultar asistente</span>
                  <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                </div>
              </Link>
            </div>
          </section>

          {/* ==================== CÓMO FUNCIONA ==================== */}
          <section
            id="como-funciona"
            className="overflow-hidden rounded-2xl sm:rounded-[2rem] bg-[var(--green-dark)] p-6 sm:p-10 lg:p-14 text-white shadow-xl"
          >
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div className="space-y-3.5">
                <span className="inline-block rounded-full bg-emerald-800/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Paso a paso
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                  Del primer síntoma a la atención que tu mascota necesita
                </h2>
                <p className="text-emerald-100/80 text-xs sm:text-sm lg:text-base leading-relaxed">
                  Diseñamos un camino sencillo y transparente para que nunca te sientas a la deriva cuando tu compañero requiera cuidados.
                </p>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-3">
                {[
                  {
                    step: "01",
                    title: "Busca o consulta",
                    desc: "Filtra veterinarias por tu localidad o describe señales de alerta en el asistente orientativo.",
                  },
                  {
                    step: "02",
                    title: "Revisa credenciales",
                    desc: "Compara clínicas aprobadas con personería legal, especialidades y datos de contacto directo.",
                  },
                  {
                    step: "03",
                    title: "Acude informado",
                    desc: "Lleva la ficha de tu mascota organizada y recibe atención formal de médicos acreditados.",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 backdrop-blur-sm"
                  >
                    <div>
                      <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{item.step}</span>
                      <h3 className="mt-2 text-base font-bold text-white">{item.title}</h3>
                      <p className="mt-1.5 text-xs text-emerald-100/75 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ==================== DIRECTORIO DESTACADO ==================== */}
          <section aria-labelledby="directorio-title" className="space-y-6 sm:space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="vet-eyebrow">Red de atención regional</p>
                <h2 id="directorio-title" className="vet-section-title mt-1">
                  Encuentra veterinarias cerca de ti
                </h2>
                <p className="vet-muted mt-1.5 text-xs sm:text-base">
                  Cobertura verificada en las tres ciudades piloto de la Región Ica.
                </p>
              </div>
              <Link
                href="/veterinarias"
                className="vet-link text-xs sm:text-sm font-bold flex items-center gap-1.5"
              >
                <span>Explorar todo el directorio</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            {/* City Cards */}
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/veterinarias?city=${city.slug}`}
                  className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={city.image}
                      alt={`Veterinarias en ${city.name}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg sm:text-xl font-bold text-[var(--ink)]">{city.name}</h3>
                      <span className="text-xs font-semibold text-[var(--green)] group-hover:underline">Ver clínicas →</span>
                    </div>
                    <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                      {city.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Specialty Tags */}
            <div className="rounded-xl sm:rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Búsquedas frecuentes por servicio:
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5 sm:gap-2">
                {specialties.map((spec) => (
                  <Link
                    key={spec}
                    href={`/veterinarias?service=${encodeURIComponent(spec)}`}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-[var(--ink-soft)] transition hover:border-[var(--green)] hover:bg-emerald-50 hover:text-[var(--green-dark)]"
                  >
                    {spec}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* ==================== ASISTENTE IA (SHOWCASE) ==================== */}
          <section className="rounded-2xl sm:rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white to-[#f4f9f6] p-5 sm:p-10 lg:p-12 shadow-xs">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
              <div className="space-y-4 sm:space-y-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-[var(--green-dark)]">
                  <span>✦</span>
                  <span>Inteligencia orientativa segura</span>
                </span>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--ink)] leading-tight">
                  Orientación preventiva cuando tienes dudas urgentes
                </h2>

                <p className="text-xs sm:text-base text-[var(--ink-soft)] leading-relaxed">
                  ¿Tu mascota no quiere comer, tose o la notas apagada? El asistente VetIA te ayuda a evaluar los síntomas iniciales y a reconocer cuándo es crucial acudir a un centro médico veterinario.
                </p>

                <div className="space-y-2 pt-1 text-xs sm:text-sm text-[var(--ink-soft)]">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-[var(--green)]">✓</span>
                    <span>Reconoce signos de alarma que requieren atención inmediata.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-[var(--green)]">✓</span>
                    <span>Sin recetas ni dosis de fármacos: protegemos la vida de tu mascota.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-[var(--green)]">✓</span>
                    <span>Te conecta de inmediato con veterinarias activas en tu ciudad.</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/asistente"
                    className="vet-button vet-button-primary !w-full sm:!w-auto px-6 py-2.5 text-sm sm:text-base shadow-md"
                  >
                    <span>Consultar al asistente</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>

              {/* Chat Simulation Card */}
              <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-[var(--green)]">
                      ✦
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[var(--ink)]">Asistente VetIA</p>
                      <p className="text-[10px] text-emerald-700 font-semibold">Orientación preventiva</p>
                    </div>
                  </div>
                  <span className="text-[10px] rounded bg-slate-100 px-2 py-0.5 text-slate-500 font-medium">Demo</span>
                </div>

                <div className="space-y-3 py-3 text-xs">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-[88%] rounded-xl rounded-tr-xs bg-[var(--green)] p-2.5 text-white">
                      Mi perrita de 3 años tiene tos seca desde anoche. ¿Qué debería hacer?
                    </div>
                  </div>

                  {/* Assistant Message */}
                  <div className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-[var(--green)]">
                      ✦
                    </span>
                    <div className="max-w-[92%] space-y-1.5 rounded-xl rounded-tl-xs border border-slate-100 bg-slate-50 p-3 text-[var(--ink)]">
                      <p>
                        La tos seca repentina suele deberse a irritación, un cuerpo extraño o traqueobronquitis.
                      </p>
                      <p className="font-semibold text-emerald-900">
                        Observa estas señales de alarma:
                      </p>
                      <ul className="list-disc pl-3.5 space-y-0.5 text-slate-600">
                        <li>Dificultad evidente para respirar o encías pálidas.</li>
                        <li>Tos persistente por más de 24 horas.</li>
                      </ul>
                      <div className="mt-1.5 rounded-md bg-emerald-50 p-1.5 text-[10px] font-semibold text-emerald-800">
                        📍 Te sugerimos evaluación física con un médico veterinario en Chincha o Ica.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2.5 text-center">
                  <Link href="/asistente" className="text-xs font-bold text-[var(--green)] hover:underline">
                    Escribir consulta en vivo →
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== PARA VETERINARIAS (B2B) ==================== */}
          <section className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-10 lg:p-12 shadow-xs">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="space-y-4 sm:space-y-5">
                <span className="vet-kicker">Para profesionales veterinarios</span>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--ink)] leading-tight">
                  Haz que tu clínica sea visible, formal y fácil de gestionar
                </h2>

                <p className="text-xs sm:text-base text-[var(--muted)] leading-relaxed">
                  Únete a la primera red veterinaria verificada de la región. Acredita tu RUC y colegiatura CMVP para generar confianza inmediata en miles de familias con mascotas.
                </p>

                <div className="grid gap-2.5 sm:grid-cols-2 pt-1 text-xs">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="font-bold text-[var(--ink)]">Acreditación formal</p>
                    <p className="text-[var(--muted)] mt-0.5">Distingue tu establecimiento con verificación de SUNAT y CMVP.</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="font-bold text-[var(--ink)]">Panel privado de gestión</p>
                    <p className="text-[var(--muted)] mt-0.5">Organiza solicitudes de cita, fichas de pacientes y clientes.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <Link
                    href="/account/clinic-applications"
                    className="vet-button vet-button-primary !w-full sm:!w-auto text-xs sm:text-sm px-5 py-2.5"
                  >
                    Registrar mi veterinaria
                  </Link>
                  <Link
                    href="/clinic"
                    className="vet-button vet-button-secondary !w-full sm:!w-auto text-xs sm:text-sm px-5 py-2.5"
                  >
                    Acceder al panel de clínica
                  </Link>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs aspect-[16/10] sm:aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80"
                  alt="Instalaciones de consultorio veterinario profesional"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </section>

          {/* ==================== PREGUNTAS FRECUENTES (FAQ) ==================== */}
          <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
            <div className="text-center space-y-1.5">
              <p className="vet-eyebrow">Preguntas frecuentes</p>
              <h2 id="faq-title" className="vet-section-title">
                Claridad y transparencia ante todo
              </h2>
              <p className="vet-muted text-xs sm:text-sm">
                Respuestas directas sobre el funcionamiento y compromiso de VetIA.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {questions.map(([question, answer]) => (
                <details
                  key={question}
                  className="group rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition hover:border-slate-300 open:bg-[#fbfdfc]"
                >
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-[var(--ink)] text-xs sm:text-base">
                    <span>{question}</span>
                    <span className="ml-2 text-base sm:text-lg text-[var(--green)] font-mono transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="vet-muted mt-2.5 text-xs sm:text-sm leading-relaxed border-t border-slate-100 pt-2.5">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* ==================== CTA FINAL ==================== */}
          <section className="rounded-2xl sm:rounded-[2rem] bg-gradient-to-br from-[#0c4a3b] to-[#12634d] p-6 sm:p-12 text-center text-white shadow-xl">
            <div className="mx-auto max-w-2xl space-y-4 sm:space-y-5">
              <span className="text-2xl sm:text-3xl">🐾</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
                Dale a tu mascota la atención confiable que se merece
              </h2>
              <p className="text-emerald-100/85 text-xs sm:text-base leading-relaxed">
                Empieza explorando las clínicas verificadas de tu ciudad o crea tu cuenta gratuita para mantener sus datos organizados.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-2.5 pt-2">
                <Link
                  href="/veterinarias"
                  className="rounded-xl bg-white px-6 py-3 text-xs sm:text-sm font-bold text-[var(--green-dark)] shadow-md transition hover:bg-emerald-50 active:scale-95"
                >
                  Explorar veterinarias
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-white/20 active:scale-95"
                >
                  Crear cuenta gratuita
                </Link>
              </div>
            </div>
          </section>

        </div>
      </main>

      <SiteFooter />
    </>
  );
}
