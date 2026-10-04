const DATABASE_URL = "https://tesis-5c7ab-default-rtdb.asia-southeast1.firebasedatabase.app";
const quizId = "demo_konfigurasi_elektron";
const token = "AtomX2-7Kp9LmQ";
const now = Date.now();
const existingResponse = await fetch(`${DATABASE_URL}/quizzes/${quizId}.json`);
const existingQuiz = existingResponse.ok ? await existingResponse.json() : null;
const teacherId = existingQuiz?.teacherId || "demo-teacher";

const quiz = {
  teacherId,
  title: "Konfigurasi Elektron Atom Netral",
  material: "Struktur Atom & Konfigurasi Elektron",
  description: "Uji pemahamanmu tentang aturan penulisan konfigurasi elektron dan tentukan langkah belajar berikutnya.",
  passingScore: 75,
  status: "active",
  accessToken: token,
  durationMinutes: 15,
  shuffleQuestions: false,
  shuffleOptions: false,
  questionCount: 5,
  createdAt: now,
  updatedAt: now
};

const questions = {
  q1: { type: "multiple_choice", text: "Jumlah maksimum elektron yang dapat menempati kulit K adalah…", options: { A: "2 elektron", B: "8 elektron", C: "18 elektron", D: "32 elektron", E: "50 elektron" }, correctAnswer: "A", weight: 1, order: 1 },
  q2: { type: "multiple_choice", text: "Konfigurasi elektron atom natrium (Na) dengan nomor atom 11 adalah…", options: { A: "2, 7, 2", B: "2, 8, 1", C: "2, 8, 2", D: "2, 9", E: "2, 6, 3" }, correctAnswer: "B", weight: 1, order: 2 },
  q3: { type: "multiple_choice", text: "Elektron yang berada pada kulit terluar suatu atom disebut…", options: { A: "Elektron inti", B: "Elektron bebas", C: "Elektron valensi", D: "Elektron netral", E: "Elektron stabil" }, correctAnswer: "C", weight: 1, order: 3 },
  q4: { type: "multiple_choice", text: "Atom dengan konfigurasi elektron 2, 8, 7 memiliki jumlah elektron sebanyak…", options: { A: "15", B: "16", C: "17", D: "18", E: "19" }, correctAnswer: "C", weight: 1, order: 4 },
  q5: { type: "multiple_choice", text: "Kulit elektron yang memiliki nilai n = 3 dilambangkan dengan huruf…", options: { A: "K", B: "L", C: "M", D: "N", E: "O" }, correctAnswer: "C", weight: 1, order: 5 }
};

const publicQuestions = Object.fromEntries(Object.entries(questions).map(([id, { correctAnswer, ...question }]) => [id, question]));
const publicQuiz = { teacherId: quiz.teacherId, quizId, title: quiz.title, material: quiz.material, description: quiz.description, passingScore: quiz.passingScore, status: quiz.status, durationMinutes: quiz.durationMinutes, shuffleQuestions: quiz.shuffleQuestions, shuffleOptions: quiz.shuffleOptions, questionCount: quiz.questionCount };

const patch = {
  [`quizzes/${quizId}`]: quiz,
  [`questions/${quizId}`]: questions,
  [`publicQuestions/${quizId}`]: publicQuestions,
  [`quizAccess/${token}`]: publicQuiz,
  [`quizAccessById/${quizId}`]: publicQuiz,
  [`teacherQuizIndex/${teacherId}/${quizId}`]: true
};

const response = await fetch(`${DATABASE_URL}/.json`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
if (!response.ok) throw new Error(`Seed failed: ${response.status} ${await response.text()}`);
console.log(`Demo quiz ready: /q/${token}`);
