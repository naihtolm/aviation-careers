"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerActionClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { extractText, parseResumeWithAI } from "@/lib/resume-parsing";
import type { ReviewedExperience, ReviewedEducation } from "@/lib/resume-parsing";

async function requireUser() {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return { supabase, user };
}

// V1 processes synchronously within this one request rather than a real
// background queue/Edge Function (the schema's resume_processing_jobs
// table is designed for either) -- a resume-length document is small
// enough that extraction + one AI call finishes well within Vercel's
// function timeout, so the "processing" state the UI shows is real but
// brief, not a genuinely async job. Revisit if parsing volume or
// document size grows enough that this stops being true.
export async function uploadResume(formData: FormData) {
  const { supabase, user } = await requireUser();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file selected." };

  const fileType = file.type === "application/pdf" ? "pdf" : file.type.includes("wordprocessingml") ? "docx" : null;
  if (!fileType) return { error: "Please upload a PDF or DOCX file." };
  if (file.size > 10 * 1024 * 1024) return { error: "File is too large (10 MB max)." };

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // New upload replaces the previous primary resume — one current resume
  // per user is the V1 model (matches the schema's partial unique index
  // on resumes(user_id) where is_primary).
  await supabase.from("resumes").update({ is_primary: false }).eq("user_id", user.id);

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      file_name: file.name,
      storage_path: "", // filled in right after we know the resume id
      file_type: fileType,
      file_size_bytes: file.size,
      is_primary: true,
      upload_status: "uploaded",
    })
    .select("id")
    .single();
  if (resumeError) return { error: resumeError.message };

  const storagePath = `${user.id}/${resume.id}/original.${fileType}`;
  const { error: uploadError } = await supabase.storage.from("resumes").upload(storagePath, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  await supabase.from("resumes").update({ storage_path: storagePath }).eq("id", resume.id);

  // resume_processing_jobs and resume_parses both have owner-scoped
  // SELECT-only RLS (010_rls_policies.sql) -- writes are meant to come
  // from the processing pipeline (here: this same request), not the
  // user's own client, so those writes go through the service client.
  const db = getServiceClient();

  const { data: job, error: jobError } = await db
    .from("resume_processing_jobs")
    .insert({ resume_id: resume.id, status: "processing", started_at: new Date().toISOString() })
    .select("id")
    .single();
  if (jobError) return { error: jobError.message };

  try {
    await supabase.from("resumes").update({ upload_status: "processing" }).eq("id", resume.id);

    const text = await extractText(buffer, fileType);
    if (!text.trim()) throw new Error("Couldn't read any text from this file.");

    const parsed = await parseResumeWithAI(text);

    await db.from("resume_parses").insert({
      resume_id: resume.id,
      parser_name: "claude",
      parser_version: "claude-haiku-4-5-20251001",
      raw_text: text.slice(0, 50000),
      structured_data: parsed,
      confidence_score: parsed.confidence,
    });

    await db
      .from("resume_processing_jobs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", job.id);
    await supabase.from("resumes").update({ upload_status: "processed" }).eq("id", resume.id);
  } catch (err) {
    const detail = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    await db
      .from("resume_processing_jobs")
      .update({ status: "failed", error_message: detail.slice(0, 4000), completed_at: new Date().toISOString() })
      .eq("id", job.id);
    await supabase.from("resumes").update({ upload_status: "failed" }).eq("id", resume.id);
    // Not an error return -- the resume record still exists and the
    // page shows the failure state with a manual-entry fallback, per
    // the spec's "parse failure never blocks the user" requirement.
  }

  revalidatePath("/dashboard/resume");
  redirect("/dashboard/resume");
}

export async function deleteResume(resumeId: string) {
  const { supabase, user } = await requireUser();

  const { data: resume } = await supabase
    .from("resumes")
    .select("storage_path")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!resume) return;

  if (resume.storage_path) {
    await supabase.storage.from("resumes").remove([resume.storage_path]);
  }
  // resume_processing_jobs and resume_parses cascade-delete with the
  // resumes row (on delete cascade in 003_resume_and_profile.sql).
  await supabase.from("resumes").delete().eq("id", resumeId).eq("user_id", user.id);

  revalidatePath("/dashboard/resume");
}

export async function saveReviewedResumeData(input: {
  experience: ReviewedExperience[];
  education: ReviewedEducation[];
  skills: { approved: boolean; name: string }[];
  certifications: { approved: boolean; name: string }[];
}) {
  const { supabase, user } = await requireUser();

  for (const exp of input.experience) {
    if (!exp.approved) continue;
    await supabase.from("user_experience").insert({
      user_id: user.id,
      company_name: exp.company_name,
      job_title: exp.job_title,
      employment_type: exp.employment_type,
      location: exp.location,
      start_date: exp.start_date,
      end_date: exp.end_date,
      is_current: exp.is_current,
      description: exp.description,
      source: "resume",
    });
  }

  for (const edu of input.education) {
    if (!edu.approved) continue;
    await supabase.from("user_education").insert({
      user_id: user.id,
      school_name: edu.school_name,
      degree: edu.degree,
      field_of_study: edu.field_of_study,
      graduation_date: edu.graduation_date,
    });
  }

  const db = getServiceClient();
  for (const skill of input.skills) {
    if (!skill.approved || !skill.name.trim()) continue;
    let { data: existing } = await db.from("skills").select("id").ilike("name", skill.name.trim()).maybeSingle();
    if (!existing) {
      const slug = skill.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const { data: created } = await db.from("skills").insert({ name: skill.name.trim(), slug }).select("id").single();
      existing = created;
    }
    if (existing) {
      await supabase.from("user_skills").upsert(
        { user_id: user.id, skill_id: existing.id, source: "resume" },
        { onConflict: "user_id,skill_id" }
      );
    }
  }

  for (const cert of input.certifications) {
    if (!cert.approved || !cert.name.trim()) continue;
    let { data: existing } = await db.from("certifications").select("id").ilike("name", cert.name.trim()).maybeSingle();
    if (!existing) {
      const { data: created } = await db.from("certifications").insert({ name: cert.name.trim() }).select("id").single();
      existing = created;
    }
    if (existing) {
      await supabase.from("user_certifications").insert({ user_id: user.id, certification_id: existing.id, source: "resume" });
    }
  }

  revalidatePath("/dashboard/profile");
  redirect("/dashboard/profile");
}
