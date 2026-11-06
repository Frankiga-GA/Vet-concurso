# VetIA — PRD funcional v1.0

**Estado:** Aprobado como fuente funcional oficial.  
**Cobertura inicial:** Chincha, Pisco e Ica.  
**Producto:** PWA de orientación asistida, directorio veterinario y SaaS multiempresa para piloto controlado.

## 1. Visión

VetIA conecta propietarios de mascotas con orientación inicial de IA y veterinarias reales aprobadas. Las clínicas administran su perfil, solicitudes, citas y registros básicos. El superadministrador revisa establecimientos y opera la red.

Circuito central: **Propietario → IA → directorio aprobado → solicitud → coordinación clínica → cita confirmada.** La IA no reemplaza al profesional, no emite diagnósticos definitivos ni prescribe medicamentos. Una solicitud no es una reserva confirmada.

## 2. Usuarios y permisos

- **Invitado/propietario:** consulta IA, directorio y perfiles; solicita cita sin cuenta. El invitado recibe referencia y coordina manualmente.
- **Propietario registrado:** funciones públicas, datos básicos propios y de mascotas, seguimiento persistente de sus solicitudes y avisos internos.
- **Solicitante de clínica:** envía solicitud de incorporación y consulta/atiende requerimientos; no tiene acceso operativo mientras está pendiente.
- **Personal de clínica:** accede por invitación o activación autorizada y solo a su tenant y permisos.
- **Administrador de clínica:** administra perfil, servicios, horarios informativos, solicitudes/citas, clientes y mascotas locales.
- **Superadministrador:** revisa y aprueba solicitudes, controla publicación, usuarios, planes configurables, auditoría y operación.
- **Asistente VetIA:** orientación general y consulta exclusiva del directorio público elegible.

## 3. Entornos

### A. Plataforma pública de propietarios
Inicio, IA sin registro, directorio por localidad/servicios, perfiles públicos, solicitud de cita invitada o autenticada, registro/login/verificación/recuperación, cuenta del propietario, mascotas básicas y seguimiento.

### B. Panel de clínica
Resumen con avisos internos; solicitudes y citas; perfil público, servicios y horarios declarados; búsqueda/gestión básica de clientes y mascotas; usuarios mediante invitación autorizada. Datos aislados por clínica. No ofrece disponibilidad en tiempo real ni historia clínica avanzada.

### C. Superadministración
Dashboard, revisión de incorporación/documentación que se defina, aprobación/rechazo/requerimiento de información, clínicas y publicación, usuarios, planes/estados manuales, auditoría y reintento operativo autorizado.

### D. IA VetIA
Conversación pública no persistente para invitados en P0; orientación prudente, manejo de señales de alarma, acceso acotado al directorio aprobado, límites de consumo y protección contra abuso. Sin diagnóstico, prescripción, SQL arbitrario ni acceso a datos privados.

## 4. Navegación y pantallas

### Público/propietario
- **Inicio:** explica servicio, cobertura, límites y accesos a IA/directorio.
- **Asistente:** mensajes de sesión, aviso de límites, entrada de consulta, reinicio y acceso a clínicas. Validación de longitud/frecuencia; carga, vacío inicial y error del proveedor con alternativa segura.
- **Directorio/resultados:** localidad manual, filtros por servicios publicados, clínicas elegibles; carga, sin resultados y error recuperable.
- **Perfil clínico público:** nombre, zona/dirección, contacto, servicios y horarios declarados; nunca cupos disponibles.
- **Solicitud de cita:** clínica, nombre, teléfono, motivo, preferencia fecha/hora y mascota opcional. Validaciones de formato, campos requeridos, fecha futura y clínica publicada. Envío produce referencia y estado pendiente.
- **Registro/login/verificación:** correo y contraseña, confirmación de correo, errores de validación/acceso, reenvío de confirmación.
- **Recuperación:** solicitud de enlace/código con respuesta que no enumera cuentas.
- **Resumen propietario:** solicitudes recientes, avisos, citas y mascotas.
- **Solicitudes/citas:** estado, última actualización, detalle y acciones permitidas.
- **Mascotas propias:** alta/edición/búsqueda de registros propios y selección en solicitud.

### Incorporación y clínica
- **Solicitud de incorporación:** datos de establecimiento/representante, localidad, contacto y documentación/información definida por criterios pendientes. Validación de requeridos, estados de envío y error.
- **Estado de incorporación:** solicitud enviada, requiere información, aprobada/rechazada; sin acceso operativo pendiente.
- **Invitación/activación:** invitación dirigida a correo, rol y clínica; aceptación con cuenta verificada.
- **Dashboard clínica:** solicitudes nuevas/pendientes, propuestas y citas próximas; avisos internos.
- **Solicitudes/citas:** bandeja, filtros y detalle; aceptar, rechazar con motivo, proponer horario, registrar acuerdo digital o telefónico, cancelar/completar conforme a estado.
- **Clientes:** crear, buscar y consultar fichas locales; sin fusión automática por nombre/teléfono.
- **Mascotas/pacientes:** crear, buscar y vincular a cliente local, solicitud/cita; solo datos básicos.
- **Perfil/servicios/horarios:** editar y completar perfil; horario siempre informativo.

