const PROTOCOL_HTTP = "http://";
const PROTOCOL_HTTPS = "https://";

export function normalizeUrl(url: string): string {
  if (!url || typeof url !== "string") {
    throw new Error("URL must be a non-empty string");
  }

  const trimmedUrl = url.trim();
  
  if (!trimmedUrl) {
    throw new Error("URL cannot be empty after trimming");
  }

  if (trimmedUrl.startsWith(PROTOCOL_HTTP) || trimmedUrl.startsWith(PROTOCOL_HTTPS)) {
    return trimmedUrl;
  }

  return PROTOCOL_HTTP + trimmedUrl;
}