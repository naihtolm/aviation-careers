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
    <form ref={formRef} action={handleSubmit} className="border rounded-lg p-4 bg-white space-y-3">
      <p className="font-medium text-slate-900 text-sm">Create a new alert</p>
      <div className="grid sm:grid-cols-2 gap-2">
        <input name="keyword" placeholder="Job title or keyword" className="border rounded-md px-2 py-1.5 text-sm" />
        <input name="location" placeholder="City or state" className="border rounded-md px-2 py-1.5 text-sm" />
      </div>
      <select name="frequency" defaultValue="daily" className="border rounded-md px-2 py-1.5 text-sm">
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="bg-slate-900 text-white px-4 py-1.5 rounded-md text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Creating…" : "Create alert"}
      </button>
    </form>
  );
}
