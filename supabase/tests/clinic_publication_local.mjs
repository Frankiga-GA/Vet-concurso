// Supabase local + a local Next.js instance with the publication flag enabled.
import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";

const api = "http://127.0.0.1:54321";
const site = "http://127.0.0.1:3138";
const docker = ["exec", "-i", "supabase_db_concurso", "psql", "-XqtA", "-U", "postgres", "-d", "postgres"];
const localKey = process.env.VETIA_LOCAL_TEST_KEY;
const publishable = process.env.VETIA_LOCAL_PUBLISHABLE_KEY;
const browserModule = process.env.VETIA_PLAYWRIGHT_ENTRY;
assert(localKey && publishable && browserModule, "Supply local test keys and a Playwright entry point");
const playwright = await import(pathToFileURL(browserModule).href);
const { chromium } = playwright.default ?? playwright;
const lit = (value) => "'" + value.replaceAll("'", "''") + "'";
const newId = () => randomUUID();
const app = newId();
const clinic = newId();
const slug = "publication-mobile-" + newId();
const review = "2026-11-06T02:00:00Z";
let admin, applicant, browser, stage;

function sql(statement) {
  const result = spawnSync("docker", [...docker, "-v", "ON_ERROR_STOP=1"], {
    input: statement, encoding: "utf8", timeout: 20000,
  });
  assert.equal(result.status, 0, "Local fixture SQL failed");
  return result.stdout.trim();
}

