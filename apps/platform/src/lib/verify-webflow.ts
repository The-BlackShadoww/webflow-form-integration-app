import crypto from "crypto";

/**
 * Verify a Webflow webhook delivery.
 * - HMAC-SHA256 over `${timestamp}:${rawBody}` using the OAuth app client secret
 * - Rejects if timestamp is older than 5 minutes (replay protection)
 * - Pass the *raw* request body string, NOT parsed JSON
 */
export function verifyWebflowSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  secret: string,
): boolean {
  if (!signature || !timestamp) return false;
  // Webflow v2 sends `x-webflow-timestamp` in milliseconds (13-digit value).
  // Tolerate a seconds-based timestamp too, in case a future version switches.
  const ts = parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) return false;
  const tsMs = ts < 1e12 ? ts * 1000 : ts;
  if (Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) return false;
  const signed = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}:${rawBody}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signed), Buffer.from(signature));
  } catch {
    return false;
  }
}
