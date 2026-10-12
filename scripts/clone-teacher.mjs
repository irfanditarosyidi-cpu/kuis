import { randomBytes } from "node:crypto";

const API_KEY = "AIzaSyBEmoYUKMkAUMiX6fJs3DYu8p9C7n7f538";
const DATABASE_URL = "https://tesis-5c7ab-default-rtdb.asia-southeast1.firebasedatabase.app";

const email = process.env.NEW_TEACHER_EMAIL?.trim();
const password = process.env.NEW_TEACHER_PASSWORD;
const displayName = process.env.NEW_TEACHER_NAME?.trim() || "Guru 2";
const configuredSourceUid = process.env.SOURCE_TEACHER_UID?.trim();
const databaseAuth = process.env.FIREBASE_DATABASE_AUTH?.trim();

if (!email || !password) {
  throw new Error("NEW_TEACHER_EMAIL dan NEW_TEACHER_PASSWORD wajib diisi.");
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message || payload?.error || response.statusText;
    const error = new Error(`${response.status}: ${message}`);
    error.code = payload?.error?.message;
    throw error;
  }
  return payload;
}

async function authenticateTeacher() {
  const body = JSON.stringify({ email, password, returnSecureToken: true });
  const options = { method: "POST", headers: { "content-type": "application/json" }, body };

  try {
    const account = await requestJson(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
      options,
    );
    return { ...account, created: true };
  } catch (error) {
    if (error.code !== "EMAIL_EXISTS") throw error;
    const account = await requestJson(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      options,
    );
    return { ...account, created: false };
  }
}

function databaseUrl(path, auth) {
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  const suffix = auth ? `?auth=${encodeURIComponent(auth)}` : "";
  return `${DATABASE_URL}/${cleanPath ? `${cleanPath}.json` : ".json"}${suffix}`;
}

async function databaseGet(path, auth) {
  return requestJson(databaseUrl(path, auth), { headers: { "cache-control": "no-store" } });
}

async function databasePatch(updates, auth) {
  return requestJson(databaseUrl("", auth), {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(updates),
  });
}

function newQuizId() {
  return `quiz_${randomBytes(12).toString("hex")}`;
}

function newAccessToken() {
  return randomBytes(18).toString("base64url");
}

function publicQuestion(question) {
  const { correctAnswer: _correctAnswer, ...safeQuestion } = question;
  return safeQuestion;
}

const account = await authenticateTeacher();

await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ idToken: account.idToken, displayName, returnSecureToken: false }),
});

const readAuth = databaseAuth || undefined;
const [allQuizzes, allQuestions, targetIndex] = await Promise.all([
  databaseGet("quizzes", readAuth),
  databaseGet("questions", readAuth),
  databaseGet(`teacherQuizIndex/${account.localId}`, account.idToken),
]);

if (targetIndex && Object.keys(targetIndex).length > 0) {
  throw new Error(`Akun ${email} sudah memiliki kuis. Proses dibatalkan agar tidak membuat duplikat.`);
}

const teacherIds = [...new Set(Object.values(allQuizzes || {}).map((quiz) => quiz.teacherId))]
  .filter((teacherId) => teacherId && teacherId !== account.localId);
const sourceUid = configuredSourceUid || (teacherIds.length === 1 ? teacherIds[0] : null);

if (!sourceUid) {
  throw new Error("SOURCE_TEACHER_UID wajib diisi karena sumber guru tidak dapat ditentukan secara otomatis.");
}

const sourceQuizzes = Object.entries(allQuizzes || {})
  .filter(([, quiz]) => quiz.teacherId === sourceUid)
  .sort(([, first], [, second]) => Number(first.createdAt || 0) - Number(second.createdAt || 0));

if (!sourceQuizzes.length) {
  throw new Error(`Tidak ada kuis yang ditemukan untuk guru sumber ${sourceUid}.`);
}

const updates = {
  [`users/${account.localId}`]: {
    name: displayName,
    email,
    role: "teacher",
    createdAt: Date.now(),
  },
};
const cloned = [];
const now = Date.now();

for (const [sourceQuizId, sourceQuiz] of sourceQuizzes) {
  const quizId = newQuizId();
  const accessToken = newAccessToken();
  const questions = allQuestions?.[sourceQuizId] || {};
  const questionCount = Object.keys(questions).length;
  const quiz = {
    ...sourceQuiz,
    teacherId: account.localId,
    accessToken,
    questionCount,
    createdAt: now + cloned.length,
    updatedAt: now + cloned.length,
  };
  const publicQuiz = {
    teacherId: account.localId,
    quizId,
    title: quiz.title,
    material: quiz.material,
    description: quiz.description || "",
    passingScore: quiz.passingScore,
    status: quiz.status,
    durationMinutes: quiz.durationMinutes ?? null,
    shuffleQuestions: Boolean(quiz.shuffleQuestions),
    shuffleOptions: Boolean(quiz.shuffleOptions),
    questionCount,
  };

  updates[`quizzes/${quizId}`] = quiz;
  updates[`questions/${quizId}`] = questions;
  updates[`publicQuestions/${quizId}`] = Object.fromEntries(
    Object.entries(questions).map(([questionId, question]) => [questionId, publicQuestion(question)]),
  );
  updates[`quizAccess/${accessToken}`] = publicQuiz;
  updates[`quizAccessById/${quizId}`] = publicQuiz;
  updates[`teacherQuizIndex/${account.localId}/${quizId}`] = true;
  cloned.push({ quizId, title: quiz.title, questionCount });
}

await databasePatch(updates, account.idToken);

for (const quiz of cloned) {
  const [savedQuiz, savedQuestions] = await Promise.all([
    databaseGet(`quizzes/${quiz.quizId}`, account.idToken),
    databaseGet(`questions/${quiz.quizId}`, account.idToken),
  ]);
  if (savedQuiz?.teacherId !== account.localId || Object.keys(savedQuestions || {}).length !== quiz.questionCount) {
    throw new Error(`Verifikasi salinan gagal untuk ${quiz.title}.`);
  }
}

console.log(`${account.created ? "Akun dibuat" : "Akun sudah ada"}: ${email} (${account.localId})`);
console.log(`${cloned.length} kuis dan ${cloned.reduce((total, quiz) => total + quiz.questionCount, 0)} soal berhasil disalin.`);
for (const quiz of cloned) console.log(`- ${quiz.title}: ${quiz.questionCount} soal`);
