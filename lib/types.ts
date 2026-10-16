export type QuizStatus = "draft" | "active" | "closed";
export type AttemptStatus = "registered" | "in_progress" | "submitted" | "expired";
export type FollowUp = "REMEDIAL" | "PENGAYAAN" | null;
export type FollowUpCategory = Exclude<FollowUp, null>;
export type AnswerKey = "A" | "B" | "C" | "D" | "E";

export interface FollowUpQuestion {
  id: string;
  text: string;
  order: number;
}

export interface Quiz {
  id: string;
  teacherId: string;
  title: string;
  material: string;
  description: string;
  passingScore: number;
  status: QuizStatus;
  accessToken: string;
  durationMinutes: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Question {
  id: string;
  type: "multiple_choice";
  text: string;
  options: Record<AnswerKey, string>;
  correctAnswer?: AnswerKey;
  weight: number;
  order: number;
}

export interface StudentIdentity {
  name: string;
  attendanceNumber: string;
  className: string;
}

export interface Attempt {
  id: string;
  quizId: string;
  student: StudentIdentity;
  status: AttemptStatus;
  startedAt: number;
  submittedAt: number | null;
  progress: { answered: number; total: number };
  score: number | null;
  correctCount: number | null;
  incorrectCount: number | null;
  followUp: FollowUp;
  leaveCount: number;
  sessionTokenHash?: string;
  lastSeenAt?: number;
}

export interface ActivityLog {
  id: string;
  type: "tab_hidden" | "window_blur" | "page_unload" | "page_return" | "page_reload";
  timestamp: number;
}

export interface PublicQuiz {
  quizId: string;
  title: string;
  material: string;
  description: string;
  passingScore: number;
  status: QuizStatus;
  durationMinutes: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questionCount: number;
}
