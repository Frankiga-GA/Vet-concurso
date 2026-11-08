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
  return <main className="vet-shell vet-page max-w-md">
    <section className="vet-card space-y-5">
      <Brand />
      <PageIntro title={title}><p>{description}</p></PageIntro>
      <form action={action} className="space-y-4">
        {children}
        <SubmitButton label={submitLabel} />
      </form>
    </section>
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
