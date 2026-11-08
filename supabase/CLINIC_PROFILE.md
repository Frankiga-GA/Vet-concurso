# Perfil de clínica

La migración `20261107020000_clinic_profile.sql` agrega servicios, horarios y una revisión de perfil. El editor está en `/clinic/[clinicId]/profile`. Se requiere una sesión vigente con correo confirmado y una membresía `clinic_admin` activa en una clínica activa. Las RPC devuelven únicamente campos del perfil. No conceden lectura o escritura directa sobre `clinics`.

Nombre y ciudad son obligatorios desde el borrador porque identifican al establecimiento en el modelo existente. La ficha completa exige además dirección, teléfono público, descripción, al menos un servicio y al menos un turno válido. Los turnos se expresan en hora de Perú. Dos turnos pueden tocarse en sus extremos. Para cruzar medianoche se divide el turno entre dos días. Los horarios son informativos.

Al guardar se bloquea primero la fila de clínica y luego la membresía. Se vuelve a comprobar la sesión y la revisión esperada. Los cambios y la auditoría se guardan en la misma transacción. La auditoría registra actor, clínica y estado de completitud. Los valores del formulario quedan en la ficha.

## Publicación posterior

Implementar una operación administrativa separada. Debe exigir el rol de plataforma, sesión vigente y MFA conforme a los controles de activación, y bloquear la clínica antes de verificar la aprobación, la activación, la revisión esperada y la completitud calculada. Confirmar que los datos son aptos para publicación y registrar quién autoriza el cambio. Tras aprobar la publicación, ampliar la proyección pública de forma explícita para mostrar servicios y horarios. El directorio y el ingreso de citas deben continuar usando la misma regla de elegibilidad.

El editor mantiene las fichas publicadas en solo lectura. Para corregir una ficha pública, primero se debe retirar mediante una operación autorizada y auditable, después editar y volver a autorizar su publicación. El editor tampoco activa clínicas ni cambia membresías. Las fichas de migraciones previas conservan sus estados almacenados hasta un guardado autorizado. Una futura publicación debe recalcular la completitud y comprobar la revisión, incluso si una fila anterior ya tenía estado completo.

## Prueba local

Aplicar la migración con `pnpm exec supabase migration up` y comprobar que el destino sea la pila local. Ejecutar `pnpm exec supabase test db` y `pnpm test`. Con una cuenta ficticia local que tenga una clínica activa sin publicar, abrir el editor a 390 px, guardar un borrador y recargar, intentar guardar dos turnos solapados y después corregirlos y completar la ficha. Confirmar que no aparece en el directorio y que suspender la clínica bloquea el acceso al editor. Retirar únicamente las filas y la cuenta creadas para esa prueba.
