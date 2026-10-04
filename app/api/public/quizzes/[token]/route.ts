import { dbGet } from "@/lib/server-db";
import type { PublicQuiz, Question } from "@/lib/types";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const quiz = await dbGet<PublicQuiz & { teacherId?: string }>(`quizAccess/${token}`);
    if (!quiz) return Response.json({ error: "Kuis tidak ditemukan atau tautan tidak valid." }, { status: 404 });
    const raw = await dbGet<Record<string, Omit<Question, "id">>>(`publicQuestions/${quiz.quizId}`) || {};
    const questions = Object.entries(raw)
      .map(([id, value]) => {
        const { correctAnswer: _hidden, ...safe } = value;
        return { id, ...safe };
      })
      .sort((a, b) => a.order - b.order);
    const { teacherId: _teacherId, ...safeQuiz } = quiz;
    return Response.json({ quiz: { ...safeQuiz, questionCount: questions.length }, questions }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "Tidak dapat memuat kuis. Coba lagi sebentar." }, { status: 500 });
  }
}
