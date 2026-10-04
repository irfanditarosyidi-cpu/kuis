import { z } from "zod";
import { dbGet, dbPut, sha256, uid } from "@/lib/server-db";
import type { Attempt, PublicQuiz } from "@/lib/types";

const schema = z.object({
  accessToken: z.string().min(8).max(80),
  student: z.object({ name: z.string().trim().min(2).max(80), attendanceNumber: z.string().trim().min(1).max(20), className: z.string().trim().min(1).max(40) }),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const quiz = await dbGet<PublicQuiz>(`quizAccess/${body.accessToken}`);
    if (!quiz) return Response.json({ error: "Tautan kuis tidak valid." }, { status: 404 });
    if (quiz.status !== "active") return Response.json({ error: quiz.status === "closed" ? "Kuis sudah ditutup oleh guru." : "Kuis belum dapat dikerjakan." }, { status: 403 });
    const existing = await dbGet<Record<string, Attempt>>(`attempts/${quiz.quizId}`) || {};
    const duplicate = Object.entries(existing).find(([, attempt]) => attempt.status === "submitted" && attempt.student.name.toLowerCase() === body.student.name.toLowerCase() && attempt.student.attendanceNumber.toLowerCase() === body.student.attendanceNumber.toLowerCase() && attempt.student.className.toLowerCase() === body.student.className.toLowerCase());
    if (duplicate) return Response.json({ error: "Identitas ini sudah pernah menyelesaikan kuis." }, { status: 409 });
    const attemptId = uid("att");
    const sessionToken = `${uid("ses")}${uid("")}`;
    const startedAt = Date.now();
    const attempt: Omit<Attempt, "id"> = {
      quizId: quiz.quizId, student: body.student, status: "in_progress", startedAt, submittedAt: null,
      progress: { answered: 0, total: quiz.questionCount }, score: null, correctCount: null, incorrectCount: null,
      followUp: null, leaveCount: 0, sessionTokenHash: await sha256(sessionToken), lastSeenAt: startedAt,
    };
    await dbPut(`attempts/${quiz.quizId}/${attemptId}`, attempt);
    return Response.json({ attemptId, sessionToken, quizId: quiz.quizId, startedAt });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Lengkapi identitas dengan benar." }, { status: 400 });
    return Response.json({ error: "Sesi belum dapat dibuat. Coba lagi." }, { status: 500 });
  }
}
