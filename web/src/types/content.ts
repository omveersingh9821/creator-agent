/**
 * TypeScript interfaces and Zod schemas for the generated content.
 *
 * Zod is used for runtime validation of API responses, while the
 * TypeScript interface provides compile-time type safety.
 */

import { z } from "zod";

/** Zod schema that validates the backend response shape. */
export const GeneratedContentSchema = z.object({
  caption: z.string(),
  hashtags: z.array(z.string()),
  reel_script: z.string(),
  image_idea: z.string(),
  blog: z.string(),
});

/** TypeScript type inferred from the Zod schema — single source of truth. */
export type GeneratedContent = z.infer<typeof GeneratedContentSchema>;

/** Shape of the request body sent to the backend. */
export interface GenerateRequest {
  topic: string;
}
