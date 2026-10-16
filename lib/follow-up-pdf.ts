import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { Attempt, FollowUpQuestion, PublicQuiz } from "@/lib/types";

type PdfAttempt = Pick<Attempt, "student" | "score" | "followUp" | "submittedAt">;
type PdfQuiz = Pick<PublicQuiz, "title" | "material" | "passingScore">;

export interface FollowUpPdfInput {
  attempt: PdfAttempt;
  quiz: PdfQuiz;
  questions: FollowUpQuestion[];
}

type PdfQuestionSegment =
  | { type: "text"; value: string }
  | { type: "diagram"; orbitals: string[] };

const ORBITAL_BOX_SOURCE = String.raw`\[(?:[ \t]*(?:[↑↓][ \t]*){1,2}|[ \t]+)\]`;
const ORBITAL_GROUP_PATTERN = new RegExp(`(?:${ORBITAL_BOX_SOURCE})(?:[ \\t]*${ORBITAL_BOX_SOURCE})*`, "gu");
const ORBITAL_BOX_PATTERN = /\[([^\]]*)\]/gu;

function parsePdfQuestion(text: string): PdfQuestionSegment[] {
  const segments: PdfQuestionSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(ORBITAL_GROUP_PATTERN)) {
    const start = match.index ?? 0;
    if (start > cursor) segments.push({ type: "text", value: text.slice(cursor, start) });
    segments.push({
      type: "diagram",
      orbitals: Array.from(match[0].matchAll(ORBITAL_BOX_PATTERN), (box) => box[1].replace(/[ \t]/g, "")),
    });
    cursor = start + match[0].length;
  }
  if (cursor < text.length) segments.push({ type: "text", value: text.slice(cursor) });
  return segments.length ? segments : [{ type: "text", value: text }];
}

