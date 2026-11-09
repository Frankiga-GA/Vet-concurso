import { describe, expect, it } from "vitest";
import {
  createAgroFarmSchema,
  createAgroHerdSchema,
  agroFarmListSchema,
  agroHerdListSchema,
  AGRO_SPECIES,
  AGRO_HOLDING_TYPES,
} from "./contract";

describe("VetIA Agro schemas", () => {
  it("validates valid farm input", () => {
    const input = {
      name: "Fundo El Olivar",
      holding_type: "lecheria",
      province: "Chincha",
      district: "Chincha Baja",
      address_reference: "Km 200 Panamericana",
      senasa_code: "PE-110201-99",
    };
    const parsed = createAgroFarmSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid holding type or missing district", () => {
    const input = {
      name: "Fundo Invalido",
      holding_type: "inexistente",
      province: "Chincha",
      district: "",
    };
    const parsed = createAgroFarmSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it("validates herd input for all supported species", () => {
    for (const species of AGRO_SPECIES) {
      const input = {
        farm_id: "e4b52df3-34e8-4ec8-b643-9824317135f2",
        species,
        record_type: "lote",
        identifier: `Lote ${species} 01`,
        head_count: 25,
        health_status: "aparentemente_sano",
      };
      const parsed = createAgroHerdSchema.safeParse(input);
      expect(parsed.success).toBe(true);
    }
  });

  it("rejects zero or negative head count", () => {
    const input = {
      farm_id: "e4b52df3-34e8-4ec8-b643-9824317135f2",
      species: "bovino",
      record_type: "lote",
      identifier: "Lote Vacas",
      head_count: 0,
    };
    const parsed = createAgroHerdSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });
});
