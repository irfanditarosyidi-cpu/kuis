import { apiError, authorizeAttempt } from "@/lib/attempt-auth";
import { dbGet } from "@/lib/server-db";

export async function GET(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const quizId = new URL(request.url).searchParams.get("quizId") || "";
  if (!quizId) return apiError("Quiz ID diperlukan.");
  const attempt = await authorizeAttempt(request, quizId, attemptId);
  if (!attempt) return apiError("Sesi tidak valid atau telah berakhir.", 401);
  const answers = await dbGet<Record<string, { answer: string; updatedAt: number }>>(`answers/${quizId}/${attemptId}`) || {};
  const { sessionTokenHash: _, ...safeAttempt } = attempt;
  return Response.json({ attempt: { ...safeAttempt, id: attemptId }, answers });
}
