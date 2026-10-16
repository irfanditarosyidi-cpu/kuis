"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle, ArrowLeft, ArrowRight, BookOpenCheck, Check, CheckCircle2, Clock3,
  Download, FileQuestion, GraduationCap, LoaderCircle, LockKeyhole, RotateCcw, Save, Send,
  ShieldCheck, Sparkles, Trophy, UserRound, XCircle,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { OrbitalText } from "@/components/OrbitalText";
import { buildFollowUpPdfDefinition, followUpPdfFileName } from "@/lib/follow-up-pdf";
import type { ActivityLog, Attempt, FollowUpQuestion, PublicQuiz, Question, StudentIdentity } from "@/lib/types";
import { formatDuration, shuffleArray } from "@/lib/utils";

type PublicQuestion = Omit<Question, "correctAnswer">;
type QuizPayload = { quiz: PublicQuiz; questions: PublicQuestion[] };
type Session = { attemptId: string; sessionToken: string; quizId: string; startedAt: number };
type Phase = "loading" | "access" | "playing" | "result" | "error";

const activityNames: Record<ActivityLog["type"], ActivityLog["type"]> = {
  tab_hidden: "tab_hidden", window_blur: "window_blur", page_unload: "page_unload", page_return: "page_return", page_reload: "page_reload",
};

