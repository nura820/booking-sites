/**
 * Движение сайта: GSAP, ScrollTrigger и Lenis. Всё, что здесь, только украшает:
 * без этих библиотек и при prefers-reduced-motion содержимое видно сразу.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type { NicheId } from "@/data/types";

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));

export interface Motion {
  /** анимации включены (есть gsap и нет prefers-reduced-motion) */
  G: boolean;
  intro(id: NicheId): void;
  scrubs(): void;
  disarm(): void;
  refreshSoon(): void;
  scrollToEl(el: Element | null, now?: boolean): void;
  scrollTop(): void;
  pop(el: Element | null): void;
  /** монтажная склейка при смене сферы: swap вызывается, когда экран закрыт шторками */
  cutTo(id: NicheId, colors: [string, string], swap: () => void): void;
  isSwitching(): boolean;
  destroy(): void;
}

export function createMotion(): Motion {
  const RM = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const G = !RM;
  if (G) gsap.registerPlugin(ScrollTrigger);

  let lenis: Lenis | null = null;
  let tick: ((t: number) => void) | null = null;
  if (G) {
    try {
      lenis = new Lenis({ lerp: 0.18, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
      lenis.on("scroll", ScrollTrigger.update);
      tick = (t: number) => lenis!.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    } catch {
      lenis = null;
    }
  }

  let goTw: gsap.core.Tween | null = null;
  const stopGo = () => {
    if (goTw) {
      goTw.kill();
      goTw = null;
    }
  };
  const userEvents = ["wheel", "touchstart", "keydown"] as const;
  userEvents.forEach((ev) => window.addEventListener(ev, stopGo, { passive: true }));

  function scrollToEl(el: Element | null, now?: boolean) {
    if (!el) return;
    const off = -(($(".top")?.offsetHeight ?? 0) + 12);
    if (lenis && !now) {
      /* свой твин вместо lenis.scrollTo: его не обрывает недавний обычный скролл пальцем или клавишами */
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const o = { y: window.pageYOffset || 0 };
      const to = Math.max(0, Math.min(max, o.y + el.getBoundingClientRect().top + off));
      stopGo();
      goTw = gsap.to(o, { y: to, duration: 0.6, ease: "power3.out", onUpdate: () => lenis!.scrollTo(o.y, { immediate: true, force: true }), onComplete: () => void (goTw = null) });
    } else if (lenis) lenis.scrollTo(el as HTMLElement, { offset: off, immediate: true, force: true });
    else {
      const y = (window.pageYOffset || 0) + el.getBoundingClientRect().top + off;
      window.scrollTo({ top: Math.max(0, y), behavior: RM || now ? "auto" : "smooth" });
    }
  }
  function scrollTop() {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }

  let rfT = 0;
  /* пересчёт позиций только когда скролл стоит, чтобы не сбивать прокрутку к записи */
  function refreshSoon() {
    if (!G) return;
    clearTimeout(rfT);
    rfT = window.setTimeout(() => {
      if (goTw || (lenis && lenis.isScrolling)) return refreshSoon();
      ScrollTrigger.refresh();
    }, 350);
  }

  /* Вход на первый экран: сначала объект (0.5 с, power4.out), и только после полной остановки вылетает текст. */
  let introTl: gsap.core.Timeline | null = null;
  function intro(id: NicheId) {
    if (!G) return;
    introTl?.kill();
    const m = "#media";
    const clip = "#media .mclip";
    const pic = "#media .mi>*";
    const tl = (introTl = gsap.timeline({ defaults: { ease: "power4.out" } }));
    if (id === "auto") {
      /* машина влетает боком и выравнивается, кислотная шторка срывается с кадра */
      tl.fromTo(m, { xPercent: 58, skewX: -14 }, { xPercent: 0, skewX: 0, duration: 0.5, clearProps: "transform" }, 0)
        .fromTo(pic, { scale: 1.3, xPercent: -6 }, { scale: 1, xPercent: 0, duration: 0.5, clearProps: "transform" }, 0)
        .fromTo("#media .mwipe", { scaleX: 1 }, { scaleX: 0, duration: 0.4, ease: "power3.inOut" }, 0.1);
    } else if (id === "coffee") {
      /* чашка поднимается из-под маски */
      tl.fromTo(m, { yPercent: 26, rotation: 4 }, { yPercent: 0, rotation: 0, duration: 0.5, clearProps: "transform" }, 0)
        .fromTo(clip, { clipPath: "inset(100% 0% 0% 0% round 20px)" }, { clipPath: "inset(0% 0% 0% 0% round 20px)", duration: 0.5, clearProps: "clipPath" }, 0)
        .fromTo(pic, { scale: 1.2 }, { scale: 1, duration: 0.5, clearProps: "transform" }, 0);
    } else {
      /* кадр раскрывается от центра, как створки, затем садится латунная рамка */
      tl.fromTo(clip, { clipPath: "inset(0% 50% 0% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, clearProps: "clipPath" }, 0)
        .fromTo(pic, { scale: 1.22 }, { scale: 1, duration: 0.5, clearProps: "transform" }, 0)
        .fromTo("#media .mfr", { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, clearProps: "transform,opacity" }, 0.1);
    }
    tl.fromTo("#media .mtag", { opacity: 0 }, { opacity: 1, duration: 0.2, clearProps: "opacity" }, 0.3)
      .fromTo(".htxt h1 .ln>span", { yPercent: 125 }, { yPercent: 0, duration: 0.45, stagger: 0.05, immediateRender: true, clearProps: "transform" }, 0.5)
      .fromTo(".htxt p.ln>span", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.1, immediateRender: true, clearProps: "transform,opacity" }, 0.5)
      .fromTo(".facts", { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: true, clearProps: "opacity" }, 0.68)
      .fromTo(".hact,.facts li", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.04, immediateRender: true, clearProps: "transform,opacity" }, 0.68);
  }

  /* Привязка к скроллу: параллакс медиа и линия прогресса. Контент они не прячут. */
  function scrubs() {
    if (!G) return;
    ScrollTrigger.getAll().forEach((t) => t.kill());
    gsap.fromTo("#media .mi", { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
    $$(".tpi").forEach((el) => {
      gsap.fromTo(el, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: el.parentNode as Element, start: "top bottom", end: "bottom top", scrub: true } });
    });
    gsap.fromTo("#prog", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });
    ScrollTrigger.refresh();
  }

  /* Появления по скроллу включаются только после первого реального скролла и только для того,
     что ещё ниже экрана. Пока человек не скроллил, всё видно. */
  let armed = false;
  let io: IntersectionObserver | null = null;
  let switching = false;
  const targets = new WeakMap<Element, Element>();
  function disarm() {
    armed = false;
    io?.disconnect();
    io = null;
    if (G) gsap.set(".rv", { clearProps: "transform,opacity" });
  }
  function arm() {
    if (armed || !G || !("IntersectionObserver" in window)) return;
    armed = true;
    const vh = window.innerHeight;
    io = new IntersectionObserver(
      (en) => {
        let n = 0;
        en.forEach((e) => {
          if (!e.isIntersecting) return;
          io!.unobserve(e.target);
          gsap.to(targets.get(e.target) ?? e.target, { y: 0, yPercent: 0, opacity: 1, duration: 0.45, delay: n++ * 0.06, ease: "power4.out", overwrite: true, clearProps: "transform,opacity" });
        });
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    $$(".rv,.tile,.rcard,.fcall,.fcols>div").forEach((el) => {
      if (el.getBoundingClientRect().top < vh) return;
      targets.set(el, el);
      gsap.set(el, { y: 40, opacity: 0 });
      io!.observe(el);
    });
    const fb = $(".fbig");
    if (fb && fb.firstElementChild && fb.getBoundingClientRect().top >= vh) {
      targets.set(fb, fb.firstElementChild);
      gsap.set(fb.firstElementChild, { yPercent: 110 });
      io.observe(fb);
    }
  }
  const onScroll = () => {
    if (!armed && !switching && (window.pageYOffset || 0) > 4) arm();
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  function pop(el: Element | null) {
    if (G && el) gsap.fromTo(el, { scale: 0.88 }, { scale: 1, duration: 0.3, ease: "back.out(3)", clearProps: "transform" });
  }

  /* Смена сферы: шторки закрывают экран за 0.2 с, под ними меняется всё,
     шторки уходят, и одновременно въезжает главный объект. Затухания нет. */
  function cutTo(id: NicheId, c: [string, string], swap: () => void) {
    const cut = $("#cut");
    if (!G || !cut) return swap();
    if (switching) return;
    switching = true;
    const a = cut.children[0];
    const b = cut.children[1];
    gsap.killTweensOf([a, b]);
    gsap.set(cut, { visibility: "visible" });
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(cut, { visibility: "hidden" });
        switching = false;
      },
    });
    if (id === "barber") {
      /* две тёмные створки сходятся в центре и расходятся */
      gsap.set(a, { left: "0%", width: "50.2%", background: c[0], skewX: 0, yPercent: 0, xPercent: -101, boxShadow: "inset -1px 0 0 #C19A5B" });
      gsap.set(b, { left: "49.8%", width: "50.2%", background: c[1], skewX: 0, yPercent: 0, xPercent: 101, boxShadow: "inset 1px 0 0 #C19A5B" });
      tl.to([a, b], { xPercent: 0, duration: 0.22, ease: "power3.in" }).add(swap).to(a, { xPercent: -101, duration: 0.34, ease: "power4.out" }, ">.03").to(b, { xPercent: 101, duration: 0.34, ease: "power4.out" }, "<");
    } else if (id === "coffee") {
      /* две плашки поднимаются снизу и уходят вверх */
      gsap.set([a, b], { left: "0%", width: "100%", skewX: 0, xPercent: 0, yPercent: 101, boxShadow: "none" });
      gsap.set(a, { background: c[0] });
      gsap.set(b, { background: c[1] });
      tl.to(a, { yPercent: 0, duration: 0.2, ease: "power3.in" }).to(b, { yPercent: 0, duration: 0.2, ease: "power3.in" }, 0.05).add(swap).to(b, { yPercent: -101, duration: 0.32, ease: "power4.out" }, ">.03").to(a, { yPercent: -101, duration: 0.32, ease: "power4.out" }, "<.04");
    } else {
      /* косые лезвия пролетают слева направо */
      gsap.set([a, b], { left: "-25%", width: "150%", skewX: -14, yPercent: 0, xPercent: -105, boxShadow: "none" });
      gsap.set(a, { background: c[0] });
      gsap.set(b, { background: c[1] });
      tl.to(a, { xPercent: 0, duration: 0.2, ease: "power3.in" }).to(b, { xPercent: 0, duration: 0.2, ease: "power3.in" }, 0.05).add(swap).to(b, { xPercent: 105, duration: 0.32, ease: "power4.out" }, ">.03").to(a, { xPercent: 105, duration: 0.32, ease: "power4.out" }, "<.04");
    }
  }

  function destroy() {
    userEvents.forEach((ev) => window.removeEventListener(ev, stopGo));
    window.removeEventListener("scroll", onScroll);
    clearTimeout(rfT);
    introTl?.kill();
    stopGo();
    io?.disconnect();
    if (G) ScrollTrigger.getAll().forEach((t) => t.kill());
    if (tick) gsap.ticker.remove(tick);
    lenis?.destroy();
  }

  return { G, intro, scrubs, disarm, refreshSoon, scrollToEl, scrollTop, pop, cutTo, isSwitching: () => switching, destroy };
}

export { gsap };
