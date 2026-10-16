import { apiError, authorizeAttempt } from "@/lib/attempt-auth";
import { dbGet } from "@/lib/server-db";
import type { FollowUpQuestion } from "@/lib/types";

export async function GET(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const quizId = new URL(request.url).searchParams.get("quizId") || "";
  if (!quizId) return apiError("Quiz ID diperlukan.");
  const attempt = await authorizeAttempt(request, quizId, attemptId);
  if (!attempt) return apiError("Sesi tidak valid atau telah berakhir.", 401);
  const [answers, followUpRaw] = await Promise.all([
    dbGet<Record<string, { answer: string; updatedAt: number }>>(`answers/${quizId}/${attemptId}`),
    attempt.status === "submitted" && attempt.followUp
      ? dbGet<Record<string, Omit<FollowUpQuestion, "id">>>(`followUpQuestions/${quizId}/${attempt.followUp}`)
      : Promise.resolve(null),
  ]);
  const followUpQuestions = Object.entries(followUpRaw || {})
    .map(([id, value]) => ({ id, ...value }))
    .sort((first, second) => first.order - second.order);
  const { sessionTokenHash: _, ...safeAttempt } = attempt;
  return Response.json({ attempt: { ...safeAttempt, id: attemptId }, answers: answers || {}, followUpQuestions });
}
