"use client";

import { useState, useTransition } from "react";
import { UploadCloud, FileCheck2 } from "lucide-react";
import { uploadResume } from "@/features/resumes/actions";

export function UploadForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await uploadResume(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="border rounded-lg p-6 bg-white">
      <span className="text-sm font-medium text-slate-900">Upload your resume</span>
      {/* A bare <input type="file"> renders as a tiny native button with no
          visible boundary -- wrapping it in a dashed, clickable card makes
          the whole tap target obvious and gives clear before/after states. */}
      <label
        className={`mt-3 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-colors ${
          fileName ? "border-brand-300 bg-brand-50/50" : "border-slate-300 hover:border-brand-400 hover:bg-brand-50/40"
        }`}
      >
        {fileName ? (
          <FileCheck2 className="w-6 h-6 text-brand-600" />
        ) : (
          <UploadCloud className="w-6 h-6 text-slate-400" />
        )}
        <span className="text-sm font-medium text-slate-700">{fileName ?? "Click to choose a file"}</span>
        <span className="text-xs text-slate-400">PDF or DOCX, up to 10 MB</span>
        <input
          type="file"
          name="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          className="sr-only"
        />
      </label>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !fileName}
        className="mt-4 bg-accent-200 text-board hover:bg-accent-100 transition-colors px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Processing… this usually takes under a minute" : "Upload & Process"}
      </button>
    </form>
  );
}