export default function StudentQuizPage() {
  const { token } = useParams<{ token: string }>();
  const [phase, setPhase] = useState<Phase>("loading");
  const [payload, setPayload] = useState<QuizPayload | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [resumeSession, setResumeSession] = useState<Session | null>(null);
  const [identity, setIdentity] = useState<StudentIdentity>({ name: "", attendanceNumber: "", className: "" });
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitConfirmationOpen, setSubmitConfirmationOpen] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "offline">("saved");
  const lastLeaveAt = useRef(0);
  const submitting = useRef(false);
  const trackingPaused = useRef(false);
  const storageKey = `ruangtuntas_session_${token}`;

  const resetDeletedSession = useCallback(() => {
    localStorage.removeItem(storageKey);
    setSession(null);
    setResumeSession(null);
    setAttempt(null);
    setFollowUpQuestions([]);
    setAnswers({});
    setCurrent(0);
    setRemaining(null);
    setSaveState("saved");
    setSubmitConfirmationOpen(false);
    submitting.current = false;
    trackingPaused.current = false;
    setError("Sesi ini telah dihapus oleh guru. Silakan mulai kembali.");
    setPhase("access");
  }, [storageKey]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`/api/public/quizzes/${token}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setPayload(data);
        setQuestions(data.questions);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as Session;
          const resume = await fetch(`/api/attempts/${parsed.attemptId}?quizId=${parsed.quizId}`, { headers: { "x-session-token": parsed.sessionToken } });
          if (resume.ok) {
            const state = await resume.json();
            setAttempt(state.attempt);
            setFollowUpQuestions(state.followUpQuestions || []);
            setIdentity(state.attempt.student);
            setAnswers(Object.fromEntries(Object.entries(state.answers || {}).map(([id, value]) => [id, (value as { answer: string }).answer])));
            setResumeSession(parsed);
            if (state.attempt.status === "submitted") { setSession(parsed); setPhase("result"); return; }
          } else localStorage.removeItem(storageKey);
        }
        setPhase("access");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Kuis tidak dapat dimuat.");
        setPhase("error");
      }
    })();
  }, [storageKey, token]);

  const startPlaying = useCallback((activeSession: Session, initialAttempt?: Attempt) => {
    if (!payload) return;
    setSession(activeSession);
    const ordered = payload.quiz.shuffleQuestions ? shuffleArray(payload.questions) : payload.questions;
    setQuestions(ordered);
    if (initialAttempt) setAttempt(initialAttempt);
    setPhase("playing");
  }, [payload]);

  async function startQuiz(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/attempts/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accessToken: token, student: identity }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const created: Session = data;
      localStorage.setItem(storageKey, JSON.stringify(created));
      setFollowUpQuestions([]);
      setAttempt({ id: created.attemptId, quizId: created.quizId, student: identity, status: "in_progress", startedAt: created.startedAt, submittedAt: null, progress: { answered: 0, total: payload?.questions.length || 0 }, score: null, correctCount: null, incorrectCount: null, followUp: null, leaveCount: 0 });
      startPlaying(created);
    } catch (startError) { setError(startError instanceof Error ? startError.message : "Sesi tidak dapat dimulai."); }
    finally { setBusy(false); }
  }

  function continueQuiz() {
    if (!resumeSession || !attempt) return;
    startPlaying(resumeSession, attempt);
  }

  const sendEvent = useCallback(async (type: ActivityLog["type"]) => {
    if (!session || phase !== "playing" || trackingPaused.current) return;
    const now = Date.now();
    if ((type === "tab_hidden" || type === "window_blur") && now - lastLeaveAt.current < 1600) return;
    if (type === "tab_hidden" || type === "window_blur") lastLeaveAt.current = now;
    try {
      await fetch(`/api/attempts/${session.attemptId}/events`, { method: "POST", keepalive: true, headers: { "content-type": "application/json", "x-session-token": session.sessionToken }, body: JSON.stringify({ quizId: session.quizId, type: activityNames[type], timestamp: now }) });
    } catch { /* activity logging is best-effort */ }
  }, [phase, session]);

  useEffect(() => {
    if (phase !== "playing") return;
    const onVisibility = () => sendEvent(document.hidden ? "tab_hidden" : "page_return");
    const onBlur = () => sendEvent("window_blur");
    const onPageHide = () => sendEvent("page_unload");
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pagehide", onPageHide);
    return () => { document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("blur", onBlur); window.removeEventListener("pagehide", onPageHide); };
  }, [phase, sendEvent]);

  const submitQuiz = useCallback(async () => {
    if (!session || submitting.current) return;
    trackingPaused.current = true;
    submitting.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/attempts/${session.attemptId}/submit`, { method: "POST", headers: { "content-type": "application/json", "x-session-token": session.sessionToken }, body: JSON.stringify({ quizId: session.quizId }) });
      const data = await response.json();
      if (response.status === 401) { resetDeletedSession(); return; }
      if (!response.ok) throw new Error(data.error);
      setSubmitConfirmationOpen(false); setAttempt(data.attempt); setFollowUpQuestions(data.followUpQuestions || []); setPhase("result");
    } catch (submitError) { setSubmitConfirmationOpen(false); setError(submitError instanceof Error ? submitError.message : "Jawaban belum dapat dikumpulkan."); submitting.current = false; trackingPaused.current = false; }
    finally { setBusy(false); }
  }, [answers, questions.length, resetDeletedSession, session]);

  useEffect(() => {
    if (phase !== "playing" || !payload?.quiz.durationMinutes || !session) { setRemaining(null); return; }
    const deadline = session.startedAt + payload.quiz.durationMinutes * 60_000;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) submitQuiz();
    };
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [payload?.quiz.durationMinutes, phase, session, submitQuiz]);

  async function chooseAnswer(questionId: string, answer: string) {
    if (!session || attempt?.status === "submitted") return;
    setAnswers((state) => ({ ...state, [questionId]: answer })); setSaveState("saving");
    try {
      const response = await fetch(`/api/attempts/${session.attemptId}/answer`, { method: "POST", headers: { "content-type": "application/json", "x-session-token": session.sessionToken }, body: JSON.stringify({ quizId: session.quizId, questionId, answer, total: questions.length }) });
      if (response.status === 401) { resetDeletedSession(); return; }
      if (!response.ok) throw new Error();
      setSaveState("saved");
    } catch { setSaveState("offline"); }
  }

  const answeredCount = Object.keys(answers).length;
  const optionEntries = useMemo(() => {
    const question = questions[current];
    if (!question) return [];
    const values = Object.entries(question.options) as Array<[string, string]>;
    return payload?.quiz.shuffleOptions ? shuffleArray(values) : values;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, questions, payload?.quiz.shuffleOptions]);

  if (phase === "loading") return <StudentChrome><div className="status-page"><div className="status-card"><LoaderCircle className="spin" size={32} style={{ color: "var(--green)" }} /><p className="muted">Menyiapkan kuis…</p></div></div></StudentChrome>;
  if (phase === "error" || !payload) return <StudentChrome><StatusCard icon={<AlertCircle size={38} />} title="Kuis tidak tersedia" text={error || "Kuis tidak ditemukan atau tautan tidak valid."} tone="error" /></StudentChrome>;
  if (phase === "result" && attempt) return <StudentChrome><ResultView attempt={attempt} quiz={payload.quiz} followUpQuestions={followUpQuestions} /></StudentChrome>;
  if (phase === "playing" && session && attempt) {
    const question = questions[current];
    if (!question) return <StudentChrome><StatusCard icon={<FileQuestion size={38} />} title="Soal belum tersedia" text="Guru belum menambahkan soal ke kuis ini." /></StudentChrome>;
    return <StudentChrome minimal><main className="quiz-shell rise"><div className="card quiz-topbar"><div className="quiz-user"><div className="avatar"><UserRound size={17} /></div><div><strong>{attempt.student.name}</strong><span>{payload.quiz.title}</span></div></div>{remaining !== null && <div className={`timer ${remaining <= 60 ? "urgent" : ""}`}><Clock3 size={16} />{formatDuration(remaining)}</div>}</div>
      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}
      <div className="quiz-layout"><section className="card question-card"><span className="question-count">Soal {current + 1} dari {questions.length}</span><h1 className="question-text"><OrbitalText text={question.text} /></h1><div className="answers">{optionEntries.map(([key, text]) => <label className={`answer ${answers[question.id] === key ? "selected" : ""}`} key={key}><input type="radio" name={question.id} checked={answers[question.id] === key} onChange={() => chooseAnswer(question.id, key)} /><span className="answer-letter">{key}</span><OrbitalText text={text} /></label>)}</div><div className="quiz-controls"><button className="btn btn-light" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}><ArrowLeft size={17} /><span>Sebelumnya</span></button><div>{current < questions.length - 1 ? <button className="btn btn-primary" onClick={() => setCurrent((value) => value + 1)}><span>Berikutnya</span><ArrowRight size={17} /></button> : <button className="btn btn-primary" onClick={() => { trackingPaused.current = true; setSubmitConfirmationOpen(true); }} disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}<span>Kumpulkan</span></button>}</div></div></section><aside className="quiz-side"><div className="card progress-panel"><h3>Progres pengerjaan</h3><div className="progress-bar"><span style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }} /></div><div className="progress-copy"><span>{answeredCount} soal dijawab</span><strong>{Math.round((answeredCount / questions.length) * 100)}%</strong></div><div className="question-map">{questions.map((item, index) => <button className={`q-dot ${answers[item.id] ? "answered" : ""} ${index === current ? "current" : ""}`} onClick={() => setCurrent(index)} key={item.id}>{index + 1}</button>)}</div></div><div className="card save-state">{saveState === "saving" ? <LoaderCircle className="spin" size={15} /> : saveState === "offline" ? <AlertCircle size={15} /> : <Check size={15} />}<span>{saveState === "saving" ? "Menyimpan jawaban…" : saveState === "offline" ? "Belum tersimpan — pilih ulang saat online" : "Semua jawaban tersimpan"}</span></div></aside></div>
    </main><ConfirmDialog
      open={submitConfirmationOpen}
      title="Kumpulkan jawaban?"
      description="Setelah dikumpulkan, jawaban tidak dapat diubah kembali."
      detail={<><strong>{answeredCount} dari {questions.length}</strong> soal telah dijawab.{answeredCount < questions.length && <> Masih ada {questions.length - answeredCount} soal yang belum dijawab.</>}</>}
      confirmLabel="Kumpulkan sekarang"
      loadingLabel="Mengumpulkan..."
      tone="primary"
      loading={busy}
      onConfirm={submitQuiz}
      onCancel={() => { trackingPaused.current = false; setSubmitConfirmationOpen(false); }}
    /></StudentChrome>;
  }

  if (payload.quiz.status !== "active" && !resumeSession) {
    return <StudentChrome><StatusCard icon={payload.quiz.status === "closed" ? <XCircle size={38} /> : <Clock3 size={38} />} title={payload.quiz.status === "closed" ? "Kuis sudah ditutup" : "Kuis belum dibuka"} text={payload.quiz.status === "closed" ? "Guru sudah menutup akses untuk pengerjaan baru." : "Kuis belum dapat dikerjakan. Silakan tunggu arahan guru."} tone={payload.quiz.status === "closed" ? "error" : "normal"} /></StudentChrome>;
  }

  return <StudentChrome><main className="access-shell rise"><div className="card access-card"><section className="access-intro"><div><div className="subject-icon"><GraduationCap size={26} /></div><div className="material-name">{payload.quiz.material}</div><h1>{payload.quiz.title}</h1><p>{payload.quiz.description || "Baca setiap pertanyaan dengan teliti dan pilih jawaban terbaik."}</p></div><div className="quiz-facts"><div><strong>{payload.questions.length}</strong><span>Jumlah soal</span></div><div><strong>{payload.quiz.durationMinutes ? `${payload.quiz.durationMinutes} mnt` : "∞"}</strong><span>Waktu</span></div><div><strong>{payload.quiz.passingScore}</strong><span>Nilai tuntas</span></div></div></section><section className="identity-panel"><p className="eyebrow">Sebelum dimulai</p><h2>Kenalan dulu, yuk!</h2><p className="muted">Isi identitas sesuai data kelas. Pastikan tidak ada yang keliru.</p>{resumeSession && attempt && <div style={{ padding: 14, borderRadius: 13, background: "#edf5ff", marginBottom: 16 }}><strong className="small">Ada pengerjaan yang belum selesai</strong><p className="muted small" style={{ margin: "5px 0 10px" }}>{attempt.student.name} · {attempt.progress.answered}/{attempt.progress.total} soal</p><button className="btn btn-primary btn-sm" onClick={continueQuiz}><RotateCcw size={15} />Lanjutkan pengerjaan</button></div>}<form className="identity-form" onSubmit={startQuiz}><label className="field"><span>Nama lengkap</span><input className="input" value={identity.name} onChange={(e) => setIdentity({ ...identity, name: e.target.value })} placeholder="Contoh: Andi Pratama" required minLength={2} /></label><div style={{ display: "grid", gridTemplateColumns: ".75fr 1.25fr", gap: 11 }}><label className="field"><span>No. absen</span><input className="input" value={identity.attendanceNumber} onChange={(e) => setIdentity({ ...identity, attendanceNumber: e.target.value })} placeholder="12" required /></label><label className="field"><span>Kelas</span><input className="input" value={identity.className} onChange={(e) => setIdentity({ ...identity, className: e.target.value })} placeholder="X-2" required /></label></div>{error && <div className="error-box">{error}</div>}<button className="btn btn-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}{busy ? "Menyiapkan sesi…" : "Mulai Kuis"}</button></form><div className="privacy-note"><ShieldCheck size={14} />Identitas hanya digunakan untuk pencatatan hasil kuis ini.</div></section></div></main></StudentChrome>;
}

