/**
 * API service layer — all backend communication lives here.
 *
 * Uses Axios for HTTP and Zod for runtime response validation so
 * any shape mismatch with the backend is caught immediately.
 */

import axios from "axios";
import { API_BASE_URL, GENERATE_CONTENT_ENDPOINT } from "../constants/config";
import {
  GeneratedContentSchema,
  type GeneratedContent,
  type GenerateRequest,
} from "../types/content";

/** Pre-configured Axios instance pointing at the backend API. */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 120_000, // LLM agent calls can take a while
});

/**
 * Calls the backend to generate Instagram content for a given topic.
 *
 * @param request – Object containing the topic string.
 * @returns Validated `GeneratedContent` object.
 */
export async function generateContent(
  request: GenerateRequest
): Promise<GeneratedContent> {
  const { data } = await apiClient.post(GENERATE_CONTENT_ENDPOINT, request);

  // Runtime validation — guarantees the response matches our schema
  return GeneratedContentSchema.parse(data);
}
