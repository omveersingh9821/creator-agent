/**
 * Formatting and parsing utility helpers.
 */

/**
 * Copies the given text to the clipboard.
 * Returns `true` on success, `false` on failure.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Truncates a string to a maximum length, appending "…" if truncated.
 */
export function truncate(str: string, maxLen = 120): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + "…";
}
