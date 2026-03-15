/**
 * useGenerateContent — React Query-powered hook for AI content generation.
 *
 * Wraps the API service call, provides loading/error/data states,
 * and integrates with TanStack Query for caching and deduplication.
 */

import { useMutation } from "@tanstack/react-query";
import { generateContent } from "../services/api";
import type { GeneratedContent } from "../types/content";

interface GenerateInput {
  topic: string;
  uid?: string;
  email?: string;
  display_name?: string;
}

/**
 * Custom hook to trigger content generation.
 *
 * Usage:
 * ```tsx
 * const { mutate, data, isPending, error } = useGenerateContent();
 * mutate({ topic: "morning routine tips", uid: "abc123" });
 * ```
 */
export function useGenerateContent() {
  return useMutation<GeneratedContent, Error, GenerateInput>({
    /** Maps the input object to the API request shape. */
    mutationFn: (input: GenerateInput) => generateContent(input),
  });
}
