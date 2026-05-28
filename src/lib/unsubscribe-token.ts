import { createHmac, timingSafeEqual } from "node:crypto";

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

export function mintUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) throw new Error("UNSUBSCRIBE_SECRET is not set");
  return createHmac("sha256", secret).update(normalize(email)).digest("base64url");
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  try {
    const expected = Buffer.from(mintUnsubscribeToken(email), "base64url");
    const provided = Buffer.from(token, "base64url");
    if (expected.length !== provided.length) return false;
    return timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

export function buildUnsubscribeUrl(email: string, origin = "https://hsukenooi.com"): string {
  const token = mintUnsubscribeToken(email);
  return `${origin}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}
