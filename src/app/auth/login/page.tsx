import Link from "next/link";
import { loginAction } from "@/app/auth/actions";
import { AuthForm, AuthMessage } from "@/features/auth/auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AuthForm title="Iniciar sesión" description="Accede a tu cuenta VetIA." action={loginAction} submitLabel="Ingresar">
    <AuthMessage code={error} />
    <label className="block text-sm font-medium">Correo electrónico<input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3" /></label>
    <label className="block text-sm font-medium">Contraseña<input name="password" type="password" autoComplete="current-password" required className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3" /></label>
    <Link className="text-sm font-semibold text-emerald-800" href="/auth/forgot-password">Olvidé mi contraseña</Link>
    <p className="text-sm text-slate-600">¿Aún no tienes cuenta? <Link className="font-semibold text-emerald-800" href="/auth/register">Regístrate</Link></p>
  </AuthForm>;
}
