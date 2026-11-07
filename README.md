# VetIA

PWA SaaS veterinaria en Next.js, Supabase y PostgreSQL. La fuente funcional es [VETIA_PRD.md](./VETIA_PRD.md); decisiones técnicas y plan están en [ARCHITECTURE.md](./ARCHITECTURE.md) y [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md).

## Requisitos locales

- Node.js 20.9+ (entorno auditado: Node 24).
- pnpm.
- Supabase Cloud para el piloto, o Docker Desktop/Podman si se desea iniciar el stack local.
- La CLI de Supabase ya está declarada en dependencias de desarrollo; ejecútala con `pnpm exec supabase`.

## Preparación

1. Copia `.env.example` a `.env.local` y completa `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `NEXT_PUBLIC_SITE_URL` del proyecto de desarrollo. `SUPABASE_SECRET_KEY` solo puede usarse desde código de servidor cuando una función lo requiera; nunca la pongas en variables `NEXT_PUBLIC_*`.
2. Instala dependencias con `pnpm install`.
3. Para Supabase Cloud, inicia sesión en CLI (`pnpm exec supabase login`) y vincula el proyecto de desarrollo (`pnpm exec supabase link --project-ref <project-ref>`). La CLI puede pedir la contraseña de base de datos. No guardes tokens ni contraseñas en archivos versionados.
4. Revisa el historial y el diff remoto antes de cualquier cambio (`pnpm exec supabase migration list --remote` y `pnpm exec supabase db diff --remote`). No ejecutes `db push` hasta revisar y aprobar el plan de migración.
5. Para Supabase local, inicia Docker/Podman y usa `pnpm db:up`, `pnpm db:reset` y `pnpm db:test`.
6. Inicia Next.js con `pnpm dev`.

Para confirmar y recuperar correo local, usa el buzón de pruebas de Supabase local. En un proyecto remoto configura allowlist de redirects, correo confirmado y TOTP antes de probar Auth/MFA.

## Comandos

- `pnpm dev`: desarrollo.
- `pnpm typecheck`: TypeScript.
- `pnpm lint`: ESLint.
- `pnpm test`: pruebas unitarias.
- `pnpm build`: build de producción.
- `pnpm db:up`, `pnpm db:reset`, `pnpm db:test`: Supabase local.
- `pnpm exec supabase`: CLI para Supabase Cloud/local.

## Estado de infraestructura (2026-11-06)

- Git está en `main`, `origin` apunta al repositorio oficial y la rama local está sincronizada con `origin/main`.
- `.env.local` existe y está ignorado por Git. Las variables públicas de Supabase y la clave secreta están configuradas localmente; sus valores no se imprimen ni se guardan en documentación.
- La URL pública de Supabase Cloud y la clave publishable respondieron correctamente al endpoint de configuración de Auth. No se validó acceso a la base de datos.
- La CLI local reporta versión 3.0.0. No está autenticada: falta `SUPABASE_ACCESS_TOKEN` y no se pudo consultar el proyecto remoto ni enlazarlo.
- Existe una migración local inicial. No se aplicaron migraciones remotas; la comparación remota queda pendiente de autenticación y enlace.

El bootstrap del primer superadministrador es una operación única del propietario del proyecto; sigue las instrucciones de `supabase/seed/bootstrap-first-superadmin.template.sql`. No es una ruta de la aplicación.
