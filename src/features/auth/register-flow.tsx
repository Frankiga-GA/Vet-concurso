"use client";

import Link from "next/link";
import { registerAction, registerWithGoogleFormAction } from "@/app/auth/actions";
import { AuthMessage } from "./auth-form";
import { Smartphone, Sparkles, Warehouse } from "lucide-react";

export function RegisterFlow({
  initialError,
}: {
  initialError?: string;
  initialType?: string;
}) {
  return (
    <div className="vet-auth-card space-y-6">
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Modality Tag */}
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200/80 px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 leading-tight">
                Plataforma B2B Pecuaria
              </p>
              <p className="text-xs font-black text-slate-900">
                IAVET Agro — Productores & Galpones
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
            CHINCHA • PISCO • ICA
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Crea tu cuenta de Productor
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm">
            Registra tu acceso a IAVET Agro para gestionar tus galpones, activar el
            escaneo de aves con la cámara de tu celular y sincronizar lotes pecuarios.
          </p>
        </div>

        <AuthMessage code={initialError} />

        {/* Continuar con Google */}
        <div>
          <form action={registerWithGoogleFormAction}>
            <input type="hidden" name="accountType" value="agro" />
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
          <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            O con correo electrónico
          </span>
        </div>

        {/* Formulario Tradicional */}
        <form action={registerAction} className="space-y-4">
          <input type="hidden" name="accountType" value="agro" />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-800">
              Nombres
              <input
                name="firstName"
                autoComplete="given-name"
                required
                minLength={2}
                maxLength={80}
                placeholder="Ej. Carlos"
                className="vet-field text-sm mt-1"
              />
            </label>
            <label className="block text-xs font-bold text-slate-800">
              Apellidos
              <input
                name="lastName"
                autoComplete="family-name"
                required
                minLength={2}
                maxLength={120}
                placeholder="Ej. Mendoza"
                className="vet-field text-sm mt-1"
              />
            </label>
          </div>

          <label className="block text-xs font-bold text-slate-800">
            Correo electrónico
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="productor@granjas.pe"
              className="vet-field text-sm mt-1"
            />
          </label>

          <div>
            <label className="block text-xs font-bold text-slate-800">
              Contraseña de Acceso
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
            <p id="register-password-help" className="text-slate-400 mt-1 text-[11px]">
              Usa al menos 10 caracteres combinando letras y números.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
          >
            Registrar mi Granja en IAVET Agro
          </button>

          <p className="text-slate-500 text-xs text-center pt-1">
            Te enviaremos un correo de confirmación antes de iniciar sesión.
          </p>

          <div className="border-t border-slate-100 pt-3 text-center">
            <p className="text-slate-500 text-xs">
              ¿Ya tienes cuenta de productor?{" "}
              <Link className="text-emerald-700 font-bold hover:underline" href="/auth/login">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
