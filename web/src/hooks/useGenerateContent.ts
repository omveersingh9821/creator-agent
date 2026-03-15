/**
 * useGenerateContent — React Query-powered hook for AI content generation.
 *
 * Wraps the API service call, provides loading/error/data states,
 * and integrates with TanStack Query for caching and deduplication.
 */

import { useMutation } from "@tanstack/react-query";
import { generateContent } from "../services/api";
import type { GeneratedContent } from "../types/content";

/**
 * Custom hook to trigger content generation.
 *
 * Usage:
 * ```tsx
 * const { mutate, data, isPending, error } = useGenerateContent();
 * mutate("morning routine tips");
 * ```
 */
export function useGenerateContent() {
  return useMutation<GeneratedContent, Error, string>({
    /** Maps the topic string to the API request shape. */
    mutationFn: (topic: string) => generateContent({ topic }),
  });
}
