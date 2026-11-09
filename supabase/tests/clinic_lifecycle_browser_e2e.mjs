// End-to-end local-only check for the governed clinic lifecycle.
// Requires the isolated local Next instance at http://127.0.0.1:3138 with
// VETIA_ADMIN_DECISIONS_ENABLED=true and VETIA_CLINIC_PUBLICATION_ENABLED=true.
// It creates uniquely named fixtures and deletes them in finally. It never uses a remote URL.
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const api = "http://127.0.0.1:54321";
const site = "http://127.0.0.1:3138";
const localKey = process.env.VETIA_LOCAL_TEST_KEY;
const publishable = process.env.VETIA_LOCAL_PUBLISHABLE_KEY;
const browserModule = process.env.VETIA_PLAYWRIGHT_ENTRY;
assert(localKey && publishable && browserModule, "Supply local test keys and a Playwright entry point");
const playwright = await import(pathToFileURL(browserModule).href);
const { chromium } = playwright.default ?? playwright;
const docker = ["exec", "-i", "supabase_db_concurso", "psql", "-XqtA", "-U", "postgres", "-d", "postgres"];
const run = "local-lifecycle-" + randomUUID();
const applicationId = randomUUID();
const userApplicationId = "8285f4ed-fcf0-4c83-bf8b-3510ba1be0f2";
let adminId, applicantId, clinicId, browser;
let stage = "preflight";

function sql(statement) {
  const result = spawnSync("docker", [...docker, "-v", "ON_ERROR_STOP=1"], { input: statement, encoding: "utf8", timeout: 30000 });
  assert.equal(result.status, 0, `Fixture SQL failed: ${result.stderr}`);
  return result.stdout.trim();
}
async function post(path, key, bearer, body) {
  const response = await fetch(api + path, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  assert(response.ok, `Local API returned ${response.status}`);
  return response.json();
}
async function createAccount(kind, password) {
  const account = await post("/auth/v1/admin/users", localKey, localKey, { email: `${run}-${kind}@example.test`, password, email_confirm: true });
  assert.match(account.id, /^[a-f0-9-]{36}$/);
  return account.id;
}
function totp(secret) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = [...secret.toUpperCase().replace(/=+$/, "")].map((letter) => {
    const value = alphabet.indexOf(letter); assert(value >= 0, "Invalid TOTP encoding"); return value.toString(2).padStart(5, "0");
  }).join("");
  const key = Buffer.from((bits.match(/.{8}/g) ?? []).map((item) => Number.parseInt(item, 2)));
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = createHmac("sha1", key).update(counter).digest(); const offset = digest.at(-1) & 15;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
}

