// src/utils/jwt.ts
export function parseJwtExpMs(token: string): number {
  try {
    const payload = decodeJwtPayload(token);
    return (payload?.exp ?? 0) * 1000;
  } catch {
    return 0;
  }
}

function decodeJwtPayload(token: string): any {
  const part = token.split(".")[1];
  if (!part) throw new Error("invalid token");
  // JWT usa base64url; normalize + padding
  const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? 4 - (b64.length % 4) : 0;
  const fixed = b64 + "=".repeat(pad);
  const json = atob(fixed);
  return JSON.parse(json);
}
