import Link from "next/link";
import type { ReactNode } from "react";

export function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className={"vet-brand " + (light ? "text-white" : "")} aria-label="VetIA, inicio">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/icons/icon.svg" width={38} height={38} alt="" />
    <span className="vet-brand-copy">
      <span className="vet-brand-name">VetIA</span>
      <span className={"vet-brand-tagline " + (light ? "text-emerald-100" : "")}>Cuidado que conecta</span>
    </span>
  </Link>;
}

export function PublicHeader({ current }: { current?: "directory" | "assistant" | "account" }) {
  return <header className="vet-header">
    <div className="vet-shell vet-header-inner">
      <Brand />
      <nav aria-label="Navegación principal" className="vet-nav">
        <Link href="/veterinarias" aria-current={current === "directory" ? "page" : undefined}>Veterinarias</Link>
        <Link href="/asistente" aria-current={current === "assistant" ? "page" : undefined}>Asistente IA</Link>
        <Link href="/account" aria-current={current === "account" ? "page" : undefined}>Mi cuenta</Link>
      </nav>
    </div>
  </header>;
}

export function PageIntro({ title, label, children }: { title: string; label?: string; children?: ReactNode }) {
  return <div className="min-w-0 space-y-2">
    {label && <p className="vet-eyebrow">{label}</p>}
    <h1 className="vet-title">{title}</h1>
    {children && <div className="vet-muted max-w-3xl text-[.98rem]">{children}</div>}
  </div>;
}

export function Notice({ children, tone = "info", role }: {
  children: ReactNode; tone?: "info" | "warning" | "danger"; role?: "alert" | "status";
}) {
  return <div role={role} className={"vet-notice vet-notice-" + tone}>{children}</div>;
}

export function EmptyState({ icon = "♡", title, children, action }: {
  icon?: string; title: string; children?: ReactNode; action?: ReactNode;
}) {
  return <div className="vet-empty">
    <span className="vet-empty-icon" aria-hidden="true">{icon}</span>
    <h2 className="vet-card-title">{title}</h2>
    {children && <div className="vet-muted max-w-md text-sm">{children}</div>}
    {action}
  </div>;
}

export function FeatureCard({ icon, title, children, href }: {
  icon: string; title: string; children: ReactNode; href?: string;
}) {
  const content = <><span className="vet-icon-tile" aria-hidden="true">{icon}</span>
    <div className="min-w-0"><h3 className="vet-card-title">{title}</h3><div className="vet-muted mt-1 text-sm">{children}</div></div></>;
  return href ? <Link href={href} className="vet-card vet-card-action flex h-full gap-3">{content}</Link>
    : <div className="vet-card flex h-full gap-3">{content}</div>;
}

export function SectionNav({ label, items }: {
  label: string; items: { href: string; label: string; current?: boolean }[];
}) {
  return <nav aria-label={label} className="vet-nav vet-section-nav">
    {items.map((item) => <Link key={item.href} href={item.href}
      aria-current={item.current ? "page" : undefined}>{item.label}</Link>)}
  </nav>;
}

export function ClinicNav({ clinicId, current, profile = false }: {
  clinicId: string; current: "overview" | "appointments" | "clients" | "profile"; profile?: boolean;
}) {
  const base = "/clinic/" + clinicId;
  return <SectionNav label="Panel de clínica" items={[
    { href: base, label: "Resumen", current: current === "overview" },
    { href: base + "/appointments", label: "Citas", current: current === "appointments" },
    { href: base + "/clients", label: "Clientes y pacientes", current: current === "clients" },
    ...(profile ? [{ href: base + "/profile", label: "Perfil público", current: current === "profile" }] : []),
    { href: "/clinic", label: "Cambiar clínica" },
  ]} />;
}

export function OwnerNav({ current }: { current: "overview" | "profile" | "pets" | "applications" }) {
  return <SectionNav label="Mi espacio en VetIA" items={[
    { href: "/account", label: "Resumen", current: current === "overview" },
    { href: "/account/profile", label: "Mi perfil", current: current === "profile" },
    { href: "/account/pets", label: "Mis mascotas", current: current === "pets" },
    { href: "/account/clinic-applications", label: "Mis solicitudes", current: current === "applications" },
    { href: "/veterinarias", label: "Buscar veterinaria" },
  ]} />;
}

export function AdminNav({ current }: { current: "overview" | "applications" | "security" }) {
  return <SectionNav label="Superadministración" items={[
    { href: "/admin", label: "Resumen", current: current === "overview" },
    { href: "/admin/clinic-applications", label: "Solicitudes", current: current === "applications" },
    { href: "/admin/security", label: "Seguridad", current: current === "security" },
  ]} />;
}

export function SiteFooter() {
  return <footer className="vet-footer">
    <div className="vet-shell vet-footer-grid">
      <div><Brand /><p className="vet-muted mt-3 max-w-sm text-sm">Orientación responsable y conexión con veterinarias verificadas de Chincha, Pisco e Ica.</p></div>
      <div><p className="font-bold">Explorar</p><nav className="mt-2 grid gap-2 text-sm"><Link href="/veterinarias">Directorio de veterinarias</Link><Link href="/asistente">Asistente VetIA</Link><Link href="/account">Mi cuenta</Link></nav></div>
      <div><p className="font-bold">Para veterinarias</p><nav className="mt-2 grid gap-2 text-sm"><Link href="/account/clinic-applications">Solicitar incorporación</Link><Link href="/clinic">Panel de clínica</Link></nav></div>
    </div>
    <div className="vet-shell border-t border-[var(--line)] py-4 text-xs text-[var(--muted)]">© 2026 VetIA · La orientación digital no reemplaza la evaluación de un profesional veterinario.</div>
  </footer>;
}
