export function parseJwtExpMs(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (payload?.exp ?? 0) * 1000; // ms
  } catch {
    return 0;
  }
}
