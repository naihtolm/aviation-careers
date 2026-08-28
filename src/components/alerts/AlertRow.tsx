"use client";

import { useTransition } from "react";
import { toggleAlert, deleteAlert } from "@/features/alerts/actions";

export function AlertRow({ alert }: { alert: any }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="border rounded-lg p-3 bg-white flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-900">{alert.name}</p>
        <p className="text-xs text-slate-500">
          {alert.filters?.location ? `Near ${alert.filters.location} · ` : ""}
          {alert.frequency} · {alert.is_active ? "Active" : "Paused"}
          {alert.last_sent_at && ` · Last sent ${new Date(alert.last_sent_at).toLocaleDateString()}`}
        </p>
      </div>
      <div className="flex gap-2 text-sm">
        <button
          onClick={() => startTransition(() => toggleAlert(alert.id, !alert.is_active))}
          disabled={isPending}
          className="text-slate-600 hover:underline disabled:opacity-50"
        >
          {alert.is_active ? "Pause" : "Resume"}
        </button>
        <button
          onClick={() => startTransition(() => deleteAlert(alert.id))}
          disabled={isPending}
          className="text-red-600 hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
