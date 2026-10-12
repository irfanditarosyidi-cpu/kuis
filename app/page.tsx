import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  FileSpreadsheet,
  Link2,
  ListChecks,
  MonitorUp,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UploadCloud,
  Users,
} from "lucide-react";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "RuangTuntas | Asesmen yang Berlanjut",
  description: "Buat kuis, pantau proses belajar secara real-time, dan tentukan remedial atau pengayaan dari satu ruang kerja.",
};

const steps = [
  {
    number: "01",
    icon: UploadCloud,
    title: "Susun sekali, bagikan seketika",
    text: "Buat soal langsung atau impor dari Excel, lalu bagikan satu tautan unik kepada seluruh kelas.",
  },
  {
    number: "02",
    icon: MonitorUp,
    title: "Lihat proses saat berlangsung",
    text: "Ikuti progres jawaban dan aktivitas perpindahan halaman tanpa menunggu kuis berakhir.",
  },
  {
    number: "03",
    icon: Target,
    title: "Ubah hasil menjadi tindakan",
    text: "Nilai dihitung otomatis dan siswa langsung dikelompokkan untuk remedial atau pengayaan.",
  },
];

const features = [
  { icon: Activity, title: "Monitoring real-time", text: "Progres seluruh kelas bergerak langsung di layar guru." },
  { icon: ShieldCheck, title: "Jejak aktivitas", text: "Perpindahan tab dan halaman tercatat sebagai bahan pengamatan." },
  { icon: BarChart3, title: "Penilaian otomatis", text: "Skor, jumlah benar, dan jumlah salah tersedia begitu siswa mengumpulkan." },
  { icon: RefreshCcw, title: "Tindak lanjut terarah", text: "Batas ketuntasan memisahkan kebutuhan remedial dan pengayaan." },
  { icon: FileSpreadsheet, title: "Impor soal Excel", text: "Pindahkan bank soal hingga ratusan baris tanpa mengetik ulang." },
  { icon: Link2, title: "Akses tanpa akun siswa", text: "Siswa cukup membuka tautan atau memindai QR dari guru." },
];

