import type { ReactNode } from "react";
import { Brand, Notice, PageIntro } from "@/components/vetia-ui";
import { SubmitButton } from "@/components/submit-button";

type AuthFormProps = {
  title: string;
  description: string;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  children: ReactNode;
};

export function AuthForm({ title, description, action, submitLabel, children }: AuthFormProps) {
  return <main className="vet-auth">
    <div className="vet-auth-shell">
      <section className="vet-auth-grid">
        <aside className="vet-auth-aside">
          <Brand light />
          <div>
            <p className="text-sm font-bold uppercase tracking-[.14em] text-emerald-200">Tu espacio VetIA</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight">El cuidado de tus mascotas, mejor organizado.</h2>
            <ul className="mt-6 grid gap-3 text-sm text-emerald-50/85">
              <li>✓ Guarda las fichas de tus mascotas</li>
              <li>✓ Encuentra veterinarias verificadas</li>
              <li>✓ Gestiona tu establecimiento de forma segura</li>
            </ul>
          </div>
          <p className="text-xs text-emerald-100/75">VetIA · Cuidado que conecta</p>
        </aside>
        <div className="vet-auth-card space-y-6">
          <div className="md:hidden"><Brand /></div>
          <PageIntro title={title}><p>{description}</p></PageIntro>
          <form action={action} className="space-y-4">
            {children}
            <SubmitButton label={submitLabel} />
          </form>
        </div>
      </section>
    </div>
  </main>;
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
  };
  return <Notice tone="danger" role="alert">{messages[code] ?? "No se pudo completar la acción."}</Notice>;
}
