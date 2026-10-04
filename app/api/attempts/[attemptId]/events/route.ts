import { z } from "zod";
import { apiError, authorizeAttempt } from "@/lib/attempt-auth";
import { dbGet, dbPatch, dbPut, uid } from "@/lib/server-db";
import type { ActivityLog } from "@/lib/types";

const schema = z.object({ quizId: z.string().min(1), type: z.enum(["tab_hidden", "window_blur", "page_unload", "page_return", "page_reload"]), timestamp: z.number() });

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await params;
    const body = schema.parse(await request.json());
    const attempt = await authorizeAttempt(request, body.quizId, attemptId);
    if (!attempt) return apiError("Sesi tidak valid.", 401);
    if (attempt.status !== "in_progress") return Response.json({ recorded: false });
    const logs = await dbGet<Record<string, Omit<ActivityLog, "id">>>(`activityLogs/${body.quizId}/${attemptId}`) || {};
    const latest = Object.values(logs).sort((a, b) => b.timestamp - a.timestamp)[0];
    const leaveType = body.type === "tab_hidden" || body.type === "window_blur";
    const isDuplicate = latest && leaveType && (latest.type === "tab_hidden" || latest.type === "window_blur") && body.timestamp - latest.timestamp < 1800;
    if (isDuplicate) return Response.json({ recorded: false, deduplicated: true });
    await dbPut(`activityLogs/${body.quizId}/${attemptId}/${uid("evt")}`, { type: body.type, timestamp: body.timestamp });
    await dbPatch(`attempts/${body.quizId}/${attemptId}`, { ...(leaveType ? { leaveCount: (attempt.leaveCount || 0) + 1 } : {}), lastSeenAt: Date.now() });
    return Response.json({ recorded: true });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Event tidak valid.");
    return apiError("Event belum tercatat.", 500);
  }
}
