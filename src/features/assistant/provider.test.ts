import { afterEach, expect, it, vi } from "vitest";
import { classifyWithGroq } from "./provider";

vi.mock("server-only", () => ({}));
afterEach(() => vi.unstubAllGlobals());

it("sends bounded JSON classification to Groq Chat Completions without tools or remote state", async () => {
  const output = { intent: "symptom", level: "consult", topic: "digestive", question: "onset" };
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: JSON.stringify(output) } }] }));
  vi.stubGlobal("fetch", fetchMock);
  await expect(classifyWithGroq("test-only", "test-model", ["Mi perro vomitó."])).resolves.toEqual({ ok: true, classification: output });
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
  const body = JSON.parse(options.body);
  expect(body).toMatchObject({ max_tokens: 256, messages: [{ role: "system" }, { role: "user" }] });
  expect(body).not.toHaveProperty("tools");
  expect(body).not.toHaveProperty("store");
  expect(body).not.toHaveProperty("response_format");
});

it("keeps concise, non-prescriptive model wording after validating its shape", async () => {
  const output = { intent: "symptom", level: "clarify", topic: "digestive", question: "onset", answer: "Entiendo que te preocupe. Observa si sigue bebiendo agua.", follow_up: "¿Desde cuándo notas que no quiere comer?" };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: JSON.stringify(output) } }] })));
  await expect(classifyWithGroq("test-only", "test-model", ["Mi perro no quiere comer"])).resolves.toMatchObject({
    ok: true,
    guidance: { text: output.answer, question: output.follow_up },
  });
});

it("does not expose provider wording that contains a dose or treatment", async () => {
  const output = { intent: "symptom", level: "consult", topic: "general", question: "none", answer: "Dale 5 mg de un medicamento.", follow_up: null };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: JSON.stringify(output) } }] })));
  await expect(classifyWithGroq("test-only", "test-model", ["consulta ficticia"])).resolves.toEqual({
    ok: true,
    classification: { intent: "symptom", level: "consult", topic: "general", question: "none" },
  });
});

it("does not expose speculative diagnoses or possible causes", async () => {
  const output = { intent: "symptom", level: "clarify", topic: "digestive", question: "onset", answer: "Puede deberse a varias razones, como estrés o un problema gastrointestinal.", follow_up: null };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: JSON.stringify(output) } }] })));
  await expect(classifyWithGroq("test-only", "test-model", ["Mi perro no quiere comer"])).resolves.toEqual({
    ok: true,
    classification: { intent: "symptom", level: "clarify", topic: "digestive", question: "onset" },
  });
});

it.each([
  { choices: [] },
  { choices: [{ message: { content: null } }] },
])("fails closed for absent provider output", async (body) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
  expect((await classifyWithGroq("test-only", "test-model", ["consulta ficticia"])).ok).toBe(false);
});

it("turns a valid but non-contract ambiguous label into a safe clarification", async () => {
  const body = { choices: [{ message: { content: JSON.stringify({ level: "uncertain", topic: "other", question: "more details" }) } }] };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
  await expect(classifyWithGroq("test-only", "test-model", ["consulta ambigua"])).resolves.toEqual({ ok: true, classification: { intent: "symptom", level: "clarify", topic: "general", question: "animal" } });
});

it("uses a safe clarification when a provider JSON object omits triage fields", async () => {
  const body = { choices: [{ message: { content: JSON.stringify({ intent: "symptom" }) } }] };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
  await expect(classifyWithGroq("test-only", "test-model", ["mi mascota está mal"])).resolves.toEqual({ ok: true, classification: { intent: "symptom", level: "clarify", topic: "general", question: "animal" } });
});

it("fails safely toward clarification when the provider uses an unexpected shape or non-JSON wrapper", async () => {
  const body = { choices: [{ message: { content: "No puedo clasificar eso con seguridad." } }] };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
  await expect(classifyWithGroq("test-only", "test-model", ["consulta ficticia"])).resolves.toEqual({ ok: true, classification: { intent: "symptom", level: "clarify", topic: "general", question: "animal" } });
});

it("uses clarification instead of an unavailable error for a JSON value that is not an object", async () => {
  const body = { choices: [{ message: { content: "[\"unexpected\"]" } }] };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
  await expect(classifyWithGroq("test-only", "test-model", ["consulta ficticia"])).resolves.toEqual({ ok: true, classification: { intent: "symptom", level: "clarify", topic: "general", question: "animal" } });
});

it("accepts a fenced JSON object but still validates its contract", async () => {
  const body = { choices: [{ message: { content: "```json\n{\"intent\":\"thanks\",\"level\":\"general\",\"topic\":\"general\",\"question\":\"none\"}\n```" } }] };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
  await expect(classifyWithGroq("test-only", "test-model", ["Gracias"])).resolves.toEqual({ ok: true, classification: { intent: "thanks", level: "general", topic: "general", question: "none" } });
});

it("reports a safe provider category without retaining its error body", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: { message: "Unsupported parameter: store" } }, { status: 400 })));
  await expect(classifyWithGroq("test-only", "test-model", ["consulta ficticia"])).resolves.toMatchObject({ ok: false, stage: "response", status: 400, reason: "parameter" });
});

it("uses the documented low-effort mode only for GPT-OSS reasoning models", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: JSON.stringify({ intent: "general", level: "general", topic: "prevention", question: "none" }) } }] }));
  vi.stubGlobal("fetch", fetchMock);
  await classifyWithGroq("test-only", "openai/gpt-oss-20b", ["consulta ficticia"]);
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ reasoning_effort: "low", include_reasoning: false });
});
