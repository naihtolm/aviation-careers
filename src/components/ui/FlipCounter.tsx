"use client";

import { useEffect, useRef, useState } from "react";

interface Digit {
  char: string;
  changed: boolean;
}

// The signature move from the motion-system pass: a number that updates
// in place flips digit-by-digit, like a real departure board, instead of
// just snapping to the new text. Only used for short numeric content
// (a result count, a pending count) -- never for full cards or lists,
// which get a plain quick-fade instead (see the jobs search page).
//
// Only the digits that actually changed play the flip; unchanged digits
// (the common case when a filter narrows 319 -> 312, say) stay static
// rather than every digit replaying the animation pointlessly.
export function FlipCounter({ value, className = "" }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === prevValue.current) return;
    setFlipping(true);
    const timer = setTimeout(() => {
      setDisplayValue(value);
      prevValue.current = value;
      setFlipping(false);
    }, 420);
    return () => clearTimeout(timer);
  }, [value]);

  const fromStr = String(prevValue.current);
  const toStr = String(flipping ? value : displayValue);
  const width = Math.max(fromStr.length, toStr.length);
  const from = fromStr.padStart(width, " ");
  const to = toStr.padStart(width, " ");

  const digits: Digit[] = flipping
    ? Array.from({ length: width }, (_, i) => ({ char: to[i], changed: from[i] !== to[i] }))
    : String(displayValue)
        .split("")
        .map((char) => ({ char, changed: false }));

  return (
    <span className={`inline-flex font-mono-data tabular-nums ${className}`}>
      {digits.map((d, i) =>
        d.changed ? (
          <span key={i} className="relative inline-block overflow-hidden" style={{ width: "0.62em", height: "1.2em" }}>
            <span className="absolute inset-0 flex items-center justify-center animate-flip-out">{from[i]}</span>
            <span className="absolute inset-0 flex items-center justify-center animate-flip-in">{to[i]}</span>
          </span>
        ) : (
          <span key={i}>{d.char}</span>
        )
      )}
    </span>
  );
}
