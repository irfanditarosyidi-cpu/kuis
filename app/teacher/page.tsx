"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "@firebase/auth";
import { onValue, push, ref, set, update } from "@firebase/database";
import { QRCodeCanvas } from "qrcode.react";
import {
  Activity, AlertTriangle, ArrowLeft, BarChart3, BookOpen, BookOpenCheck, CheckCircle2,
  ChevronDown, ChevronUp, ClipboardList, Clock3, Copy, Edit3, ExternalLink, FileQuestion,
  FileSpreadsheet, Download, LayoutDashboard, Link2, ListChecks, LoaderCircle, LogOut, Menu,
  MoreVertical, Plus, QrCode, RefreshCcw, Save, Settings2, Sparkles, Trash2, Trophy, UploadCloud,
  Users, X, XCircle, Presentation,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { auth, database } from "@/lib/firebase";
import type { ActivityLog, AnswerKey, Attempt, Question, Quiz, QuizStatus } from "@/lib/types";
import { formatDate, generateToken } from "@/lib/utils";

type Tab = "info" | "questions" | "monitor" | "results";
type TeacherView = "dashboard" | "quizzes";
type QuizForm = Pick<Quiz, "title" | "material" | "description" | "passingScore" | "durationMinutes" | "shuffleQuestions" | "shuffleOptions">;

const emptyQuiz: QuizForm = { title: "", material: "", description: "", passingScore: 75, durationMinutes: 20, shuffleQuestions: false, shuffleOptions: false };
const emptyQuestion: Omit<Question, "id" | "order"> = { type: "multiple_choice", text: "", options: { A: "", B: "", C: "", D: "", E: "" }, correctAnswer: "A", weight: 1 };

function statusLabel(status: QuizStatus) {
  return status === "active" ? "Aktif" : status === "closed" ? "Ditutup" : "Draft";
}

function activityLabel(type: ActivityLog["type"]) {
  const labels: Record<ActivityLog["type"], string> = {
    tab_hidden: "Halaman tidak terlihat",
    window_blur: "Jendela kehilangan fokus",
    page_unload: "Halaman ditutup",
    page_return: "Kembali ke halaman",
    page_reload: "Halaman dimuat ulang",
  };
  return labels[type];
}

export default function TeacherPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [allAttempts, setAllAttempts] = useState<Record<string, Record<string, Attempt>>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("info");
  const [quizModal, setQuizModal] = useState<Quiz | "new" | null>(null);
  const [toast, setToast] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [view, setView] = useState<TeacherView>("dashboard");
  const teacherId = user?.uid || "";

  useEffect(() => onAuthStateChanged(auth, (current) => {
    setUser(current);
    setReady(true);
    if (!current) router.replace("/login");
  }), [router]);

  useEffect(() => {
    if (!teacherId) return;
    let childUnsubs: Array<() => void> = [];
    const quizMap = new Map<string, Quiz>();
    const attemptsMap: Record<string, Record<string, Attempt>> = {};
    const publishQuizzes = () => setQuizzes(Array.from(quizMap.values()).sort((a, b) => b.createdAt - a.createdAt));
    const unsubIndex = onValue(ref(database, `teacherQuizIndex/${teacherId}`), (snapshot) => {
      childUnsubs.forEach((unsubscribe) => unsubscribe());
      childUnsubs = [];
      quizMap.clear();
      const ids = Object.keys(snapshot.val() || {});
      if (!ids.length) { setQuizzes([]); setAllAttempts({}); return; }
      ids.forEach((id) => {
        childUnsubs.push(onValue(ref(database, `quizzes/${id}`), (quizSnapshot) => {
          const value = quizSnapshot.val();
          if (value) quizMap.set(id, { id, ...value }); else quizMap.delete(id);
          publishQuizzes();
        }));
        childUnsubs.push(onValue(ref(database, `attempts/${id}`), (attemptSnapshot) => {
          attemptsMap[id] = attemptSnapshot.val() || {};
          setAllAttempts({ ...attemptsMap });
        }));
      });
    });
    return () => { unsubIndex(); childUnsubs.forEach((unsubscribe) => unsubscribe()); };
  }, [teacherId]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const attempts = useMemo(() => Object.values(allAttempts).flatMap((items) => Object.entries(items || {}).map(([id, value]) => ({ ...value, id }))), [allAttempts]);
  const stats = {
    quizzes: quizzes.length,
    active: quizzes.filter((q) => q.status === "active").length,
    attempts: attempts.filter((a) => quizzes.some((q) => q.id === a.quizId)).length,
    remedial: attempts.filter((a) => quizzes.some((q) => q.id === a.quizId) && a.followUp === "REMEDIAL").length,
    enrichment: attempts.filter((a) => quizzes.some((q) => q.id === a.quizId) && a.followUp === "PENGAYAAN").length,
  };
  const statItems: Array<[LucideIcon, number, string]> = [
    [BookOpen, stats.quizzes, "Total kuis"], [Activity, stats.active, "Sedang aktif"],
    [Users, stats.attempts, "Total pengerjaan"], [RefreshCcw, stats.remedial, "Perlu remedial"],
    [Trophy, stats.enrichment, "Pengayaan"],
  ];
  const selected = quizzes.find((q) => q.id === selectedId) || null;
  const visibleQuizzes = view === "dashboard" ? quizzes.slice(0, 3) : quizzes;

  async function logout() {
    if (auth.currentUser) await signOut(auth);
    router.replace("/login");
  }

  async function deleteQuiz(quiz: Quiz) {
    if (!confirm(`Hapus “${quiz.title}” beserta soal dan seluruh hasilnya?`)) return;
    await update(ref(database), {
      [`quizzes/${quiz.id}`]: null,
      [`questions/${quiz.id}`]: null,
      [`publicQuestions/${quiz.id}`]: null,
      [`quizAccess/${quiz.accessToken}`]: null,
      [`quizAccessById/${quiz.id}`]: null,
      [`attempts/${quiz.id}`]: null,
      [`answers/${quiz.id}`]: null,
      [`activityLogs/${quiz.id}`]: null,
      [`teacherQuizIndex/${teacherId}/${quiz.id}`]: null,
    });
    if (selectedId === quiz.id) setSelectedId(null);
    setToast("Kuis berhasil dihapus");
  }

  async function copyLink(quiz: Quiz) {
    const link = `${location.origin}/q/${quiz.accessToken}`;
    await navigator.clipboard.writeText(link);
    setToast("Tautan kuis disalin");
  }

  function showView(nextView: TeacherView) {
    setView(nextView);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!ready) return <div className="status-page"><LoaderCircle className="spin" /></div>;
  if (!user) return <div className="status-page"><LoaderCircle className="spin" /></div>;
  if (selected) return <>
    <QuizManager quiz={selected} tab={tab} setTab={setTab} onBack={() => setSelectedId(null)} onEdit={() => setQuizModal(selected)} onToast={setToast} attempts={allAttempts[selected.id] || {}} />
    {quizModal && <QuizModal initial={quizModal === "new" ? null : quizModal} teacherId={teacherId} onClose={() => setQuizModal(null)} onSaved={(id) => { setQuizModal(null); setSelectedId(id); setToast("Pengaturan kuis berhasil diperbarui"); }} />}
    {toast && <div className="toast">{toast}</div>}
  </>;

  return (
    <div className="teacher-shell">
      {mobileOpen && <button className="sidebar-backdrop" aria-label="Tutup menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand"><span className="brand-mark"><BookOpenCheck size={20} /></span>RuangTuntas</div>
        <nav className="nav">
          <button className={`nav-button ${view === "dashboard" ? "active" : ""}`} onClick={() => showView("dashboard")}><LayoutDashboard size={18} />Dashboard</button>
          <button className={`nav-button ${view === "quizzes" ? "active" : ""}`} onClick={() => showView("quizzes")}><ClipboardList size={18} />Kuis saya</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="teacher-profile">
            <div className="avatar">{(user?.email || "G")[0].toUpperCase()}</div>
            <div><strong>{user.displayName || "Guru"}</strong><span>{user.email}</span></div>
          </div>
          <button className="nav-button" onClick={logout}><LogOut size={17} />Keluar</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-copy">
            <button className="icon-btn mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Buka menu"><Menu size={20} /></button>
            <p className="eyebrow">{view === "dashboard" ? "Ringkasan hari ini" : "Manajemen asesmen"}</p>
            <h1 className="title">{view === "dashboard" ? `Selamat mengajar, ${user.displayName?.split(" ")[0] || "Guru"}.` : "Kuis saya"}</h1>
            <p>{view === "dashboard" ? "Setiap hasil adalah awal dari langkah belajar berikutnya." : "Buat, atur, dan pantau seluruh kuis Anda di satu tempat."}</p>
          </div>
          <div className="top-actions"><button className="btn btn-primary" onClick={() => setQuizModal("new")}><Plus size={18} /><span>Buat Kuis</span></button></div>
        </header>

        {view === "dashboard" && <section className="stats-grid">
          {statItems.map(([Icon, value, label], index) => <div className="card stat-card rise" style={{ animationDelay: `${index * 45}ms` }} key={label}><span className="stat-icon"><Icon size={17} /></span><div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div></div>)}
        </section>}

        <section id="quiz-list">
          <div className="section-head"><div><h2 className="section-title">{view === "dashboard" ? "Kuis terbaru" : "Semua kuis"}</h2><p className="muted small">{view === "dashboard" ? "Kelola asesmen dan ikuti progres kelas secara langsung." : `${quizzes.length} kuis tersimpan dalam akun Anda.`}</p></div><button className="btn btn-outline btn-sm" onClick={() => setQuizModal("new")}><Plus size={16} /><span>Kuis baru</span></button></div>
          <div className="quiz-grid">
            {visibleQuizzes.map((quiz, index) => {
              const quizAttempts = Object.values(allAttempts[quiz.id] || {});
              const questionCount = Number((quiz as Quiz & { questionCount?: number }).questionCount || 0);
              return <article className="card quiz-card rise" style={{ animationDelay: `${index * 50}ms` }} key={quiz.id}>
                <div className="quiz-accent" />
                <div className="quiz-card-body">
                  <div className="quiz-card-top"><span className={`badge badge-${quiz.status}`}>{statusLabel(quiz.status)}</span><button className="icon-btn" aria-label="Hapus kuis" onClick={() => deleteQuiz(quiz)}><Trash2 size={16} /></button></div>
                  <h3>{quiz.title}</h3><div className="material">{quiz.material}</div>
                  <div className="quiz-meta"><div><strong>{questionCount}</strong><span>Soal</span></div><div><strong>{quizAttempts.length}</strong><span>Peserta</span></div><div><strong>{quiz.passingScore}</strong><span>Batas</span></div></div>
                  <div className="quiz-actions"><button className="btn btn-light btn-sm" onClick={() => { setSelectedId(quiz.id); setTab("info"); }}>Kelola kuis</button><button className="icon-btn" title="Salin tautan" onClick={() => copyLink(quiz)}><Copy size={16} /></button></div>
                </div>
              </article>;
            })}
            {!quizzes.length && <div className="card empty-state"><div><div className="empty-illustration"><FileQuestion size={34} /></div><h3>Belum ada kuis</h3><p className="muted">Mulai dari materi yang sedang dipelajari. Tambahkan soal, aktifkan, lalu bagikan tautannya kepada siswa.</p><button className="btn btn-primary" onClick={() => setQuizModal("new")}><Plus size={17} />Buat kuis pertama</button></div></div>}
          </div>
        </section>
      </main>
      {quizModal && <QuizModal initial={quizModal === "new" ? null : quizModal} teacherId={teacherId} onClose={() => setQuizModal(null)} onSaved={(id) => { setQuizModal(null); setSelectedId(id); setToast("Kuis berhasil disimpan"); }} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function QuizModal({ initial, teacherId, onClose, onSaved }: { initial: Quiz | null; teacherId: string; onClose: () => void; onSaved: (id: string) => void }) {
  const [form, setForm] = useState<QuizForm>(initial ? { title: initial.title, material: initial.material, description: initial.description, passingScore: initial.passingScore, durationMinutes: initial.durationMinutes, shuffleQuestions: initial.shuffleQuestions, shuffleOptions: initial.shuffleOptions } : emptyQuiz);
  const [saving, setSaving] = useState(false);
  const change = <K extends keyof QuizForm>(key: K, value: QuizForm[K]) => setForm((state) => ({ ...state, [key]: value }));
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    try {
      const now = Date.now();
      const id = initial?.id || push(ref(database, "quizzes")).key!;
      const accessToken = initial?.accessToken || generateToken();
      const quiz: Omit<Quiz, "id"> & { questionCount: number } = { ...form, teacherId, accessToken, status: initial?.status || "draft", createdAt: initial?.createdAt || now, updatedAt: now, questionCount: Number((initial as Quiz & { questionCount?: number } | null)?.questionCount || 0) };
      const publicQuiz = { teacherId, quizId: id, title: form.title, material: form.material, description: form.description, passingScore: form.passingScore, status: quiz.status, durationMinutes: form.durationMinutes, shuffleQuestions: form.shuffleQuestions, shuffleOptions: form.shuffleOptions, questionCount: quiz.questionCount };
      await set(ref(database, `quizzes/${id}`), quiz);
      await update(ref(database), { [`quizAccess/${accessToken}`]: publicQuiz, [`quizAccessById/${id}`]: publicQuiz, [`teacherQuizIndex/${teacherId}/${id}`]: true });
      onSaved(id);
    } finally { setSaving(false); }
  }
  return <div className="overlay"><form className="modal" onSubmit={save}>
    <div className="modal-head"><div><h2>{initial ? "Edit informasi kuis" : "Buat kuis baru"}</h2><p className="muted small">Atur identitas dan ketentuan dasar asesmen.</p></div><button type="button" className="icon-btn" onClick={onClose}><X size={18} /></button></div>
    <div className="modal-body"><div className="form-grid">
      <label className="field span-2"><span>Judul kuis</span><input className="input" value={form.title} onChange={(e) => change("title", e.target.value)} placeholder="Contoh: Kuis Konfigurasi Elektron" required /></label>
      <label className="field span-2"><span>Materi</span><input className="input" value={form.material} onChange={(e) => change("material", e.target.value)} placeholder="Contoh: Struktur Atom" required /></label>
      <label className="field span-2"><span>Deskripsi singkat</span><textarea className="textarea" value={form.description} onChange={(e) => change("description", e.target.value)} placeholder="Tujuan atau petunjuk singkat untuk siswa" /></label>
      <label className="field"><span>Batas ketuntasan</span><input className="input" type="number" min="0" max="100" value={form.passingScore} onChange={(e) => change("passingScore", Number(e.target.value))} required /></label>
      <label className="field"><span>Durasi (menit)</span><input className="input" type="number" min="0" max="300" value={form.durationMinutes || ""} onChange={(e) => change("durationMinutes", e.target.value ? Number(e.target.value) : null)} placeholder="Tanpa batas" /></label>
      <div className="check-row span-2"><label className="check"><input type="checkbox" checked={form.shuffleQuestions} onChange={(e) => change("shuffleQuestions", e.target.checked)} />Acak urutan soal</label><label className="check"><input type="checkbox" checked={form.shuffleOptions} onChange={(e) => change("shuffleOptions", e.target.checked)} />Acak pilihan jawaban</label></div>
    </div><div className="modal-actions"><button type="button" className="btn btn-light" onClick={onClose}>Batal</button><button className="btn btn-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}{saving ? "Menyimpan…" : "Simpan kuis"}</button></div></div>
  </form></div>;
}

function QuizManager({ quiz, tab, setTab, onBack, onEdit, onToast, attempts }: { quiz: Quiz; tab: Tab; setTab: (tab: Tab) => void; onBack: () => void; onEdit: () => void; onToast: (message: string) => void; attempts: Record<string, Attempt> }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionModal, setQuestionModal] = useState<Question | "new" | null>(null);
  const [importModal, setImportModal] = useState(false);
  useEffect(() => onValue(ref(database, `questions/${quiz.id}`), (snapshot) => {
    const data = snapshot.val() || {};
    setQuestions(Object.entries(data).map(([id, value]) => ({ id, ...(value as Omit<Question, "id">) })).sort((a, b) => a.order - b.order));
  }), [quiz.id]);
  const copyLink = async () => { await navigator.clipboard.writeText(`${location.origin}/q/${quiz.accessToken}`); onToast("Tautan kuis disalin"); };
  async function setStatus(status: QuizStatus) {
    if (status === "active" && !questions.length) { onToast("Tambahkan setidaknya satu soal dahulu"); return; }
    await update(ref(database), { [`quizzes/${quiz.id}/status`]: status, [`quizzes/${quiz.id}/updatedAt`]: Date.now(), [`quizAccess/${quiz.accessToken}/status`]: status, [`quizAccessById/${quiz.id}/status`]: status });
    onToast(status === "active" ? "Kuis sudah aktif" : status === "closed" ? "Kuis sudah ditutup" : "Kuis dikembalikan ke draft");
  }
  async function deleteQuestion(question: Question) {
    if (!confirm("Hapus soal ini?")) return;
    await update(ref(database), { [`questions/${quiz.id}/${question.id}`]: null, [`publicQuestions/${quiz.id}/${question.id}`]: null, [`quizzes/${quiz.id}/questionCount`]: Math.max(0, questions.length - 1), [`quizAccess/${quiz.accessToken}/questionCount`]: Math.max(0, questions.length - 1), [`quizAccessById/${quiz.id}/questionCount`]: Math.max(0, questions.length - 1) });
    onToast("Soal dihapus");
  }
  async function moveQuestion(question: Question, direction: -1 | 1) {
    const index = questions.findIndex((q) => q.id === question.id);
    const target = questions[index + direction];
    if (!target) return;
    await update(ref(database), { [`questions/${quiz.id}/${question.id}/order`]: target.order, [`questions/${quiz.id}/${target.id}/order`]: question.order, [`publicQuestions/${quiz.id}/${question.id}/order`]: target.order, [`publicQuestions/${quiz.id}/${target.id}/order`]: question.order });
  }
  return <div className="teacher-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark"><BookOpenCheck size={20} /></span>RuangTuntas</div><nav className="nav"><button className="nav-button" onClick={onBack}><LayoutDashboard size={18} />Dashboard</button><button className="nav-button active"><ClipboardList size={18} />Kelola kuis</button></nav><div className="sidebar-bottom"><button className="nav-button" onClick={onBack}><ArrowLeft size={17} />Kembali ke daftar</button></div></aside>
    <main className="main">
      <header className="editor-header"><button className="back-button" onClick={onBack}><ArrowLeft size={15} />Kembali ke dashboard</button><div className="editor-title-row"><div><div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><span className={`badge badge-${quiz.status}`}>{statusLabel(quiz.status)}</span><span className="muted small">Diperbarui {formatDate(quiz.updatedAt, true)}</span></div><h1>{quiz.title}</h1><p className="muted" style={{ margin: 0 }}>{quiz.material}</p></div><button className="btn btn-outline" onClick={onEdit}><Settings2 size={17} />Edit pengaturan</button></div></header>
      <nav className="editor-tabs">{([["info", Link2, "Informasi & link"], ["questions", ListChecks, `Soal (${questions.length})`], ["monitor", Activity, "Monitoring"], ["results", BarChart3, "Hasil"]] as const).map(([id, Icon, label]) => <button className={`editor-tab ${tab === id ? "active" : ""}`} key={id} onClick={() => setTab(id)}><Icon size={15} style={{ verticalAlign: -3, marginRight: 7 }} />{label}</button>)}</nav>
      {tab === "info" && <InfoTab quiz={quiz} questionCount={questions.length} copyLink={copyLink} setStatus={setStatus} />}
      {tab === "questions" && <section><div className="section-head"><div><h2 className="section-title">Daftar soal</h2><p className="muted small">Kunci jawaban hanya tersimpan pada node privat.</p></div><div className="question-head-actions"><button className="btn btn-outline" onClick={() => setImportModal(true)}><UploadCloud size={17} />Impor Excel</button><button className="btn btn-primary" onClick={() => setQuestionModal("new")}><Plus size={17} />Tambah soal</button></div></div><div className="question-list">{questions.map((q, index) => <div className="card question-row" key={q.id}><div className="question-number">{index + 1}</div><div><h4>{q.text}</h4><p className="muted small">Jawaban: <strong>{q.correctAnswer}</strong> · Bobot {q.weight}</p></div><div className="row-actions"><button className="icon-btn" disabled={index === 0} onClick={() => moveQuestion(q, -1)}><ChevronUp size={15} /></button><button className="icon-btn" disabled={index === questions.length - 1} onClick={() => moveQuestion(q, 1)}><ChevronDown size={15} /></button><button className="icon-btn" onClick={() => setQuestionModal(q)}><Edit3 size={15} /></button><button className="icon-btn" onClick={() => deleteQuestion(q)}><Trash2 size={15} /></button></div></div>)}{!questions.length && <div className="card empty-state"><div><div className="empty-illustration"><ListChecks size={34} /></div><h3>Soal belum ditambahkan</h3><p className="muted">Tambahkan satu per satu atau impor banyak soal dari template Excel.</p><div style={{ display: "flex", gap: 9, justifyContent: "center", flexWrap: "wrap" }}><button className="btn btn-outline" onClick={() => setImportModal(true)}><UploadCloud size={17} />Impor Excel</button><button className="btn btn-primary" onClick={() => setQuestionModal("new")}><Plus size={17} />Tambah soal</button></div></div></div>}</div></section>}
      {tab === "monitor" && <Monitoring quiz={quiz} attempts={attempts} />}
      {tab === "results" && <Results quizId={quiz.id} questions={questions} attempts={attempts} />}
    </main>
    {questionModal && <QuestionModal quiz={quiz} questions={questions} initial={questionModal === "new" ? null : questionModal} onClose={() => setQuestionModal(null)} onSaved={() => { setQuestionModal(null); onToast("Soal berhasil disimpan"); }} />}
    {importModal && <ExcelImportModal quiz={quiz} existingCount={questions.length} onClose={() => setImportModal(false)} onImported={(count) => { setImportModal(false); onToast(`${count} soal berhasil diimpor`); }} />}
  </div>;
}

function InfoTab({ quiz, questionCount, copyLink, setStatus }: { quiz: Quiz; questionCount: number; copyLink: () => void; setStatus: (status: QuizStatus) => void }) {
  const [link, setLink] = useState(`/q/${quiz.accessToken}`);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => setLink(`${window.location.origin}/q/${quiz.accessToken}`), [quiz.accessToken]);

  function downloadQr() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const anchor = document.createElement("a");
    const fileName = quiz.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "kuis";
    anchor.download = `qr-${fileName}.png`;
    anchor.href = canvas.toDataURL("image/png");
    anchor.click();
  }

  return <div className="info-layout"><section className="card panel"><h3>Tautan akses siswa</h3><p className="muted small">Siswa dapat membuka tautan atau memindai QR berikut untuk masuk ke kuis.</p><div className="share-layout"><div className="share-link"><div className="link-box">{link}</div><div className="share-actions"><button className="btn btn-primary btn-sm" onClick={copyLink}><Copy size={15} />Salin tautan</button><a className="btn btn-outline btn-sm" href={link} target="_blank" rel="noreferrer"><ExternalLink size={15} />Pratinjau</a></div></div><div className="qr-card"><div className="qr-code" ref={qrRef}><QRCodeCanvas value={link} size={180} level="H" marginSize={2} title={`QR akses ${quiz.title}`} /></div><div className="qr-label"><QrCode size={15} /><span>Pindai untuk membuka kuis</span></div><button className="btn btn-light btn-sm qr-download" onClick={downloadQr}><Download size={15} />Unduh QR</button></div></div><div className="student-description"><h3>Deskripsi untuk siswa</h3><p className="muted small">{quiz.description || "Belum ada deskripsi untuk kuis ini."}</p></div></section><aside className="card panel"><h3>Ketentuan kuis</h3><div className="setting-line"><span>Jumlah soal</span><strong>{questionCount}</strong></div><div className="setting-line"><span>Batas nilai</span><strong>{quiz.passingScore}</strong></div><div className="setting-line"><span>Durasi</span><strong>{quiz.durationMinutes ? `${quiz.durationMinutes} menit` : "Tanpa batas"}</strong></div><div className="setting-line"><span>Acak soal</span><strong>{quiz.shuffleQuestions ? "Ya" : "Tidak"}</strong></div><div className="setting-line"><span>Acak opsi</span><strong>{quiz.shuffleOptions ? "Ya" : "Tidak"}</strong></div><div className="status-controls">{quiz.status !== "active" && <button className="btn btn-primary" onClick={() => setStatus("active")}><CheckCircle2 size={17} />Aktifkan kuis</button>}{quiz.status === "active" && <button className="btn btn-danger" onClick={() => setStatus("closed")}><XCircle size={17} />Tutup kuis</button>}{quiz.status !== "draft" && <button className="btn btn-light" onClick={() => setStatus("draft")}>Kembalikan ke draft</button>}</div></aside></div>;
}

function QuestionModal({ quiz, questions, initial, onClose, onSaved }: { quiz: Quiz; questions: Question[]; initial: Question | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(emptyQuestion);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (initial) setForm({
      type: initial.type,
      text: initial.text,
      options: { A: initial.options.A || "", B: initial.options.B || "", C: initial.options.C || "", D: initial.options.D || "", E: initial.options.E || "" },
      correctAnswer: initial.correctAnswer,
      weight: initial.weight,
    });
  }, [initial]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    try {
      const id = initial?.id || push(ref(database, `questions/${quiz.id}`)).key!;
      const order = initial?.order || (Math.max(0, ...questions.map((q) => q.order)) + 1);
      const privateQuestion = { ...form, order };
      const { correctAnswer: _, ...publicQuestion } = privateQuestion;
      const count = initial ? questions.length : questions.length + 1;
      await update(ref(database), { [`questions/${quiz.id}/${id}`]: privateQuestion, [`publicQuestions/${quiz.id}/${id}`]: publicQuestion, [`quizzes/${quiz.id}/questionCount`]: count, [`quizAccess/${quiz.accessToken}/questionCount`]: count, [`quizAccessById/${quiz.id}/questionCount`]: count, [`quizzes/${quiz.id}/updatedAt`]: Date.now() });
      onSaved();
    } finally { setSaving(false); }
  }
  const keys = ["A", "B", "C", "D", "E"] as const;
  return <div className="overlay"><form className="modal modal-wide" onSubmit={save}><div className="modal-head"><div><h2>{initial ? "Edit soal" : "Tambah soal"}</h2><p className="muted small">Pilih jawaban benar dengan menekan huruf di sebelah kiri.</p></div><button type="button" className="icon-btn" onClick={onClose}><X size={18} /></button></div><div className="modal-body"><label className="field"><span>Pertanyaan</span><textarea className="textarea" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Tuliskan pertanyaan dengan jelas…" required /></label><div className="option-editor">{keys.map((key) => <div className={`option-line ${form.correctAnswer === key ? "correct" : ""}`} key={key}><button className="option-key" type="button" title="Jadikan jawaban benar" onClick={() => setForm({ ...form, correctAnswer: key })}>{key}</button><input className="input" value={form.options[key]} onChange={(e) => setForm({ ...form, options: { ...form.options, [key]: e.target.value } })} placeholder={`Pilihan ${key}`} required /></div>)}</div><label className="field" style={{ width: 150, marginTop: 16 }}><span>Bobot</span><input className="input" type="number" min="0.1" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} required /></label><div className="modal-actions"><button type="button" className="btn btn-light" onClick={onClose}>Batal</button><button className="btn btn-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}{saving ? "Menyimpan…" : "Simpan soal"}</button></div></div></form></div>;
}

