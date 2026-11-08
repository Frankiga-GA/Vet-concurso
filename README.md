# VetIA

PWA SaaS veterinaria en Next.js, Supabase y PostgreSQL. La fuente funcional es [VETIA_PRD.md](./VETIA_PRD.md); decisiones técnicas y plan están en [ARCHITECTURE.md](./ARCHITECTURE.md) y [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md).

## Requisitos locales

- Node.js 20.9+ (entorno auditado: Node 24).
- pnpm.
- Docker Desktop o Podman para iniciar Supabase local.
- La CLI de Supabase ya está declarada en dependencias de desarrollo; ejecútala con `pnpm exec supabase`.

## Ejecutar el piloto en local

Instala las dependencias con `pnpm install --frozen-lockfile`. Con Docker en ejecución, inicia Supabase y arranca Next.js en PowerShell. El comando usa la clave publicable del stack local en la sesión actual y comprueba el destino antes de iniciar.

```powershell
pnpm exec supabase start
$local = pnpm exec supabase status -o json | ConvertFrom-Json
if ($local.API_URL -ne 'http://127.0.0.1:54321') { throw 'Se requiere Supabase local' }
$env:NEXT_PUBLIC_SUPABASE_URL = $local.API_URL
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = $local.PUBLISHABLE_KEY
$env:NEXT_PUBLIC_SITE_URL = 'http://127.0.0.1:3000'
$env:VETIA_ADMIN_DECISIONS_ENABLED = 'false'
$env:VETIA_CLINIC_PUBLICATION_ENABLED = 'false'
$env:VETIA_AI_ENABLED = 'false'
$env:VETIA_APPOINTMENT_INTAKE_KEY = 'disabled'
pnpm dev --hostname 127.0.0.1 --port 3000
```

Abre `http://127.0.0.1:3000`. Usa el buzón de Supabase local para confirmar cuentas y recuperar contraseñas ficticias. Para probar SQL, ejecuta `pnpm exec supabase test db --local` con las migraciones del piloto instaladas. Un stack local ya existente puede necesitar la migración incremental pendiente. Comprueba primero su historial. Reserva `db reset` para una instancia desechable.

## Comandos

- `pnpm dev`: desarrollo.
- `pnpm typecheck`: TypeScript.
- `pnpm lint`: ESLint.
- `pnpm test`: pruebas unitarias.
- `pnpm build`: build de producción.
- `pnpm db:up`, `pnpm db:reset`, `pnpm db:test`: Supabase local.
- `pnpm exec supabase`: CLI para Supabase Cloud/local.

El piloto incluye cuenta de propietario, mascotas, directorio, incorporación y panel de clínica con perfil, citas, clientes y pacientes. La activación administrativa queda bajo la misma bandera que la aprobación. La acreditación sigue el [procedimiento de revisión](./supabase/CLINIC_APPLICATION_DECISIONS.md). Las decisiones, la publicación, el ingreso de citas y la IA requieren habilitación separada y se mantienen cerrados en el arranque de arriba.

Antes de recibir usuarios reales quedan pendientes el respaldo verificado y el despliegue autorizado de las migraciones en PROD, Auth y recuperación en el dominio final, una clínica legítima acreditada y publicada, y el circuito de citas en HTTPS con Turnstile real. La IA requiere una validación independiente con credenciales reales del proveedor.

El bootstrap del primer superadministrador es una operación única del propietario del proyecto; sigue las instrucciones de `supabase/seed/bootstrap-first-superadmin.template.sql`. No es una ruta de la aplicación.
