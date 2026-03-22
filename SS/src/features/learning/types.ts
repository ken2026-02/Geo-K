import { z } from "zod";

export const learningItemTypes = ["word", "phrase", "sentence", "concept"] as const;

export type LearningItemType = (typeof learningItemTypes)[number];

export const learningItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(learningItemTypes),
  content: z.string().min(1),
  meaning: z.string().optional(),
  example: z.string().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source_report: z.string().optional()
}).passthrough();

export const learningPackV1Schema = z.object({
  schema_version: z.literal("1.0"),
  pack_id: z.string().min(1),
  source_report: z.record(z.unknown()).optional(),
  items: z.array(learningItemSchema)
}).passthrough();

export type LearningPackV1 = z.infer<typeof learningPackV1Schema>;
export type LearningPackItem = z.infer<typeof learningItemSchema>;
