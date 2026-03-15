/**
 * Application-wide configuration constants.
 *
 * Values that might change between environments (dev vs prod)
 * are centralised here so they only need updating in one place.
 */

/** Base URL of the FastAPI backend. */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

/** Endpoint path for structured content generation. */
export const GENERATE_CONTENT_ENDPOINT = "/api/generate-content";
