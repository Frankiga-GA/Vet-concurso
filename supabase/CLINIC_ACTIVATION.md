# Activación inicial de una clínica

`20261106030000_clinic_activation.sql` añade la operación SQL de Fase 3. El detalle de la solicitud aprobada en Next.js muestra la activación de una clínica pendiente cuando la bandera de servidor `VETIA_ADMIN_DECISIONS_ENABLED` está habilitada. La bandera está apagada por defecto. La acción usa la sesión del superadministrador y la revisión original de la solicitud. La publicación es una operación independiente.

## Contrato

- `vetia_activate_clinic(p_clinic_id, p_expected_reviewed_at, p_operation_id)` recibe la revisión de la **solicitud** (`reviewed_at`), con la precisión original de PostgreSQL, y una clave UUID por intención. No acepta destinatario ni rol.
- La operación exige que el estado de la solicitud sea `approved` y que su revisión coincida con `clinics.approved_at`, como en la aprobación de Fase 2. El primer administrador se deriva de `clinic_applications.applicant_user_id`. Debe ser una cuenta confirmada y habilitada, con acreditación vigente y una membresía `clinic_admin / pending`. Se rechaza la autoactivación del propio solicitante y cualquier otra membresía activa u otro administrador no revocado.
- La clínica debe estar `pending_activation / incomplete / unpublished`. La RPC cambia solo el estado operativo y el de la membresía, y escribe el recibo y el evento `clinic.activate` en la misma transacción. La salida describe el resultado de la activación original, incluso si el perfil o los estados cambian más adelante.
- La misma combinación de actor, clave y argumentos devuelve el mismo recibo. La misma clave con otros argumentos devuelve `PT409`. Una clave nueva tampoco puede repetir la activación de la misma clínica. El recibo se conserva como referencia histórica.
- Todos los llamados, incluidos los reintentos, requieren superadmin, correo confirmado, sesión vigente, AAL2 y TOTP con antigüedad máxima de 600 segundos en el claim firmado `amr`. Se vuelve a comprobar tras el bloqueo por operación y justo antes de escribir. La marca del TOTP no se toma de los parámetros.

## Bloqueos y alcance

1. Bloqueo consultivo transaccional por actor y operación. Luego se consulta el recibo por la clave completa.
2. Para una activación nueva, se bloquean la solicitud, la clínica, la acreditación, la cuenta solicitante y su membresía, en ese orden. La relación solicitud–clínica se vuelve a comprobar tras adquirir los bloqueos.
3. La revocación manual de acreditación debe seguir el orden solicitud → acreditación. Si confirma primero, la activación falla. Si la activación confirma primero, la revocación posterior no cambia por sí sola la membresía ni la clínica. Ese caso requiere el procedimiento operativo de suspensión.
4. Cualquier operación futura que cambie la relación, la elegibilidad o el padrón inicial debe respetar el orden de bloqueos y coordinarse por la misma solicitud y clínica. El recibo único por clínica y el índice único por actor y clave siguen siendo barreras de integridad.

El recibo tiene RLS y carece de grants para roles de API. La RPC pública solo concede `EXECUTE` a `authenticated` entre esos roles. El helper privado usa los permisos efectivos del propietario de la RPC. No se modifican los grants ni las políticas de las tablas existentes.

## Pruebas locales y despliegue

- En el stack local con Fases 1 y 2 aplicadas, comprobar el destino y el historial antes de usar `pnpm exec supabase migration up` sin parámetros remotos. La suite pgTAP se ejecuta con `pnpm exec supabase test db .\supabase\tests`.
- Con Docker y Python 3.12, ejecutar `py -3.12 -u .\supabase\tests\clinic_activation_concurrency.py`. El script usa exclusivamente `supabase_db_concurso` y dos conexiones PostgreSQL independientes. Confirma fixtures ficticios con UUID nuevos, observa que B espera a A y prueba dos revisores, reintento exacto, revocación concurrente y reutilización de clave entre clínicas. Retira solo sus fixtures por UUID y comprueba que no quede ninguno.
- Antes de desplegar a DEV, comparar el esquema y confirmar los permisos del propietario previsto (`postgres`) sobre las tablas, los helpers y las columnas de Auth usadas. Verificar en particular que pueda bloquear las filas de `auth.users`, que requiere permiso de actualización sobre alguna columna, además de lectura. Tras el despliegue, auditar propietario, `search_path`, RLS y permisos efectivos antes de habilitar la operación.
- En una prueba controlada con JWT reales, verificar activación, TOTP reciente y vencido, sesión revocada y aislamiento entre clínicas. La acreditación de la corrida anterior de EL ÑE está revocada. Usar fixtures nuevos para el camino positivo.
- El recibo incorpora referencias restrictivas a la membresía y al actor de Auth. Incluirlas en la política de retención y en el inventario previo a cualquier borrado de usuarios o clínicas.
