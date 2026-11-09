import Link from "next/link";
import { Brand, Notice, PageIntro } from "@/components/vetia-ui";

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ purpose?: string }> }) {
  const { purpose } = await searchParams;
  return <main className="vet-auth"><div className="vet-auth-shell max-w-xl"><section className="vet-card vet-card-elevated space-y-5 text-center">
    <div className="mx-auto"><Brand /></div>
    <span className="vet-empty-icon mx-auto" aria-hidden="true">✉</span>
    <PageIntro title="Revisa tu correo"><p>{purpose === "recovery" ? "Si la cuenta puede recibir instrucciones, llegará un enlace para recuperar el acceso." : "Si el registro se procesó, llegará un enlace para confirmar tu dirección."}</p></PageIntro>
    <Notice>El enlace puede tardar unos minutos. Revisa también la carpeta de correo no deseado.</Notice>
    <Link className="vet-button vet-button-secondary" href="/auth/login">Volver a iniciar sesión</Link>
  </section></div></main>;
}