function Monitoring({ quiz, attempts }: { quiz: Quiz; attempts: Record<string, Attempt> }) {
  const list = Object.entries(attempts).map(([id, value]) => ({ ...value, id })).sort((a, b) => b.startedAt - a.startedAt);
  const [detail, setDetail] = useState<Attempt | null>(null);
  const inProgress = list.filter((a) => a.status === "in_progress").length;
  const submitted = list.filter((a) => a.status === "submitted").length;
  return <section><div className="summary-strip"><div className="card summary-item"><strong>{inProgress}</strong><span>Sedang mengerjakan</span></div><div className="card summary-item"><strong>{submitted}</strong><span>Selesai</span></div><div className="card summary-item"><strong>{list.filter((a) => a.followUp === "REMEDIAL").length}</strong><span>Remedial</span></div><div className="card summary-item"><strong>{list.filter((a) => a.followUp === "PENGAYAAN").length}</strong><span>Pengayaan</span></div></div><div className="section-head"><div><h2 className="section-title">Monitoring real-time</h2><p className="muted small"><span style={{ color: "#2563eb" }}>●</span> Data diperbarui otomatis tanpa refresh.</p></div><a className="btn btn-primary btn-sm" href={`/teacher/projector/${quiz.id}`} target="_blank" rel="noreferrer"><Presentation size={16} />Mode Proyektor</a></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Siswa</th><th>Progress</th><th>Status</th><th>Keluar</th><th>Nilai</th><th>Tindak lanjut</th><th /></tr></thead><tbody>{list.map((attempt) => <tr key={attempt.id}><td><div className="student-name">{attempt.student.name}</div><span className="muted small">No. {attempt.student.attendanceNumber} · {attempt.student.className}</span></td><td><strong>{attempt.progress?.answered || 0}/{attempt.progress?.total || 0}</strong><div className="progress-line"><span style={{ width: `${attempt.progress?.total ? (attempt.progress.answered / attempt.progress.total) * 100 : 0}%` }} /></div></td><td><span className={`badge ${attempt.status === "submitted" ? "badge-enrichment" : "badge-progress"}`}>{attempt.status === "submitted" ? "Selesai" : "Mengerjakan"}</span></td><td>{attempt.leaveCount ? <strong style={{ color: "#b16825" }}>⚠ {attempt.leaveCount} kali</strong> : "0"}</td><td><strong>{attempt.score ?? "—"}</strong></td><td>{attempt.followUp ? <span className={`badge ${attempt.followUp === "REMEDIAL" ? "badge-remedial" : "badge-enrichment"}`}>{attempt.followUp}</span> : "—"}</td><td><button className="btn btn-outline btn-sm" onClick={() => setDetail(attempt)}>Aktivitas</button></td></tr>)}{!list.length && <tr><td colSpan={7} style={{ textAlign: "center", padding: 50 }}><Users size={28} style={{ color: "#91a1b6", marginBottom: 9 }} /><div className="muted">Belum ada siswa yang memulai kuis.</div></td></tr>}</tbody></table></div>{detail && <ActivityModal quizId={quiz.id} attempt={detail} onClose={() => setDetail(null)} />}</section>;
}

