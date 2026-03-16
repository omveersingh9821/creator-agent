/**
 * API service layer — all backend communication lives here.
 *
 * Uses Axios for HTTP and Zod for runtime response validation so
 * any shape mismatch with the backend is caught immediately.
 */

import axios from "axios";
import { API_BASE_URL, GENERATE_CONTENT_ENDPOINT, GENERATE_IMAGE_ENDPOINT } from "../constants/config";
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
 * Now also sends user UID so results are persisted to MongoDB.
 */
export async function generateContent(
  request: GenerateRequest & { uid?: string; email?: string; display_name?: string }
): Promise<GeneratedContent> {
  const { data } = await apiClient.post(GENERATE_CONTENT_ENDPOINT, request);

  // Runtime validation — guarantees the response matches our schema
  return GeneratedContentSchema.parse(data);
}

// ── Image Generation ─────────────────────────────────────────────────────────

export interface ImageGenResponse {
  image_base64: string;
  prompt: string;
}

/** Generate an AI image from a text prompt */
export async function generateImage(prompt: string): Promise<ImageGenResponse> {
  const { data } = await apiClient.post(GENERATE_IMAGE_ENDPOINT, { prompt });
  return data;
}

// ── MongoDB-backed data fetching ─────────────────────────────────────────────


export interface GlobalUsage {
  total_requests: number;
  total_tokens_estimated: number;
  estimated_cost_usd: number;
  model: string;
}

export interface UserRequest {
  topic: string;
  timestamp: string;
}

export interface UserRequestsResponse {
  recent_requests: UserRequest[];
  total_requests: number;
  email?: string;
  display_name?: string;
}

export interface UserResult {
  topic: string;
  caption: string;
  hashtags: string[];
  reel_script: string;
  image_idea: string;
  blog: string;
  created_at: string;
}

export interface UserResultsResponse {
  recent_results: UserResult[];
}

/** Fetch global API usage stats from MongoDB */
export async function fetchUsage(): Promise<GlobalUsage> {
  const { data } = await apiClient.get("/api/usage");
  return data;
}

/** Fetch recent requests for a specific user */
export async function fetchUserRequests(uid: string): Promise<UserRequestsResponse> {
  const { data } = await apiClient.get(`/api/user/${uid}/requests`);
  return data;
}

/** Fetch recent 5 results for a specific user */
export async function fetchUserResults(uid: string): Promise<UserResultsResponse> {
  const { data } = await apiClient.get(`/api/user/${uid}/results`);
  return data;
}
