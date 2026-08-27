"use client";

import { useState, type ReactNode } from "react";

export function Tabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex gap-1 border-b">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px ${
              active === i ? "border-slate-900 text-slate-900 font-medium" : "border-transparent text-slate-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{tabs[active].content}</div>
    </div>
  );
}
