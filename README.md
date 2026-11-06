# VetIA

PWA SaaS veterinaria en Next.js, Supabase y PostgreSQL. La fuente funcional es [VETIA_PRD.md](./VETIA_PRD.md); decisiones técnicas y plan están en [ARCHITECTURE.md](./ARCHITECTURE.md) y [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md).

## Requisitos locales

- Node.js 20.9+ (entorno auditado: Node 24).
- pnpm.
- Docker Desktop o Podman para iniciar el stack local de Supabase.

## Preparación

1. Copia `.env.example` a `.env.local` y completa las variables públicas de un proyecto de desarrollo. Nunca pongas una clave secreta en variables `NEXT_PUBLIC_*`.
2. Instala dependencias con `pnpm install`.
3. Inicia el stack local con `pnpm db:up`.
4. Aplica migraciones y pruebas con `pnpm db:reset` y `pnpm db:test`.
5. Inicia Next.js con `pnpm dev`.

Para confirmar y recuperar correo local, usa el buzón de pruebas de Supabase local. En un proyecto remoto configura allowlist de redirects, correo confirmado y TOTP antes de probar Auth/MFA.

## Comandos

- `pnpm dev`: desarrollo.
- `pnpm typecheck`: TypeScript.
- `pnpm lint`: ESLint.
- `pnpm test`: pruebas unitarias.
- `pnpm build`: build de producción.
- `pnpm db:up`, `pnpm db:reset`, `pnpm db:test`: Supabase local.

El bootstrap del primer superadministrador es una operación única del propietario del proyecto; sigue las instrucciones de `supabase/seed/bootstrap-first-superadmin.template.sql`. No es una ruta de la aplicación.
