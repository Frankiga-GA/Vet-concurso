# Piloto de directorio y citas

## Alcance

El directorio `/veterinarias` y la ficha pública usan una proyección de columnas permitidas. Solo aparecen solicitudes de incorporación aprobadas cuya clínica está activa, completa y publicada y tiene dirección y teléfono públicos. El directorio y la admisión de nuevas citas aplican el mismo filtro. Para el piloto la ficha muestra hasta 100 clínicas por consulta.

Un invitado recibe una referencia al enviar sus datos y una preferencia de fecha y hora. La solicitud nace en `pending`. La clínica acuerda el horario por teléfono y usa `/clinic/[clinicId]/appointments` para registrar la fecha y hora acordadas. La bandeja muestra hasta 50 solicitudes por estado. La confirmación guarda el actor, la fecha de confirmación y un evento privado de auditoría. Repetir exactamente el horario ya confirmado devuelve la misma referencia. No hay agenda sincronizada, historial público, notificaciones automáticas, rechazo ni cancelación en esta entrega.

## Configuración para abrir el ingreso

- Aprobación, activación y publicación siguen siendo decisiones separadas. Este cambio no conecta acciones administrativas. Antes de abrir el servicio, un operador autorizado debe completar y revisar los datos públicos de una clínica piloto, verificar la acreditación y habilitar la publicación en una operación explícita y auditada. No copiar el contacto privado de la solicitud como contacto público sin validarlo.
- Configurar el origen HTTPS de la aplicación en `NEXT_PUBLIC_SITE_URL`. Provisionar un widget Turnstile para ese hostname. Usar `VETIA_TURNSTILE_SITE_KEY` y `VETIA_TURNSTILE_SECRET_KEY` en el servidor. Solo la site key llega al navegador. La acción verifica el desafío en el servidor y, con claves reales, comprueba hostname y acción. Las claves oficiales de prueba solo se aceptan cuando la aplicación y Supabase apuntan ambos a loopback.
- Generar una clave de ingreso dedicada y aleatoria de 32 bytes codificada en hexadecimal. Guardarla como `VETIA_APPOINTMENT_INTAKE_KEY` en el servidor. Un operador provisiona **solo el digest SHA-256 de la cadena hexadecimal**, como `bytea`, en la fila única de `private.appointment_intake_key`. No guardar la clave original en SQL versionado, historial o logs. Usar claves separadas por entorno y coordinar su rotación. Sin las tres variables válidas, el formulario permanece cerrado.
- La RPC pública de ingreso exige esa clave dedicada, para que una llamada directa a PostgREST no pueda saltarse la verificación de Next.js. Conserva la misma referencia para la misma clave de solicitud y los mismos datos. Aplica cupos por hora de 4 por teléfono, 40 por clínica y 300 globales. Revisar estos límites para el volumen previsto y aplicar protección en el perímetro del despliegue para rechazos repetidos y saturación.
- Revisar el aviso de privacidad y el plazo de conservación de teléfono, nombre y motivo antes de recibir usuarios reales. No incluir el contenido de la cita en logs, alertas técnicas ni auditoría de confirmación.

## Verificación local y salida a usuarios

Aplicar la migración pendiente exclusivamente al stack local con `pnpm exec supabase migration up` tras comprobar que el destino es loopback y que solo está pendiente la migración de citas. Ejecutar `pnpm exec supabase test db .\supabase\tests`, `pnpm test`, `pnpm typecheck`, `pnpm lint` y `pnpm build`.

Validar en un navegador móvil el directorio, el reto, el recibo de invitado y la confirmación con un usuario autenticado de la clínica. Probar otra clínica y un invitado contra la bandeja y la Data API. Verificar que el directorio no muestra clínicas sin publicar ni campos de contacto internos. No abrir el circuito en un entorno con usuarios reales hasta que la migración, las ACL, la publicación de la clínica, las claves reales y el recorrido con dos clínicas se hayan verificado en el entorno aprobado.
