import Link from "next/link";

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ purpose?: string }> }) {
  const { purpose } = await searchParams;
  return <main className="grid min-h-screen place-items-center px-5"><section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
    <p className="text-sm font-semibold uppercase tracking-widest text-emerald-800">VetIA</p>
    <h1 className="mt-5 text-3xl font-semibold">Revisa tu correo</h1>
    <p className="mt-3 leading-7 text-slate-600">{purpose === "recovery" ? "Si la cuenta puede recibir instrucciones, llegará un enlace para recuperar el acceso." : "Si el registro se procesó, llegará un enlace para confirmar tu dirección."}</p>
    <Link className="mt-7 inline-block font-semibold text-emerald-800" href="/auth/login">Volver a iniciar sesión</Link>
  </section></main>;
}
