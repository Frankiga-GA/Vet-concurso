# Validación visual del piloto

La interfaz comparte la paleta y los estilos de `src/app/globals.css`. Las cabeceras, la navegación por espacio, los títulos y los avisos se reutilizan desde `src/components/vetia-ui.tsx`. Las acciones de servidor, las reglas de acceso y los estados de negocio conservan su comportamiento.

## Recorrido reproducible en local

1. Usar Supabase Docker con las migraciones del piloto ya aplicadas. El asistente y las banderas administrativas deben estar apagados. La base local debe tener la pasarela de citas sin provisionar.
2. Iniciar Next.js en `http://127.0.0.1:3138` apuntando a Supabase local en `http://127.0.0.1:54321`. Configurar Turnstile con las claves oficiales de prueba y usar, solo para esa instancia, `VETIA_APPOINTMENT_INTAKE_KEY` igual a 64 repeticiones del dígito 8. El script crea temporalmente el digest de esa clave ficticia.
3. Proporcionar `VETIA_LOCAL_TEST_KEY` desde la pila local y `VETIA_PLAYWRIGHT_ENTRY` como ruta al módulo Playwright externo al proyecto. Ejecutar `node supabase/tests/ui_pilot_mobile.mjs`.
4. El script usa Chromium de Edge y sesiones separadas por ancho. Recorre portada, foco de teclado, directorio, ficha, solicitud y referencia, pantallas de autenticación y cuenta, asistente apagado, panel de clínica y confirmación. Comprueba desbordamiento horizontal a 320, 390 y 768 px y elimina sus datos ficticios.

Para revisar superadministración con las banderas apagadas, usar un superadministrador ficticio de Auth local, verificar TOTP y abrir el panel, la bandeja y el detalle de una solicitud aprobada. Comprobar a los tres anchos que se pueda navegar y que el detalle indique que la publicación está deshabilitada.

La prueba usa emulación de ancho. Quedan para una prueba autorizada el teclado y el selector de fecha en un teléfono real, Safari móvil, lector de pantalla, entrega de correos de recuperación y Turnstile con claves y hostname del sitio final. El recorrido no realiza decisiones administrativas ni consultas al proveedor de IA.
