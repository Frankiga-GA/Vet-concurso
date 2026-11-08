# Clientes y pacientes de clínica

El panel abre `/clinic/[clinicId]/clients`. Permite listar y buscar clientes por nombre, teléfono, correo o nombre de un paciente. Desde la ficha se pueden consultar y registrar pacientes de ese cliente. La lista muestra los primeros 50 resultados y la ficha muestra hasta 100 pacientes. Refina la búsqueda para localizar un cliente fuera del listado inicial.

`20261107040000_clinic_records.sql` conserva las tablas y la FK compuesta de Fase 1. Exige sesión vigente con correo confirmado, clínica activa y membresía activa como `clinic_admin` o `clinic_staff` tanto para leer como para dar de alta. El rol de plataforma por sí solo no permite ver estas fichas. La lectura usa permisos por columna y RLS. Las altas pasan por las RPC autorizadas. Se retiran los permisos de escritura directa que existían en Fase 1.

Las altas serializan la comprobación de duplicados por clínica. Un mismo ID con el mismo contenido devuelve el registro existente. Una coincidencia de nombre y teléfono del cliente, o de nombre y especie del paciente para el mismo cliente, pide una confirmación explícita. Dos clientes pueden compartir teléfono y distintos pacientes pueden tener el mismo nombre. Ninguna alta vincula automáticamente una identidad global.

Las búsquedas de la interfaz se envían en el cuerpo de una acción autenticada. La auditoría guarda solo el actor, la clínica, el tipo de operación y el UUID del registro. Mantener el acceso a logs, auditoría y copias de seguridad restringido. Acordar con la clínica la retención y el tratamiento de datos antes de incorporar fichas reales.

## Validación local

Ejecutar `pnpm exec supabase test db` y `pnpm test`. El recorrido `node supabase/tests/clinic_records_mobile.mjs` usa Supabase local en el puerto 54321 y Next.js local en 3138. Requiere `VETIA_LOCAL_TEST_KEY` y `VETIA_LOCAL_PUBLISHABLE_KEY` de la pila local, y `VETIA_PLAYWRIGHT_ENTRY` como ruta al módulo Playwright instalado fuera del proyecto. Usa Chromium de Edge a 390 px y elimina sus datos ficticios.

Antes de un despliegue, verificar si algún consumidor anterior escribe en las tablas directamente y migrarlo a las RPC. Quedan fuera de este módulo la edición y eliminación, la vinculación con citas o mascotas globales y el historial clínico.