try {
  assert.equal(sql(`select submission_status from public.clinic_applications where id='${userApplicationId}';`), "submitted", "The user's application must not be used by this test");
  stage = "confirmed local fixture accounts and representation";
  const adminPassword = randomUUID() + "Aa1!";
  const applicantPassword = randomUUID() + "Bb2!";
  adminId = await createAccount("admin", adminPassword);
  applicantId = await createAccount("applicant", applicantPassword);
  sql(`begin;
    insert into private.platform_admins(user_id) values ('${adminId}');
    insert into public.clinic_applications(id,applicant_user_id,business_name,city,contact_name,contact_email,contact_phone,submission_status)
      values ('${applicationId}','${applicantId}','Clínica E2E Local ${run}','Ica','Solicitante E2E','${run}@example.test','999999999','submitted');
    insert into private.clinic_application_representations(application_id,applicant_user_id,verified_by,evidence_reference)
      values ('${applicationId}','${applicantId}','${adminId}','FICTITIOUS LOCAL TEST ONLY: ${run}');
    commit;`);

  stage = "browser authentication and real TOTP AAL2";
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const adminPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const applicantPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const publicPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  for (const page of [adminPage, applicantPage, publicPage]) page.setDefaultTimeout(60000);
  const detail = `${site}/admin/clinic-applications/${applicationId}`;
  await adminPage.goto(detail); await adminPage.waitForURL((url) => url.pathname === "/auth/login");
  await adminPage.locator("input[name=email]").fill(`${run}-admin@example.test`);
  await adminPage.locator("input[name=password]").fill(adminPassword);
  await adminPage.getByRole("button", { name: "Ingresar" }).click();
  await adminPage.waitForURL((url) => url.pathname === "/admin/mfa");
  const enroll = adminPage.waitForResponse((response) => response.url() === `${api}/auth/v1/factors` && response.request().method() === "POST");
  await adminPage.getByRole("button", { name: "Configurar autenticador" }).click();
  const factor = await (await enroll).json();
  const verify = adminPage.waitForResponse((response) => response.url().includes("/auth/v1/factors/") && response.url().endsWith("/verify") && response.ok());
  await adminPage.getByLabel(/digo de un solo uso/i).fill(totp(factor.totp.secret));
  await adminPage.getByRole("button", { name: "Verificar factor" }).click();
  const { access_token: adminToken } = await (await verify).json();
  const claims = JSON.parse(Buffer.from(adminToken.split(".")[1], "base64url"));
  assert.equal(claims.aal, "aal2"); assert(claims.amr.some((entry) => entry.method === "totp"));
  await adminPage.waitForURL((url) => url.pathname === "/admin");

  stage = "browser approval with an accredited representative";
  await adminPage.goto(detail);
  await adminPage.getByText("Aprobar", { exact: true }).click();
  await adminPage.getByLabel(/mensaje al solicitante/i).first().fill("Aprobación local controlada.");
  await adminPage.getByLabel(/notas internas/i).first().fill(`Fixture ${run}`);
  await adminPage.getByText(/ver confirmación de aprobar/i).click();
  await adminPage.getByRole("button", { name: /confirmar: aprobar/i }).click();
  await adminPage.getByText(/Decisión registrada: Aprobada/i).waitFor();
  clinicId = sql(`select id from public.clinics where application_id='${applicationId}';`);
  assert.match(clinicId, /^[a-f0-9-]{36}$/);
  assert.equal(sql(`select lifecycle_status||':'||profile_status||':'||publication_status from public.clinics where id='${clinicId}';`), "pending_activation:incomplete:unpublished");
  assert.equal(sql(`select status from public.clinic_memberships where clinic_id='${clinicId}' and user_id='${applicantId}';`), "pending");
  const reviewOperation = sql(`select operation_id from private.application_reviews where application_id='${applicationId}' and action='approve';`);
  // The optimistic revision submitted by the browser was null: it must remain
  // identical for a valid retry, even though reviewed_at now has a new value.
  const replay = await post("/rest/v1/rpc/vetia_review_clinic_application", publishable, adminToken, { p_application_id: applicationId, p_operation_id: reviewOperation, p_expected_reviewed_at: null, p_action: "approve", p_visible_message: "Aprobación local controlada.", p_internal_notes: `Fixture ${run}` });
  assert.equal(replay.clinic_id, clinicId, "Review retry must return the original receipt");
  assert.equal(sql(`select count(*) from private.application_reviews where application_id='${applicationId}';`), "1");

  stage = "browser activation";
  await adminPage.reload();
  await adminPage.getByRole("checkbox", { name: /autorizo activar/i }).check();
  await adminPage.getByRole("button", { name: "Activar clínica" }).click();
  await adminPage.getByText(/Clínica y membresía administrativa activadas/i).waitFor();
  assert.equal(sql(`select lifecycle_status from public.clinics where id='${clinicId}';`), "active");
  assert.equal(sql(`select status from public.clinic_memberships where clinic_id='${clinicId}' and user_id='${applicantId}';`), "active");
  assert.equal(sql(`select count(*) from private.clinic_activation_receipts where clinic_id='${clinicId}';`), "1");

  stage = "browser clinic profile";
  await applicantPage.goto(`${site}/auth/login`);
  await applicantPage.locator("input[name=email]").fill(`${run}-applicant@example.test`);
  await applicantPage.locator("input[name=password]").fill(applicantPassword);
  await applicantPage.getByRole("button", { name: "Ingresar" }).click();
  // Clinic administrators are intentionally routed to their operational panel.
  await applicantPage.waitForURL((url) => url.pathname === "/clinic");
  const profileUrl = `${site}/clinic/${clinicId}/profile`;
  await applicantPage.goto(profileUrl);
  await applicantPage.locator("input[name=address]").fill("Avenida Local 123");
  await applicantPage.locator("input[name=phone]").fill("999999999");
  await applicantPage.locator("textarea[name=description]").fill("Atención veterinaria ficticia para una prueba local controlada.");
  await applicantPage.locator("textarea[name=services]").fill("Consulta general\nVacunación");
  await applicantPage.getByRole("button", { name: /añadir turno/i }).click();
  await applicantPage.getByLabel("Desde", { exact: true }).fill("09:00");
  await applicantPage.getByLabel("Hasta", { exact: true }).fill("17:00");
  await applicantPage.getByRole("button", { name: "Guardar cambios" }).click();
  await applicantPage.getByText("Perfil completo guardado.", { exact: true }).waitFor();
  assert.equal(sql(`select profile_status from public.clinics where id='${clinicId}';`), "complete");

  stage = "directory invisibility before publication";
  const actualSlug = sql(`select slug from public.clinics where id='${clinicId}';`);
  await publicPage.goto(`${site}/veterinarias/${actualSlug}`);
  // Next's development not-found response can be a 200 shell, so assert the
  // actual public content is absent rather than relying on its transport code.
  assert.equal(await publicPage.getByRole("heading", { name: /Clínica E2E Local/ }).count(), 0);

  stage = "browser publication and public directory";
  await adminPage.goto(detail);
  await adminPage.getByText("Publicar clínica", { exact: true }).click();
  await adminPage.getByLabel("Motivo interno").fill("Publicación local autorizada");
  await adminPage.getByRole("checkbox", { name: /confirmo que revisé/i }).check();
  await adminPage.getByRole("button", { name: /confirmar: publicar/i }).click();
  await adminPage.getByText("Clínica publicada.", { exact: true }).waitFor();
  await publicPage.goto(`${site}/veterinarias/${actualSlug}`);
  await publicPage.getByRole("heading", { name: new RegExp(`Clínica E2E Local`) }).waitFor();
  assert.equal(sql(`select publication_status from public.clinics where id='${clinicId}';`), "published");

  stage = "browser withdrawal and audit";
  await adminPage.getByText("Retirar del directorio", { exact: true }).click();
  await adminPage.getByLabel("Motivo interno").fill("Retirada local autorizada");
  await adminPage.getByRole("checkbox", { name: /confirmo que la clínica dejará/i }).check();
  await adminPage.getByRole("button", { name: /confirmar: retirar/i }).click();
  await adminPage.getByText("Clínica retirada del directorio.", { exact: true }).waitFor();
  await publicPage.reload();
  assert.equal(await publicPage.getByRole("heading", { name: /Clínica E2E Local/ }).count(), 0);
  assert.equal(sql(`select publication_status from public.clinics where id='${clinicId}';`), "withdrawn");
  assert.equal(sql(`select count(*) from private.audit_events where clinic_id='${clinicId}' and action in ('clinic_application.approve','clinic.activate','clinic.publish','clinic.withdraw');`), "4");
  assert.equal(sql(`select count(*) from private.clinic_publication_receipts where clinic_id='${clinicId}';`), "2");
  console.log("PASS browser lifecycle: approve, idempotent receipt, activate, complete profile, publish, public visibility, withdraw, audit");
} catch (error) {
  console.error(`FAIL ${stage}: ${error.stack ?? error}`);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  sql(`begin;
    delete from private.audit_events where clinic_id='${clinicId ?? "00000000-0000-0000-0000-000000000000"}' or entity_id='${applicationId}';
    delete from private.clinic_publication_receipts where clinic_id='${clinicId ?? "00000000-0000-0000-0000-000000000000"}';
    delete from private.clinic_activation_receipts where clinic_id='${clinicId ?? "00000000-0000-0000-0000-000000000000"}';
    delete from private.application_reviews where application_id='${applicationId}';
    delete from public.clinic_memberships where clinic_id='${clinicId ?? "00000000-0000-0000-0000-000000000000"}';
    delete from public.clinics where application_id='${applicationId}';
    delete from private.clinic_application_representations where application_id='${applicationId}';
    delete from public.clinic_applications where id='${applicationId}';
    delete from private.platform_admins where user_id='${adminId ?? "00000000-0000-0000-0000-000000000000"}';
    delete from auth.users where id in ('${adminId ?? "00000000-0000-0000-0000-000000000000"}','${applicantId ?? "00000000-0000-0000-0000-000000000000"}');
    commit;`);
  assert.equal(sql(`select (select count(*) from public.clinic_applications where id='${applicationId}') + (select count(*) from public.clinics where application_id='${applicationId}') + (select count(*) from auth.users where id in ('${adminId ?? "00000000-0000-0000-0000-000000000000"}','${applicantId ?? "00000000-0000-0000-0000-000000000000"}'));`), "0");
  assert.equal(sql(`select submission_status from public.clinic_applications where id='${userApplicationId}';`), "submitted", "User application must remain untouched after cleanup");
  console.log("PASS fixture cleanup and user application preservation");
}
