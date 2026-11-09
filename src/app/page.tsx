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
  "Cirugías y esterilización",
  "Emergencias 24h",
  "Profilaxis y odontología",
  "Dermatología",
  "Ecografía y rayos X",
];

const urgentSigns = [
  {
    icon: "🫁",
    title: "Dificultad respiratoria severa",
    desc: "Respiración acelerada con boca abierta, jadeo continuo en gatos o tos ahogante con encías azuladas.",
    tag: "Atención urgente",
  },
  {
    icon: "🧪",
    title: "Ingestión de tóxicos o cuerpos extraños",
    desc: "Venenos, plantas tóxicas, medicamentos de humanos, chocolate concentrado u objetos no digeribles.",
    tag: "Riesgo vital",
  },
  {
    icon: "🩸",
    title: "Hemorragias o traumatismos graves",
    desc: "Sangrados continuos, atropellos, caídas de altura o sospecha de fracturas con imposibilidad de caminar.",
    tag: "Derivación inmediata",
  },
  {
    icon: "⚠️",
    title: "Abdomen distendido y dolor intenso",
    desc: "Hinchazón abdominal repentina, quejidos de dolor agudo, arqueo de lomo o intentos infructuosos de vómito.",
    tag: "Alerta quirúrgica",
  },
  {
    icon: "⚡",
    title: "Convulsiones o desvanecimiento",
    desc: "Temblores involuntarios repetidos, pérdida del equilibrio, rigidez muscular o desmayo repentino.",
    tag: "Prioridad médica",
  },
  {
    icon: "💧",
    title: "Incapacidad para orinar (Anuria)",
    desc: "Esfuerzos constantes sin micción, dolor vocalizado en la bandeja sanitaria (frecuente y crítico en gatos).",
    tag: "Emergencia 24h",
  },
];

const questions = [
  [
    "¿Qué es y cómo funciona el Asistente IA de VetIA?",
    "Es una herramienta conversacional impulsada por inteligencia artificial especializada en bienestar y salud veterinaria. Te permite describir lo que le ocurre a tu perro o gato, responde tus dudas iniciales, te ayuda a identificar posibles signos de alarma y te orienta sobre los pasos a seguir con calma y serenidad.",
  ],
  [
    "¿La IA de VetIA reemplaza la atención de un médico veterinario?",
    "No, en ningún caso. VetIA orienta y clasifica inquietudes, pero jamás diagnostica enfermedades ni sustituye el examen físico presencial. El diagnóstico definitivo y el tratamiento corresponden de forma exclusiva a un médico veterinario colegiado (CMVP).",
  ],
  [
    "¿El asistente de inteligencia artificial puede recetar medicamentos o dosis?",
    "No. Por principios éticos y estricta seguridad animal, VetIA tiene bloqueada cualquier recomendación de medicamentos, fármacos o dosificaciones. Automedicar a una mascota puede provocar intoxicaciones mortales.",
  ],
  [
    "¿Qué ocurre si la IA detecta que mi mascota está en peligro?",
    "Si la conversación contiene señales de alarma (dificultad respiratoria, convulsiones, vómito continuo o decaimiento severo), el asistente prioriza de inmediato una advertencia de urgencia y te muestra veterinarias reales y activas en tu ciudad con sus contactos directos.",
  ],
  [
    "¿Puedo usar el directorio de veterinarias sin costo?",
    "Sí. El directorio de veterinarias en Chincha, Pisco e Ica es de libre acceso. Puedes buscar clínicas acreditadas con RUC y colegiatura CMVP, consultar sus servicios y comunicarte directamente con ellas.",
  ],
  [
    "¿Cómo puede una clínica veterinaria incorporarse a VetIA?",
    "Cualquier clínica formal con RUC y médico veterinario colegiado en la Región Ica puede solicitar su incorporación declarando ser titular o representante autorizado y aportando documentos de sustento (Ficha RUC, DNI, Vigencia de poder y Colegiatura CMVP). La solicitud no concede acceso operativo ni publica la clínica: un superadministrador verifica los documentos antes de su aprobación, activación y publicación.",
  ],
];

