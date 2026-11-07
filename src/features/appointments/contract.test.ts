import { describe, expect, it } from "vitest";
import { parseLimaTime, requestFields } from "./contract";

const now = Date.parse("2026-11-07T10:00:00Z");
describe("appointment inputs", () => {
  it("interprets the agreed time in Peru", () => {
    expect(parseLimaTime("2026-11-08T10:30", now)).toBe("2026-11-08T15:30:00.000Z");
  });

  it.each(["2026-11-07T05:00", "2026-11-31T12:00", "2027-03-01T10:30", "2026-11-08T10:30Z", "x"])("rejects invalid or unavailable time %s", (value) => {
    expect(parseLimaTime(value, now)).toBeNull();
  });

  it("normalizes equivalent Peruvian mobile numbers for throttling", () => {
    const input = {
      clinicId: "c4400000-0000-4000-8000-000000000001",
      requestKey: "c6600000-0000-4000-8000-000000000001",
      name: "  Dueño de prueba ", reason: "Control veterinario",
      preferred: "2026-11-08T10:30", token: "fixture",
    };
    for (const phone of ["999 111 222", "51999111222", "+51 (999) 111-222"]) {
      expect(requestFields.parse({ ...input, phone })).toMatchObject({ phone: "+51999111222", name: "Dueño de prueba" });
    }
    expect(requestFields.safeParse({ ...input, phone: "999-abc" }).success).toBe(false);
  });
});