### Superadministración
- **Dashboard:** métricas reales por estado/ciudad y accesos a colas.
- **Revisión:** expediente y archivos privados; aprobar, rechazar o solicitar información con motivo/evento.
- **Clínicas/publicación:** estados separados, edición administrativa, activar/suspender y publicar/retirar con auditoría.
- **Usuarios/membresías:** buscar, activar/desactivar e invitar bajo permisos.
- **Planes:** Básico/Profesional/Premium configurables y piloto gratuito, sin cobros automáticos.
- **Auditoría:** actor, acción, entidad, fecha, motivo y resultado; solo lectura.

## 5. Recorridos

### Propietario
Entra → conoce la plataforma → consulta IA sin cuenta → describe la consulta → recibe orientación prudente → busca clínicas aprobadas → filtra por ciudad/servicios → consulta perfil → solicita cita sin registro o crea cuenta → recibe referencia/seguimiento → coordina con la clínica. La cuenta habilita mascotas guardadas y seguimiento persistente.

### Clínica
Conoce VetIA → envía solicitud → espera revisión → atiende requerimientos → recibe aprobación → activa acceso autorizado → completa perfil → solicita/habilita publicación separada → recibe solicitudes → acepta/rechaza/propone horario → acuerda y registra cita → gestiona clientes/mascotas locales.

### Superadministrador
Revisa cola → examina datos/documentación bajo criterios confirmados → aprueba/rechaza/pide información → se crea o activa un tenant único → invita administrador mediante proceso idempotente → revisa perfil completado → publica por acción separada → mantiene usuarios/planes y audita cambios.

## 6. Reglas de negocio y estados

### Incorporación
Solicitud: `draft → submitted → needs_information → approved/rejected`.  
Establecimiento: `pending_activation → active/suspended/inactive`.  
Perfil: `incomplete → complete`. Publicación: `unpublished → published/withdrawn`.  
Solo aparece si está aprobada, activa, completa y publicada. Aprobación no equivale a publicación.

### Citas
`appointments` es el registro único y nace `pending`. Propuestas se almacenan separadas con `proposed_for` y `created_at`. Confirmar exige horario concreto acordado; registra horario, fecha de confirmación, método digital/telefónico y actor que registra. Estados: `pending`, `accepted`, `proposed`, `confirmed`, `rejected`, `cancelled`, `completed`. Toda transición registra actor/fecha y produce aviso interno idempotente. Horarios generales no representan disponibilidad.

### Clientes y mascotas
`owners` y `pets` son identidad global privada. `clinic_clients` y `clinic_patients` son fichas locales. El servidor transfiere únicamente datos autorizados. Una mascota puede recibir atención en varias clínicas mediante asociaciones locales independientes; no se comparten notas/historiales. No vincular automáticamente por teléfono/nombre.

### Autenticación/seguridad
Correo y contraseña, verificación, recuperación y cierre de sesión. Personal por invitación/activación. No autoasignación de roles. RLS y permisos mínimos para todas las tablas expuestas; integridad tenant mediante FK compuestas. MFA TOTP/AAL2 obligatorio para superadmin.

## 7. Modelo comercial

Piloto gratuito para clínicas aprobadas. Planes Básico, Profesional y Premium configurables manualmente por superadministrador. Sin pagos ni pasarelas automáticas. No ofrecer capacidades no implementadas.

## 8. Prioridades

### P0
PWA pública; IA no persistente y limitada; directorio real con estados elegibles; incorporación/aprobación/publicación separadas; auth email/password y verificación/recuperación/logout; roles/membresías; seguridad multiempresa; superadmin MFA; panel básico de clínicas; solicitudes/citas con coordinación; notificaciones internas; gestión básica de clientes/mascotas; planes manuales; auditoría.

### P1
Geolocalización opcional; WhatsApp/SMS automatizados con consentimiento; historial IA opt-in; resumen compartible; analítica/recordatorios ampliados; mejores herramientas de importación; expansión a nuevas ciudades.

### P2
Historia clínica avanzada; agenda sincronizada/disponibilidad real; inventario; pagos/facturación; telemedicina; integraciones externas; multi-sede y analítica avanzada.

## 9. Criterios de aceptación

- Directorio y herramienta IA listan solo clínicas aprobadas, activas, completas y publicadas; no inventan registros.
- Solicitud invitada produce referencia y queda dirigida a una clínica; clínica puede coordinar y confirmar solo con hora acordada.
- Usuario registrado ve solo datos propios; clínica ve solo fichas locales de su tenant.
- Cambiar identificadores no permite leer/escribir datos ajenos; FK compuestas bloquean relaciones cruzadas.
- Solicitud pendiente no da acceso operativo; aprobación no publica por sí sola.
- Auth incluye confirmación, recuperación y logout; roles no son autoasignables; superadmin exige AAL2.
- Reprocesar outbox no duplica clínica, membresía, invitación ni notificación.
- Estados/eventos, aprobación, publicación, suspensión, cambios de rol/plan quedan auditados.

## 10. Decisiones operativas pendientes

Criterios/documentos de verificación; campos exactos mínimos de owners/pets/clientes; retención/borrado; roles internos de clínica; reclamación segura de solicitudes invitadas; cancelación/expiración de solicitudes; límites/costo/proveedor IA; custodios y recuperación de MFA; máximos/backoff de outbox; matriz detallada de planes tras piloto. No se inventarán requisitos legales.
