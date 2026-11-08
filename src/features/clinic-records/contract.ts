import { z } from "zod";
import { limaToday } from "./date";

const text = (min: number, max: number) => z.string().trim().min(min).max(max).refine((value) => !/\p{Cc}/u.test(value));
const optional = <T extends z.ZodType>(schema: T) => z.union([z.literal("").transform(() => null), schema]);
const keys = { recordId: z.uuid(), allowSimilar: z.boolean() };

export const clientInput = z.object({
  ...keys, name: text(2, 180),
  phone: text(6, 32).transform((value) => value.replace(/[ ()-]/g, "")).pipe(z.string().regex(/^\+?[0-9]{6,15}$/)),
  email: optional(z.string().trim().toLowerCase().max(254).pipe(z.email())),
});
export const patientInput = z.object({
  ...keys, name: text(1, 120), species: text(2, 60), breed: optional(text(1, 120)),
  sex: optional(z.enum(["male", "female", "unknown"])),
  birthDate: optional(z.iso.date().refine((date) => date >= "1900-01-01" && date <= limaToday())),
});
export const searchInput = text(0, 120);
export const listedClient = z.object({ id: z.uuid(), full_name: z.string(), phone: z.string() });
export const clientDetail = listedClient.extend({ email: z.string().nullable() });
export const listedPatient = z.object({
  id: z.uuid(), name: z.string(), species: z.string(), breed: z.string().nullable(),
  sex: z.string().nullable(), birth_date: z.string().nullable(),
});
export type RecordResult = { message?: string; similar?: boolean };
export type SearchResult = { rows: z.infer<typeof listedClient>[]; message?: string };
