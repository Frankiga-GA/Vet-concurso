import { resetPasswordAction } from "@/app/auth/actions";
import { AuthForm, AuthMessage } from "@/features/auth/auth-form";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AuthForm title="Recuperar acceso" description="Te enviaremos instrucciones si el correo puede recibirlas." action={resetPasswordAction} submitLabel="Enviar instrucciones">
    <AuthMessage code={error} />
    <label className="block text-sm font-medium">Correo electrónico<input name="email" type="email" autoComplete="email" required className="vet-field" /></label>
  </AuthForm>;
}
