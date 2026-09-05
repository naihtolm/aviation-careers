"use client";

import { useTransition } from "react";
import { Bell } from "lucide-react";
import { toggleAlert, deleteAlert } from "@/features/alerts/actions";

export function AlertRow({ alert }: { alert: any }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${alert.is_active ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-slate-400"}`}>
          <Bell className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">{alert.name}</p>
          <p className="text-xs text-slate-500">
            {alert.filters?.location ? `Near ${alert.filters.location} · ` : ""}
            {alert.frequency} · {alert.is_active ? "Active" : "Paused"}
            {alert.last_sent_at && ` · Last sent ${new Date(alert.last_sent_at).toLocaleDateString()}`}
          </p>
        </div>
      </div>
      <div className="flex gap-2 text-sm">
        <button
          onClick={() => startTransition(() => toggleAlert(alert.id, !alert.is_active))}
          disabled={isPending}
          className="text-slate-600 hover:underline disabled:opacity-50 hover:text-slate-900 transition-colors"
        >
          {alert.is_active ? "Pause" : "Resume"}
        </button>
        <button
          onClick={() => startTransition(() => deleteAlert(alert.id))}
          disabled={isPending}
          className="text-red-600 hover:underline disabled:opacity-50 hover:text-red-700 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
