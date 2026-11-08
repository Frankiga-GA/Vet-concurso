# Asistente VetIA

El flujo público se abre en `/asistente` y usa `POST /api/asistente`. Next.js llama a OpenAI Responses API desde servidor sin agregar dependencias. Se usa salida estructurada para clasificar urgencia, tema y pregunta de seguimiento. El texto mostrado se construye con mensajes acotados de VetIA. El proveedor no recibe acceso a herramientas, registros privados ni al directorio.

Cuando la persona elige una ciudad, el servidor consulta `vetia_public_clinics` con un cliente anónimo y muestra hasta tres perfiles de esa ciudad. No presenta horarios, disponibilidad o capacidad de urgencias. Las señales explícitas de urgencia pueden activar una recomendación inmediata desde el navegador y el servidor, sin depender del proveedor, Turnstile ni de una reserva de cuota. El aviso de urgencia y el enlace al directorio también aparecen con el asistente deshabilitado.

## Configuración

| Variable | Uso |
| --- | --- |
| `VETIA_AI_ENABLED` | Interruptor del servidor. Solo `true` habilita el flujo. |
| `VETIA_AI_MODEL` | ID habilitado en el proyecto OpenAI y compatible con Responses y salidas estructuradas. |
| `OPENAI_API_KEY` | Clave secreta del proyecto OpenAI, solo servidor. |
| `VETIA_AI_GATEWAY_KEY` | Clave dedicada de 32 bytes aleatorios codificada como 64 caracteres hexadecimales en minúscula. Solo servidor. |
| `VETIA_AI_TURNSTILE_SITE_KEY` | Clave pública del widget para el hostname elegido. |
| `VETIA_AI_TURNSTILE_SECRET_KEY` | Secreto de Turnstile, solo servidor. |
| `NEXT_PUBLIC_SITE_URL` | Origen exacto del sitio, HTTPS en Vercel. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | URL y clave pública del mismo proyecto Supabase autorizado. |

La migración incremental `20261107050000_assistant_quota.sql` crea una pasarela privada que permanece sin provisionar. Antes de abrir el flujo, el operador autorizado inserta en `private.assistant_gateway` únicamente el digest SHA-256 de los caracteres UTF-8 de la clave hexadecimal. No enviar la clave cruda a una consola SQL ni guardarla en el repositorio. Usar claves distintas por entorno. El proceso web solo necesita la clave publishable de Supabase y esta clave dedicada. Las claves de prueba de Turnstile solo se aceptan con sitio y Supabase en loopback. Para apagar el asistente, poner la bandera en `false`. Retirar el digest corta las nuevas llamadas al proveedor incluso en instancias web con configuración anterior.

## Límites y datos

- Se aceptan cuatro mensajes recientes de hasta 600 caracteres cada uno. Se reserva una llamada antes de consultar al proveedor, con un máximo de 256 tokens de salida y diez segundos de espera. Los errores del proveedor también cuentan para el límite.
- Turnstile verifica la acción y el hostname. En Vercel la cuota por cliente usa la IP del encabezado administrado por la plataforma. El servidor aplica HMAC con una clave dedicada y un contexto diario. PostgreSQL guarda el identificador seudonimizado y los contadores, con seis llamadas por hora por cliente y 120 diarias en total. La reserva es atómica. Las filas vencidas se limpian en reservas posteriores. Al retirar el servicio, revisar su limpieza si no habrá nuevas llamadas.
- El chat permanece en memoria en la pestaña y puede reiniciarse. VetIA no guarda mensajes en la base. Se filtran patrones comunes de correo, enlace y números, pero esto no anonimiza texto libre. No incluir nombres, direcciones, documentos ni datos de contacto. La llamada usa `store: false`. Revisar antes del piloto la política de retención y los controles de datos del proyecto OpenAI. [Controles de datos de OpenAI](https://platform.openai.com/docs/guides/your-data)
- Antes de habilitar para usuarios reales, revisar los mensajes de seguridad con un profesional veterinario, configurar límites de gasto y alertas del proveedor, y aplicar un límite de peticiones en el perímetro sobre `/api/asistente` para reducir abuso antes de que llegue a Turnstile. Revisar logs y privacidad. [Señales de urgencia veterinaria](https://www.merckvetmanual.com/es-us/multimedia/table/cu%C3%A1ndo-acudir-a-un-veterinario)

## Prueba y habilitación

1. Con datos ficticios, ejecutar `pnpm exec supabase test db` y `pnpm test`. Las pruebas unitarias del proveedor interceptan HTTP para revisar el contrato y el tratamiento de errores. No acreditan una conexión con OpenAI.
2. Con Next.js en loopback, `node supabase/tests/assistant_mobile.mjs` comprueba la interfaz móvil a 390 px. Usar `VETIA_PLAYWRIGHT_ENTRY` como ruta al módulo Playwright local. Con `VETIA_TEST_ASSISTANT_MODE=disabled` comprueba el estado apagado. En el modo de seguridad comprueba el aviso inmediato y el reinicio sin llamar al proveedor.
3. Para la prueba real, usar un proyecto OpenAI con facturación o crédito habilitado y una clave de servidor, el modelo compatible, el digest en Supabase local y un widget para el entorno de prueba. Hacer una consulta sintética sin signos urgentes, verificar una respuesta real del proveedor, elegir una ciudad con una clínica ficticia elegible y comprobar los enlaces. Repetir con un rechazo y un error del proveedor sin registrar el texto ni las credenciales.
4. Antes de un Preview autorizado, comprobar el dominio exacto, el aislamiento de Supabase, la respuesta real, los límites y el mecanismo de apagado. Mantener apagadas las banderas administrativas y conservar la configuración independiente del ingreso de citas.
