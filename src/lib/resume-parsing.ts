// lib/resume-parsing.ts
//
// Text extraction (PDF/DOCX -> plain text) and AI structuring
// (plain text -> the shape the review screen edits). Kept out of
// features/resumes/actions.ts so the actions file stays about
// orchestration, not parsing mechanics.

import Anthropic from "@anthropic-ai/sdk";

// pdfjs-dist (underneath pdf-parse v2) uses DOMMatrix -- a browser API --
// for some PDF operations (image/transform handling in more complex
// PDFs; a simple test PDF never exercised this path locally, but real
// resume exports from Word/Google Docs/etc. do). Node has no such
// global. dommatrix is a pure-JS polyfill with no native binary, so it
// works the same on any platform (unlike e.g. @napi-rs/canvas, which
// ships platform-specific binaries that don't reliably carry over from
// a local build to Vercel's Linux runtime).
if (typeof globalThis.DOMMatrix === "undefined") {
  const { default: DOMMatrix } = await import("dommatrix");
  globalThis.DOMMatrix = DOMMatrix as unknown as typeof globalThis.DOMMatrix;
}

export async function extractText(buffer: Buffer, fileType: "pdf" | "docx"): Promise<string> {
  if (fileType === "pdf") {
    // pdf-parse v2 (modern, actively-maintained pdfjs-dist underneath).
    // Its worker-bundling issue under Turbopack is solved via
    // serverExternalPackages in next.config.js, not by downgrading --
    // v1's much older bundled pdfjs-dist choked on some genuinely valid
    // PDFs (confirmed against a pdfkit-generated test file) that v2
    // handles fine, and real user uploads will vary more than any one
    // test fixture.
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  }
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export interface ParsedExperience {
  company_name: string;
  job_title: string;
  employment_type: "full_time" | "part_time" | "contract" | "temporary" | "internship" | null;
  location: string | null;
  start_date: string | null; // YYYY-MM-DD, or null if unclear
  end_date: string | null;
  is_current: boolean;
  description: string | null;
}

export interface ParsedEducation {
  school_name: string;
  degree: string | null;
  field_of_study: string | null;
  graduation_date: string | null;
}

export interface ParsedResumeData {
  experience: ParsedExperience[];
  education: ParsedEducation[];
  skills: string[];
  certifications: string[];
  confidence: number;
}

// The review screen's shape for these two: same fields plus an
// `approved` flag the user toggles per item before saving.
export interface ReviewedExperience extends ParsedExperience {
  approved: boolean;
}

export interface ReviewedEducation extends ParsedEducation {
  approved: boolean;
}

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: "extract_resume",
  description: "Extract structured work experience, education, skills, and certifications from resume text.",
  input_schema: {
    type: "object",
    properties: {
      experience: {
        type: "array",
        items: {
          type: "object",
          properties: {
            company_name: { type: "string" },
            job_title: { type: "string" },
            employment_type: {
              type: ["string", "null"],
              enum: ["full_time", "part_time", "contract", "temporary", "internship", null],
            },
            location: { type: ["string", "null"] },
            start_date: { type: ["string", "null"], description: "YYYY-MM-DD, or YYYY-MM-01 if only month/year known. Null if unclear." },
            end_date: { type: ["string", "null"] },
            is_current: { type: "boolean" },
            description: { type: ["string", "null"] },
          },
          required: ["company_name", "job_title", "is_current"],
        },
      },
      education: {
        type: "array",
        items: {
          type: "object",
          properties: {
            school_name: { type: "string" },
            degree: { type: ["string", "null"] },
            field_of_study: { type: ["string", "null"] },
            graduation_date: { type: ["string", "null"], description: "YYYY-MM-DD, or null if unclear." },
          },
          required: ["school_name"],
        },
      },
      skills: { type: "array", items: { type: "string" } },
      certifications: { type: "array", items: { type: "string" }, description: "e.g. A&P, ATP, IA — aviation and professional certifications/licenses mentioned." },
      confidence: { type: "number", description: "0-1: how confident you are this extraction is accurate and complete." },
    },
    required: ["experience", "education", "skills", "certifications", "confidence"],
  },
};

export async function parseResumeWithAI(resumeText: string): Promise<ParsedResumeData> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: "tool", name: "extract_resume" },
    messages: [
      {
        role: "user",
        content: `Extract structured data from this resume. Only include information actually present in the text — never invent employers, dates, or credentials.\n\n${resumeText.slice(0, 15000)}`,
      },
    ],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("AI did not return structured data");
  }

  return toolUse.input as ParsedResumeData;
}
