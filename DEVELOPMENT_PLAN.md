# VetIA — Plan de desarrollo

**Fuente funcional:** `VETIA_PRD.md` v1.0.  
**Fuente técnica:** `ARCHITECTURE.md`.  
**Objetivo actual:** Implementar únicamente Fase 1, fundamentos y seguridad. No construir aún directorio, citas, IA ni experiencia completa de clínica.

## Estado de auditoría inicial

- Workspace `D:\concurso` estaba vacío; no había código funcional/documentos que reemplazar ni repositorio Git inicializado.
- Node.js 24, npm y pnpm están disponibles.
- No se detectaron variables de entorno por nombre para Supabase, Postgres o Vercel. No se imprimieron valores.
- Docker y Supabase CLI global no están disponibles; las pruebas locales de migración necesitan instalar/ejecutar CLI y Docker o configurar un proyecto remoto de desarrollo.
- No se ha ejecutado migración ni existe confirmación de proyecto Supabase configurado.
- La conexión al esquema privado quedó resuelta mediante RPC estrechas con sesión; `private` no se expone ni se conecta desde runtime con SQL privilegiado.

## Fase 0 — decisiones previas (documentada)

1. `clinic_patients` con identidad local y FK compuestas por `clinic_id`.
2. `owners`/`pets` privados en esquema no expuesto; asociaciones global/local en tablas privadas; fichas locales separadas.
3. Acceso backend al schema privado mediante RPC estrechas autenticadas, sin exponer `private`, conexión SQL de runtime ni service_role general.
4. Outbox durable con procesamiento serverless corto por demanda y scheduler configurado/verificado; sin worker perpetuo supuesto.
5. Incorporación con `clinics.application_id UNIQUE`, transacción DB y outbox para invitación externa.
6. Documentar confirmaciones, recuperaciones y pruebas antes de persistencia.

## Fase 1 — fundamentos y seguridad (en curso)

### Objetivo
Preparar Next.js modular, Auth por correo, sesiones protegidas, perfiles/roles/membresías, base inicial segura, RLS/grants, MFA superadmin y pruebas de aislamiento. Evitar funciones de fases posteriores.

### Dependencias/configuración
- Supabase URL y publishable key para desarrollo.
- Proyecto Supabase aislado de producción o Supabase local (Docker + CLI).
- SMTP/Auth URL/redirects configurados para confirmación y recuperación.
- Configuración Supabase para Auth/Data API y ejecución de migraciones locales o remotas.
- Cuenta bootstrap superadmin y enrolamiento TOTP/AAL2.
- Vercel opcional hasta confirmar despliegue; no desplegar producción sin credenciales y configuración.

### Criterios de aceptación
- Registro/login/confirmación/recuperación/logout están implementados; quedan por probar contra un proyecto Supabase configurado.
- Protección de rutas y APIs; solicitante pendiente sin panel operativo.
- Roles derivados de tablas protegidas; no autoadministrables desde metadata/perfil.
- MFA TOTP y AAL2 aplicados a operaciones de superadmin.
- Tablas privadas fuera de Data API y cliente `service_role` no usado como repositorio general.
- Pruebas pgTAP para dos clínicas, FK compuestas y privacidad global están escritas; no ejecutadas sin PostgreSQL.
- Migraciones reproducibles, lint, typecheck, build y pruebas pasan. No declarar tests bloqueados como aprobados.

### Estado de ejecución
- [x] Auditoría inicial de workspace/runtime/Git/variables por nombre.
- [x] PRD y arquitectura creados desde especificación aprobada (no existían).
- [x] Scaffold Next.js/TypeScript/Tailwind.
- [x] Supabase CLI local y configuración de migraciones.
- [x] Migración inicial, grants/RLS y pruebas pgTAP escritas.
- [x] Auth y páginas protegidas implementadas.
- [x] Bootstrap superadmin y MFA/TOTP/AAL2 implementados/documentados.
- [ ] Pruebas de seguridad contra PostgreSQL y Auth real (bloqueadas por falta de Docker/proyecto/credenciales).
- [x] TypeScript, lint, pruebas unitarias locales y build.

### Verificación ejecutada en este workspace

- `pnpm typecheck`: pasó.
- `pnpm lint`: pasó con ESLint 9; ESLint 10 no se adoptó porque los plugins React/JSX incluidos por `eslint-config-next` aún declaran peers hasta ESLint 9.
- `pnpm test`: pasó, 2 pruebas unitarias.
- `pnpm build`: pasó con Next.js 16.4.5.
- Smoke HTTP local: `/`, registro, login y recuperación respondieron 200; rutas privadas sin sesión/configuración redirigieron 307 al login. Esto no prueba Auth real.
- `pnpm exec supabase status`, `pnpm exec supabase db reset --local` y `pnpm exec supabase db lint --local`: no pudieron conectarse porque Docker/Podman no está instalado/activo. La migración no se aplicó y pgTAP no se ejecutó.
- No se detectaron variables de Supabase/Vercel por nombre, proyecto remoto enlazado ni credenciales de desarrollo. No se probaron registro real, confirmación de email, MFA ni solicitudes autenticadas contra PostgreSQL.

## Fase 2 — incorporación y publicación

Solicitud, revisión, estados independientes, clínica única por solicitud, invitación idempotente/outbox, perfil completo y publicación manual. Aceptación: reintentos no duplican; invitación fallida no pierde establecimiento; no elegibles no aparecen.

## Fase 3 — solicitudes/citas y datos operativos

Una tabla `appointments`, transiciones, propuestas, eventos, FK compuestas; fichas locales de clientes/pacientes. Aceptación: estados sin carreras contradictorias, tenant consistency validada por DB, sin disponibilidad ficticia.

## Fase 4 — directorio, PWA e IA

Directorio público, perfiles, PWA instalable y AI Service con herramienta limitada. Aceptación: datos reales elegibles; IA no inventa ni accede a privados.

## Fase 5 — notificaciones y piloto

Avisos internos idempotentes, administración de planes, despliegue piloto, respaldo y recuperación. Aceptación: reintentos sin duplicados y restauración ensayada.

## Criterio de avance

No empezar la fase siguiente hasta que los criterios de aceptación de la fase actual se ejecuten y sus resultados queden registrados. No borrar código funcional ni introducir datos ficticios en producción. Si faltan credenciales o infraestructura, completar tareas independientes y registrar bloqueo/limitación con precisión.
