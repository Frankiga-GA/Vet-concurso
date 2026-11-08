import Link from "next/link";
import type { ReactNode } from "react";

export function Brand() {
  return <Link href="/" className="vet-brand" aria-label="VetIA, inicio">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/icons/icon.svg" width={32} height={32} alt="" />
    VetIA
  </Link>;
}

export function PublicHeader({ current }: { current?: "directory" | "assistant" | "account" }) {
  return <header className="vet-header">
    <div className="vet-shell vet-header-inner">
      <Brand />
      <nav aria-label="Navegación principal" className="vet-nav">
        <Link href="/veterinarias" aria-current={current === "directory" ? "page" : undefined}>Veterinarias</Link>
        <Link href="/asistente" aria-current={current === "assistant" ? "page" : undefined}>Asistente</Link>
        <Link href="/account" aria-current={current === "account" ? "page" : undefined}>Mi cuenta</Link>
      </nav>
    </div>
  </header>;
}

export function PageIntro({ title, label, children }: { title: string; label?: string; children?: ReactNode }) {
  return <div className="min-w-0 space-y-2">
    {label && <p className="vet-eyebrow">{label}</p>}
    <h1 className="vet-title">{title}</h1>
    {children && <div className="vet-muted">{children}</div>}
  </div>;
}

export function Notice({ children, tone = "info", role }: {
  children: ReactNode; tone?: "info" | "warning" | "danger"; role?: "alert" | "status";
}) {
  return <div role={role} className={`vet-notice vet-notice-${tone}`}>{children}</div>;
}

export function SectionNav({ label, items }: {
  label: string; items: { href: string; label: string; current?: boolean }[];
}) {
  return <nav aria-label={label} className="vet-nav border-b border-[var(--line)] pb-2">
    {items.map((item) => <Link key={item.href} href={item.href}
      aria-current={item.current ? "page" : undefined}>{item.label}</Link>)}
  </nav>;
}

export function ClinicNav({ clinicId, current, profile = false }: {
  clinicId: string; current: "overview" | "appointments" | "clients" | "profile"; profile?: boolean;
}) {
  const base = `/clinic/${clinicId}`;
  return <SectionNav label="Panel de clínica" items={[
    { href: base, label: "Panel", current: current === "overview" },
    { href: base + "/appointments", label: "Citas", current: current === "appointments" },
    { href: base + "/clients", label: "Clientes y pacientes", current: current === "clients" },
    ...(profile ? [{ href: base + "/profile", label: "Perfil", current: current === "profile" }] : []),
  ]} />;
}

export function AdminNav({ current }: { current: "overview" | "applications" | "security" }) {
  return <SectionNav label="Superadministración" items={[
    { href: "/admin", label: "Panel", current: current === "overview" },
    { href: "/admin/clinic-applications", label: "Solicitudes", current: current === "applications" },
    { href: "/admin/security", label: "Seguridad", current: current === "security" },
  ]} />;
}
