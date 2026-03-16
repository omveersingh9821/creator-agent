/**
 * useGenerateImage — React Query-powered hook for AI image generation.
 *
 * Wraps the API service call, provides loading/error/data states,
 * and integrates with TanStack Query for caching and deduplication.
 */

import { useMutation } from "@tanstack/react-query";
import { generateImage, type ImageGenResponse } from "../services/api";

/**
 * Custom hook to trigger image generation.
 *
 * Usage:
 * ```tsx
 * const { mutate, data, isPending, error } = useGenerateImage();
 * mutate("a sunset over mountains");
 * ```
 */
export function useGenerateImage() {
  return useMutation<ImageGenResponse, Error, string>({
    mutationFn: (prompt: string) => generateImage(prompt),
  });
}
