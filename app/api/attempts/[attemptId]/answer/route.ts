import { z } from "zod";
import { apiError, authorizeAttempt } from "@/lib/attempt-auth";
import { dbGet, dbPatch, dbPut } from "@/lib/server-db";

const schema = z.object({ quizId: z.string().min(1), questionId: z.string().min(1), answer: z.enum(["A", "B", "C", "D", "E"]), total: z.number().int().positive() });

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await params;
    const body = schema.parse(await request.json());
    const attempt = await authorizeAttempt(request, body.quizId, attemptId);
    if (!attempt) return apiError("Sesi tidak valid.", 401);
    if (attempt.status !== "in_progress") return apiError("Jawaban sudah dikunci.", 409);
    await dbPut(`answers/${body.quizId}/${attemptId}/${body.questionId}`, { answer: body.answer, updatedAt: Date.now() });
    const answers = await dbGet<Record<string, unknown>>(`answers/${body.quizId}/${attemptId}`) || {};
    await dbPatch(`attempts/${body.quizId}/${attemptId}`, { progress: { answered: Object.keys(answers).length, total: body.total }, lastSeenAt: Date.now() });
    return Response.json({ saved: true, answered: Object.keys(answers).length });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Jawaban tidak valid.");
    return apiError("Jawaban belum tersimpan.", 500);
  }
}
