/**
 * Safe API Client Utility for StudyHQ
 * Prevents unhandled HTML fallback / JSON syntax errors and standardizes error messages.
 */

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;

    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // fallback
      }
    } else {
      try {
        const rawText = await response.text();
        if (
          response.status === 503 ||
          rawText.includes("503") ||
          rawText.includes("UNAVAILABLE") ||
          rawText.includes("high demand")
        ) {
          errorMessage = "The AI service is currently busy. Please try again in a few moments.";
        } else if (response.status === 504 || response.status === 502) {
          errorMessage = "Service connection timed out. Please try again.";
        } else if (rawText.length > 0 && rawText.length < 160 && !rawText.includes("<")) {
          errorMessage = rawText;
        }
      } catch {
        // ignore
      }
    }

    throw new Error(errorMessage);
  }

  // If response is OK, ensure body is valid JSON
  if (!isJson) {
    const rawText = await response.text();
    if (rawText.trim().startsWith("<") || rawText.includes("<!doctype") || rawText.includes("<html")) {
      throw new Error("Server returned an unexpected HTML response. Please try again in a moment.");
    }
    try {
      return JSON.parse(rawText) as T;
    } catch {
      throw new Error("Received an unexpected format from the server. Please try again.");
    }
  }

  return (await response.json()) as T;
}