function orbitalSvg(orbitals: string[]) {
  const boxWidth = 31;
  const height = 28;
  const drawings: string[] = [];
  orbitals.forEach((orbital, index) => {
    const left = index * boxWidth;
    drawings.push(`<rect x="${left + 0.5}" y="0.5" width="30" height="27" fill="#FFFFFF" stroke="#40516A" stroke-width="1"/>`);
    [...orbital].forEach((electron, electronIndex) => {
      const x = left + (orbital.length === 1 ? 15.5 : electronIndex === 0 ? 10.5 : 20.5);
      if (electron === "↑") {
        drawings.push(`<line x1="${x}" y1="21" x2="${x}" y2="7" stroke="#17253B" stroke-width="1.7"/>`);
        drawings.push(`<polyline points="${x - 3},10 ${x},6 ${x + 3},10" fill="none" stroke="#17253B" stroke-width="1.7"/>`);
      } else {
        drawings.push(`<line x1="${x}" y1="7" x2="${x}" y2="21" stroke="#17253B" stroke-width="1.7"/>`);
        drawings.push(`<polyline points="${x - 3},18 ${x},22 ${x + 3},18" fill="none" stroke="#17253B" stroke-width="1.7"/>`);
      }
    });
  });
  const width = Math.max(boxWidth, orbitals.length * boxWidth);
  return { width, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${drawings.join("")}</svg>` };
}

function questionPromptContent(text: string): Content[] {
  return parsePdfQuestion(text).map((segment) => {
    if (segment.type === "text") return { text: segment.value, fontSize: 11.5, lineHeight: 1.35 };
    const diagram = orbitalSvg(segment.orbitals);
    return { svg: diagram.svg, width: diagram.width, margin: [0, 4, 0, 4] };
  });
}

function safeFilePart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "siswa";
}

export function followUpPdfFileName({ attempt, quiz }: FollowUpPdfInput) {
  const category = attempt.followUp === "PENGAYAAN" ? "pengayaan" : "remedial";
  return `soal-${category}-${safeFilePart(quiz.title)}-${safeFilePart(attempt.student.name)}.pdf`;
}

export function buildFollowUpPdfDefinition({ attempt, quiz, questions }: FollowUpPdfInput): TDocumentDefinitions {
  const enrichment = attempt.followUp === "PENGAYAAN";
  const category = enrichment ? "PENGAYAAN" : "REMEDIAL";
  const accent = enrichment ? "#2563EB" : "#B45346";
  const softAccent = enrichment ? "#EAF2FF" : "#FAEEEB";
  const submittedAt = attempt.submittedAt
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(attempt.submittedAt))
    : "-";

  const questionBlocks: Content[] = questions.map((question, index) => ({
    unbreakable: true,
    margin: [0, 0, 0, 13],
    table: {
      widths: [24, "*"],
      body: [[
        { text: `${index + 1}.`, bold: true, color: accent, fontSize: 11.5, margin: [0, 1, 0, 0] },
        {
          stack: [
            ...questionPromptContent(question.text),
            { text: "Jawaban:", bold: true, color: "#64748B", fontSize: 8.5, margin: [0, 10, 0, 3] },
            {
              canvas: [
                { type: "line", x1: 0, y1: 8, x2: 445, y2: 8, lineColor: "#CBD5E1", lineWidth: 0.7 },
                { type: "line", x1: 0, y1: 27, x2: 445, y2: 27, lineColor: "#CBD5E1", lineWidth: 0.7 },
                { type: "line", x1: 0, y1: 46, x2: 445, y2: 46, lineColor: "#CBD5E1", lineWidth: 0.7 },
              ],
              margin: [0, 0, 0, 4],
            },
          ],
        },
      ]],
    },
    layout: "noBorders",
  }));

  return {
    pageSize: "A4",
    pageMargins: [48, 66, 48, 54],
    defaultStyle: { font: "Roboto", fontSize: 10, color: "#17253B" },
    header: {
      margin: [48, 24, 48, 0],
      columns: [
        { text: "RUANGTUNTAS", bold: true, color: "#164A9C", fontSize: 11, characterSpacing: 0.8 },
        { text: `LEMBAR ${category}`, alignment: "right", bold: true, color: accent, fontSize: 9, characterSpacing: 0.7 },
      ],
    },
    footer: (currentPage: number, pageCount: number) => ({
      margin: [48, 13, 48, 0],
      columns: [
        { text: `${quiz.title} - ${attempt.student.name}`, color: "#64748B", fontSize: 8 },
        { text: `Halaman ${currentPage} dari ${pageCount}`, alignment: "right", color: "#64748B", fontSize: 8 },
      ],
    }),
    content: [
      {
        table: {
          widths: [6, "*"],
          body: [[
            { text: "", fillColor: accent, border: [false, false, false, false] },
            {
              border: [false, false, false, false],
              margin: [13, 4, 0, 6],
              stack: [
                { text: `SOAL ${category}`, bold: true, color: accent, fontSize: 20, characterSpacing: 0.4 },
                { text: quiz.title, bold: true, fontSize: 13, margin: [0, 5, 0, 2] },
                { text: quiz.material, color: "#64748B", fontSize: 9.5 },
              ],
            },
          ]],
        },
        layout: "noBorders",
        margin: [0, 0, 0, 20],
      },
      {
        table: {
          widths: [70, "*", 70, "*"],
          body: [
            [
              { text: "Nama", bold: true, color: "#64748B" },
              { text: attempt.student.name, bold: true },
              { text: "Kelas", bold: true, color: "#64748B" },
              { text: attempt.student.className, bold: true },
            ],
            [
              { text: "No. absen", bold: true, color: "#64748B" },
              { text: attempt.student.attendanceNumber },
              { text: "Nilai kuis", bold: true, color: "#64748B" },
              { text: String(attempt.score ?? "-"), bold: true, color: accent },
            ],
          ],
        },
        layout: {
          hLineColor: () => "#DCE5F0",
          vLineColor: () => "#DCE5F0",
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 7,
          paddingBottom: () => 7,
        },
        margin: [0, 0, 0, 13],
      },
      {
        table: {
          widths: ["*"],
          body: [[{
            text: `Petunjuk: Jawablah ${questions.length} soal uraian berikut dengan jelas dan lengkap. Kerjakan pada lembar ini atau buku tugas sesuai arahan guru.`,
            fillColor: softAccent,
            color: "#334155",
            margin: [10, 8, 10, 8],
            lineHeight: 1.3,
          }]],
        },
        layout: "noBorders",
        margin: [0, 0, 0, 19],
      },
      {
        columns: [
          { text: "DAFTAR SOAL URAIAN", bold: true, fontSize: 10.5, characterSpacing: 0.6 },
          { text: `${questions.length} soal`, alignment: "right", color: "#64748B", fontSize: 9 },
        ],
        margin: [0, 0, 0, 13],
      },
      ...questionBlocks,
      {
        text: `Dibuat dari hasil kuis pada ${submittedAt}. Batas ketuntasan: ${quiz.passingScore}.`,
        color: "#64748B",
        fontSize: 8,
        alignment: "center",
        margin: [0, 8, 0, 0],
      },
    ],
    info: {
      title: `Soal ${category} - ${quiz.title}`,
      subject: quiz.material,
      author: "RuangTuntas",
      creator: "RuangTuntas",
    },
  };
}
