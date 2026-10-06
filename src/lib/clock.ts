"use client";

import { useSyncExternalStore } from "react";
import { makeClock, type Clock } from "./booking";

let cached: Clock | null = null;
const subscribe = () => () => {};

/** Часы посетителя. На сервере их нет (null): всё, что зависит от времени, появляется после загрузки. */
export function useClock(): Clock | null {
  return useSyncExternalStore(
    subscribe,
    () => (cached ??= makeClock(new Date())),
    () => null,
  );
}
