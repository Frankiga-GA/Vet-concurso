# Publicación y retirada de clínicas

La migración `20261107030000_clinic_publication.sql` agrega dos operaciones separadas y un recibo privado por cambio. El detalle de una solicitud aprobada muestra los controles cuando `VETIA_CLINIC_PUBLICATION_ENABLED=true`. La bandera es independiente de las decisiones sobre solicitudes y viene deshabilitada. Controla el panel y la Server Action. Las RPC validan su propia autorización al recibir una llamada directa por PostgREST.

## Publicar

1. Comprueba el proyecto y el entorno web antes de operar. Verifica la evidencia real del representante mediante el proceso de acreditación de VetIA. La identidad se deriva del UUID de la solicitud, la acreditación y el recibo de activación. Las coincidencias de correo no asignan permisos. Las referencias identificadas como `e2e-ficticia-solo-prueba:` se rechazan.
2. Verifica que se haya activado la clínica y que su primer administrador acreditado siga habilitado. Pide al administrador que complete su ficha. Revisa los datos y confirma que la clínica autorizó la difusión de su dirección y contacto público.
3. Inicia sesión como superadministrador con correo confirmado y TOTP verificado en los últimos diez minutos. En el detalle de la solicitud, revisa la ficha, registra el motivo interno y confirma **Publicar clínica**. PostgreSQL vuelve a verificar el estado de la solicitud, la acreditación, la cuenta del representante, la activación y los campos del perfil. La operación no cambia membresías.
4. Comprueba la ficha con una sesión pública. La publicación habilita la elegibilidad en el directorio. El ingreso de citas conserva sus controles independientes. Servicios y horarios son parte de la completitud y la revisión administrativa. La proyección pública conserva los campos que ya mostraba.

## Retirar o revertir

1. Con el mismo requisito de sesión y TOTP, elige **Retirar del directorio**, registra el motivo y confirma. La retirada sigue disponible cuando la acreditación pierde vigencia. Si se revoca una acreditación, coordina la retirada en la misma intervención operativa. La revocación por sí sola no ejecuta esta acción.
2. Tras el commit, vuelve a consultar el directorio y la ficha sin sesión. Deben dejar de devolver la clínica. El ingreso rechaza solicitudes nuevas para esa clínica. Las citas existentes y sus auditorías se conservan.
3. Para republicar, corrige el perfil y vuelve a verificar la acreditación y el resto de requisitos. Usa la revisión actual y una nueva operación. Conserva los recibos y la auditoría de ambas decisiones.

Un reintento con el mismo UUID de operación y la misma entrada devuelve el recibo original. Un cambio de motivo, acción, clínica o revisión con el mismo UUID se rechaza. El orden de bloqueos es clave de operación, solicitud, clínica, acreditación, cuenta del solicitante y membresía. Los dos últimos pasos de elegibilidad y sus bloqueos se usan para publicar. El retiro no depende de que el representante conserve acceso.

**Antes de aplicar en un entorno compartido**, revisar en modo lectura si hay fichas publicadas con campos faltantes. La nueva proyección excluye esos registros inmediatamente sin reescribir sus estados. Validar propietarios y grants de la proyección y RPC tras la aplicación. Mantener el ingreso de citas y la bandera deshabilitados hasta autorizar la prueba correspondiente.

## Pruebas locales

- `pnpm exec supabase test db` y `pnpm test`.
- `node supabase/tests/clinic_publication_local.mjs` usa exclusivamente Supabase Docker en loopback y Next.js local en el puerto 3138. Ejecutar Next con la bandera de publicación habilitada solo para ese proceso. Pasar en el proceso de prueba `VETIA_LOCAL_TEST_KEY` y `VETIA_LOCAL_PUBLISHABLE_KEY` desde Supabase **local**, y `VETIA_PLAYWRIGHT_ENTRY` como ruta al módulo Playwright instalado fuera del proyecto. El script usa Chromium de Edge, verifica TOTP real, prueba retirada y carreras con dos conexiones y elimina sus propios datos ficticios.
