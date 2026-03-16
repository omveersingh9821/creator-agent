/**
 * Application-wide configuration constants.
 *
 * Values that might change between environments (dev vs prod)
 * are centralised here so they only need updating in one place.
 */

/** Base URL of the FastAPI backend (empty = same domain on Vercel). */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "";

/** Endpoint path for structured content generation (MongoDB-backed). */
export const GENERATE_CONTENT_ENDPOINT = `${API_BASE_URL}/api/generate`;

/** Endpoint path for AI image generation. */
export const GENERATE_IMAGE_ENDPOINT = `${API_BASE_URL}/api/generate-image`;
export const TRAVEL_AGENT_ENDPOINT = `${API_BASE_URL}/api/agents/travel`;
