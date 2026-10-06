"use client";

import { asset } from "@/lib/paths";
import type { Img } from "@/data/types";

/** Фото из assets с запасной ссылкой: если файла нет, подставляется вторая. */
export function Pic({ pair, alt = "", eager }: { pair: Img; alt?: string; eager?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset(pair[0])}
      alt={alt}
      {...(eager ? {} : { loading: "lazy" as const, decoding: "async" as const })}
      onError={(e) => {
        const el = e.currentTarget;
        if (el.dataset.fb !== "1") {
          el.dataset.fb = "1";
          el.src = pair[1];
        }
      }}
    />
  );
}

const svg = { viewBox: "0 0 24 24", "aria-hidden": true } as const;
export const IC = {
  pin: (
    <svg {...svg}>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.800 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  ),
  clock: (
    <svg {...svg}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  phone: (
    <svg {...svg}>
      <path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  ),
  mail: (
    <svg {...svg}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
};
