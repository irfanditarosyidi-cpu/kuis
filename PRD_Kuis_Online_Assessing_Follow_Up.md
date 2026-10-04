# PRD — Website Kuis Online Assessing & Follow Up

## 1. Ringkasan Produk

Website ini merupakan platform kuis online sederhana untuk mendukung tahap **Assessing & Follow Up** pada pembelajaran. Sistem berfokus pada kebutuhan guru untuk membuat kuis per materi, menghasilkan tautan kuis unik, membagikan tautan tersebut kepada siswa, memantau proses pengerjaan secara real-time, mencatat indikasi siswa meninggalkan halaman kuis, menghitung nilai otomatis, serta menentukan tindak lanjut **Remedial** atau **Pengayaan** berdasarkan nilai yang diperoleh.

Platform tidak dirancang sebagai LMS lengkap. Siswa tidak memiliki dashboard untuk melihat daftar kuis. Siswa hanya dapat mengakses kuis melalui tautan unik yang diberikan guru.

Teknologi utama:
- Frontend: React/Next.js atau React + Vite
- Hosting/deployment: Vercel
- Database real-time: Firebase Realtime Database
- Authentication guru: Firebase Authentication
- Penyimpanan status pengerjaan dan monitoring: Firebase Realtime Database

## 2. Tujuan Produk

Produk harus memungkinkan guru untuk:
1. Membuat kuis berdasarkan materi tertentu.
2. Menambahkan dan mengelola soal di dalam kuis.
3. Menghasilkan tautan unik untuk setiap kuis.
4. Membagikan tautan hanya kepada siswa yang akan mengerjakan.
5. Membuka dan menutup akses kuis.
6. Menetapkan batas nilai ketuntasan.
7. Memantau siswa yang sedang mengerjakan secara real-time.
8. Melihat progres pengerjaan setiap siswa.
9. Mendapatkan indikator ketika siswa meninggalkan halaman kuis.
10. Melihat nilai akhir siswa secara otomatis.
11. Melihat status tindak lanjut siswa secara otomatis: **Remedial** atau **Pengayaan**.
12. Melihat riwayat kejadian selama pengerjaan.

Produk harus memungkinkan siswa untuk:
1. Membuka kuis hanya melalui tautan yang dibagikan guru.
2. Mengisi identitas sebelum mengerjakan.
3. Mengerjakan kuis tanpa perlu membuat akun.
4. Mengirim jawaban dan memperoleh nilai setelah selesai.
5. Mengetahui status tindak lanjut setelah kuis selesai.
6. Tidak dapat melihat daftar kuis lain.

## 3. Pengguna

### 3.1 Guru
Guru merupakan pengguna dengan akun terautentikasi.

Hak akses guru:
- masuk ke dashboard;
- membuat kuis;
- mengedit kuis;
- menghapus kuis;
- mengatur status kuis;
- menambahkan, mengubah, dan menghapus soal;
- mengatur batas nilai;
- menyalin tautan kuis;
- memantau peserta;
- melihat hasil;
- melihat log aktivitas siswa.

### 3.2 Siswa
Siswa tidak perlu memiliki akun.

Siswa mengakses sistem melalui:
- tautan kuis unik;
- identitas berupa nama, nomor absen, dan kelas;
- sesi pengerjaan yang dibuat ketika siswa menekan tombol **Mulai Kuis**.

Siswa tidak memiliki:
- dashboard;
- menu daftar kuis;
- akses untuk mencari atau melihat kuis lain.

## 4. Ruang Lingkup MVP

MVP harus mencakup:
- autentikasi guru;
- dashboard guru;
- CRUD kuis;
- CRUD soal;
- tautan kuis unik;
- akses siswa melalui tautan;
- identitas siswa;
- soal pilihan ganda;
- penilaian otomatis;
- progress pengerjaan;
- monitoring real-time;
- pencatatan event keluar dari halaman;
- status Remedial/Pengayaan;
- halaman hasil siswa;
- buka/tutup kuis;
- Firebase Realtime Database;
- deploy di Vercel.

