import { updatePasswordAction } from "@/app/auth/actions";
import { AuthForm, AuthMessage } from "@/features/auth/auth-form";

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AuthForm title="Crear contraseña nueva" description="El enlace de recuperación debe estar vigente." action={updatePasswordAction} submitLabel="Guardar contraseña">
    <AuthMessage code={error} />
    <label className="block text-sm font-medium">Nueva contraseña<input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3" /></label>
  </AuthForm>;
}
