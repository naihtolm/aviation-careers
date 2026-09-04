"use client";

import { useState } from "react";

// Pure client-side math, no DB write — an embeddable widget per the spec.
export function SalaryCalculator() {
  const [hourlyRate, setHourlyRate] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("40");
  const [otHours, setOtHours] = useState("0");
  const [otMultiplier, setOtMultiplier] = useState("1.5");
  const [bonus, setBonus] = useState("0");

  const rate = Number(hourlyRate) || 0;
  const hours = Number(hoursPerWeek) || 0;
  const ot = Number(otHours) || 0;
  const otMult = Number(otMultiplier) || 1;
  const bonusAmt = Number(bonus) || 0;

  const weeklyPay = rate * hours + ot * rate * otMult;
  const annual = weeklyPay * 52 + bonusAmt;

  return (
    <div className="border border-white/10 rounded-lg p-4 bg-white/[0.04]">
      <p className="font-medium text-white mb-3">Salary Calculator</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-400">
          Hourly rate ($)
          <input
            type="number"
            className="w-full bg-white/5 border border-white/15 rounded px-2 py-1.5 mt-1 text-sm text-white"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
          />
        </label>
        <label className="text-xs text-slate-400">
          Hours/week
          <input
            type="number"
            className="w-full bg-white/5 border border-white/15 rounded px-2 py-1.5 mt-1 text-sm text-white"
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(e.target.value)}
          />
        </label>
        <label className="text-xs text-slate-400">
          OT hours/week
          <input
            type="number"
            className="w-full bg-white/5 border border-white/15 rounded px-2 py-1.5 mt-1 text-sm text-white"
            value={otHours}
            onChange={(e) => setOtHours(e.target.value)}
          />
        </label>
        <label className="text-xs text-slate-400">
          OT multiplier
          <input
            type="number"
            step="0.1"
            className="w-full bg-white/5 border border-white/15 rounded px-2 py-1.5 mt-1 text-sm text-white"
            value={otMultiplier}
            onChange={(e) => setOtMultiplier(e.target.value)}
          />
        </label>
        <label className="text-xs text-slate-400 col-span-2">
          Annual bonus ($)
          <input
            type="number"
            className="w-full bg-white/5 border border-white/15 rounded px-2 py-1.5 mt-1 text-sm text-white"
            value={bonus}
            onChange={(e) => setBonus(e.target.value)}
          />
        </label>
      </div>
      <div className="border-t border-white/10 mt-4 pt-3 flex justify-between items-baseline">
        <span className="text-sm text-slate-400">Estimated annual pay</span>
        <span className="text-xl font-semibold text-accent-200 font-mono-data">
          ${annual.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  );
}
