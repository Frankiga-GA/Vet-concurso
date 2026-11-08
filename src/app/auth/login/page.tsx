import Link from "next/link";
import { loginAction } from "@/app/auth/actions";
import { AuthForm, AuthMessage } from "@/features/auth/auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AuthForm title="Iniciar sesión" description="Accede a tu cuenta VetIA." action={loginAction} submitLabel="Ingresar">
    <AuthMessage code={error} />
    <label className="block text-sm font-medium">Correo electrónico<input name="email" type="email" autoComplete="email" required className="vet-field" /></label>
    <label className="block text-sm font-medium">Contraseña<input name="password" type="password" autoComplete="current-password" required className="vet-field" /></label>
    <Link className="vet-link text-sm" href="/auth/forgot-password">Olvidé mi contraseña</Link>
    <p className="vet-muted text-sm">¿Aún no tienes cuenta? <Link className="vet-link" href="/auth/register">Regístrate</Link></p>
  </AuthForm>;
}
