// Read and exercise the pilot UI only with generated fixtures on Supabase local.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const { VETIA_LOCAL_TEST_KEY: localKey, VETIA_PLAYWRIGHT_ENTRY: entry } = process.env;
assert(localKey && entry, "Use Supabase local credentials and a Playwright module path");
const { chromium } = await import(pathToFileURL(entry).href);
const api = "http://127.0.0.1:54321";
const site = "http://127.0.0.1:3138";
const slug = "ui-pilot-" + randomUUID();
const clinic = randomUUID();
const application = randomUUID();
const email = (role) => `${slug}-${role}@example.test`;
const password = randomUUID() + "Aa!";
const preferred = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10) + "T10:00";
const agreed = preferred.replace("10:00", "11:30");
const clinicName = "Veterinaria de prueba UI";
let browser, intakeCreated = false, stage = "fixtures";

function sql(statement) {
  const result = spawnSync("docker", ["exec", "-i", "supabase_db_concurso", "psql", "-XqtA",
    "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"], { input: statement, encoding: "utf8", timeout: 20000 });
  assert.equal(result.status, 0, "Local SQL fixture operation failed");
  return result.stdout.trim();
}

async function account(role) {
  const response = await fetch(api + "/auth/v1/admin/users", {
    method: "POST", headers: { apikey: localKey, Authorization: "Bearer " + localKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: email(role), password, email_confirm: true }),
  });
  assert(response.ok, "Local Auth fixture operation failed");
  const { id } = await response.json();
  assert.match(id, /^[a-f0-9-]{36}$/);
  return id;
}

async function signIn(page, role, destination) {
  await page.locator("input[name=email]").fill(email(role));
  await page.locator("input[name=password]").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL((url) => url.pathname === destination);
}

async function noOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert(overflow <= 0, "Horizontal overflow at " + new URL(page.url()).pathname + ": " + overflow);
}

