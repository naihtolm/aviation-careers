"use client";

import { useRef, useTransition } from "react";
import { createAlert } from "@/features/alerts/actions";

export function CreateAlertForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createAlert(formData);
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="border border-white/10 rounded-lg p-4 bg-white/[0.04] space-y-3">
      <p className="font-medium text-white text-sm">Create a new alert</p>
      <div className="grid sm:grid-cols-2 gap-2">
        <input name="keyword" placeholder="Job title or keyword" className="bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-sm text-white placeholder:text-slate-500" />
        <input name="location" placeholder="City or state" className="bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-sm text-white placeholder:text-slate-500" />
      </div>
      <select name="frequency" defaultValue="daily" className="bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-sm text-white">
        <option value="daily" className="text-slate-900">Daily</option>
        <option value="weekly" className="text-slate-900">Weekly</option>
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="bg-accent-200 text-board hover:bg-accent-100 transition-colors px-4 py-1.5 rounded-md text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Creating…" : "Create alert"}
      </button>
    </form>
  );
}
