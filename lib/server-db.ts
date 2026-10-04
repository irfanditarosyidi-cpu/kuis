const DATABASE_URL = "https://tesis-5c7ab-default-rtdb.asia-southeast1.firebasedatabase.app";

function pathUrl(path: string) {
  const clean = path.replace(/^\/+|\/+$/g, "");
  const auth = process.env.FIREBASE_DATABASE_AUTH;
  return `${DATABASE_URL}/${clean}.json${auth ? `?auth=${encodeURIComponent(auth)}` : ""}`;
}

export async function dbGet<T>(path: string): Promise<T | null> {
  const response = await fetch(pathUrl(path), { cache: "no-store" });
  if (!response.ok) throw new Error(`Firebase read failed (${response.status})`);
  return response.json();
}

export async function dbPut(path: string, value: unknown) {
  const response = await fetch(pathUrl(path), {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value),
  });
  if (!response.ok) throw new Error(`Firebase write failed (${response.status})`);
  return response.json();
}

export async function dbPatch(path: string, value: unknown) {
  const response = await fetch(pathUrl(path), {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value),
  });
  if (!response.ok) throw new Error(`Firebase update failed (${response.status})`);
  return response.json();
}

export async function dbDelete(path: string) {
  const response = await fetch(pathUrl(path), { method: "DELETE" });
  if (!response.ok) throw new Error(`Firebase delete failed (${response.status})`);
}

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function uid(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}