Fitur di luar MVP:
- soal esai otomatis;
- AI;
- bank soal global;
- ranking siswa;
- sertifikat;
- analitik kompleks;
- integrasi LMS;
- akun siswa;
- sistem proctoring berbasis kamera.

## 5. User Flow Guru

### 5.1 Login
1. Guru membuka halaman login.
2. Guru memasukkan email dan password.
3. Sistem memvalidasi melalui Firebase Authentication.
4. Jika berhasil, guru diarahkan ke dashboard.

### 5.2 Dashboard Guru
Dashboard menampilkan daftar kuis dalam bentuk card.

Informasi minimal setiap card:
- judul kuis;
- materi;
- jumlah soal;
- jumlah peserta;
- status kuis;
- batas ketuntasan;
- tombol **Kelola Kuis**;
- tombol **Salin Link**.

Status kuis:
- Draft
- Aktif
- Ditutup

### 5.3 Membuat Kuis
Guru menekan tombol **Buat Kuis**.

Form minimal:
- Judul kuis
- Materi
- Deskripsi singkat
- Batas nilai ketuntasan
- Durasi kuis, opsional
- Acak soal, opsional
- Acak pilihan jawaban, opsional

Setelah kuis dibuat, sistem membuat `quizId` dan `accessToken` acak.

Contoh URL:

`https://domain.com/q/9xKp3LmT7Qa2`

Token harus:
- sulit ditebak;
- tidak berurutan;
- tidak berasal dari nomor database sederhana;
- memiliki entropi yang cukup.

### 5.4 Membuat Soal
Di halaman **Kelola Kuis**, guru dapat menambah soal.

Format soal MVP:
- pertanyaan;
- opsi A;
- opsi B;
- opsi C;
- opsi D;
- kunci jawaban;
- bobot.

Guru dapat:
- tambah soal;
- edit soal;
- hapus soal;
- mengubah urutan soal.

### 5.5 Mengaktifkan Kuis
Guru menekan **Aktifkan Kuis**.

Saat kuis aktif:
- link dapat digunakan;
- siswa dapat memasukkan identitas;
- siswa dapat memulai kuis.

Saat kuis ditutup:
- link tetap valid secara struktur tetapi halaman menampilkan:
  **“Kuis sudah ditutup oleh guru.”**

## 6. User Flow Siswa

### 6.1 Membuka Link
Siswa membuka link kuis.

Sistem harus:
1. membaca token dari URL;
2. mencari kuis yang sesuai;
3. memastikan token valid;
4. memastikan kuis berstatus aktif.

Jika token tidak ditemukan:
> Kuis tidak ditemukan atau tautan tidak valid.

Jika kuis belum aktif:
> Kuis belum dapat dikerjakan.

Jika kuis sudah ditutup:
> Kuis sudah ditutup oleh guru.

Tidak boleh ada:
- halaman daftar kuis;
- tombol menuju kuis lain;
- pencarian kuis.

### 6.2 Form Identitas
Sebelum kuis dimulai, siswa mengisi:
- Nama
- Nomor Absen
- Kelas

Tombol:
**Mulai Kuis**

Setelah tombol ditekan:
- sistem membuat `attemptId`;
- waktu mulai disimpan;
- status siswa menjadi `in_progress`;
- card siswa muncul di dashboard monitoring guru.

### 6.3 Pengerjaan Kuis
Halaman pengerjaan menampilkan:
- judul kuis;
- nama siswa;
- nomor soal;
- pertanyaan;
- pilihan jawaban;
- indikator progress;
- tombol sebelumnya/berikutnya;
- tombol submit.

Jawaban siswa disimpan secara berkala atau setiap perubahan jawaban ke Firebase Realtime Database.

Contoh progress:
- 1/10
- 4/10
- 10/10

Jika durasi kuis digunakan:
- timer tampil;
- saat waktu habis, kuis otomatis dikumpulkan.

## 7. Monitoring Real-Time

Guru membuka halaman **Monitoring Kuis**.

Setiap siswa ditampilkan dalam card atau tabel.

Informasi minimal:
- Nama
- Nomor absen
- Kelas
- Status pengerjaan
- Progress
- Waktu mulai
- Jumlah event keluar halaman
- Nilai
- Status tindak lanjut

