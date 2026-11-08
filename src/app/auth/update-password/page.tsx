import { updatePasswordAction } from "@/app/auth/actions";
import { AuthForm, AuthMessage } from "@/features/auth/auth-form";

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AuthForm title="Crear contraseña nueva" description="El enlace de recuperación debe estar vigente." action={updatePasswordAction} submitLabel="Guardar contraseña">
    <AuthMessage code={error} />
    <label className="block text-sm font-medium">Nueva contraseña<input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required className="vet-field" aria-describedby="update-password-help" /></label>
    <p id="update-password-help" className="vet-muted text-sm">Usa al menos 10 caracteres.</p>
  </AuthForm>;
}
