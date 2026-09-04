"use client";

import { Star } from "lucide-react";

export function StarRating({
  rating,
  size = 16,
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="inline-flex items-center gap-0.5" role={interactive ? "radiogroup" : undefined} aria-label={interactive ? "Rating" : `${rating} out of 5 stars`}>
      {stars.map((n) => (
        <button
          key={n}
          type={interactive ? "button" : undefined}
          disabled={!interactive}
          onClick={interactive ? () => onChange?.(n) : undefined}
          aria-label={interactive ? `${n} star${n === 1 ? "" : "s"}` : undefined}
          className={interactive ? "cursor-pointer" : "cursor-default"}
          style={{ lineHeight: 0 }}
        >
          <Star
            width={size}
            height={size}
            className={n <= Math.round(rating) ? "fill-accent-200 text-accent-200" : "fill-white/10 text-white/15"}
          />
        </button>
      ))}
    </span>
  );
}