Contoh card:

```text
Andi Pratama
No. 12 | X-2

Progress       : 7/10
Status         : Sedang mengerjakan
Keluar halaman : 1 kali
Nilai          : -
Tindak lanjut  : -
```

Setelah submit:

```text
Andi Pratama
No. 12 | X-2

Progress       : 10/10
Status         : Selesai
Keluar halaman : 1 kali
Nilai          : 80
Tindak lanjut  : PENGAYAAN
```

Perubahan harus muncul tanpa refresh manual menggunakan listener Firebase Realtime Database.

## 8. Monitoring Keluar dari Halaman

### 8.1 Tujuan
Fitur ini digunakan sebagai **indikator pengawasan**, bukan sebagai bukti mutlak kecurangan.

Sistem mencatat ketika halaman kuis kehilangan fokus atau tidak lagi terlihat.

Event yang dapat digunakan:
- `visibilitychange`
- `window.blur`
- `pagehide`
- `beforeunload`

### 8.2 Event yang Dicatat

Contoh data:

```json
{
  "eventType": "visibility_hidden",
  "timestamp": 1791098123456
}
```

Jenis event:
- `tab_hidden`
- `window_blur`
- `page_unload`
- `page_return`
- `page_reload`

Sistem harus melakukan debouncing/deduplication agar satu perpindahan tab tidak tercatat berkali-kali akibat beberapa browser event yang terjadi bersamaan.

### 8.3 Tampilan Guru
Card siswa menampilkan:

`⚠ Keluar halaman: 2 kali`

Guru dapat membuka detail:

```text
10:32:14 — Halaman tidak aktif
10:32:21 — Kembali ke halaman
10:37:02 — Halaman tidak aktif
10:37:08 — Kembali ke halaman
```

### 8.4 Batasan
Data ini hanya indikator aktivitas, karena browser tidak selalu mampu memastikan apakah siswa:
- berpindah tab;
- meminimalkan browser;
- berpindah aplikasi;
- mengunci layar;
- kehilangan koneksi;
- menutup halaman.

Jangan otomatis memberikan nilai 0 hanya berdasarkan event ini.

## 9. Penilaian Otomatis

Untuk soal pilihan ganda:

```text
Skor = (total bobot jawaban benar / total bobot seluruh soal) × 100
```

Jika semua soal berbobot sama:

```text
Skor = (jumlah benar / jumlah soal) × 100
```

Nilai dibulatkan maksimal dua angka di belakang koma.

Setelah submit:
- jawaban dikunci;
- nilai dihitung;
- status pengerjaan menjadi `submitted`;
- waktu submit disimpan.

## 10. Remedial dan Pengayaan Otomatis

Saat membuat kuis, guru menentukan nilai batas ketuntasan.

Contoh:

`Batas ketuntasan = 75`

Aturan:

```text
Jika nilai < batas ketuntasan
→ REMEDIAL

Jika nilai >= batas ketuntasan
→ PENGAYAAN
```

Status disimpan pada attempt siswa.

### Tampilan card
**Remedial**
- Badge: `REMEDIAL`

**Pengayaan**
- Badge: `PENGAYAAN`

Tidak perlu guru menetapkan status satu per satu.

## 11. Halaman Hasil Siswa

Setelah siswa melakukan submit, tampilkan:
- Nama
- Nilai
- Jumlah benar
- Jumlah salah
- Status tindak lanjut

Contoh:

```text
Kuis Selesai

Nama  : Andi Pratama
Nilai : 80

Status Tindak Lanjut:
PENGAYAAN
```

Instruksi bawah:

> Berdasarkan hasil kuis yang telah diperoleh, catat pada buku tulis masing-masing bagian materi yang masih perlu dipelajari serta rencana yang akan dilakukan untuk memperbaiki atau mengembangkan pemahaman.

## 12. Halaman Guru

Struktur navigasi sederhana:

### Sidebar
- Dashboard
- Kuis
- Keluar

### Dashboard
Menampilkan ringkasan:
- Jumlah kuis
- Kuis aktif
- Total pengerjaan
- Total remedial
- Total pengayaan

