import Link from "next/link";
import { registerAction, registerWithGoogleAction } from "@/app/auth/actions";
import { AuthForm, AuthMessage, GoogleAuthButton } from "@/features/auth/auth-form";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AuthForm
    title="Crear cuenta"
    description="Registra tu correo para guardar las fichas de tus mascotas."
    action={registerAction}
    submitLabel="Crear cuenta"
    headerSlot={<GoogleAuthButton action={registerWithGoogleAction} label="Registrarse con Google" />}
  >
    <AuthMessage code={error} />
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium">Nombres<input name="firstName" autoComplete="given-name" required minLength={2} maxLength={80} className="vet-field" /></label>
      <label className="block text-sm font-medium">Apellidos<input name="lastName" autoComplete="family-name" required minLength={2} maxLength={120} className="vet-field" /></label>
    </div>
    <label className="block text-sm font-medium">Correo electrónico<input name="email" type="email" autoComplete="email" required maxLength={254} className="vet-field" /></label>
    <div>
      <label className="block text-sm font-medium">Contraseña<input name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={128} className="vet-field" aria-describedby="register-password-help" /></label>
      <p id="register-password-help" className="vet-muted mt-1 text-sm">Usa al menos 10 caracteres.</p>
    </div>
    <p className="vet-muted text-sm">Te enviaremos un correo para confirmar tu dirección.</p>
    <p className="vet-muted text-sm">¿Ya tienes cuenta? <Link className="vet-link" href="/auth/login">Inicia sesión</Link></p>
  </AuthForm>;
}
