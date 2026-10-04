"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "@firebase/auth";
import { onValue, ref } from "@firebase/database";
import {
  Activity, AlertTriangle, ArrowLeft, BookOpenCheck, CheckCircle2, Clock3,
  LogIn, Maximize2, Minimize2, Radio, RotateCcw, Users,
} from "lucide-react";
import { auth, database } from "@/lib/firebase";
import type { ActivityLog, Attempt, Quiz } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type ProjectorEvent = ActivityLog & { attemptId: string; studentName: string };

function eventInfo(type: ActivityLog["type"]) {
  if (type === "page_return") return { label: "Kembali ke kuis", kind: "return", icon: LogIn };
  if (type === "page_reload") return { label: "Memuat ulang halaman", kind: "neutral", icon: RotateCcw };
  if (type === "page_unload") return { label: "Menutup halaman", kind: "leave", icon: AlertTriangle };
  return { label: "Keluar dari halaman", kind: "leave", icon: AlertTriangle };
}

export default function ProjectorPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<Record<string, Attempt>>({});
  const [logs, setLogs] = useState<Record<string, Record<string, Omit<ActivityLog, "id">>>>({});
  const [now, setNow] = useState(new Date());
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (current) => {
    setUser(current); setReady(true);
    if (!current) router.replace("/login");
  }), [router]);

  useEffect(() => {
    if (!ready || !user) return;
    const unsubQuiz = onValue(ref(database, `quizzes/${quizId}`), (snapshot) => {
      const value = snapshot.val();
      if (!value) { setQuiz(null); return; }
      if (value.teacherId !== user.uid) { router.replace("/teacher"); return; }
      setQuiz({ id: quizId, ...value });
    });
    const unsubAttempts = onValue(ref(database, `attempts/${quizId}`), (snapshot) => setAttempts(snapshot.val() || {}));
    const unsubLogs = onValue(ref(database, `activityLogs/${quizId}`), (snapshot) => setLogs(snapshot.val() || {}));
    return () => { unsubQuiz(); unsubAttempts(); unsubLogs(); };
  }, [quizId, ready, router, user]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const onFullscreen = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => { clearInterval(timer); document.removeEventListener("fullscreenchange", onFullscreen); };
  }, []);

  const events = useMemo<ProjectorEvent[]>(() => Object.entries(logs).flatMap(([attemptId, attemptLogs]) =>
    Object.entries(attemptLogs || {}).map(([id, log]) => ({ id, attemptId, studentName: attempts[attemptId]?.student?.name || "Siswa", ...log })),
  ).sort((a, b) => b.timestamp - a.timestamp), [attempts, logs]);

  const students = useMemo(() => Object.entries(attempts).map(([id, attempt]) => {
    const latest = events.find((event) => event.attemptId === id);
    return { ...attempt, id, latest };
  }).sort((a, b) => {
    if (a.status === "in_progress" && b.status !== "in_progress") return -1;
    if (b.status === "in_progress" && a.status !== "in_progress") return 1;
    return (b.latest?.timestamp || b.startedAt) - (a.latest?.timestamp || a.startedAt);
  }), [attempts, events]);

  const inProgress = students.filter((student) => student.status === "in_progress").length;
  const returned = events.filter((event) => event.type === "page_return").length;
  const leaves = students.reduce((sum, student) => sum + (student.leaveCount || 0), 0);

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }

  if (!ready || !quiz) return <div className="projector-loading"><Radio className="spin" size={34} /><span>Menyiapkan layar monitoring…</span></div>;

  return <main className="projector-page">
    <header className="projector-header">
      <div className="projector-brand"><span><BookOpenCheck size={23} /></span><div><strong>RuangTuntas</strong><small>MODE PROYEKTOR</small></div></div>
      <div className="projector-title"><span>{quiz.material}</span><h1>{quiz.title}</h1></div>
      <div className="projector-tools"><div className="live-pill"><i /> LIVE</div><time>{now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time><button onClick={toggleFullscreen} aria-label="Layar penuh">{fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}</button><button onClick={() => router.push("/teacher")} aria-label="Kembali"><ArrowLeft size={20} /></button></div>
    </header>

    <section className="projector-stats">
      <div><span className="projector-stat-icon blue"><Users size={22} /></span><p><strong>{students.length}</strong><small>Peserta masuk</small></p></div>
      <div><span className="projector-stat-icon cyan"><Activity size={22} /></span><p><strong>{inProgress}</strong><small>Sedang mengerjakan</small></p></div>
      <div><span className="projector-stat-icon amber"><AlertTriangle size={22} /></span><p><strong>{leaves}</strong><small>Total keluar halaman</small></p></div>
      <div><span className="projector-stat-icon green"><LogIn size={22} /></span><p><strong>{returned}</strong><small>Kembali ke kuis</small></p></div>
    </section>

    <section className="projector-layout">
      <div className="projector-students">
        <div className="projector-section-head"><div><span className="projector-section-kicker">Peserta</span><h2>Aktivitas siswa</h2></div><p>Aktivitas ditampilkan sebagai pengingat selama kuis berlangsung.</p></div>
        <div className="projector-grid">
          {students.map((student) => {
            const latestInfo = student.latest ? eventInfo(student.latest.type) : null;
            return <article className={`projector-student ${student.leaveCount ? "has-leave" : ""}`} key={student.id}>
              <div className="projector-student-top"><span className="projector-avatar">{student.student.name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div><h3>{student.student.name}</h3><p>No. {student.student.attendanceNumber} · {student.student.className}</p></div><span className={`projector-status ${student.status}`}>{student.status === "submitted" ? "Selesai" : "Mengerjakan"}</span></div>
              <div className="projector-progress"><span style={{ width: `${student.progress?.total ? (student.progress.answered / student.progress.total) * 100 : 0}%` }} /></div>
              <div className="projector-student-bottom"><span>{student.progress?.answered || 0}/{student.progress?.total || 0} soal</span><strong className={student.leaveCount ? "warn" : "safe"}>{student.leaveCount ? `Keluar ${student.leaveCount}×` : "Tetap di halaman"}</strong></div>
              {latestInfo && <div className={`projector-latest ${latestInfo.kind}`}><latestInfo.icon size={15} /><span>{latestInfo.label}</span><time>{formatDate(student.latest?.timestamp)}</time></div>}
            </article>;
          })}
          {!students.length && <div className="projector-empty"><Users size={42} /><h3>Menunggu siswa masuk</h3><p>Nama siswa akan muncul otomatis setelah mereka memulai kuis.</p></div>}
        </div>
      </div>

      <aside className="projector-feed">
        <div className="projector-feed-head"><div><span className="projector-section-kicker">Real-time</span><h2>Riwayat aktivitas</h2></div><span className="feed-pulse" /></div>
        <div className="projector-feed-list">
          {events.slice(0, 20).map((event) => { const info = eventInfo(event.type); const Icon = info.icon; return <div className={`projector-event ${info.kind}`} key={`${event.attemptId}-${event.id}`}><span className="projector-event-icon"><Icon size={17} /></span><div><strong>{event.studentName}</strong><p>{info.label}</p></div><time>{formatDate(event.timestamp)}</time></div>; })}
          {!events.length && <div className="projector-feed-empty"><CheckCircle2 size={31} /><p>Belum ada aktivitas keluar halaman.</p></div>}
        </div>
        <p className="projector-disclaimer">Indikator aktivitas browser digunakan sebagai pengingat, bukan bukti mutlak kecurangan.</p>
      </aside>
    </section>
  </main>;
}