### Kuis
Daftar seluruh kuis.

### Kelola Kuis
Subbagian:
- Informasi Kuis
- Soal
- Link Kuis
- Monitoring
- Hasil

## 13. Data Model Firebase Realtime Database

Contoh struktur:

```json
{
  "users": {
    "teacherUid": {
      "name": "Guru",
      "email": "guru@email.com"
    }
  },
  "quizzes": {
    "quizId": {
      "teacherId": "teacherUid",
      "title": "Aturan dan Penulisan Konfigurasi Elektron Atom Netral",
      "material": "Konfigurasi Elektron",
      "description": "",
      "passingScore": 75,
      "status": "active",
      "accessToken": "9xKp3LmT7Qa2",
      "durationMinutes": 20,
      "shuffleQuestions": false,
      "shuffleOptions": false,
      "createdAt": 1791098000000
    }
  },
  "questions": {
    "quizId": {
      "questionId": {
        "type": "multiple_choice",
        "text": "Pertanyaan...",
        "options": {
          "A": "Pilihan A",
          "B": "Pilihan B",
          "C": "Pilihan C",
          "D": "Pilihan D"
        },
        "correctAnswer": "B",
        "weight": 1,
        "order": 1
      }
    }
  },
  "attempts": {
    "quizId": {
      "attemptId": {
        "student": {
          "name": "Andi Pratama",
          "attendanceNumber": "12",
          "className": "X-2"
        },
        "status": "in_progress",
        "startedAt": 1791098100000,
        "submittedAt": null,
        "progress": {
          "answered": 7,
          "total": 10
        },
        "score": null,
        "followUp": null,
        "leaveCount": 1
      }
    }
  },
  "answers": {
    "quizId": {
      "attemptId": {
        "questionId": {
          "answer": "B",
          "updatedAt": 1791098120000
        }
      }
    }
  },
  "activityLogs": {
    "quizId": {
      "attemptId": {
        "eventId": {
          "type": "tab_hidden",
          "timestamp": 1791098123456
        }
      }
    }
  }
}
```

## 14. Keamanan Akses

### 14.1 Guru
Semua operasi guru harus memerlukan Firebase Authentication.

Guru hanya boleh:
- membaca kuis miliknya;
- menulis kuis miliknya;
- melihat attempt untuk kuis miliknya.

### 14.2 Siswa
Siswa tidak boleh memperoleh akses membaca seluruh node `quizzes`.

Siswa hanya boleh memperoleh data kuis setelah token yang valid diverifikasi oleh aplikasi.

Jangan membuat endpoint yang memungkinkan `/quizzes` menampilkan seluruh daftar kuis kepada siswa.

### 14.3 Access Token
Token harus dihasilkan menggunakan generator acak yang aman.

Hindari:
- `/quiz/1`
- `/quiz/2`
- `/quiz/3`

Gunakan bentuk:

```text
/q/jY7mQ9xA2KpL
```

### 14.4 Kunci Jawaban
Kunci jawaban **tidak boleh dikirim ke browser siswa selama pengerjaan**.

Penilaian sebaiknya dilakukan melalui lingkungan server, misalnya:
- Vercel Serverless Function;
- Next.js API Route / Server Action;
- Firebase Cloud Function.

Frontend siswa hanya menerima:
- pertanyaan;
- opsi;
- metadata yang dibutuhkan.

Frontend siswa tidak menerima:
- `correctAnswer`.

## 15. Firebase Security Rules

Rules harus memastikan:
- guru hanya mengakses datanya sendiri;
- akses siswa dibatasi;
- siswa tidak dapat membaca kunci jawaban;
- siswa tidak dapat mengubah nilai;
- siswa tidak dapat mengubah status tindak lanjut;
- siswa tidak dapat mengubah data attempt milik siswa lain.

Nilai dan follow-up hanya boleh ditulis oleh backend terpercaya.

## 16. Identitas dan Sesi Siswa

Saat siswa memulai kuis, sistem membuat:
- `attemptId`
- `sessionToken`

`sessionToken` disimpan di browser selama sesi.