function ActivityModal({ quizId, attempt, onClose }: { quizId: string; attempt: Attempt; onClose: () => void }) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  useEffect(() => onValue(ref(database, `activityLogs/${quizId}/${attempt.id}`), (snapshot) => { const data = snapshot.val() || {}; setLogs(Object.entries(data).map(([id, value]) => ({ id, ...(value as Omit<ActivityLog, "id">) })).sort((a, b) => b.timestamp - a.timestamp)); }), [quizId, attempt.id]);
  return <div className="overlay"><div className="modal"><div className="modal-head"><div><h2>Aktivitas {attempt.student.name}</h2><p className="muted small">Indikator aktivitas browser, bukan bukti mutlak kecurangan.</p></div><button className="icon-btn" onClick={onClose}><X size={18} /></button></div><div className="modal-body"><div className="log-list">{logs.map((log) => <div className="log-item" key={log.id}><span className="log-dot">{log.type === "page_return" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}</span><div><strong className="small">{activityLabel(log.type)}</strong><div className="muted" style={{ fontSize: 11 }}>{log.type.replaceAll("_", " ")}</div></div><time className="muted small">{formatDate(log.timestamp)}</time></div>)}{!logs.length && <p className="muted small" style={{ textAlign: "center", padding: 25 }}>Belum ada aktivitas keluar halaman.</p>}</div></div></div></div>;
}

