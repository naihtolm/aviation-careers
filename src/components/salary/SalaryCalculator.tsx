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
    <div className="border rounded-lg p-4 bg-white">
      <p className="font-medium text-slate-900 mb-3">Salary Calculator</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-500">
          Hourly rate ($)
          <input
            type="number"
            className="w-full border rounded px-2 py-1.5 mt-1 text-sm"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
          />
        </label>
        <label className="text-xs text-slate-500">
          Hours/week
          <input
            type="number"
            className="w-full border rounded px-2 py-1.5 mt-1 text-sm"
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(e.target.value)}
          />
        </label>
        <label className="text-xs text-slate-500">
          OT hours/week
          <input
            type="number"
            className="w-full border rounded px-2 py-1.5 mt-1 text-sm"
            value={otHours}
            onChange={(e) => setOtHours(e.target.value)}
          />
        </label>
        <label className="text-xs text-slate-500">
          OT multiplier
          <input
            type="number"
            step="0.1"
            className="w-full border rounded px-2 py-1.5 mt-1 text-sm"
            value={otMultiplier}
            onChange={(e) => setOtMultiplier(e.target.value)}
          />
        </label>
        <label className="text-xs text-slate-500 col-span-2">
          Annual bonus ($)
          <input
            type="number"
            className="w-full border rounded px-2 py-1.5 mt-1 text-sm"
            value={bonus}
            onChange={(e) => setBonus(e.target.value)}
          />
        </label>
      </div>
      <div className="border-t mt-4 pt-3 flex justify-between items-baseline">
        <span className="text-sm text-slate-500">Estimated annual pay</span>
        <span className="text-xl font-semibold text-slate-900">
          ${annual.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  );
}