Tujuan:
- membedakan setiap pengerjaan;
- mencegah siswa secara langsung mengedit attempt siswa lain;
- memulihkan sesi jika halaman tidak sengaja reload.

Jika siswa membuka link yang sama kembali dan sesi belum submit:
- tawarkan **Lanjutkan Pengerjaan**.

## 17. Pencegahan Pengerjaan Ganda

MVP dapat menggunakan kombinasi:
- quizId
- kelas
- nomor absen
- nama

Jika ditemukan attempt `submitted` dengan identitas yang sama:
- tampilkan pesan bahwa kuis sudah pernah diselesaikan.

Guru dapat memiliki tombol **Izinkan Mengulang** jika memang dibutuhkan.

## 18. Status Attempt

Gunakan status:
- `registered`
- `in_progress`
- `submitted`
- `expired`

Keterangan:

**registered** — siswa sudah mengisi identitas tetapi belum memulai.

**in_progress** — siswa sedang mengerjakan.

**submitted** — jawaban sudah dikumpulkan.

**expired** — waktu habis atau sesi dinyatakan tidak lagi aktif.

## 19. Status Kuis

Gunakan:
- `draft`
- `active`
- `closed`

**draft** — belum dapat diakses siswa.

**active** — dapat dikerjakan.

**closed** — tidak menerima pengerjaan baru.

## 20. UI/UX

### Gaya
- sederhana;
- bersih;
- nyaman untuk siswa SMA;
- responsif;
- dapat digunakan di HP maupun laptop;
- warna konsisten dengan materi pembelajaran;
- tidak terlalu banyak navigasi.

### Dashboard Guru
Prioritaskan informasi:
1. siapa yang sedang mengerjakan;
2. progress;
3. event keluar halaman;
4. nilai;
5. remedial/pengayaan.

### Halaman Siswa
Selama kuis:
- tidak menampilkan sidebar;
- tidak ada menu menuju halaman lain;
- satu fokus utama: mengerjakan kuis.

## 21. Komponen Utama

### Teacher
```text
TeacherLogin
TeacherDashboard
QuizList
QuizCard
QuizEditor
QuestionEditor
QuizSettings
QuizLinkPanel
MonitoringDashboard
StudentAttemptCard
ActivityLogModal
ResultTable
```

### Student
```text
QuizAccessPage
StudentIdentityForm
QuizInstruction
QuizPlayer
QuestionCard
QuizProgress
QuizTimer
SubmitConfirmation
QuizResult
```

## 22. Route yang Disarankan

```text
/login

/teacher
/teacher/quizzes
/teacher/quizzes/new
/teacher/quizzes/:quizId
/teacher/quizzes/:quizId/questions
/teacher/quizzes/:quizId/monitor
/teacher/quizzes/:quizId/results

/q/:accessToken
/q/:accessToken/start
/q/:accessToken/result
```

Jangan menyediakan route publik berupa `/quizzes` yang menampilkan daftar kuis kepada siswa.

## 23. Monitoring UI

Contoh layout:

```text
Monitoring — Konfigurasi Elektron

Sedang mengerjakan : 12
Selesai             : 18
Remedial            : 5
Pengayaan           : 13

--------------------------------------------------------
Nama        Progress    Keluar     Nilai    Tindak Lanjut
--------------------------------------------------------
Andi        7/10        ⚠ 1        -        -
Budi        10/10       0          80       Pengayaan
Citra       10/10       ⚠ 2        60       Remedial
--------------------------------------------------------
```

Guru dapat mengklik siswa untuk membuka detail aktivitas.

## 24. Acceptance Criteria

### Guru
- [ ] Guru dapat login.
- [ ] Guru dapat membuat kuis.
- [ ] Guru dapat mengedit dan menghapus kuis.
- [ ] Guru dapat membuat soal pilihan ganda.
- [ ] Guru dapat menetapkan kunci jawaban.
- [ ] Guru dapat menentukan batas nilai.
- [ ] Sistem menghasilkan link unik.
- [ ] Guru dapat mengaktifkan dan menutup kuis.
- [ ] Guru dapat menyalin link.
- [ ] Guru melihat siswa secara real-time.
- [ ] Guru melihat progress pengerjaan.
- [ ] Guru menerima indikator siswa meninggalkan halaman.
- [ ] Guru melihat nilai otomatis.
- [ ] Guru melihat status Remedial/Pengayaan otomatis.

