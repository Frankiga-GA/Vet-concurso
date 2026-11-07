import { describe, expect, it } from "vitest";
import { createSubmissionKeys, parseApplication, submissionKeySchema, submissionSlot } from "./submission";

function validForm() {
  const data = new FormData();
  data.set("businessName", " Veterinaria Sol ");
  data.set("city", "Ica");
  data.set("contactName", " Ana Pérez ");
  data.set("contactEmail", " ANA@EXAMPLE.COM ");
  data.set("contactPhone", "+51 999 111 222");
  return data;
}

describe("clinic applications", () => {
  it("normalizes names and email before submission", () => {
    expect(parseApplication(validForm()).data).toMatchObject({
      businessName: "Veterinaria Sol",
      contactName: "Ana Pérez",
      contactEmail: "ana@example.com",
    });
  });

  it.each([
    ["businessName", "   "],
    ["city", "Lima"],
    ["contactName", ""],
    ["contactEmail", "invalid"],
    ["contactPhone", "+++++++"],
  ])("rejects invalid %s", (field, value) => {
    const data = validForm();
    data.set(field, value);
    expect(parseApplication(data).success).toBe(false);
  });

  it("reuses an unconfirmed key after reloading and rotates it after success", () => {
    const stored = new Map<string, string>();
    const storage = {
      getItem: (slot: string) => stored.get(slot) ?? null,
      setItem: (slot: string, key: string) => { stored.set(slot, key); },
      removeItem: (slot: string) => { stored.delete(slot); },
    };
    const first = createSubmissionKeys(storage).get("draft");
    const reloaded = createSubmissionKeys(storage);
    expect(submissionKeySchema.safeParse(first).success).toBe(true);
    expect(reloaded.get("draft")).toBe(first);
    reloaded.complete("draft");
    expect(createSubmissionKeys(storage).get("draft")).not.toBe(first);
  });

  it("separates drafts by user and normalized data", async () => {
    const form = validForm();
    const application = parseApplication(form).data!;
    const first = await submissionSlot("first-user", application);
    form.set("contactEmail", "ana@example.com");
    expect(await submissionSlot("first-user", parseApplication(form).data!)).toBe(first);
    expect(await submissionSlot("other-user", application)).not.toBe(first);
    expect(await submissionSlot("first-user", { ...application, city: "Pisco" })).not.toBe(first);
    expect(first).not.toContain(application.contactEmail);
  });

  it("reuses the key in memory if browser storage is unavailable", () => {
    const keys = createSubmissionKeys(undefined);
    expect(keys.get("draft")).toBe(keys.get("draft"));
  });
});