function StudentChrome({ children, minimal = false }: { children: React.ReactNode; minimal?: boolean }) {
  return <div className="student-page"><header className="student-nav"><div className="brand"><span className="brand-mark"><BookOpenCheck size={19} /></span>RuangTuntas</div><div className="student-nav-note"><LockKeyhole size={14} /><span>{minimal ? "Jawaban tersimpan otomatis" : "Akses siswa yang aman"}</span></div></header>{children}</div>;
}

function StatusCard({ icon, title, text, tone = "normal" }: { icon: React.ReactNode; title: string; text: string; tone?: "normal" | "error" }) {
  return <div className="status-page"><div className="card status-card rise"><div className="empty-illustration" style={tone === "error" ? { background: "#fae8e4", color: "var(--red)" } : undefined}>{icon}</div><h1>{title}</h1><p className="muted">{text}</p></div></div>;
}

function ResultView({ attempt, quiz, followUpQuestions }: { attempt: Attempt; quiz: PublicQuiz; followUpQuestions: FollowUpQuestion[] }) {
  const enrichment = attempt.followUp === "PENGAYAAN";
  const [creatingPdf, setCreatingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");

  async function downloadPdf() {
    if (creatingPdf || !followUpQuestions.length) return;
    setCreatingPdf(true);
    setPdfError("");
    try {
      const [pdfMakeModule, fontsModule] = await Promise.all([
        import("pdfmake/build/pdfmake.js"),
        import("pdfmake/build/vfs_fonts.js"),
      ]);
      const pdfMake = pdfMakeModule.default;
      pdfMake.addVirtualFileSystem(fontsModule.default);
      const input = { attempt, quiz, questions: followUpQuestions };
      await pdfMake.createPdf(buildFollowUpPdfDefinition(input)).download(followUpPdfFileName(input));
    } catch {
      setPdfError("PDF belum dapat dibuat. Silakan coba lagi.");
    } finally {
      setCreatingPdf(false);
    }
  }

  return <main className="result-card card rise"><section className="result-hero"><div className="result-icon">{enrichment ? <Trophy size={34} /> : <Sparkles size={34} />}</div><h1>Kuis selesai!</h1><p>Terima kasih, {attempt.student.name}. Jawabanmu sudah tersimpan.</p></section><section className="result-body"><div className="score-ring"><div><strong>{attempt.score}</strong><span>Nilai akhir</span></div></div><div className="result-stats"><div className="result-stat"><strong>{attempt.correctCount}</strong><span>Jawaban benar</span></div><div className="result-stat"><strong>{attempt.incorrectCount}</strong><span>Jawaban salah</span></div><div className="result-stat"><strong>{quiz.passingScore}</strong><span>Batas tuntas</span></div></div><div className={`followup ${enrichment ? "" : "remedial"}`}><span className={`badge ${enrichment ? "badge-enrichment" : "badge-remedial"}`}>{attempt.followUp}</span><p>{enrichment ? "Bagus! Kamu siap melanjutkan ke aktivitas pengayaan." : "Tetap semangat. Pelajari kembali bagian yang belum dikuasai, lalu ikuti remedial."}</p></div>{followUpQuestions.length > 0 && <div className={`result-download ${enrichment ? "enrichment" : "remedial"}`}><div className="result-download-icon"><FileQuestion size={22} /></div><div><strong>Soal uraian {enrichment ? "pengayaan" : "remedial"} siap</strong><span>{followUpQuestions.length} soal akan dibuat menjadi PDF</span></div><button className="btn btn-primary" type="button" disabled={creatingPdf} onClick={downloadPdf}>{creatingPdf ? <LoaderCircle className="spin" size={17} /> : <Download size={17} />}{creatingPdf ? "Membuat PDF..." : "Unduh PDF"}</button></div>}{pdfError && <div className="error-box result-pdf-error">{pdfError}</div>}<div className="reflection"><strong>Langkah berikutnya</strong><br />{followUpQuestions.length ? "Unduh PDF dan kerjakan soal uraian tindak lanjut yang sudah disiapkan guru. Catat juga bagian materi yang masih perlu dipelajari atau dikembangkan." : "Catat pada buku tulis bagian materi yang masih perlu dipelajari serta rencana yang akan dilakukan untuk memperbaiki atau mengembangkan pemahaman."}</div></section></main>;
}
