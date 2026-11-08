import { z } from "zod";
import { cities } from "@/features/appointments/contract";

export const maxMessageLength = 600;
export const maxContextMessages = 4;
export const assistantInput = z.strictObject({
  messages: z.array(z.string().trim().min(3).max(maxMessageLength)).min(1).max(maxContextMessages),
  city: z.enum(cities).nullable(),
  token: z.string().max(2048),
});
export const levels = ["urgent", "consult", "clarify", "general"] as const;
export const topics = ["general", "digestive", "skin", "mobility", "prevention", "outside_scope"] as const;
export const questions = ["none", "animal", "onset", "change"] as const;
export const classification = z.strictObject({ level: z.enum(levels), topic: z.enum(topics), question: z.enum(questions) });
export const publicSuggestion = z.object({
  slug: z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string(), city: z.enum(cities),
});
export const assistantReply = z.object({
  source: z.enum(["assistant", "safety"]),
  urgent: z.boolean(), text: z.string(), question: z.string().nullable(),
  clinics: z.array(publicSuggestion).max(3),
});
export type AssistantReply = z.infer<typeof assistantReply>;
