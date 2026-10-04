import type { Attempt } from "@/lib/types";
import { dbGet, sha256 } from "@/lib/server-db";

export async function authorizeAttempt(request: Request, quizId: string, attemptId: string) {
  const token = request.headers.get("x-session-token") || "";
  if (!token) return null;
  const attempt = await dbGet<Attempt>(`attempts/${quizId}/${attemptId}`);
  if (!attempt || attempt.sessionTokenHash !== await sha256(token)) return null;
  return attempt;
}

export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
