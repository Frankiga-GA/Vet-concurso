import Link from "next/link";
import { Brand, Notice, PageIntro } from "@/components/vetia-ui";

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ purpose?: string }> }) {
  const { purpose } = await searchParams;
  return <main className="vet-shell vet-page max-w-md"><section className="vet-card space-y-4">
    <Brand />
    <PageIntro title="Revisa tu correo"><p>{purpose === "recovery" ? "Si la cuenta puede recibir instrucciones, llegará un enlace para recuperar el acceso." : "Si el registro se procesó, llegará un enlace para confirmar tu dirección."}</p></PageIntro>
    <Notice>Si no encuentras el mensaje, revisa la carpeta de correo no deseado.</Notice>
    <Link className="vet-button vet-button-secondary" href="/auth/login">Volver a iniciar sesión</Link>
  </section></main>;
}
