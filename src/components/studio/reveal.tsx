"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Появление блоков [data-in]. При prefers-reduced-motion всё видно сразу. */
export function Reveal() {
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const els = Array.from(document.querySelectorAll("[data-in]"));
    gsap.set(els, { opacity: 0, y: 18 });
    const triggers = ScrollTrigger.batch(els, {
      start: "top 92%",
      once: true,
      onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.06, overwrite: true, clearProps: "transform" }),
    });
    /* После загрузки картинок высота страницы меняется, пересчитываем точки появления */
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      triggers.forEach((t) => t.kill());
      gsap.set(els, { clearProps: "opacity,transform" });
    };
  }, []);
  return null;
}
