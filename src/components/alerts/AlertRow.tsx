"use client";

import { useTransition } from "react";
import { Bell } from "lucide-react";
import { toggleAlert, deleteAlert } from "@/features/alerts/actions";

export function AlertRow({ alert }: { alert: any }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="border border-white/10 rounded-lg p-3 bg-white/[0.04] hover:bg-white/[0.07] transition-all flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${alert.is_active ? "bg-brand-400/15 text-brand-300" : "bg-white/10 text-slate-500"}`}>
          <Bell className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{alert.name}</p>
          <p className="text-xs text-slate-400">
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
          className="text-slate-300 hover:underline disabled:opacity-50 hover:text-white transition-colors"
        >
          {alert.is_active ? "Pause" : "Resume"}
        </button>
        <button
          onClick={() => startTransition(() => deleteAlert(alert.id))}
          disabled={isPending}
          className="text-red-400 hover:underline disabled:opacity-50 hover:text-red-300 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
