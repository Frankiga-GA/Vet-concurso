import { describe, expect, it } from "vitest";
import { clientInput, patientInput, searchInput } from "./contract";
import { limaToday } from "./date";

const recordId = "80f52b8e-9740-4fb9-9d3e-f215452e7d47";
const client = { recordId, allowSimilar: false, name: "  Ana Prueba  ", phone: "+51 (999) 123-456", email: "ANA@example.test" };
const patient = { recordId, allowSimilar: false, name: "Luna", species: "Gato", breed: "", sex: "", birthDate: "" };

describe("clinic records", () => {
  it("normalizes names, phone punctuation and email", () => {
    expect(clientInput.parse(client)).toMatchObject({ name: "Ana Prueba", phone: "+51999123456", email: "ana@example.test" });
  });
  it("accepts no contact email and no optional patient data", () => {
    expect(clientInput.parse({ ...client, email: "" }).email).toBeNull();
    expect(patientInput.parse(patient)).toMatchObject({ breed: null, sex: null, birthDate: null });
  });
  it.each([{ phone: "999abc999" }, { email: "invalid" }, { name: "Ana\tPrueba" }, { recordId: "wrong" }])(
    "rejects malformed client data", (invalid) => {
      expect(clientInput.safeParse({ ...client, ...invalid }).success).toBe(false);
    },
  );
  it.each([{ birthDate: "2099-01-01" }, { birthDate: "2026-02-30" }, { species: "G" }, { sex: "other" }])(
    "rejects malformed patient data", (invalid) => {
      expect(patientInput.safeParse({ ...patient, ...invalid }).success).toBe(false);
    },
  );
  it("uses the Lima calendar and limits search input", () => {
    expect(limaToday(new Date("2026-11-07T01:00:00Z"))).toBe("2026-11-06");
    expect(searchInput.parse("  Luna ")).toBe("Luna");
    expect(searchInput.safeParse("a".repeat(121)).success).toBe(false);
  });
});
