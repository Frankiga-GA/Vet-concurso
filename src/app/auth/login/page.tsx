import Link from "next/link";
import { loginAction, loginWithGoogleAction } from "@/app/auth/actions";
import { AuthForm, AuthMessage, GoogleAuthButton } from "@/features/auth/auth-form";
import { Notice } from "@/components/vetia-ui";

function usesLocalAuth() {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
    return host === "127.0.0.1" || host === "localhost" || host === "[::1]";
  } catch {
    return false;
  }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AuthForm
    title="Iniciar sesión"
    description="Accede a tu cuenta VetIA."
    action={loginAction}
    submitLabel="Ingresar"
    headerSlot={<GoogleAuthButton action={loginWithGoogleAction} />}
  >
    <AuthMessage code={error} />
    {usesLocalAuth() && <Notice>
      <strong>Estás en la demo local.</strong> Las cuentas de DEV y producción no están disponibles aquí. Si aún no tienes una cuenta local, <Link className="vet-link" href="/auth/register">regístrate en esta demo</Link> y confirma el correo en el buzón local.
    </Notice>}
    <label className="block text-sm font-medium">Correo electrónico<input name="email" type="email" autoComplete="email" required className="vet-field" /></label>
    <label className="block text-sm font-medium">Contraseña<input name="password" type="password" autoComplete="current-password" required className="vet-field" /></label>
    <Link className="vet-link text-sm" href="/auth/forgot-password">Olvidé mi contraseña</Link>
    <p className="vet-muted text-sm">¿Aún no tienes cuenta? <Link className="vet-link" href="/auth/register">Regístrate</Link></p>
  </AuthForm>;
}
