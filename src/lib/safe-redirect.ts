/** Only same-site paths may be used as a post-login destination; anything else falls back to the account page. */
export function safeRedirect(value: unknown, fallback = "/account"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (value.startsWith("/auth") || value.startsWith("/reset-password")) return fallback;
  return value;
}