async function request(path, key, bearer, input) {
  const response = await fetch(api + path, {
    method: "POST", headers: { apikey: key, Authorization: "Bearer " + bearer, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  assert(response.ok, "Local API rejected operation: " + response.status);
  return response.json();
}

async function account(kind, password) {
  const result = await request("/auth/v1/admin/users", localKey, localKey, {
    email: slug + "-" + kind + "@example.test", password, email_confirm: true,
  });
  assert.match(result.id, /^[a-f0-9-]{36}$/);
  return result.id;
}

function totp(secret) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = [...secret.toUpperCase().replace(/=+$/, "")].map((letter) => {
    const index = alphabet.indexOf(letter);
    assert(index >= 0, "Invalid TOTP fixture encoding");
    return index.toString(2).padStart(5, "0");
  }).join("");
  const key = Buffer.from((bits.match(/.{8}/g) ?? []).map((byte) => parseInt(byte, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = createHmac("sha1", key).update(counter).digest();
  const offset = digest.at(-1) & 15;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, "0");
}

function connection() {
  const process = spawn("docker", docker, { stdio: ["pipe", "pipe", "pipe"] });
  const lines = createInterface({ input: process.stdout });
  let running;
  lines.on("line", (line) => {
    if (!running) return;
    if (line === running.marker) {
      const { resolve, output, timer } = running;
      clearTimeout(timer);
      running = undefined;
      resolve(output);
    } else if (line) running.output.push(line);
  });
  process.stderr.resume();
  return {
    query(statement) {
      assert(!running, "Connection already has a pending query");
      const marker = "done_" + newId();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Local database connection timed out")), 20000);
        running = { marker, resolve, output: [], timer };
        process.stdin.write(statement + "\n\\echo " + marker + "\n");
      });
    },
    async close() {
      if (running) clearTimeout(running.timer);
      process.stdin.end();
      if (process.exitCode === null) await new Promise((resolve) => process.once("close", resolve));
    },
  };
}

async function race(claims, revision, sameKey) {
  const a = connection();
  const b = connection();
  const key = newId();
  const decision = sameKey ? "publish" : "withdraw";
  const call = (operation) => `select public.vetia_${decision}_clinic(${lit(clinic)},0,${revision},${lit(operation)},'Concurrent local fixture');`;
  const begin = `begin; set local statement_timeout='12s'; set local role authenticated;
    do $test$ begin perform set_config('request.jwt.claims',${lit(JSON.stringify(claims))},true); end $test$;`;
  try {
    const [[firstPid], [secondPid]] = await Promise.all([a.query("select pg_backend_pid();"), b.query("select pg_backend_pid();")]);
    await Promise.all([a.query(begin), b.query(begin)]);
    const [winner] = await a.query(call(key));
    assert(winner, "The first concurrent operation must succeed");
    const pending = b.query(call(sameKey ? key : newId()) + "\n\\echo :SQLSTATE");
    let blocked = false;
    for (let attempt = 0; attempt < 20 && !blocked; attempt++) {
      blocked = sql(`select ${Number(firstPid)}=any(pg_blocking_pids(${Number(secondPid)}));`) === "t";
      if (!blocked) await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert(blocked, "Second connection must block on the first");
    await a.query("commit;");
    const response = await pending;
    if (sameKey) {
      assert.equal(response.at(-1), "00000");
      assert.deepEqual(JSON.parse(response[0]), JSON.parse(winner));
    } else {
      assert.deepEqual(response, ["PT409"]);
    }
    await b.query("rollback;");
  } finally {
    await Promise.all([a.close(), b.close()]);
  }
}

try {
  stage = "local fixtures";
  const password = newId() + "A1!";
  admin = await account("admin", password);
  applicant = await account("applicant", newId() + "A1!");
  sql(`begin;
    insert into private.platform_admins(user_id) values ('${admin}');
    insert into public.clinic_applications(id,applicant_user_id,business_name,city,contact_name,contact_email,contact_phone,submission_status,reviewed_at)
    values ('${app}','${applicant}','Publication mobile fixture','Ica','Fixture','${slug}@example.test','555123456','approved','${review}');
    insert into public.clinics(id,application_id,slug,name,city,approved_at)
    values ('${clinic}','${app}','${slug}','Publication mobile fixture','Ica','${review}');
    insert into public.clinic_memberships(clinic_id,user_id,role) values ('${clinic}','${applicant}','clinic_admin');
    insert into private.clinic_application_representations(application_id,applicant_user_id,verified_by,evidence_reference)
    values ('${app}','${applicant}','${admin}','local-automated-publication-fixture'); commit;`);

  stage = "mobile anonymous authorization";
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const options = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
  const adminPage = await browser.newPage(options);
  const publicPage = await browser.newPage(options);
  adminPage.setDefaultTimeout(60000);
  publicPage.setDefaultTimeout(60000);
  const detail = site + "/admin/clinic-applications/" + app;
  const publicUrl = site + "/veterinarias/" + slug;
  await adminPage.goto(detail);
  await adminPage.waitForURL((url) => url.pathname === "/auth/login");
  stage = "mobile AAL1 authorization";
  await adminPage.locator("input[name=email]").fill(slug + "-admin@example.test");
  await adminPage.locator("input[name=password]").fill(password);
  await adminPage.getByRole("button", { name: "Ingresar" }).click();
  await adminPage.waitForURL((url) => url.pathname === "/admin/mfa");
  await adminPage.goto(detail);
  await adminPage.waitForURL((url) => url.pathname === "/admin/mfa");

  stage = "real TOTP verification";
  const enrollment = adminPage.waitForResponse((response) =>
    response.url() === api + "/auth/v1/factors" && response.request().method() === "POST");
  await adminPage.getByRole("button", { name: "Configurar autenticador" }).click();
  const factor = await (await enrollment).json();
  const verification = adminPage.waitForResponse((response) => response.url().endsWith("/verify")
    && response.url().startsWith(api + "/auth/v1/factors/") && response.ok());
  await adminPage.getByLabel(/digo de un solo uso/).fill(totp(factor.totp.secret));
  await adminPage.getByRole("button", { name: "Verificar factor" }).click();
  const { access_token: token } = await (await verification).json();
  const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url"));
  assert.equal(claims.aal, "aal2");
  assert(claims.amr.some((entry) => entry.method === "totp"));
  await adminPage.waitForURL((url) => url.pathname === "/admin");
  stage = "activate fixture";
  await request("/rest/v1/rpc/vetia_activate_clinic", publishable, token, {
    p_clinic_id: clinic, p_expected_reviewed_at: review, p_operation_id: newId(),
  });
  sql(`update public.clinics set address='Fixture address 123', phone='555123456', description='Fixture veterinary care',
    services=array['Consulta'], opening_hours='[{"day":1,"start":"09:00","end":"17:00"}]', profile_status='complete'
    where id='${clinic}';`);

  stage = "mobile publication";
  await adminPage.goto(detail);
  const publish = adminPage.getByText("Publicar clínica", { exact: true });
  await publish.click();
  assert(await adminPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await adminPage.getByLabel("Motivo interno").fill("Revisión local controlada");
  await adminPage.getByRole("checkbox").check();
  await adminPage.getByRole("button", { name: /confirmar: publicar/i }).click();
  await adminPage.getByText("Clínica publicada.", { exact: true }).waitFor();
  await publicPage.goto(publicUrl);
  await publicPage.getByRole("heading", { name: "Publication mobile fixture" }).waitFor();

  stage = "mobile withdrawal";
  await adminPage.getByText("Retirar del directorio", { exact: true }).click();
  await adminPage.getByLabel("Motivo interno").fill("Retiro local controlado");
  await adminPage.getByRole("checkbox").check();
  await adminPage.getByRole("button", { name: /confirmar: retirar/i }).click();
  await adminPage.getByText("Clínica retirada del directorio.", { exact: true }).waitFor();
  assert.equal((await publicPage.reload()).status(), 404);
  console.log("PASS mobile 390px: unauthenticated/AAL1 denied, real TOTP, activation, publication and immediate withdrawal");

  stage = "two-connection concurrency";
  await race(claims, 2, true);
  await race(claims, 3, false);
  assert.equal(sql(`select publication_status||':'||publication_revision from public.clinics where id='${clinic}';`), "withdrawn:4");
  assert.equal(sql(`select count(*) from private.clinic_publication_receipts r
    join private.audit_events e on e.metadata->>'receipt_id'=r.id::text
    and e.clinic_id=r.clinic_id and e.action in ('clinic.publish','clinic.withdraw') where r.clinic_id='${clinic}';`), "4");
  assert.equal(sql(`select count(*) from private.clinic_publication_receipts where clinic_id='${clinic}';`), "4");
  console.log("PASS concurrent same-key publish returns one receipt; competing withdrawals reject the stale revision");
} catch (error) {
  console.error("FAIL " + stage + " (" + error.name + ")");
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  sql(`begin;
    delete from private.audit_events where clinic_id='${clinic}' and action in ('clinic.activate','clinic.publish','clinic.withdraw');
    delete from private.clinic_publication_receipts where clinic_id='${clinic}';
    delete from private.clinic_activation_receipts where clinic_id='${clinic}';
    delete from public.clinic_memberships where clinic_id='${clinic}';
    delete from public.clinics where id='${clinic}' and slug='${slug}';
    delete from private.clinic_application_representations where application_id='${app}';
    delete from public.clinic_applications where id='${app}';
    delete from private.platform_admins where user_id::text='${admin ?? ""}';
    delete from auth.users where email in ('${slug}-admin@example.test','${slug}-applicant@example.test');
    commit;`);
  assert.equal(sql(`select (select count(*) from auth.users where email in ('${slug}-admin@example.test','${slug}-applicant@example.test'))
    +(select count(*) from auth.sessions where user_id::text in ('${admin ?? ""}','${applicant ?? ""}'))
    +(select count(*) from auth.mfa_factors where user_id::text='${admin ?? ""}')
    +(select count(*) from public.clinics where id='${clinic}')
    +(select count(*) from private.audit_events where entity_id='${clinic}');`), "0");
  console.log("PASS local fixture cleanup");
}
