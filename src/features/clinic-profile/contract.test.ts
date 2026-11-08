import { describe, expect, it } from "vitest";
import { profileInput } from "./contract";

const draft = {
  revision: 0, name: "Clínica veterinaria", address: null, city: "Ica", phone: null,
  description: null, services: [], hours: [],
};

describe("clinic profile", () => {
  it("allows a draft with the existing required identity fields", () => {
    expect(profileInput.parse(draft)).toEqual(draft);
  });

  it("accepts adjoining intervals, distinct days and closing at midnight", () => {
    expect(profileInput.safeParse({ ...draft, hours: [
      { day: 1, start: "12:00", end: "24:00" },
      { day: 2, start: "08:00", end: "18:00" },
      { day: 1, start: "09:00", end: "12:00" },
    ] }).success).toBe(true);
  });

  it.each([
    [{ day: 1, start: "08:00", end: "18:00" }, { day: 1, start: "09:00", end: "10:00" }],
    [{ day: 1, start: "09:00", end: "09:00" }],
    [{ day: 1, start: "22:00", end: "01:00" }],
    [{ day: 1, start: "24:00", end: "24:00" }],
    [{ day: 8, start: "09:00", end: "18:00" }],
  ])("rejects an invalid weekly schedule", (...hours) => {
    expect(profileInput.safeParse({ ...draft, hours }).success).toBe(false);
  });

  it.each([
    { revision: -1 }, { name: "Clínica\tprueba" }, { city: "Lima" }, { phone: "+51 999123456" },
    { address: "A" }, { description: "Breve" }, { services: [" Consulta ", "consulta"] },
  ])("rejects malformed profile data", (invalid) => {
    expect(profileInput.safeParse({ ...draft, ...invalid }).success).toBe(false);
  });
});
