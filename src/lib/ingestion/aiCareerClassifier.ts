// lib/ingestion/aiCareerClassifier.ts
//
// Last-resort career classification for auto-approve: when the keyword
// rules in careerMatching.ts find nothing (or only a low-confidence
// guess), ask the model to either match the job to an existing career it
// missed, invent a new one that's genuinely warranted, or decline --
// rather than leaving every never-seen title stuck waiting on a human to
// type a name in. Server-only (uses ANTHROPIC_API_KEY) -- never import
// this into a client component.

import Anthropic from "@anthropic-ai/sdk";

export interface CareerClassification {
  decision: "existing" | "new" | "reject";
  existingCareerId: string | null;
  newCareerName: string | null;
  newCareerCategoryId: string | null;
  newCareerShortDescription: string | null;
}

interface CareerOption {
  id: string;
  name: string;
  categoryName: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

function buildTool(careerIds: string[], categoryIds: string[]): Anthropic.Tool {
  return {
    name: "classify_career",
    description:
      "Decide how a job posting's title should be categorized against an aviation careers taxonomy: reuse an existing career, add a new one, or decline because it isn't a real distinguishable career.",
    input_schema: {
      type: "object",
      properties: {
        decision: {
          type: "string",
          enum: ["existing", "new", "reject"],
          description:
            "'existing' if one of the listed careers is genuinely a good fit for this job (even a loose one is better than a near-duplicate new entry). 'new' only if none fit AND this represents a real, reusable job category other postings could share -- not a one-off internal req title. 'reject' if this isn't a distinguishable career at all (a generic resume drop-off, an unspecified internship/fellowship program, or too vague to categorize).",
        },
        existing_career_id: {
          type: ["string", "null"],
          enum: [...careerIds, null],
          description: "Required when decision is 'existing'.",
        },
        new_career_name: {
          type: ["string", "null"],
          description:
            "Required when decision is 'new'. A short, general, reusable career title that other job postings of the same kind could also use -- e.g. 'Quality Assurance Inspector', never the literal job posting title, req code, department suffix, or seniority level (strip things like 'Sr.', '- (SJ2026MA)', '| Quality Management Systems').",
        },
        new_career_category_id: {
          type: ["string", "null"],
          enum: [...categoryIds, null],
          description: "Required when decision is 'new' -- the best-fitting existing category id.",
        },
        new_career_short_description: {
          type: ["string", "null"],
          description: "Required when decision is 'new'. One general sentence describing the career itself, not this specific posting.",
        },
      },
      required: ["decision"],
    },
  };
}

export async function classifyCareerWithAI(input: {
  title: string;
  descriptionSnippet: string;
  existingCareers: CareerOption[];
  categories: CategoryOption[];
}): Promise<CareerClassification | null> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const careerList = input.existingCareers.map((c) => `- ${c.id}: ${c.name} (${c.categoryName ?? "uncategorized"})`).join("\n");
  const categoryList = input.categories.map((c) => `- ${c.id}: ${c.name}`).join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    tools: [buildTool(input.existingCareers.map((c) => c.id), input.categories.map((c) => c.id))],
    tool_choice: { type: "tool", name: "classify_career" },
    messages: [
      {
        role: "user",
        content: `Job posting title: "${input.title}"\n\nDescription excerpt:\n${input.descriptionSnippet.slice(0, 1500)}\n\nExisting careers:\n${careerList}\n\nExisting categories:\n${categoryList}\n\nStrongly prefer reusing an existing career over creating a new one -- only create "new" when there's genuinely no reasonable fit and this job represents a real, recurring career (not a one-off internal req title).`,
      },
    ],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return null;

  const raw = toolUse.input as any;
  return {
    decision: raw.decision,
    existingCareerId: raw.existing_career_id ?? null,
    newCareerName: raw.new_career_name ?? null,
    newCareerCategoryId: raw.new_career_category_id ?? null,
    newCareerShortDescription: raw.new_career_short_description ?? null,
  };
}
