import Link from "next/link";
import { registerAction } from "@/app/auth/actions";
import { AuthForm, AuthMessage } from "@/features/auth/auth-form";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AuthForm title="Crear cuenta" description="Registra tu correo para guardar tus mascotas y seguir tus solicitudes." action={registerAction} submitLabel="Crear cuenta">
    <AuthMessage code={error} />
    <label className="block text-sm font-medium">Correo electrónico<input name="email" type="email" autoComplete="email" required maxLength={254} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3" /></label>
    <label className="block text-sm font-medium">Contraseña<input name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={128} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3" /></label>
    <p className="text-xs leading-5 text-slate-500">Al continuar, te enviaremos un correo para confirmar tu dirección.</p>
    <p className="text-sm text-slate-600">¿Ya tienes cuenta? <Link className="font-semibold text-emerald-800" href="/auth/login">Inicia sesión</Link></p>
  </AuthForm>;
}
