// Run against Supabase Docker and Next.js on loopback only.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const api = "http://127.0.0.1:54321";
const site = "http://127.0.0.1:3138";
const { VETIA_LOCAL_TEST_KEY: adminKey, VETIA_LOCAL_PUBLISHABLE_KEY: publicKey, VETIA_PLAYWRIGHT_ENTRY: entry } = process.env;
assert(adminKey && publicKey && entry, "Supply local test keys and a Playwright entry point");
const { chromium } = await import(pathToFileURL(entry).href);
const clinics = [randomUUID(), randomUUID()];
const apps = [randomUUID(), randomUUID()];
const slug = "records-mobile-" + randomUUID();
const emails = clinics.map((_, index) => `${slug}-${index}@example.test`);
const passwords = clinics.map(() => randomUUID() + "Aa1!");
const users = [];
let browser, stage;

function sql(statement) {
  const result = spawnSync("docker", ["exec", "-i", "supabase_db_concurso", "psql", "-XqtA",
    "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"], { input: statement, encoding: "utf8", timeout: 20000 });
  assert.equal(result.status, 0, "Local fixture SQL failed");
  return result.stdout.trim();
}

function headers(key, bearer) {
  return { apikey: key, Authorization: "Bearer " + bearer, "Content-Type": "application/json" };
}

async function login(page, index) {
  await page.goto(site + "/auth/login");
  await page.locator("input[name=email]").fill(emails[index]);
  await page.locator("input[name=password]").fill(passwords[index]);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL((url) => url.pathname === "/clinic");
}

