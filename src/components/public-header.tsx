"use client";

import { useState } from "react";
import Link from "next/link";
import { Brand } from "./vetia-ui";

export function PublicHeader({ current }: { current?: "directory" | "assistant" | "account" | "agro" }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="vet-header">
      <div className="vet-shell flex h-16 items-center justify-between gap-4">
        <Brand />

        {/* Desktop Navigation (>= 768px) */}
        <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-1.5">
          <Link
            href="/veterinarias"
            aria-current={current === "directory" ? "page" : undefined}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
              current === "directory"
                ? "bg-[var(--green)] !text-white shadow-sm"
                : "text-[var(--ink-soft)] hover:bg-emerald-50 hover:text-[var(--green)]"
            }`}
          >
            Directorio
          </Link>
          <Link
            href="/asistente"
            aria-current={current === "assistant" ? "page" : undefined}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
              current === "assistant"
                ? "bg-[var(--green)] !text-white shadow-sm"
                : "text-[var(--ink-soft)] hover:bg-emerald-50 hover:text-[var(--green)]"
            }`}
          >
            Asistente IA
          </Link>
          <Link
            href="/account/agro"
            aria-current={current === "agro" ? "page" : undefined}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1 ${
              current === "agro"
                ? "bg-[var(--green)] !text-white shadow-sm"
                : "text-[var(--ink-soft)] hover:bg-emerald-50 hover:text-[var(--green)]"
            }`}
          >
            <span>🌾</span>
            <span>VetIA Agro</span>
          </Link>
          <Link
            href="/account/clinic-applications"
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-[var(--ink-soft)] hover:bg-emerald-50 hover:text-[var(--green)] transition"
          >
            Para Veterinarias
          </Link>
          <Link
            href="/auth/login"
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-[var(--ink-soft)] hover:bg-emerald-50 hover:text-[var(--green)] transition ml-2"
          >
            Ingresar
          </Link>
          <Link
            href="/account"
            aria-current={current === "account" ? "page" : undefined}
            className="vet-button vet-button-primary !min-h-[38px] !py-1.5 !px-4 !text-xs font-bold !text-white rounded-lg shadow-sm ml-1"
          >
            Mi cuenta
          </Link>
        </nav>

        {/* Mobile Actions (< 768px): Clear Button + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/account"
            className="vet-button vet-button-primary !min-h-[34px] !py-1 !px-3 !text-xs !text-white font-bold rounded-lg shadow-sm"
          >
            Mi cuenta
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú de navegación"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[var(--ink)] shadow-sm hover:bg-slate-50 active:scale-95 transition"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200/90 bg-white/98 backdrop-blur-xl px-4 py-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1.5">
            <Link
              href="/veterinarias"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                current === "directory" ? "bg-[var(--green)] !text-white" : "text-[var(--ink)] hover:bg-emerald-50"
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs">🏥</span>
              <span>Directorio de veterinarias</span>
            </Link>
            <Link
              href="/asistente"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                current === "assistant" ? "bg-[var(--green)] !text-white" : "text-[var(--ink)] hover:bg-emerald-50"
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-800">✦</span>
              <span>Asistente IA Orientativo</span>
            </Link>
            <Link
              href="/account/agro"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                current === "agro" ? "bg-[var(--green)] !text-white" : "text-[var(--ink)] hover:bg-emerald-50"
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs">🌾</span>
              <span>VetIA Agro (Animales de producción)</span>
            </Link>
            <Link
              href="/account/pets"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[var(--ink)] hover:bg-emerald-50 transition"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs">🐾</span>
              <span>Fichas de mis mascotas</span>
            </Link>
            <Link
              href="/account/clinic-applications"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[var(--ink)] hover:bg-emerald-50 transition"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs">🏢</span>
              <span>Para Veterinarias (Acreditación)</span>
            </Link>

            <div className="my-2 border-t border-slate-100" />

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-xl border border-slate-200 py-2.5 text-center text-xs font-bold text-[var(--ink-soft)] hover:bg-slate-50 transition"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-xl bg-[var(--green)] py-2.5 text-center text-xs font-bold !text-white shadow-sm hover:bg-[var(--green-dark)] transition"
              >
                Crear cuenta
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
