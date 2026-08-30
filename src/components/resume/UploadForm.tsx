"use client";

import { useState, useTransition } from "react";
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
      <label className="block">
        <span className="text-sm font-medium text-slate-900">Upload your resume</span>
        <p className="text-xs text-slate-500 mt-1 mb-3">PDF or DOCX, up to 10 MB.</p>
        <input
          type="file"
          name="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          className="text-sm"
        />
      </label>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !fileName}
        className="mt-4 bg-brand-600 text-white hover:bg-brand-700 transition-colors px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Processing… this usually takes under a minute" : "Upload & Process"}
      </button>
    </form>
  );
}