type SavedAnswer = { answer: AnswerKey; updatedAt: number };

function Results({ quizId, questions, attempts }: { quizId: string; questions: Question[]; attempts: Record<string, Attempt> }) {
  const list = Object.entries(attempts).map(([id, value]) => ({ ...value, id })).filter((a) => a.status === "submitted").sort((a, b) => (b.score || 0) - (a.score || 0));
  const [detail, setDetail] = useState<Attempt | null>(null);
  return <section><div className="section-head"><div><h2 className="section-title">Hasil pengerjaan</h2><p className="muted small">Nilai dan tindak lanjut dihitung otomatis saat siswa mengumpulkan.</p></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Siswa</th><th>Kelas</th><th>Benar</th><th>Salah</th><th>Nilai</th><th>Tindak lanjut</th><th>Waktu submit</th><th /></tr></thead><tbody>{list.map((attempt) => <tr key={attempt.id}><td><div className="student-name">{attempt.student.name}</div><span className="muted small">No. {attempt.student.attendanceNumber}</span></td><td>{attempt.student.className}</td><td>{attempt.correctCount ?? "—"}</td><td>{attempt.incorrectCount ?? "—"}</td><td><strong style={{ fontSize: 17 }}>{attempt.score}</strong></td><td><span className={`badge ${attempt.followUp === "REMEDIAL" ? "badge-remedial" : "badge-enrichment"}`}>{attempt.followUp}</span></td><td>{formatDate(attempt.submittedAt)}</td><td><button className="btn btn-outline btn-sm" onClick={() => setDetail(attempt)}>Lihat jawaban</button></td></tr>)}{!list.length && <tr><td colSpan={8} style={{ textAlign: "center", padding: 50 }}><BarChart3 size={29} style={{ color: "#97a198", marginBottom: 9 }} /><div className="muted">Hasil akan muncul setelah siswa mengumpulkan.</div></td></tr>}</tbody></table></div>{detail && <AnswerDetailModal key={detail.id} quizId={quizId} questions={questions} attempt={detail} onClose={() => setDetail(null)} />}</section>;
}