try {
  assert.equal(sql("select count(*) from private.appointment_intake_key;"), "0", "Use a local stack with no existing intake key");
  const staff = await account("staff");
  await account("owner");
  sql(`begin;
    insert into public.clinic_applications(id,applicant_user_id,business_name,city,contact_name,contact_email,contact_phone,submission_status,reviewed_at)
    values ('${application}','${staff}','${clinicName}','Ica','Fixture','${email("staff")}','555123456','approved',now());
    insert into public.clinics(id,application_id,slug,name,city,approved_at,lifecycle_status,profile_status,publication_status,address,phone,description,services,opening_hours)
    values ('${clinic}','${application}','${slug}','${clinicName}','Ica',now(),'active','complete','published','Dirección ficticia de prueba','555123456',
      'Descripción ficticia para pruebas',array['Consulta'],'[{"day":1,"start":"09:00","end":"17:00"}]');
    insert into public.clinic_memberships(clinic_id,user_id,role,status) values ('${clinic}','${staff}','clinic_admin','active');
    insert into private.appointment_intake_key(key_digest) values (sha256(convert_to(repeat('8',64),'UTF8')));
    commit;`);
  intakeCreated = true;
  browser = await chromium.launch({ channel: "msedge", headless: true });
  for (const [index, width] of [320, 390, 768].entries()) {
    const page = await browser.newPage({ viewport: { width, height: 860 }, isMobile: true, hasTouch: true });
    page.setDefaultTimeout(60000);
    try {
      stage = `${width}px public navigation`;
      await page.goto(site);
      await page.getByRole("heading", { name: "Encuentra una veterinaria para tu mascota" }).waitFor();
      await noOverflow(page);
      await page.getByRole("link", { name: "VetIA, inicio" }).focus();
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => document.activeElement?.textContent), "Veterinarias");
      assert.notEqual(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), "none");
      await page.getByRole("link", { name: "Buscar veterinaria", exact: true }).click();
      const cityFilter = page.getByRole("navigation", { name: "Filtrar por ciudad" });
      await cityFilter.getByRole("link", { name: "Ica", exact: true }).click();
      await page.waitForURL("**/veterinarias?ciudad=Ica");
      assert.equal(await cityFilter.getByRole("link", { name: "Ica", exact: true }).getAttribute("aria-current"), "page");
      await noOverflow(page);
      await page.getByRole("link", { name: `Ver ficha de ${clinicName}` }).click();
      await page.getByRole("heading", { name: clinicName }).waitFor();
      await noOverflow(page);
      assert.equal(await page.getByRole("link", { name: "Llamar a la veterinaria" }).getAttribute("href"), "tel:555123456");

      stage = `${width}px request with Turnstile`;
      const contact = `Contacto de prueba ${width}`;
      await page.locator("input[name=name]").fill(contact);
      await page.locator("input[name=phone]").fill(`99912345${index}`);
      await page.locator("textarea[name=reason]").fill("Motivo ficticio de prueba visual");
      await page.locator("input[name=preferred]").fill(preferred);
      await page.locator('button[type=submit]:enabled').filter({ hasText: "Enviar solicitud" }).waitFor();
      await noOverflow(page);
      await page.getByRole("button", { name: "Enviar solicitud" }).click();
      await page.getByText("Solicitud enviada · Pendiente de coordinación", { exact: true }).waitFor();
      await page.getByText(/^Referencia: /).waitFor();
      await noOverflow(page);

      stage = `${width}px owner navigation and assistant disabled`;
      await page.getByRole("link", { name: "Mi cuenta", exact: true }).click();
      await page.getByRole("heading", { name: "Iniciar sesión" }).waitFor();
      await noOverflow(page);
      await page.getByRole("link", { name: "Olvidé mi contraseña" }).click();
      await page.getByRole("heading", { name: "Recuperar acceso" }).waitFor();
      await noOverflow(page);
      await page.goto(site + "/auth/register");
      await page.getByText("Usa al menos 10 caracteres.").waitFor();
      await noOverflow(page);
      await page.goto(site + "/auth/login");
      await signIn(page, "owner", "/account");
      await page.getByRole("heading", { name: "Mi cuenta" }).waitFor();
      await noOverflow(page);
      await page.getByRole("link", { name: "Abrir mis mascotas" }).click();
      await page.getByRole("heading", { name: "Mis mascotas" }).waitFor();
      await noOverflow(page);
      await page.goto(site + "/account/clinic-applications");
      await page.getByRole("heading", { name: "Mis solicitudes" }).waitFor();
      await noOverflow(page);
      await page.goto(site + "/asistente");
      await page.getByRole("status").filter({ hasText: /temporalmente deshabilitado/ }).waitFor();
      await noOverflow(page);
      await page.goto(site + "/account");
      await page.getByRole("button", { name: "Cerrar sesión" }).click();
      await page.waitForURL((url) => url.pathname === "/");

      stage = `${width}px clinic confirms appointment`;
      await page.goto(site + "/auth/login");
      await signIn(page, "staff", "/clinic");
      await page.getByRole("link", { name: "Abrir establecimiento" }).click();
      await page.getByRole("heading", { name: "Panel de clínica" }).waitFor();
      await noOverflow(page);
      await page.getByRole("link", { name: "Abrir solicitudes de cita" }).click();
      const row = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: contact }) });
      await row.getByText("Registrar horario acordado").click();
      await row.locator("input[name=agreed]").fill(agreed);
      await row.getByRole("checkbox").check();
      await noOverflow(page);
      const confirmation = page.waitForResponse((response) =>
        response.url().endsWith("/appointments") && response.request().method() === "POST");
      await row.getByRole("button", { name: "Confirmar cita" }).click();
      assert((await confirmation).ok());
      await page.getByRole("link", { name: "Confirmadas", exact: true }).click();
      await page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: contact }) })
        .getByText(/^Horario acordado:/).waitFor();
      await noOverflow(page);
      await page.getByRole("link", { name: "Clientes y pacientes", exact: true }).click();
      await page.getByRole("heading", { name: "Clientes y pacientes" }).waitFor();
      await noOverflow(page);
      await page.goto(site + `/clinic/${clinic}/profile`);
      await page.getByRole("heading", { name: "Perfil de la veterinaria" }).waitFor();
      await noOverflow(page);
      console.log(`PASS ${width}px: keyboard focus, directory, real local request and confirmation, auth, account and clinic navigation`);
    } finally {
      await page.close();
    }
  }
  assert.equal(sql(`select count(*) from public.appointments where clinic_id='${clinic}' and status='confirmed';`), "3");
} catch (error) {
  console.error("FAIL " + stage + " (" + error.name + ")");
  if (error.name === "AssertionError") console.error(error.message);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  sql(`begin;
    delete from private.audit_events where clinic_id='${clinic}' and action='appointment.confirm';
    delete from public.appointments where clinic_id='${clinic}';
    delete from public.clinic_memberships where clinic_id='${clinic}';
    delete from public.clinics where id='${clinic}' and slug='${slug}';
    delete from public.clinic_applications where id='${application}';
    delete from auth.users where email in ('${email("staff")}','${email("owner")}');
    ${intakeCreated ? "delete from private.appointment_intake_key where key_digest=sha256(convert_to(repeat('8',64),'UTF8'));" : ""}
    commit;`);
  assert.equal(sql(`select (select count(*) from public.clinics where id='${clinic}')
    +(select count(*) from public.appointments where clinic_id='${clinic}')
    +(select count(*) from auth.users where email in ('${email("staff")}','${email("owner")}'));`), "0");
  console.log("PASS local UI fixture cleanup");
}
