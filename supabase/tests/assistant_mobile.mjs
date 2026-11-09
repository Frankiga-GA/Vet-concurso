// Local safety smoke test. Does not send a provider request.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const entry = process.env.VETIA_PLAYWRIGHT_ENTRY;
assert(entry, "Supply the local Playwright entry point");
const playwright = await import(pathToFileURL(entry).href);
const { chromium } = playwright.default ?? playwright;
const site = process.env.VETIA_TEST_SITE ?? "http://127.0.0.1:3138";
const viewportWidth = Number(process.env.VETIA_TEST_VIEWPORT_WIDTH ?? 390);
assert(Number.isInteger(viewportWidth) && viewportWidth >= 320 && viewportWidth <= 1024, "Use a supported test viewport width");
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: viewportWidth, height: 844 }, isMobile: viewportWidth < 768, hasTouch: true });
  page.setDefaultTimeout(60000);
  await page.goto(site);
  await page.getByRole("link", { name: "Asistente VetIA" }).click();
  await page.locator("h1").filter({ hasText: "Asistente VetIA" }).waitFor();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.equal(await page.getByRole("link", { name: "Abrir el directorio" }).getAttribute("href"), "/veterinarias");

  if (process.env.VETIA_TEST_ASSISTANT_MODE === "disabled") {
    await page.getByRole("status").filter({ hasText: /Temporalmente deshabilitado/ }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Enviar consulta" }).count(), 0);
    const response = await fetch(site + "/api/asistente", { method: "POST" });
    assert.equal(response.status, 503);
    console.log(`PASS ${viewportWidth}px: disabled UI, directory fallback and direct API blocked`);
  } else {
    let calls = 0;
    page.on("request", (request) => { if (request.url() === site + "/api/asistente") calls++; });
    await page.getByRole("textbox", { name: "Escribe tu consulta" }).fill("Mi gato no puede respirar");
    await page.getByRole("alert").filter({ hasText: /atención veterinaria inmediata/ }).waitFor();
    await page.getByRole("button", { name: "Enviar" }).click();
    await page.getByText("Atención inmediata", { exact: true }).waitFor();
    assert.equal(calls, 0);
    await page.getByRole("button", { name: "Nueva conversación" }).click();
    assert.equal(await page.getByText("Atención inmediata", { exact: true }).count(), 0);
    const response = await fetch(site + "/api/asistente", {
      method: "POST", headers: { Origin: site, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: ["Mi gato no puede respirar"], city: "Ica", token: "" }),
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).source, "safety");
    console.log(`PASS ${viewportWidth}px: immediate safety alert, no provider call, restart and server safety path`);
  }
} finally {
  await browser.close();
}
