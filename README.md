# RuangTuntas

Platform kuis online untuk tahap **Assessing & Follow Up**. Guru dapat membuat kuis pilihan ganda dengan lima opsi jawaban, membagikan tautan unik, memantau pengerjaan secara real-time, melihat indikator perpindahan halaman, dan memperoleh klasifikasi Remedial/Pengayaan otomatis.

Guru juga dapat menulis atau mengimpor soal uraian remedial dan pengayaan pada menu **Tindak lanjut**. Setelah mengumpulkan kuis, siswa dapat mengunduh PDF berisi soal yang sesuai dengan klasifikasi nilainya. PDF dibuat saat diunduh dan tidak disimpan sebagai file di database.

## Menjalankan lokal

Konfigurasi Firebase Web dari proyek `tesis-5c7ab` sudah tertanam di `lib/firebase.ts`, jadi tidak perlu membuat `.env` untuk mencoba aplikasi.

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`, lalu masuk menggunakan akun guru yang terdaftar pada Firebase Authentication.

## Perintah

```bash
npm run typecheck
npm run test:orbital
npm run build
```

Untuk membuat akun guru baru sekaligus menyalin seluruh kuis dan soal dari guru yang sudah ada, jalankan skrip provisioning dengan kredensial melalui environment variable. Skrip membuat ID kuis dan tautan baru, serta tidak menyalin jawaban, aktivitas, atau nilai siswa.

```powershell
$env:SOURCE_TEACHER_UID="uid-guru-sumber"
$env:NEW_TEACHER_EMAIL="guru-baru@sekolah.sch.id"
$env:NEW_TEACHER_PASSWORD="kata-sandi-baru"
$env:NEW_TEACHER_NAME="Guru 2"
npm run clone:teacher
```

## Struktur data

- `quizzes` dan `questions`: data privat guru, termasuk kunci jawaban.
- `quizAccess` dan `publicQuestions`: payload aman untuk route siswa, tanpa kunci jawaban.
- `attempts`, `answers`, `activityLogs`: sesi siswa, jawaban, progres, dan event monitoring.
- `followUpQuestions`: soal uraian remedial/pengayaan yang disimpan di Realtime Database tanpa kunci jawaban.
- `teacherQuizIndex`: indeks kuis per guru.

Penilaian dilakukan di `app/api/attempts/[attemptId]/submit/route.ts`. Browser siswa tidak pernah menerima `correctAnswer`.

Guru dapat mengimpor hingga 200 soal sekaligus melalui menu **Soal → Impor Excel**. Gunakan template `/template-soal-ruangtuntas.xlsx`; file dibaca dan divalidasi langsung di browser sebelum disimpan ke Firebase.

Diagram orbital dapat ditulis sebagai teks pada pertanyaan maupun pilihan jawaban, misalnya `[↑↓][↑][↑]`. Format `[↑↓]`, `[↑]`, `[↓]`, `[ ]`, dan konfigurasi pengecoh seperti `[↑↑]` akan dirender otomatis sebagai kotak orbital tanpa mengubah teks yang tersimpan.

Saat kuis berlangsung, buka **Monitoring → Mode Proyektor** untuk menampilkan nama, progres, jumlah keluar halaman, dan riwayat keluar/kembali siswa secara real-time tanpa menampilkan nilai.

## Produksi

1. Aktifkan Email/Password pada Firebase Authentication.
2. Deploy `database.rules.json` dengan `npx firebase-tools deploy --only database`.
3. Di Vercel, tambahkan `FIREBASE_DATABASE_AUTH` untuk route server setelah rules dikunci. Ini adalah kredensial server, bukan Firebase Web API key.
4. Deploy repository ke Vercel; region fungsi sudah diarahkan ke Singapura melalui `vercel.json`.

Firebase Web API key memang bersifat publik. Keamanan produksi berasal dari Authentication, Security Rules, dan kredensial route server—bukan dari menyembunyikan konfigurasi web.
