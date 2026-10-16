import { z } from "zod";
import { apiError, authorizeAttempt } from "@/lib/attempt-auth";
import { dbGet, dbPatch } from "@/lib/server-db";
import type { FollowUpCategory, FollowUpQuestion, PublicQuiz, Question } from "@/lib/types";

const schema = z.object({ quizId: z.string().min(1) });

async function getFollowUpQuestions(quizId: string, category: FollowUpCategory) {
  const raw = await dbGet<Record<string, Omit<FollowUpQuestion, "id">>>(`followUpQuestions/${quizId}/${category}`);
  return Object.entries(raw || {})
    .map(([id, value]) => ({ id, ...value }))
    .sort((first, second) => first.order - second.order);
}

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await params;
    const body = schema.parse(await request.json());
    const attempt = await authorizeAttempt(request, body.quizId, attemptId);
    if (!attempt) return apiError("Sesi tidak valid.", 401);
    if (attempt.status === "submitted" && attempt.followUp) {
      const { sessionTokenHash: _, ...safeAttempt } = attempt;
      return Response.json({ attempt: { ...safeAttempt, id: attemptId }, followUpQuestions: await getFollowUpQuestions(body.quizId, attempt.followUp) });
    }
    const [questionsRaw, answers, quiz] = await Promise.all([
      dbGet<Record<string, Omit<Question, "id">>>(`questions/${body.quizId}`),
      dbGet<Record<string, { answer: string }>>(`answers/${body.quizId}/${attemptId}`),
      dbGet<PublicQuiz>(`quizAccessById/${body.quizId}`),
    ]);
    const questions = Object.entries(questionsRaw || {}).map(([id, value]) => ({ id, ...value }));
    if (!questions.length) return apiError("Kunci penilaian tidak ditemukan.", 500);
    let earned = 0; let totalWeight = 0; let correctCount = 0;
    for (const question of questions) {
      totalWeight += Number(question.weight || 1);
      if (answers?.[question.id]?.answer === question.correctAnswer) { earned += Number(question.weight || 1); correctCount += 1; }
    }
    const score = Math.round((earned / totalWeight) * 10000) / 100;
    const quizFallback = await dbGet<{ passingScore: number }>(`quizzes/${body.quizId}`);
    const passingScore = quiz?.passingScore ?? quizFallback?.passingScore ?? 75;
    const followUp: FollowUpCategory = score >= passingScore ? "PENGAYAAN" : "REMEDIAL";
    const result = { status: "submitted", submittedAt: Date.now(), progress: { answered: Object.keys(answers || {}).length, total: questions.length }, score, correctCount, incorrectCount: questions.length - correctCount, followUp, lastSeenAt: Date.now() } as const;
    await dbPatch(`attempts/${body.quizId}/${attemptId}`, result);
    return Response.json({ attempt: { ...attempt, ...result, id: attemptId, sessionTokenHash: undefined }, followUpQuestions: await getFollowUpQuestions(body.quizId, followUp) });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Permintaan tidak valid.");
    return apiError("Kuis belum dapat dikumpulkan. Coba lagi.", 500);
  }
}