export default function HomePage() {
  return (
    <>
      <PublicHeader />

      <main className="vet-main overflow-x-hidden">
        <div className="vet-shell vet-page space-y-16 sm:space-y-24 md:space-y-28">

          {/* ======================================================== */}
          {/* 1. HERO SECTION: LA INTELIGENCIA ARTIFICIAL EN PRIMER PLANO */}
          {/* ======================================================== */}
          <section className="relative overflow-hidden rounded-2xl sm:rounded-[2.25rem] border border-[rgb(18_99_77/18%)] bg-gradient-to-br from-[#e4f3eb] via-[#f7fbf8] to-[#f4ede0] p-5 sm:p-10 lg:p-14 shadow-[var(--shadow-md)]">
            <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="space-y-5 sm:space-y-6">
                
                {/* AI Badge Pill */}
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-800/15 bg-white/95 px-3.5 py-1.5 text-xs font-bold text-[var(--green-dark)] shadow-xs backdrop-blur-sm">
                  <span className="vet-badge-dot" />
                  <span className="font-semibold text-emerald-800">✦ Asistente Veterinario Inteligente</span>
                  <span className="hidden sm:inline text-slate-300">|</span>
                  <span className="hidden sm:inline text-[var(--muted)] font-normal">Orientación en tiempo real</span>
                </div>

                {/* Hero Title */}
                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-5xl lg:text-[3.65rem] leading-[1.08]">
                  La salud de tu mascota empieza con una conversación.
                </h1>

                {/* Hero Subtitle */}
                <p className="max-w-xl text-base sm:text-lg text-[var(--ink-soft)] leading-relaxed">
                  Conversa con VetIA, recibe orientación inicial sobre tu mascota y encuentra atención veterinaria cuando la necesites.
                </p>

                {/* Primary & Secondary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <Link
                    href="/asistente"
                    className="vet-button vet-button-primary !w-full sm:!w-auto text-base px-6 py-3.5 shadow-lg flex items-center justify-center gap-2 group"
                  >
                    <span className="text-emerald-200 group-hover:rotate-12 transition-transform">✦</span>
                    <span className="font-bold">Hablar con VetIA IA</span>
                    <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                  </Link>

                  <Link
                    href="/veterinarias"
                    className="vet-button vet-button-secondary !w-full sm:!w-auto text-base px-5 py-3.5 flex items-center justify-center gap-2"
                  >
                    <span>Buscar veterinarias</span>
                    <span aria-hidden="true">🏥</span>
                  </Link>
                </div>

                {/* Safety Guarantee Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs font-semibold text-[var(--muted)]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span>Orientación ética y triaje inicial</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span>Sin recetas ni medicamentos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span>Derivación a clínicas reales</span>
                  </div>
                </div>
              </div>

              {/* Hero Visual: Demo interactiva elegante del chat + compañero */}
              <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
                {/* Background soft glow */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-xl opacity-70" />

                {/* Simulated AI Chat Card */}
                <div className="relative rounded-2xl border border-emerald-900/15 bg-white/95 p-4 sm:p-5 shadow-xl backdrop-blur-md">
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--green)] text-white shadow-sm font-bold text-sm">
                        ✦
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-extrabold text-[var(--ink)] leading-none">VetIA Asistente</p>
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                        </div>
                        <p className="text-[11px] text-[var(--muted)] mt-0.5">Orientación preventiva y triaje</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[10px] font-bold text-[var(--green-dark)]">
                      Demostración
                    </span>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap gap-1.5 py-3 border-b border-slate-100/80">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700 font-medium">
                      ¿Qué hacer si mi perro no come?
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700 font-medium">
                      ¿Cómo saber si es una emergencia?
                    </span>
                  </div>

                  {/* Dialogue Simulation (Clear educational demo, not fake personal claims) */}
                  <div className="space-y-3 py-3 text-xs sm:text-[13px] leading-relaxed">
                    {/* User Question */}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[var(--green)] p-3 text-white shadow-xs">
                        <p className="text-[11px] font-bold text-emerald-200 mb-0.5">Tú preguntas:</p>
                        <p>«Mi perro de 2 años vomitó en la mañana y lo veo decaído, ¿qué precauciones debo tomar?»</p>
                      </div>
                    </div>

                    {/* AI Response */}
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-[var(--green)] mt-0.5">
                        ✦
                      </div>
                      <div className="max-w-[90%] space-y-2 rounded-2xl rounded-tl-xs border border-emerald-950/10 bg-[#f8fbf9] p-3 text-[var(--ink)] shadow-xs">
                        <p className="font-semibold text-emerald-950">
                          Te ayudo a evaluar el estado de tu mascota:
                        </p>
                        <p className="text-slate-700 text-[12px]">
                          Un episodio aislado puede deberse a indiscreción alimentaria, pero el decaimiento asociado exige vigilar de cerca su evolución.
                        </p>
                        <div className="rounded-lg bg-emerald-100/60 p-2 text-[11px] text-emerald-900 border border-emerald-200/50">
                          <p className="font-bold">⚠️ Observa signos de alarma:</p>
                          <p className="text-[11px] text-emerald-800">
                            Vómitos continuos, diarrea con sangre, encías pálidas o dolor al tocar su vientre.
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1 text-[var(--muted)]">
                          <span>Derivación: Consulta médica recomendada</span>
                          <span className="font-bold text-[var(--green)]">Directorio disponible →</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Composer Link */}
                  <div className="pt-2">
                    <Link
                      href="/asistente"
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500 hover:border-emerald-600 hover:bg-emerald-50/50 hover:text-emerald-900 transition group"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-slate-400 group-hover:text-emerald-600">✍️</span>
                        <span>Escribe tu consulta sobre tu mascota...</span>
                      </span>
                      <span className="rounded-lg bg-[var(--green)] px-3 py-1 font-bold text-white group-hover:bg-[var(--green-dark)] transition">
                        Comenzar
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 2. ASISTENTE IA: PROFUNDIZACIÓN, CAPACIDADES Y SEGURIDAD */}
          {/* ======================================================== */}
          <section id="asistente-ia" aria-labelledby="asistente-ia-title" className="space-y-8 sm:space-y-10">
            <div className="max-w-3xl">
              <span className="vet-eyebrow">✦ Inteligencia Artificial Responsable</span>
              <h2 id="asistente-ia-title" className="vet-section-title mt-1.5">
                Diseñado para orientar, proteger y guiarte con serenidad
              </h2>
              <p className="vet-muted mt-2 text-sm sm:text-base leading-relaxed">
                El asistente de VetIA utiliza modelos de lenguaje avanzados ajustados estrictamente a lineamientos éticos de salud animal. No sustituye al veterinario: te brinda claridad para tomar mejores decisiones a tiempo.
              </p>
            </div>

            {/* 3 Core Pillars Grid */}
            <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Card 1 */}
              <div className="vet-card flex flex-col justify-between p-6 border-slate-200/90 shadow-xs">
                <div className="space-y-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl text-[var(--green)] font-bold">
                    <span>✦</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--ink)]">Triaje y preguntas clave</h3>
                  <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                    Te ayuda a identificar los detalles que importan: desde cuándo iniciaron los síntomas, qué señales de incomodidad presenta y cómo describir el cuadro al médico.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 text-xs font-semibold text-[var(--green-dark)]">
                  Estructura tu consulta con orden
                </div>
              </div>

              {/* Card 2 */}
              <div className="vet-card flex flex-col justify-between p-6 border-slate-200/90 shadow-xs">
                <div className="space-y-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-xl text-amber-700 font-bold">
                    <span>⚠️</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--ink)]">Detección de señales críticas</h3>
                  <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                    Si el asistente detecta términos asociados a asfixia, sangrado, shock o intoxicación, suspende la charla y te pide acudir a urgencias de inmediato sin perder tiempo.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 text-xs font-semibold text-amber-800">
                  Prioridad absoluta a la vida animal
                </div>
              </div>

              {/* Card 3 */}
              <div className="vet-card flex flex-col justify-between p-6 border-slate-200/90 shadow-xs sm:col-span-2 lg:col-span-1">
                <div className="space-y-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl text-[var(--green)] font-bold">
                    <span>🏥</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--ink)]">Derivación a clínicas reales</h3>
                  <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                    Conecta tus dudas con el directorio regional de Chincha, Pisco e Ica. Te sugiere centros formales con RUC y colegiatura CMVP para una auscultación presencial.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 text-xs font-semibold text-[var(--green-dark)]">
                  Del chat al consultorio veterinario
                </div>
              </div>
            </div>

            {/* Medical Transparency Callout Banner */}
            <div className="rounded-2xl border border-emerald-800/15 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white p-5 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--green)] text-white text-xs font-bold">
                      i
                    </span>
                    <h4 className="text-sm sm:text-base font-extrabold text-[var(--green-dark)]">
                      Compromiso ético: Orientación vs. Diagnóstico
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--ink-soft)] max-w-2xl leading-relaxed">
                    VetIA no emite recetas médicas, no sugiere dosificaciones ni sustituye el criterio de un médico veterinario colegiado. Toda medicación debe ser autorizada por un profesional habilitado.
                  </p>
                </div>

                <Link
                  href="/asistente"
                  className="vet-button vet-button-primary !w-full sm:!w-auto text-xs sm:text-sm px-5 py-2.5 shrink-0 shadow-sm"
                >
                  Probar el asistente IA
                </Link>
              </div>
            </div>

            {/* VetIA Agro Spotlight Banner */}
            <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-100/70 via-teal-50/80 to-white p-5 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--green)] text-white text-sm font-bold">
                      🌾
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-[var(--green-dark)]">
                      VetIA Agro: Ganadería y Animales de Producción
                    </h3>
                    <span className="rounded-full bg-emerald-200/70 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5">
                      Nuevo
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--ink-soft)] max-w-2xl leading-relaxed">
                    Módulo especializado para predios, lotes y censo pecuario de bovinos, porcinos, ovinos, caprinos y aves. Con triaje de bioseguridad, alertas zoosanitarias SENASA y filtro de veterinarios para producción.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Link
                    href="/account/agro"
                    className="vet-button vet-button-primary !w-full sm:!w-auto text-xs sm:text-sm px-4 py-2.5 font-bold shadow-sm"
                  >
                    🌾 Panel VetIA Agro
                  </Link>
                  <Link
                    href="/asistente?mode=agro"
                    className="vet-button vet-button-secondary !w-full sm:!w-auto text-xs sm:text-sm px-4 py-2.5"
                  >
                    Triaje IA Agro
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 3. CÓMO FUNCIONA: DE LA PREGUNTA A LA ACCIÓN */}
          {/* ======================================================== */}
          <section
            id="como-funciona"
            className="overflow-hidden rounded-2xl sm:rounded-[2.25rem] bg-[var(--green-dark)] p-6 sm:p-10 lg:p-14 text-white shadow-xl"
          >
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div className="space-y-4">
                <span className="inline-block rounded-full bg-emerald-800/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Paso a paso
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                  Cómo acompaña VetIA a tu mascota
                </h2>
                <p className="text-emerald-100/85 text-xs sm:text-sm lg:text-base leading-relaxed">
                  Un flujo intuitivo que transforma la incertidumbre en orientación fundamentada y acceso directo a veterinarias colegiadas.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    step: "01",
                    title: "Conversa con la IA",
                    desc: "Describe lo que notas en tu mascota: inapetencia, tos, cambios de ánimo, dudas sobre vacunas o comportamiento.",
                  },
                  {
                    step: "02",
                    title: "Recibe triaje claro",
                    desc: "VetIA evalúa los síntomas, formula preguntas para acotar el cuadro y te señala los signos que requieren observación.",
                  },
                  {
                    step: "03",
                    title: "Encuentra atención",
                    desc: "Si el caso lo amerita o es urgente, consulta clínicas acreditadas con RUC y colegiatura CMVP en tu ciudad.",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex flex-col justify-between rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"
                  >
                    <div>
                      <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{item.step}</span>
                      <h3 className="mt-2 text-base font-bold text-white">{item.title}</h3>
                      <p className="mt-1.5 text-xs text-emerald-100/80 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 4. SEÑALES DE URGENCIA: CUÁNDO NO ESPERAR (EDUCACIONAL) */}
          {/* ======================================================== */}
          <section id="urgencias" aria-labelledby="urgencias-title" className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="max-w-2xl">
                <span className="vet-eyebrow text-rose-700">Guía de Seguridad Veterinaria</span>
                <h2 id="urgencias-title" className="vet-section-title mt-1.5 text-slate-900">
                  ¿Cuándo no esperar? Señales de urgencia veterinaria
                </h2>
                <p className="vet-muted mt-2 text-xs sm:text-sm leading-relaxed">
                  Si tu mascota presenta cualquiera de los siguientes cuadros, no dependas de una consulta virtual ni esperes mejoría espontánea: trasládala de inmediato a un centro veterinario.
                </p>
              </div>

              <Link
                href="/veterinarias?service=Emergencias%2024h"
                className="vet-button vet-button-danger !w-full sm:!w-auto text-xs sm:text-sm px-5 py-2.5 shrink-0 flex items-center justify-center gap-2"
              >
                <span>Ver veterinarias de urgencia</span>
                <span aria-hidden="true">🚨</span>
              </Link>
            </div>

            {/* Grid of Emergency Signs */}
            <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {urgentSigns.map((sign) => (
                <div
                  key={sign.title}
                  className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 sm:p-5 shadow-xs transition hover:border-rose-300"
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-2xl">{sign.icon}</span>
                    <span className="rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                      {sign.tag}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {sign.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {sign.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Emergency Protocol Box */}
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-6 text-xs sm:text-sm text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  <span>💡</span>
                  <span>Consejo vital para emergencias:</span>
                </p>
                <p className="text-amber-900 leading-relaxed text-xs sm:text-sm">
                  Llama por teléfono a la clínica veterinaria mientras te trasladas. De esta forma, el equipo médico puede tener listo el instrumental, oxígeno o suero antes de que llegues.
                </p>
              </div>

              <Link
                href="/asistente"
                className="vet-button vet-button-secondary !w-full sm:!w-auto text-xs sm:text-sm px-4 py-2 shrink-0 bg-white"
              >
                Consultar dudas en VetIA
              </Link>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 5. DIRECTORIO VETERINARIO: CLÍNICAS REALES EN TU CIUDAD */}
          {/* ======================================================== */}
          <section id="directorio" aria-labelledby="directorio-title" className="space-y-6 sm:space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="vet-eyebrow">Red de atención presencial</p>
                <h2 id="directorio-title" className="vet-section-title mt-1">
                  Encuentra veterinarias verificadas cerca de ti
                </h2>
                <p className="vet-muted mt-1 text-xs sm:text-sm">
                  Establecimientos con RUC activo y médicos colegiados en la Región Ica.
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
                Búsquedas frecuentes por servicio clínico:
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

          {/* ======================================================== */}
          {/* 6. PARA CLÍNICAS VETERINARIAS (PROFESIONALES) */}
          {/* ======================================================== */}
          <section className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-10 lg:p-12 shadow-xs">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="space-y-4 sm:space-y-5">
                <span className="vet-kicker">Para profesionales veterinarios</span>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--ink)] leading-tight">
                  Suma tu clínica a la red oficial de VetIA
                </h2>

                <p className="text-xs sm:text-base text-[var(--muted)] leading-relaxed">
                  Únete al directorio regional verificado. Acredita tu RUC y colegiatura CMVP para recibir derivaciones de pacientes, responder consultas y gestionar solicitudes de cita en un panel formal.
                </p>

                <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed">
                  <strong>Aviso de seguridad:</strong> El envío de la solicitud de incorporación no concede acceso operativo inmediato ni publica la clínica. Cada solicitud requiere aportar documentos de personería y colegiatura, siendo verificada rigurosamente por un superadministrador antes de su aprobación, activación y publicación.
                </p>

                <div className="grid gap-2.5 sm:grid-cols-2 pt-1 text-xs">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="font-bold text-[var(--ink)]">Acreditación formal</p>
                    <p className="text-[var(--muted)] mt-0.5">Validación de RUC en SUNAT y registro en el Colegio Médico Veterinario del Perú.</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="font-bold text-[var(--ink)]">Panel privado de clínica</p>
                    <p className="text-[var(--muted)] mt-0.5">Control de solicitudes de cita, clientes registrados e información pública tras ser activada.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <Link
                    href="/account/clinic-applications"
                    className="vet-button vet-button-primary !w-full sm:!w-auto text-xs sm:text-sm px-5 py-2.5"
                  >
                    Solicitar incorporación de mi clínica
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

          {/* ======================================================== */}
          {/* 7. PREGUNTAS FRECUENTES (FAQ) */}
          {/* ======================================================== */}
          <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
            <div className="text-center space-y-1.5">
              <p className="vet-eyebrow">Preguntas frecuentes</p>
              <h2 id="faq-title" className="vet-section-title">
                Claridad y transparencia ante todo
              </h2>
              <p className="vet-muted text-xs sm:text-sm">
                Todo lo que necesitas saber sobre el asistente IA y el directorio de VetIA.
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

          {/* ======================================================== */}
          {/* 8. CTA FINAL CONTEXTUAL */}
          {/* ======================================================== */}
          <section className="rounded-2xl sm:rounded-[2.25rem] bg-gradient-to-br from-[#0a4536] via-[#12634d] to-[#0d503f] p-6 sm:p-12 text-center text-white shadow-xl">
            <div className="mx-auto max-w-2xl space-y-4 sm:space-y-5">
              <span className="inline-block text-3xl">🐾</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
                Empieza hoy una conversación por el bienestar de tu mascota
              </h2>
              <p className="text-emerald-100/90 text-xs sm:text-base leading-relaxed">
                Resuelve dudas iniciales con el asistente de inteligencia artificial o encuentra atención veterinaria formal en Chincha, Pisco e Ica.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <Link
                  href="/asistente"
                  className="rounded-xl bg-white px-6 py-3.5 text-xs sm:text-sm font-bold text-[var(--green-dark)] shadow-md transition hover:bg-emerald-50 active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>✦</span>
                  <span>Hablar con VetIA IA</span>
                </Link>
                <Link
                  href="/veterinarias"
                  className="rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-xs sm:text-sm font-bold text-white transition hover:bg-white/20 active:scale-95"
                >
                  Buscar veterinarias
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
