# RuangTuntas

Platform kuis online untuk tahap **Assessing & Follow Up**. Guru dapat membuat kuis pilihan ganda dengan lima opsi jawaban, membagikan tautan unik, memantau pengerjaan secara real-time, melihat indikator perpindahan halaman, dan memperoleh klasifikasi Remedial/Pengayaan otomatis.

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
npm run build
```

## Struktur data

- `quizzes` dan `questions`: data privat guru, termasuk kunci jawaban.
- `quizAccess` dan `publicQuestions`: payload aman untuk route siswa, tanpa kunci jawaban.
- `attempts`, `answers`, `activityLogs`: sesi siswa, jawaban, progres, dan event monitoring.
- `teacherQuizIndex`: indeks kuis per guru.

Penilaian dilakukan di `app/api/attempts/[attemptId]/submit/route.ts`. Browser siswa tidak pernah menerima `correctAnswer`.

Guru dapat mengimpor hingga 200 soal sekaligus melalui menu **Soal → Impor Excel**. Gunakan template `/template-soal-ruangtuntas.xlsx`; file dibaca dan divalidasi langsung di browser sebelum disimpan ke Firebase.

Saat kuis berlangsung, buka **Monitoring → Mode Proyektor** untuk menampilkan nama, progres, jumlah keluar halaman, dan riwayat keluar/kembali siswa secara real-time tanpa menampilkan nilai.

## Produksi

1. Aktifkan Email/Password pada Firebase Authentication.
2. Deploy `database.rules.json` dengan `npx firebase-tools deploy --only database`.
3. Di Vercel, tambahkan `FIREBASE_DATABASE_AUTH` untuk route server setelah rules dikunci. Ini adalah kredensial server, bukan Firebase Web API key.
4. Deploy repository ke Vercel; region fungsi sudah diarahkan ke Singapura melalui `vercel.json`.

Firebase Web API key memang bersifat publik. Keamanan produksi berasal dari Authentication, Security Rules, dan kredensial route server—bukan dari menyembunyikan konfigurasi web.
