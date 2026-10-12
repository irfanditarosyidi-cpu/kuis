"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "@firebase/auth";
import { BookOpenCheck, Eye, EyeOff, GraduationCap, LoaderCircle } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/teacher");
    } catch {
      setError("Email atau kata sandi belum cocok. Periksa kembali data masuk Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <Link className="brand" href="/"><span className="brand-mark"><BookOpenCheck size={20} /></span>RuangTuntas</Link>
        <div className="story-copy rise">
          <p className="eyebrow" style={{ color: "var(--lime)" }}>Assess • Understand • Follow up</p>
          <h1>Setiap hasil punya <em>langkah berikutnya.</em></h1>
          <p>Pantau proses belajar secara langsung, pahami kebutuhan tiap siswa, lalu lanjutkan dengan remedial atau pengayaan yang tepat.</p>
        </div>
        <div className="quote">“Asesmen bukan garis akhir. Ia adalah kompas untuk pembelajaran berikutnya.”</div>
      </section>

      <section className="login-panel">
        <div className="login-box rise">
          <span className="eyebrow">Portal guru</span>
          <h2>Selamat datang kembali</h2>
          <p className="muted">Masuk untuk mengelola kuis dan melihat perkembangan siswa Anda.</p>
          <form className="login-form" onSubmit={login}>
            <label className="field">
              <span>Email</span>
              <input className="input" type="email" autoComplete="email" placeholder="guru@sekolah.sch.id" value={email} onChange={(e) => setEmail(e.target.value)} required aria-invalid={!!error} />
            </label>
            <label className="field">
              <span>Kata sandi</span>
              <div className="password-wrap">
                <input className="input" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Masukkan kata sandi" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} aria-invalid={!!error} />
                <button type="button" aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </label>
            {error && <div className="error-box" role="alert">{error}</div>}
            <button className="btn btn-primary login-submit" disabled={loading} aria-busy={loading}>{loading ? <LoaderCircle className="spin" size={18} /> : <GraduationCap size={18} />}{loading ? "Memeriksa…" : "Masuk sebagai Guru"}</button>
          </form>
          <p className="login-note">Siswa tidak perlu login — cukup buka tautan kuis dari guru.</p>
        </div>
      </section>
    </main>
  );
}