try {
  stage = "local fixtures";
  for (const [index, clinic] of clinics.entries()) {
    const response = await fetch(api + "/auth/v1/admin/users", {
      method: "POST", headers: headers(adminKey, adminKey),
      body: JSON.stringify({ email: emails[index], password: passwords[index], email_confirm: true }),
    });
    assert(response.ok, "Local account setup failed");
    const { id } = await response.json();
    assert.match(id, /^[a-f0-9-]{36}$/);
    users.push(id);
    sql(`begin;
      insert into public.clinic_applications(id,applicant_user_id,business_name,city,contact_name,contact_email,contact_phone,submission_status,reviewed_at)
      values ('${apps[index]}','${id}','Records mobile fixture','Ica','Fixture','${emails[index]}','555123456','approved',now());
      insert into public.clinics(id,application_id,slug,name,city,approved_at,lifecycle_status)
      values ('${clinic}','${apps[index]}','${slug}-${index}','Records mobile fixture','Ica',now(),'active');
      insert into public.clinic_memberships(clinic_id,user_id,role,status)
      values ('${clinic}','${id}','${index === 0 ? "clinic_staff" : "clinic_admin"}','active'); commit;`);
  }

  stage = "mobile navigation and client registration";
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const options = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
  const staff = await browser.newPage(options);
  const other = await browser.newPage(options);
  staff.setDefaultTimeout(60000);
  other.setDefaultTimeout(60000);
  await login(staff, 0);
  const clinicUrl = site + "/clinic/" + clinics[0];
  await staff.goto(clinicUrl);
  await staff.getByRole("link", { name: "Clientes y pacientes" }).click();
  await staff.getByRole("heading", { name: "Clientes y pacientes" }).waitFor();
  const noOverflow = () => staff.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  assert(await noOverflow());
  const listUrl = clinicUrl + "/clients";
  const owner = "Cliente móvil ficticio";
  const name = "Luna móvil ficticia";
  await staff.locator("input[name=name]").fill(owner);
  await staff.locator("input[name=phone]").fill("+51 (999) 123-456");
  await staff.locator("input[name=email]").fill("owner-fixture@example.test");
  await staff.getByRole("button", { name: "Registrar cliente" }).click();
  await staff.getByRole("heading", { name: owner }).waitFor();
  await staff.getByText("+51999123456", { exact: true }).waitFor();
  const detailUrl = staff.url();
  const clientId = new URL(detailUrl).pathname.split("/").at(-1);
  assert.match(clientId, /^[a-f0-9-]{36}$/);

  stage = "mobile patient registration and search";
  await staff.getByRole("link", { name: "Añadir paciente" }).click();
  await staff.locator("input[name=name]").fill(name);
  await staff.locator("input[name=species]").fill("Gato");
  await staff.getByRole("button", { name: "Registrar paciente" }).click();
  await staff.getByRole("heading", { name }).waitFor();
  assert(await noOverflow());
  await staff.goto(listUrl);
  await staff.locator("input[name=query]").fill("Resultado inexistente");
  await staff.getByRole("button", { name: "Buscar", exact: true }).click();
  await staff.getByText("No encontramos clientes para esta búsqueda.").waitFor();
  await staff.locator("input[name=query]").fill(name);
  await staff.getByRole("button", { name: "Buscar", exact: true }).click();
  await staff.getByRole("link", { name: new RegExp(owner) }).waitFor();
  await staff.waitForURL(listUrl);
  await staff.locator("input[name=name]").fill(owner);
  await staff.locator("input[name=phone]").fill("+51999123456");
  await staff.getByRole("button", { name: "Registrar cliente" }).click();
  await staff.getByRole("alert").filter({ hasText: /registro parecido/ }).waitFor();
  assert.equal(sql(`select count(*) from public.clinic_clients where clinic_id='${clinics[0]}';`), "1");

  stage = "mobile and API cross-tenant isolation";
  await login(other, 1);
  for (const url of [detailUrl, site + "/clinic/" + clinics[1] + "/clients/" + clientId]) {
    await other.goto(url);
    assert.equal(await other.getByRole("heading", { name: owner }).count(), 0);
    await other.getByText(/This page could not be found/i).waitFor();
  }
  stage = "direct API tenant reads";
  const auth = await fetch(api + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: { apikey: publicKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: emails[1], password: passwords[1] }),
  });
  assert(auth.ok, "Local API login failed");
  const { access_token: token } = await auth.json();
  for (const [table, column] of [["clinic_clients", "full_name"], ["clinic_patients", "name"]]) {
    const response = await fetch(api + `/rest/v1/${table}?select=${column}&clinic_id=eq.${clinics[0]}`,
      { headers: headers(publicKey, token) });
    assert(response.ok);
    assert.deepEqual(await response.json(), []);
  }
  stage = "direct API foreign patient association";
  const cross = await fetch(api + "/rest/v1/rpc/vetia_create_clinic_patient", {
    method: "POST", headers: headers(publicKey, token), body: JSON.stringify({
      p_clinic_id: clinics[1], p_client_id: clientId, p_id: randomUUID(), p_name: "Cross fixture",
      p_species: "Gato", p_breed: null, p_sex: null, p_birth_date: null, p_allow_similar: false,
    }),
  });
  const errorCode = (await cross.json())?.code;
  assert(cross.status === 404 && errorCode === "PT404",
    `Expected foreign association rejection (HTTP ${cross.status}, SQL ${errorCode})`);
  console.log("PASS mobile 390px: client, patient, search, duplicate warning, URL and PostgREST isolation");
} catch (error) {
  console.error("FAIL " + stage + " (" + error.name + ")");
  if (stage === "direct API foreign patient association" && error.message.startsWith("Expected foreign association rejection")) {
    console.error(error.message);
  }
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  const clinicIds = clinics.map((id) => "'" + id + "'").join(",");
  const appIds = apps.map((id) => "'" + id + "'").join(",");
  const fixtureEmails = emails.map((email) => "'" + email + "'").join(",");
  const userIds = [...users, ""].map((id) => "'" + id + "'").join(",");
  sql(`begin;
    delete from private.audit_events where clinic_id in (${clinicIds}) and action in ('clinic.client_create','clinic.patient_create');
    delete from public.clinic_patients where clinic_id in (${clinicIds});
    delete from public.clinic_clients where clinic_id in (${clinicIds});
    delete from public.clinic_memberships where clinic_id in (${clinicIds});
    delete from public.clinics where id in (${clinicIds});
    delete from public.clinic_applications where id in (${appIds});
    delete from auth.users where email in (${fixtureEmails});
    commit;`);
  assert.equal(sql(`select (select count(*) from auth.users where email in (${fixtureEmails}))
    +(select count(*) from auth.sessions where user_id::text in (${userIds}))
    +(select count(*) from public.clinics where id in (${clinicIds}))
    +(select count(*) from public.clinic_clients where clinic_id in (${clinicIds}))
    +(select count(*) from public.clinic_patients where clinic_id in (${clinicIds}))
    +(select count(*) from private.audit_events where clinic_id in (${clinicIds}));`), "0");
  console.log("PASS local fixture cleanup");
}