### Siswa
- [ ] Siswa dapat membuka kuis dari link valid.
- [ ] Siswa tidak melihat daftar kuis.
- [ ] Link invalid ditolak.
- [ ] Kuis tertutup tidak dapat dimulai.
- [ ] Siswa dapat memasukkan identitas.
- [ ] Siswa dapat mengerjakan soal.
- [ ] Jawaban tersimpan selama pengerjaan.
- [ ] Siswa dapat submit.
- [ ] Nilai muncul setelah submit.
- [ ] Status tindak lanjut muncul setelah submit.
- [ ] Kunci jawaban tidak tersedia di payload browser selama pengerjaan.

### Monitoring
- [ ] `visibilitychange` tercatat.
- [ ] event tidak terduplikasi berlebihan.
- [ ] guru dapat melihat jumlah event.
- [ ] guru dapat melihat waktu kejadian.
- [ ] monitoring update tanpa refresh.

## 25. Non-Functional Requirements

### Responsiveness
Website harus dapat digunakan pada:
- smartphone;
- tablet;
- laptop;
- desktop.

### Performance
- halaman siswa harus ringan;
- loading awal sebaiknya < 3 detik pada koneksi normal;
- update monitoring real-time tidak memerlukan refresh.

### Reliability
Jawaban yang telah dipilih harus tetap tersedia jika:
- koneksi terputus sebentar;
- halaman reload;
- siswa kembali ke sesi aktif.

### Security
- Firebase config publik bukan pengganti security rules;
- semua rules harus diuji;
- kunci jawaban tidak boleh dikirim ke client;
- penilaian tidak boleh dipercayakan ke input nilai dari browser siswa.

## 26. Rekomendasi Arsitektur

```text
                         ┌───────────────────────┐
                         │       Vercel          │
                         │ React / Next.js App   │
                         └───────────┬───────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
        Teacher Interface                       Student Interface
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     │
                          Firebase Realtime DB
                                     │
                ┌────────────────────┴────────────────────┐
                │                                         │
      Firebase Authentication                  Secure scoring API
             (Guru)                         / Serverless Function
```

Untuk implementasi yang paling aman, disarankan menggunakan **Next.js di Vercel** agar validasi token dan penilaian dapat dilakukan pada server route tanpa mengekspos kunci jawaban.

## 27. Urutan Implementasi

### Phase 1 — Foundation
- setup project;
- setup Firebase;
- authentication guru;
- routing;
- layout dashboard.

### Phase 2 — Quiz Management
- CRUD kuis;
- CRUD soal;
- access token;
- buka/tutup kuis.

### Phase 3 — Student Quiz
- akses via token;
- identitas;
- pengerjaan;
- penyimpanan jawaban;
- submit.

### Phase 4 — Scoring
- scoring server-side;
- batas ketuntasan;
- remedial/pengayaan;
- halaman hasil.

### Phase 5 — Monitoring
- realtime student cards;
- progress;
- visibility events;
- activity log.

### Phase 6 — Hardening
- Firebase Security Rules;
- validasi input;
- session recovery;
- duplicate attempt handling;
- testing;
- deploy Vercel.

## 28. Definition of Done

Fitur dianggap selesai apabila guru dapat membuat satu kuis dari awal, menghasilkan link unik, membagikan link kepada beberapa siswa, melihat mereka mulai dan mengerjakan kuis secara real-time, memperoleh indikator ketika halaman kuis kehilangan fokus, menerima hasil setelah siswa submit, serta melihat status **Remedial/Pengayaan** yang ditentukan sistem secara otomatis berdasarkan batas nilai yang telah ditetapkan.

Siswa hanya dapat mengikuti kuis dari link yang diberikan, tidak memiliki akses ke daftar kuis lain, dan tidak menerima kunci jawaban di browser selama proses pengerjaan.
