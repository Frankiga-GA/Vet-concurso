"use client";

import { useState } from "react";
import Link from "next/link";
import { registerAction, registerWithGoogleFormAction } from "@/app/auth/actions";
import { AuthMessage } from "./auth-form";

export function RegisterFlow({
  initialError,
  initialType,
}: {
  initialError?: string;
  initialType?: "mascotas" | "agro";
}) {
  const [selectedType, setSelectedType] = useState<"mascotas" | "agro" | null>(
    initialType || null
  );

  return (
    <div className="vet-auth-card space-y-6">
      {/* ======================================================== */}
      {/* PASO 1: SELECCIÓN EXCLUSIVA DE LAS DOS MODALIDADES       */}
      {/* ======================================================== */}
      {!selectedType ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <span className="vet-kicker">Paso 1 de 2</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] leading-tight mt-1">
              ¿Qué tipo de cuenta deseas crear?
            </h1>
            <p className="vet-muted text-xs sm:text-sm max-w-md mx-auto">
              Elige el enfoque principal de tu cuenta. Podrás alternar o cambiar tu modalidad en cualquier momento desde tu perfil.
            </p>
          </div>

          <AuthMessage code={initialError} />

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            {/* Tarjeta 1: Mascotas */}
            <button
              type="button"
              onClick={() => setSelectedType("mascotas")}
              className="group text-left rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition hover:border-[var(--green)] hover:shadow-md hover:-translate-y-1 focus-visible:border-[var(--green)]"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl group-hover:scale-105 transition-transform">
                  🐾
                </span>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-[var(--green-dark)]">
                  Animales de compañía
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[var(--ink)]">
                Mascotas
              </h2>
              <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                Para familias y tutores de perros, gatos y animales domésticos.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Fichas médicas de perros y gatos</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Asistente IA para dudas y triaje</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Directorio de clínicas veterinarias</span>
                </li>
              </ul>
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-[var(--green)] group-hover:underline">
                  Elegir Mascotas
                </span>
                <span className="text-sm font-bold text-[var(--green)] transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </button>

            {/* Tarjeta 2: Agropecuario */}
            <button
              type="button"
              onClick={() => setSelectedType("agro")}
              className="group text-left rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition hover:border-emerald-600 hover:shadow-md hover:-translate-y-1 focus-visible:border-emerald-600"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-2xl group-hover:scale-105 transition-transform">
                  🌾
                </span>
                <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[10px] font-bold text-teal-800">
                  Animales de producción
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[var(--ink)]">
                Agropecuario
              </h2>
              <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                Para productores, ganaderos y fundos con bovinos, cerdos, ovinos, caprinos o aves.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Registro de explotaciones y predios</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Control de lotes sanitarios y censo</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Asistente IA con alertas zoosanitarias SENASA</span>
                </li>
              </ul>
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-[var(--green)] group-hover:underline">
                  Elegir Agropecuario
                </span>
                <span className="text-sm font-bold text-[var(--green)] transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </button>
          </div>

          <div className="text-center pt-2">
            <p className="vet-muted text-xs">
              ¿Ya tienes una cuenta creada?{" "}
              <Link className="vet-link font-bold" href="/auth/login">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* PASO 2: GOOGLE OAUTH + FORMULARIO CON CORREO             */
        /* ======================================================== */
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Active Modality Banner with Change Option */}
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200/80 px-3.5 py-2">
            <div className="flex items-center gap-2">
              <span className="text-base">
                {selectedType === "agro" ? "🌾" : "🐾"}
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--green-dark)] leading-tight">
                  Modalidad seleccionada
                </p>
                <p className="text-xs font-extrabold text-[var(--ink)]">
                  {selectedType === "agro" ? "VetIA Agropecuario" : "Mascotas Familiares"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedType(null)}
              className="text-xs font-bold text-[var(--green)] hover:underline"
            >
              ← Cambiar
            </button>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-[var(--ink)]">
              {selectedType === "agro"
                ? "Crea tu cuenta en VetIA Agro"
                : "Crea tu cuenta de Mascotas"}
            </h1>
            <p className="vet-muted text-xs sm:text-sm">
              {selectedType === "agro"
                ? "Registra tu acceso para administrar predios, lotes pecuarios y consultas sanitarias."
                : "Registra tu acceso para guardar las fichas y cuidar la salud de tus mascotas."}
            </p>
          </div>

          <AuthMessage code={initialError} />

          {/* Continuar con Google */}
          <div>
            <form action={registerWithGoogleFormAction}>
              <input type="hidden" name="accountType" value={selectedType} />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </button>
            </form>
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
              O con correo electrónico
            </span>
          </div>

          {/* Formulario Tradicional */}
          <form action={registerAction} className="space-y-4">
            <input type="hidden" name="accountType" value={selectedType} />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold text-[var(--ink)]">
                Nombres
                <input
                  name="firstName"
                  autoComplete="given-name"
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="Tu nombre"
                  className="vet-field text-sm mt-1"
                />
              </label>
              <label className="block text-xs font-bold text-[var(--ink)]">
                Apellidos
                <input
                  name="lastName"
                  autoComplete="family-name"
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Tus apellidos"
                  className="vet-field text-sm mt-1"
                />
              </label>
            </div>

            <label className="block text-xs font-bold text-[var(--ink)]">
              Correo electrónico
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="ejemplo@correo.com"
                className="vet-field text-sm mt-1"
              />
            </label>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)]">
                Contraseña
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={10}
                  maxLength={128}
                  placeholder="Mínimo 10 caracteres"
                  className="vet-field text-sm mt-1"
                  aria-describedby="register-password-help"
                />
              </label>
              <p id="register-password-help" className="vet-muted mt-1 text-[11px]">
                Usa al menos 10 caracteres combinando letras y números.
              </p>
            </div>

            <button
              type="submit"
              className="vet-button vet-button-primary !w-full text-xs sm:text-sm py-3 font-bold shadow-sm"
            >
              {selectedType === "agro"
                ? "Registrarme en VetIA Agro"
                : "Registrarme en VetIA Mascotas"}
            </button>

            <p className="vet-muted text-xs text-center pt-1">
              Te enviaremos un correo para confirmar tu dirección antes de iniciar sesión.
            </p>

            <div className="border-t border-slate-100 pt-3 text-center">
              <p className="vet-muted text-xs">
                ¿Ya tienes cuenta?{" "}
                <Link className="vet-link font-bold" href="/auth/login">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