const students = [
  { initials: "NA", name: "Nadia Aulia", detail: "10/10 soal", progress: "100%", state: "Selesai", tone: "done" },
  { initials: "RP", name: "Raka Pratama", detail: "8/10 soal", progress: "80%", state: "Mengerjakan", tone: "working" },
  { initials: "SF", name: "Salma Fitria", detail: "6/10 soal", progress: "60%", state: "Mengerjakan", tone: "working" },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} id="beranda">
        <Image
          className={styles.heroImage}
          src="/ruangtuntas-classroom.webp"
          alt="Guru mendampingi siswa mengerjakan asesmen digital di kelas"
          fill
          priority
          sizes="100vw"
        />
        <div className={styles.heroShade} aria-hidden="true" />

        <header className={styles.navbar}>
          <Link className={styles.brand} href="#beranda" aria-label="RuangTuntas, kembali ke beranda">
            <span className={styles.brandMark}><BookOpenCheck size={20} strokeWidth={2.4} /></span>
            <span>RuangTuntas</span>
          </Link>
          <nav className={styles.navLinks} aria-label="Navigasi utama">
            <a href="#cara-kerja">Cara kerja</a>
            <a href="#produk">Produk</a>
            <a href="#fitur">Fitur</a>
          </nav>
          <Link className={styles.navCta} href="/login">Masuk Guru <ArrowRight size={16} /></Link>
        </header>

        <div className={styles.heroContent}>
          <p className={styles.kicker}><span /> Platform asesmen dan tindak lanjut</p>
          <h1>RuangTuntas</h1>
          <p className={styles.heroTagline}>Asesmen yang tidak berhenti di angka.</p>
          <p className={styles.heroText}>
            Pahami proses belajar saat terjadi, temukan siapa yang membutuhkan dukungan,
            dan lanjutkan pembelajaran dengan langkah yang tepat.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="/login">Masuk sebagai Guru <ArrowRight size={18} /></Link>
            <a className={styles.secondaryAction} href="#cara-kerja">Jelajahi alurnya <ArrowDown size={17} /></a>
          </div>
          <div className={styles.heroProof} aria-label="Keunggulan utama">
            <span><Check size={15} /> Tanpa akun siswa</span>
            <span><Check size={15} /> Nilai otomatis</span>
            <span><Check size={15} /> Pantauan langsung</span>
          </div>
        </div>

        <a className={styles.scrollCue} href="#cara-kerja" aria-label="Lihat bagian berikutnya">
          <span>Temukan caranya</span><ArrowDown size={17} />
        </a>
      </section>

      <section className={styles.signalBand} aria-label="Ringkasan RuangTuntas">
        <div className={styles.signalInner}>
          <div><Clock3 size={20} /><span><strong>Real-time</strong>Progres terlihat saat itu juga</span></div>
          <div><Users size={20} /><span><strong>Tanpa friksi</strong>Siswa masuk melalui satu tautan</span></div>
          <div><Sparkles size={20} /><span><strong>Siap ditindaklanjuti</strong>Remedial dan pengayaan otomatis</span></div>
        </div>
      </section>

      <section className={styles.processSection} id="cara-kerja">
        <div className={styles.sectionIntro}>
          <div>
            <p className={styles.sectionKicker}>Dari asesmen menuju aksi</p>
            <h2>Satu alur, keputusan belajar yang lebih jelas.</h2>
          </div>
          <p>RuangTuntas menyatukan pembuatan kuis, pengamatan proses, penilaian, dan tindak lanjut dalam alur yang tenang dan mudah dipahami.</p>
        </div>

        <ol className={styles.processRail}>
          {steps.map(({ number, icon: Icon, title, text }) => (
            <li key={number}>
              <div className={styles.stepTop}>
                <span className={styles.stepNumber}>{number}</span>
                <span className={styles.stepIcon}><Icon size={22} /></span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.productSection} id="produk">
        <div className={styles.productCopy}>
          <p className={styles.sectionKicker}>Kelas dalam satu pandangan</p>
          <h2>Guru tidak perlu menunggu untuk memahami.</h2>
          <p className={styles.productLead}>Saat kuis berjalan, setiap progres dan aktivitas penting hadir dalam tampilan yang mudah dipindai.</p>
          <ul>
            <li><CheckCircle2 size={18} /><span><strong>Fokus pada pola kelas</strong> Lihat siapa yang selesai, tertinggal, atau perlu diperhatikan.</span></li>
            <li><CheckCircle2 size={18} /><span><strong>Nilai tetap privat</strong> Mode proyektor menampilkan progres tanpa membuka hasil siswa.</span></li>
            <li><CheckCircle2 size={18} /><span><strong>Keputusan lebih cepat</strong> Hasil akhir langsung siap untuk langkah berikutnya.</span></li>
          </ul>
          <Link className={styles.textLink} href="/login">Buka portal guru <ArrowRight size={17} /></Link>
        </div>

        <div className={styles.productVisual} role="img" aria-label="Pratinjau dashboard monitoring kuis RuangTuntas">
          <div className={styles.windowBar}>
            <div className={styles.windowDots} aria-hidden="true"><i /><i /><i /></div>
            <span>Monitoring Kuis</span>
            <div className={styles.liveLabel}><i /> LIVE</div>
          </div>
          <div className={styles.mockContent}>
            <div className={styles.mockHeader}>
              <div><span>Konfigurasi Elektron</span><strong>Kelas XI IPA 1</strong></div>
              <div className={styles.mockTime}><Clock3 size={14} /> 09:42</div>
            </div>
            <div className={styles.mockStats}>
              <div><Users size={17} /><span><strong>32</strong>Peserta</span></div>
              <div><Activity size={17} /><span><strong>18</strong>Mengerjakan</span></div>
              <div><CheckCircle2 size={17} /><span><strong>14</strong>Selesai</span></div>
              <div><Eye size={17} /><span><strong>2</strong>Perlu dilihat</span></div>
            </div>
            <div className={styles.mockBody}>
              <div className={styles.studentPanel}>
                <div className={styles.mockSectionTitle}><strong>Progres siswa</strong><span>Diperbarui langsung</span></div>
                <div className={styles.studentList}>
                  {students.map((student) => (
                    <div className={styles.studentRow} key={student.name}>
                      <span className={styles.studentAvatar}>{student.initials}</span>
                      <span className={styles.studentInfo}><strong>{student.name}</strong><small>{student.detail}</small></span>
                      <span className={styles.miniProgress}><i style={{ width: student.progress }} /></span>
                      <span className={`${styles.studentState} ${styles[student.tone]}`}>{student.state}</span>
                    </div>
                  ))}
                </div>
              </div>
              <aside className={styles.activityPanel}>
                <div className={styles.mockSectionTitle}><strong>Aktivitas</strong><span>Terbaru</span></div>
                <div className={styles.activityItem}><span className={styles.activityGood}><Check size={13} /></span><p><strong>Nadia selesai</strong><small>Baru saja</small></p></div>
                <div className={styles.activityItem}><span className={styles.activityWarn}><Eye size={13} /></span><p><strong>Raka kembali</strong><small>1 menit lalu</small></p></div>
                <div className={styles.activityItem}><span className={styles.activityInfo}><ListChecks size={13} /></span><p><strong>Salma menjawab</strong><small>2 menit lalu</small></p></div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.featuresSection} id="fitur">
        <div className={styles.featuresHeading}>
          <p className={styles.sectionKicker}>Dibuat untuk ritme mengajar</p>
          <h2>Yang penting terlihat.<br />Yang rumit dibuat sederhana.</h2>
        </div>
        <div className={styles.featuresGrid}>
          {features.map(({ icon: Icon, title, text }, index) => (
            <article key={title}>
              <span className={styles.featureIndex}>0{index + 1}</span>
              <Icon size={23} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.outcomeBand}>
        <div>
          <span className={styles.outcomeIcon}><Trophy size={25} /></span>
          <p>Setiap hasil punya langkah berikutnya.</p>
        </div>
        <div className={styles.outcomeWords} aria-label="Alur hasil belajar">
          <span>Asesmen</span><ArrowRight size={18} /><span>Pemahaman</span><ArrowRight size={18} /><strong>Tindak lanjut</strong>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <p className={styles.sectionKicker}>Mulai dari kelas berikutnya</p>
          <h2>Beri setiap hasil arah yang berarti.</h2>
          <p>Masuk ke RuangTuntas, siapkan kuis, dan lihat pembelajaran bergerak dari data menuju tindakan.</p>
        </div>
        <Link className={styles.finalButton} href="/login">Masuk ke RuangTuntas <ArrowRight size={19} /></Link>
      </section>

      <footer className={styles.footer}>
        <Link className={styles.footerBrand} href="#beranda"><BookOpenCheck size={20} /> RuangTuntas</Link>
        <p>Assess. Understand. Follow up.</p>
        <Link href="/login">Portal Guru <ArrowRight size={15} /></Link>
      </footer>
    </main>
  );
}