function AnswerDetailModal({ quizId, questions, attempt, onClose }: { quizId: string; questions: Question[]; attempt: Attempt; onClose: () => void }) {
  const [answers, setAnswers] = useState<Record<string, SavedAnswer>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => onValue(ref(database, `answers/${quizId}/${attempt.id}`), (snapshot) => {
    setAnswers(snapshot.val() || {});
    setLoading(false);
  }), [quizId, attempt.id]);

  return <div className="overlay"><div className="modal modal-wide answer-detail-modal"><div className="modal-head"><div><h2>Jawaban {attempt.student.name}</h2><p className="muted small">No. {attempt.student.attendanceNumber} · {attempt.student.className} · Dikumpulkan {formatDate(attempt.submittedAt)}</p></div><button className="icon-btn" onClick={onClose} aria-label="Tutup detail jawaban"><X size={18} /></button></div><div className="modal-body"><div className="answer-detail-summary"><div><span>Nilai akhir</span><strong>{attempt.score ?? "—"}</strong></div><div><span>Jawaban benar</span><strong>{attempt.correctCount ?? "—"}</strong></div><div><span>Jawaban salah</span><strong>{attempt.incorrectCount ?? "—"}</strong></div></div>{loading ? <div className="answer-detail-loading"><LoaderCircle className="spin" size={25} />Memuat jawaban…</div> : <div className="answer-detail-list">{questions.map((question, index) => {
    const studentAnswer = answers[question.id]?.answer;
    const correctAnswer = question.correctAnswer;
    const state = !studentAnswer ? "unanswered" : studentAnswer === correctAnswer ? "correct" : "incorrect";
    return <article className={`answer-review ${state}`} key={question.id}><div className="answer-review-head"><span className="answer-review-number">{index + 1}</span><div><h3>{question.text}</h3><span className="muted small">Bobot {question.weight}</span></div><span className={`answer-review-status ${state}`}>{state === "correct" ? <><CheckCircle2 size={15} />Benar</> : state === "incorrect" ? <><XCircle size={15} />Salah</> : <><AlertTriangle size={15} />Tidak dijawab</>}</span></div><div className="answer-review-choices"><div><span>Jawaban siswa</span>{studentAnswer ? <strong><i>{studentAnswer}</i>{question.options[studentAnswer] || "Pilihan tidak tersedia"}</strong> : <strong className="empty-answer">Tidak dijawab</strong>}</div><div><span>Kunci jawaban</span>{correctAnswer ? <strong><i>{correctAnswer}</i>{question.options[correctAnswer] || "Pilihan tidak tersedia"}</strong> : <strong className="empty-answer">Tidak tersedia</strong>}</div></div></article>;
  })}{!questions.length && <div className="answer-detail-loading">Soal tidak tersedia.</div>}</div>}</div></div></div>;
}

