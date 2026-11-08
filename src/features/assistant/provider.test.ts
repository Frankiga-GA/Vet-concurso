import { afterEach, expect, it, vi } from "vitest";
import { classifyWithOpenAI } from "./provider";

vi.mock("server-only", () => ({}));
afterEach(() => vi.unstubAllGlobals());

it("sends bounded structured classification to Responses without tools or stored state", async () => {
  const output = { level: "consult", topic: "digestive", question: "onset" };
  const fetchMock = vi.fn().mockResolvedValue(Response.json({
    status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(output) }] }],
  }));
  vi.stubGlobal("fetch", fetchMock);
  expect(await classifyWithOpenAI("test-only", "test-model", ["Mi perro vomitó."])).toEqual(output);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe("https://api.openai.com/v1/responses");
  const body = JSON.parse(options.body);
  expect(body).toMatchObject({ store: false, max_output_tokens: 256, text: { format: { type: "json_schema", strict: true } } });
  expect(body).not.toHaveProperty("tools");
  expect(body).not.toHaveProperty("previous_response_id");
});

it.each([
  { status: "incomplete", output: [] },
  { status: "completed", output: [{ type: "message", content: [{ type: "refusal" }] }] },
  { status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "{invalid" }] }] },
])("fails closed for malformed, refused or incomplete provider output", async (body) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
  expect(await classifyWithOpenAI("test-only", "test-model", ["consulta ficticia"])).toBeNull();
});
