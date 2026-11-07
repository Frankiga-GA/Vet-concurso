import Link from "next/link";
import type { ReactNode } from "react";

type AuthFormProps = {
  title: string;
  description: string;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  children: ReactNode;
};

export function AuthForm({ title, description, action, submitLabel, children }: AuthFormProps) {
  return <main className="grid min-h-screen place-items-center px-5 py-10">
    <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm sm:p-10">
      <Link className="text-sm font-bold tracking-wide text-emerald-800" href="/">VETIA</Link>
      <h1 className="mt-7 text-3xl font-semibold">{title}</h1>
      <p className="mt-2 mb-7 text-sm leading-6 text-slate-600">{description}</p>
      <form action={action} className="space-y-5">
        {children}
        <button className="w-full rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white hover:bg-emerald-900" type="submit">{submitLabel}</button>
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
  return <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{messages[code] ?? "No se pudo completar la acción."}</p>;
}
