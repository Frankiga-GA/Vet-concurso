import { z } from "zod";

export const petListSchema = z.array(z.object({
  id: z.uuid(),
  name: z.string(),
  species: z.string(),
  breed: z.string().nullable(),
  sex: z.string().nullable(),
  birth_date: z.iso.date().nullable(),
}));

export const ownerProfileSchema = z.object({ full_name: z.string(), phone: z.string().nullable() });
export type Pet = z.infer<typeof petListSchema>[number];
