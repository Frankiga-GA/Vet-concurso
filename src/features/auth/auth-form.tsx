import type { ReactNode } from "react";
import { Brand, Notice, PageIntro } from "@/components/vetia-ui";
import { SubmitButton } from "@/components/submit-button";

type AuthFormProps = {
  title: string;
  description: string;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  children: ReactNode;
  headerSlot?: ReactNode;
};

export function AuthForm({ title, description, action, submitLabel, children, headerSlot }: AuthFormProps) {
  return <main className="vet-auth">
    <div className="vet-auth-shell">
      <section className="vet-auth-grid">
        <aside className="vet-auth-aside">
          <Brand light />
          <div>
            <p className="text-sm font-bold uppercase tracking-[.14em] text-emerald-200">Plataforma IAVET Agro</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight">Inteligencia Artificial y Visión Móvil para Galpones.</h2>
            <ul className="mt-6 grid gap-3 text-sm text-emerald-50/85">
              <li>✓ Censo y conteo de aves con la cámara del celular</li>
              <li>✓ Detección temprana de patologías y estrés térmico</li>
              <li>✓ Control de lotes pecuarios y parámetros SENASA</li>
              <li>✓ Directorio B2B de proveedores verificado en Ica</li>
            </ul>
          </div>
          <p className="text-xs text-emerald-100/75">IAVET Agro · Tecnología para los productores del Perú</p>
        </aside>
        <div className="vet-auth-card space-y-6">
          <div className="md:hidden"><Brand /></div>
          <PageIntro title={title}><p>{description}</p></PageIntro>
          {headerSlot}
          <form action={action} className="space-y-4">
            {children}
            <SubmitButton label={submitLabel} />
          </form>
        </div>
      </section>
    </div>
  </main>;
}

export function GoogleAuthButton({ action, label = "Continuar con Google" }: { action: () => Promise<void>; label?: string }) {
  return (
    <div className="space-y-4">
      <form action={action}>
        <button
          type="submit"
          className="vet-button vet-button-secondary flex w-full items-center justify-center gap-3 border border-slate-200 bg-white py-2.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
          <span>{label}</span>
        </button>
      </form>
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <span className="relative bg-white px-3 text-xs uppercase tracking-wider text-slate-500">
          o continúa con correo
        </span>
      </div>
    </div>
  );
}

export function AuthMessage({ code }: { code?: string }) {
  if (!code) return null;
  const messages: Record<string, string> = {
    invalid: "Revisa los datos ingresados y los requisitos de contraseña.",
    unconfigured: "La autenticación aún no está configurada en este entorno.",
    signup: "No se pudo completar el registro. Verifica la configuración e inténtalo de nuevo.",
    credentials: "No se pudo iniciar sesión. Revisa tus credenciales y confirma tu correo.",
    unavailable: "No se pudo consultar el acceso de esta cuenta. Inténtalo nuevamente.",
    "session-required": "Tu sesión no está disponible o ha caducado. Inicia sesión para continuar.",
    expired: "El enlace expiró o ya fue utilizado. Solicita uno nuevo.",
    callback: "No se pudo validar el enlace. Solicita uno nuevo.",
    oauth: "No se pudo completar la autenticación con Google. Inténtalo de nuevo o usa correo y contraseña.",
  };
  return <Notice tone="danger" role="alert">{messages[code] ?? "No se pudo completar la acción."}</Notice>;
}
