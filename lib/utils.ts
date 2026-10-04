export const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

export function generateToken(length = 14) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

export function formatDate(value?: number | null, withDate = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    ...(withDate ? { day: "2-digit", month: "short" } : {}),
    hour: "2-digit",
    minute: "2-digit",
    second: withDate ? undefined : "2-digit",
  }).format(new Date(value));
}

export function formatDuration(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  return `${String(minutes).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export function shuffleArray<T>(input: T[]) {
  const result = [...input];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