type ImportedQuestion = {
  sourceRow: number;
  text: string;
  options: Record<AnswerKey, string>;
  correctAnswer: AnswerKey;
  weight: number;
};

function normalizeHeader(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function ExcelImportModal({ quiz, existingCount, onClose, onImported }: { quiz: Quiz; existingCount: number; onClose: () => void; onImported: (count: number) => void }) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportedQuestion[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);

  async function readFile(file: File) {
    setFileName(file.name); setRows([]); setErrors([]);
    if (!file.name.toLowerCase().endsWith(".xlsx")) { setErrors(["Gunakan file Excel berformat .xlsx."]); return; }
    if (file.size > 5 * 1024 * 1024) { setErrors(["Ukuran file maksimal 5 MB."]); return; }
    setReading(true);
    try {
      const { readSheet } = await import("read-excel-file/browser");
      const sheetRows = await readSheet(file, "Soal") as unknown[][];
      const headerIndex = sheetRows.findIndex((row) => row.some((cell) => normalizeHeader(cell) === "pertanyaan"));
      if (headerIndex < 0) throw new Error("Tab Soal atau baris judul kolom tidak ditemukan. Gunakan template yang disediakan.");
      const headerMap = new Map(sheetRows[headerIndex].map((cell, index) => [normalizeHeader(cell), index]));
      const required = ["pertanyaan", "opsi a", "opsi b", "opsi c", "opsi d", "opsi e", "kunci"];
      const missing = required.filter((name) => !headerMap.has(name));
      if (missing.length) throw new Error(`Kolom wajib tidak ditemukan: ${missing.join(", ")}.`);
      const parsed: ImportedQuestion[] = [];
      const validationErrors: string[] = [];
      const cell = (row: unknown[], name: string) => row[headerMap.get(name)!];
      for (let index = headerIndex + 1; index < sheetRows.length; index++) {
        const source = sheetRows[index];
        const text = String(cell(source, "pertanyaan") ?? "").trim();
        if (!text) continue;
        const sourceRow = index + 1;
        const options = Object.fromEntries((["A", "B", "C", "D", "E"] as AnswerKey[]).map((key) => [key, String(cell(source, `opsi ${key.toLowerCase()}`) ?? "").trim()])) as Record<AnswerKey, string>;
        const correctAnswer = String(cell(source, "kunci") ?? "").trim().toUpperCase() as AnswerKey;
        const rawWeight = cell(source, "bobot");
        const weight = rawWeight === null || rawWeight === undefined || rawWeight === "" ? 1 : Number(String(rawWeight).replace(",", "."));
        const rowIssues: string[] = [];
        if (text.length < 3) rowIssues.push("pertanyaan terlalu pendek");
        if (Object.values(options).some((option) => !option)) rowIssues.push("opsi A–E belum lengkap");
        if (!(["A", "B", "C", "D", "E"] as string[]).includes(correctAnswer)) rowIssues.push("kunci harus A–E");
        if (!Number.isFinite(weight) || weight <= 0 || weight > 100) rowIssues.push("bobot harus 0–100");
        if (rowIssues.length) validationErrors.push(`Baris ${sourceRow}: ${rowIssues.join(", ")}.`);
        else parsed.push({ sourceRow, text, options, correctAnswer, weight });
      }
      if (!parsed.length && !validationErrors.length) validationErrors.push("Tidak ada soal yang terisi pada tab Soal.");
      if (parsed.length + validationErrors.length > 200) validationErrors.push("Maksimal 200 soal dalam satu file.");
      if (existingCount + parsed.length > 200) validationErrors.push(`Jumlah soal akan melebihi batas 200. Kuis saat ini memiliki ${existingCount} soal.`);
      setRows(parsed); setErrors(validationErrors);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "File tidak dapat dibaca."]);
    } finally { setReading(false); }
  }

  async function importQuestions() {
    if (!rows.length || errors.length) return;
    setImporting(true);
    try {
      const updates: Record<string, unknown> = {};
      rows.forEach((question, index) => {
        const id = push(ref(database, `questions/${quiz.id}`)).key!;
        const order = existingCount + index + 1;
        const privateQuestion = { type: "multiple_choice", text: question.text, options: question.options, correctAnswer: question.correctAnswer, weight: question.weight, order };
        const { correctAnswer: _answer, ...publicQuestion } = privateQuestion;
        updates[`questions/${quiz.id}/${id}`] = privateQuestion;
        updates[`publicQuestions/${quiz.id}/${id}`] = publicQuestion;
      });
      const count = existingCount + rows.length;
      updates[`quizzes/${quiz.id}/questionCount`] = count;
      updates[`quizzes/${quiz.id}/updatedAt`] = Date.now();
      updates[`quizAccess/${quiz.accessToken}/questionCount`] = count;
      updates[`quizAccessById/${quiz.id}/questionCount`] = count;
      await update(ref(database), updates);
      onImported(rows.length);
    } catch { setErrors(["Impor gagal disimpan ke database. Periksa koneksi lalu coba lagi."]); }
    finally { setImporting(false); }
  }

  return <div className="overlay"><div className="modal modal-wide"><div className="modal-head"><div><h2>Impor soal dari Excel</h2><p className="muted small">Data diperiksa di browser sebelum masuk ke kuis.</p></div><button className="icon-btn" onClick={onClose}><X size={18} /></button></div><div className="modal-body">
    <div className="import-guide"><div><strong>1. Unduh dan isi template</strong><p>Jangan mengubah nama tab atau judul kolom.</p></div><a className="btn btn-outline btn-sm" href="/template-soal-ruangtuntas.xlsx" download><Download size={15} />Unduh template</a></div>
    <label className={`import-dropzone ${fileName ? "has-file" : ""}`}><input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { const file = event.target.files?.[0]; if (file) readFile(file); }} /><span className="import-file-icon">{reading ? <LoaderCircle className="spin" size={25} /> : <FileSpreadsheet size={26} />}</span><strong>{reading ? "Membaca file…" : fileName || "Pilih file Excel"}</strong><span>{fileName ? "Klik untuk mengganti file" : "Format .xlsx, maksimal 5 MB dan 200 soal"}</span></label>
    {errors.length > 0 && <div className="import-errors"><strong><AlertTriangle size={16} />Perlu diperbaiki</strong>{errors.slice(0, 8).map((error) => <p key={error}>{error}</p>)}{errors.length > 8 && <p>…dan {errors.length - 8} kesalahan lainnya.</p>}</div>}
    {rows.length > 0 && <div className="import-preview"><div className="import-preview-head"><div><strong>{rows.length} soal siap diimpor</strong><p className="muted small">Pratinjau {Math.min(rows.length, 6)} baris pertama.</p></div><span className={`badge ${errors.length ? "badge-progress" : "badge-active"}`}>{errors.length ? "Periksa data" : "Valid"}</span></div><div className="table-wrap"><table className="data-table import-table"><thead><tr><th>Baris</th><th>Pertanyaan</th><th>Kunci</th><th>Bobot</th></tr></thead><tbody>{rows.slice(0, 6).map((question) => <tr key={question.sourceRow}><td>{question.sourceRow}</td><td>{question.text}</td><td><strong>{question.correctAnswer}</strong></td><td>{question.weight}</td></tr>)}</tbody></table></div></div>}
    <div className="modal-actions"><button className="btn btn-light" onClick={onClose}>Batal</button><button className="btn btn-primary" disabled={!rows.length || !!errors.length || reading || importing} onClick={importQuestions}>{importing ? <LoaderCircle className="spin" size={17} /> : <UploadCloud size={17} />}{importing ? "Mengimpor…" : `Impor ${rows.length || ""} soal`}</button></div>
  </div></div></div>;
}
