"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import type { Niche, NicheId } from "@/data/types";
import {
  brState,
  count,
  cutFrom,
  dayFull,
  dayShort,
  dur,
  firstOpenDay,
  fixSel,
  fixTime,
  fmtDur,
  fmtT,
  freeCount,
  fresh,
  keys,
  listTxt,
  maskPhone,
  minAll,
  money,
  navHint,
  navOk,
  nextWin,
  OKN,
  pid,
  plur,
  price,
  provOf,
  q,
  slotCount,
  slotOk,
  stepKey,
  total,
  validateContact,
  waLink,
  WD,
  whenTxt,
  type BookingState,
  type Clock,
} from "@/lib/booking";
import { useClock } from "@/lib/clock";
import { createMotion, gsap, type Motion } from "@/lib/motion";
import { asset } from "@/lib/paths";
import { personalize, readPersonal, type Personal } from "@/lib/personal";
import { IC, Pic } from "./parts";

export interface SiteProps {
  /** сферы на вкладках; одна сфера: сайт одного бизнеса без вкладок */
  niches: Niche[];
  initial: NicheId;
  /** демо: пометки о вымышленных данных и ссылки-заглушки соцсетей */
  demo: boolean;
}

const noSub = () => () => {};
let personalCache: Personal | null | undefined;
function usePersonal(enabled: boolean): Personal | null {
  return useSyncExternalStore(
    noSub,
    () => (enabled ? (personalCache === undefined ? (personalCache = readPersonal(window.location.search)) : personalCache) : null),
    () => null,
  );
}

/**
 * Состояние движения. Оно не влияет на то, что нарисовано, поэтому живёт вне React:
 * на странице всегда один сайт.
 */
const rt = {
  motion: null as Motion | null,
  /** анимировать ли следующую смену шага и в какую сторону */
  anim: { on: false, dir: 1 },
  lastTotal: 0,
  seen: {} as Record<string, 1>,
  sumTw: null as gsap.core.Tween | null,
};
const put = (patch: Partial<typeof rt>) => void Object.assign(rt, patch);
const newTicket = () => 1000 + Math.floor(Math.random() * 9000);

/** год сборки: показывается до загрузки часов посетителя */
const BUILD_YEAR = Number(process.env.NEXT_PUBLIC_BUILD_YEAR ?? 2026);

const SLOT_GROUPS = [
  { n: "Утро", a: 0, b: 720 },
  { n: "День", a: 720, b: 1020 },
  { n: "Вечер", a: 1020, b: 1500 },
];

export function Site({ niches, initial, demo }: SiteProps) {
  const [id, setId] = useState<NicheId>(initial);
  const [tab, setTab] = useState<NicheId>(initial);
  const [S, setS] = useState<BookingState>(fresh);
  const clock = useClock();
  const personal = usePersonal(demo);
  /* без вкладок: сайт одного клиента или именной пример с названием из ссылки */
  const single = niches.length === 1 || !!personal?.brand;
  const base = niches.find((n) => n.id === id) ?? niches[0];
  const N = useMemo(() => (personal ? personalize(base, personal) : base), [base, personal]);

  const [bar, setBar] = useState({ navVis: false, heroVis: true, inBook: false });

  const tot = total(N, S);
  const ks = keys(N, S);
  const k = stepKey(N, S);
  const m = N.prov ? provOf(N, S.mid) : null;
  const ok = navOk(N, S);
  const nextLabel = k === "contact" ? (N.qty ? "Оформить заказ" : "Записаться") : "Далее";
  const tel = N.phone.replace(/[^+\d]/g, "");
  const du = Math.max(dur(N, S), N.step);
  const P = pid(N, S);

  /* ====== движение: создаётся один раз ====== */
  useEffect(() => {
    const mo = createMotion();
    put({ motion: mo });
    mo.intro(initial);
    mo.scrubs();
    return () => {
      mo.destroy();
      put({ motion: null });
    };
  }, [initial]);

  /* сфера: цвета страницы, заголовок вкладки, цвет панели браузера */
  useEffect(() => {
    document.body.setAttribute("data-n", N.id);
    /* заголовок вкладки браузера: Next дописывает свой <title> после загрузки, поэтому свой удерживаем */
    const want = N.brand + ", онлайн-запись";
    const keep = () => {
      if (document.title !== want) document.title = want;
    };
    keep();
    const mo = new MutationObserver(keep);
    mo.observe(document.head, { childList: true, subtree: true, characterData: true });
    const tc = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (tc) tc.content = getComputedStyle(document.body).backgroundColor;
    document.documentElement.classList.remove("pz");
    return () => mo.disconnect();
  }, [N.id, N.brand]);

  /* индикатор вкладок переезжает сразу по нажатию */
  const tabsRef = useRef<HTMLElement>(null);
  const markTab = useCallback((instant: boolean) => {
    const root = tabsRef.current;
    if (!root) return;
    const on = root.querySelector<HTMLElement>('[data-tab][aria-selected="true"]');
    const t = root.querySelector<HTMLElement>(".tind");
    if (!on || !t) return;
    t.classList.toggle("off", instant);
    t.style.width = on.offsetWidth + "px";
    t.style.transform = "translateX(" + on.offsetLeft + "px)";
  }, []);
  const firstMark = useRef(true);
  useLayoutEffect(() => {
    markTab(firstMark.current);
    firstMark.current = false;
  }, [tab, markTab]);
  useEffect(() => {
    const again = () => markTab(true);
    window.addEventListener("resize", again);
    document.fonts?.ready.then(() => {
      again();
      rt.motion?.refreshSoon();
    });
    return () => window.removeEventListener("resize", again);
  }, [markTab]);

  /* ====== нижняя панель на телефоне ====== */
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const watch = (sel: string, key: "navVis" | "heroVis" | "inBook", opts?: IntersectionObserverInit) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const io = new IntersectionObserver((en) => setBar((b) => ({ ...b, [key]: en[en.length - 1].isIntersecting })), opts);
      io.observe(el);
      return io;
    };
    const ios = [watch("#bnav", "navVis"), watch("#hact", "heroVis"), watch("#book", "inBook", { rootMargin: "0px 0px -55% 0px" })];
    return () => ios.forEach((io) => io?.disconnect());
  }, []);

  /* ====== переходы шагов ====== */
  const panelRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const mo = rt.motion;
    const p = panelRef.current;
    if (mo?.G && p && rt.anim.on) {
      if (S.done) {
        gsap.fromTo(".okb", { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.45, ease: "power4.out", clearProps: "clipPath" });
        gsap.fromTo(".okb>*,.okb dl>div", { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power4.out", stagger: { amount: 0.12 }, clearProps: "transform,opacity" });
      } else {
        gsap.fromTo(p.children, { x: 26 * rt.anim.dir, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power4.out", stagger: { amount: 0.1 }, clearProps: "transform,opacity" });
      }
    }
    put({ anim: { on: false, dir: 1 } });
    mo?.refreshSoon();
  }, [S.step, S.done, S.ticket, id]);

  /* ====== итог: сумма досчитывается, новая строка въезжает ====== */
  const totRef = useRef<HTMLElement>(null);
  const sumKey = ks.join(",");
  useLayoutEffect(() => {
    const el = totRef.current;
    if (!el) return;
    rt.sumTw?.kill();
    const from = rt.lastTotal;
    if (rt.motion?.G && tot !== from) {
      const o = { v: from };
      el.textContent = money(from);
      const tw = gsap.to(o, { v: tot, duration: 0.35, ease: "power3.out", onUpdate: () => void (el.textContent = money(Math.round(o.v / 100) * 100)), onComplete: () => void (el.textContent = money(tot)) });
      put({ sumTw: tw });
      const rows = Array.from(document.querySelectorAll<HTMLElement>("#sum li[data-k]")).filter((li) => !rt.seen[li.dataset.k!]);
      if (rows.length) gsap.fromTo(rows, { x: -14, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "power4.out", clearProps: "transform,opacity" });
    } else el.textContent = money(tot);
    put({ lastTotal: tot, seen: Object.fromEntries(sumKey.split(",").filter(Boolean).map((x) => [x, 1 as const])) });
  }, [tot, sumKey, id]);

  /* ====== действия ====== */
  const later = (fn: () => void) => requestAnimationFrame(fn);
  const pop = (sel: string) => later(() => rt.motion?.pop(document.querySelector(sel)));
  const go = (sel: string) => rt.motion?.scrollToEl(document.querySelector(sel));
  const anchor = (sel: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    go(sel);
  };

  const setStep = (n: number, from: BookingState = S) => {
    put({ anim: { on: true, dir: n < from.step ? -1 : 1 } });
    let next: BookingState = { ...from, step: n };
    if (N.steps[n] === "time" && clock) {
      next = fixTime(N, clock, next);
      if (next.t == null) next = { ...next, di: firstOpenDay(N, clock, next) };
    }
    setS(next);
  };

  const submit = () => {
    const err = validateContact(S);
    if (err.name || err.phone) {
      setS({ ...S, err });
      later(() => {
        const el = document.querySelector<HTMLInputElement>(err.name ? "#fn" : "#fp");
        if (!el) return;
        el.focus();
        if (rt.motion?.G) gsap.fromTo(el.parentNode, { x: -8 }, { x: 0, duration: 0.4, ease: "elastic.out(1.2,.3)", clearProps: "transform" });
      });
      return;
    }
    put({ anim: { on: true, dir: 1 } });
    setS({ ...S, err: {}, ticket: newTicket(), done: true });
    later(() => go("#book"));
  };
  const next = () => {
    if (k === "contact") submit();
    else if (ok) setStep(S.step + 1);
  };

  const switchTo = (to: NicheId) => {
    if (to === id || rt.motion?.isSwitching()) return;
    const mo = rt.motion;
    const target = niches.find((n) => n.id === to)!;
    const swap = () => {
      mo?.disarm();
      flushSync(() => {
        setId(to);
        setTab(to);
        setS(fresh());
      });
      put({ lastTotal: 0, seen: {} });
      document.body.setAttribute("data-n", to);
      markTab(true);
      mo?.scrollTop();
      setBar((b) => ({ ...b, heroVis: true }));
      mo?.intro(to);
      mo?.scrubs();
    };
    if (!mo?.G) return swap();
    setTab(to);
    mo.cutTo(to, target.cut, swap);
  };

  const pickTile = (patch: Partial<BookingState>) => {
    const from = fixSel(N, { ...S, done: false, ...patch });
    setStep(N.steps.indexOf("items"), from);
    later(() => go("#book"));
  };

  const withClock = (fn: (c: Clock) => BookingState) => {
    if (clock) setS(fn(clock));
  };

  const mbarClick = () => {
    if (bar.inBook && !S.done) {
      if (k === "contact") go("#bnav");
      else {
        next();
        go("#book");
      }
    } else go("#book");
  };

  const cnt = count(N, S);
  const showBar = !S.done && !bar.navVis && !bar.heroVis;

  /* полоса «сегодня»: всё считается из часов филиала, расписания и прайса */
  const b0 = N.branches[0];
  const nowbar = (() => {
    if (!clock) return null;
    const st = brState(clock, b0);
    const wd = N.fixedDur || 45;
    let w: { di: number; k: number } | null = null;
    if (N.prov)
      N.provs!.forEach((p) => {
        const x = nextWin(N, clock, p.id, wd);
        if (x && (!w || x.di < w.di || (x.di === w.di && x.k < w.k))) w = x;
      });
    else w = nextWin(N, clock, "x", wd);
    return { st, w: w as { di: number; k: number } | null };
  })();

  /* ====== панели шагов ====== */
  const provPanel = () => (
    <>
      <h3>Выберите мастера</h3>
      <p className="lead">Цены зависят от мастера.</p>
      {N.provs!.map((p) => {
        const w = clock ? nextWin(N, clock, p.id) : null;
        return (
          <button
            key={p.id}
            className={"prow" + (S.mid === p.id ? " on" : "")}
            data-pick={p.id}
            onClick={() => {
              withClock((c) => fixTime(N, c, fixSel(N, { ...S, mid: p.id })));
              pop(".prow.on img");
            }}
          >
            <Pic pair={p.img} eager />
            <span>
              <b>{p.n}</b>
              <span className="rl">{p.r}</span>
              <span className="stars">
                <i aria-hidden="true">★</i>
                {p.rate}
                <span>{p.rev} отзывов</span>
              </span>
            </span>
            <span className="pr">
              <b>Стрижка от {money(p.pr.cut)}</b>
              <br />
              {w && clock ? dayShort(clock, w.di) + ", " + fmtT(N, w.k) : ""}
            </span>
          </button>
        );
      })}
    </>
  );

  const itemsPanel = () => (
    <>
      <h3>
        {N.names.items}
        {m ? ", мастер " + m.n : ""}
      </h3>
      <p className="lead">{N.itemsLead}</p>
      {N.cats.map((c) => {
        const rows = c.k
          .map((key) => {
            const p = price(N, S, key);
            if (p == null) return null;
            const s = N.items[key];
            const n = q(S, key);
            const popular = N.prov ? m?.pop === key : !!N.pop?.[key];
            const left = (
              <>
                <span>
                  <span className="nm">
                    {s.n}
                    {popular ? <em className="tag">Чаще берут</em> : null}
                  </span>
                  <span className="ds">
                    {s.t}
                    {s.d ? ", " + fmtDur(s.d) : ""}
                  </span>
                </span>
                <i className="ld" aria-hidden="true" />
              </>
            );
            const setQty = (d: number) => {
              const v = Math.max(0, Math.min(9, n + d));
              const sel = { ...S.sel };
              if (v) sel[key] = v;
              else delete sel[key];
              const nextS = { ...S, sel };
              setS(clock ? fixTime(N, clock, nextS) : nextS);
            };
            if (N.qty)
              return (
                <div key={key} className={"row" + (n ? " on" : "")}>
                  {left}
                  <span className="rt">
                    <b>{money(p)}</b>
                    <span className="qty">
                      {n ? (
                        <>
                          <button className="pl mn" data-qty={key} data-d="-1" aria-label={"Убрать: " + s.n} onClick={() => setQty(-1)} />
                          <span className="qn">{n}</span>
                        </>
                      ) : null}
                      <button
                        className={"pl" + (n ? " on" : "")}
                        data-qty={key}
                        data-d="1"
                        aria-label={"Добавить: " + s.n}
                        onClick={() => {
                          setQty(1);
                          pop(`[data-qty="${key}"][data-d="1"]`);
                        }}
                      />
                    </span>
                  </span>
                </div>
              );
            return (
              <button
                key={key}
                className={"row" + (n ? " on" : "")}
                data-svc={key}
                aria-pressed={n > 0}
                onClick={() => {
                  setQty(n ? -n : 1);
                  pop(`[data-svc="${key}"] .pl`);
                }}
              >
                {left}
                <span className="rt">
                  <b>{money(p)}</b>
                  <span className="pl" aria-hidden="true" />
                </span>
              </button>
            );
          })
          .filter(Boolean);
        return rows.length ? (
          <div key={c.n} style={{ display: "contents" }}>
            <div className="grp">{c.n}</div>
            {rows}
          </div>
        ) : null;
      })}
    </>
  );

  const timePanel = () => {
    if (!clock) return <h3>{N.names.time}</h3>;
    const fw = nextWin(N, clock, P, du, 0);
    const jump = (di: number, t: number) => {
      setS({ ...S, di, t });
      pop(".slot.on");
    };
    const groups = SLOT_GROUPS.map((g) => {
      const slots: number[] = [];
      for (let i = 0; i < slotCount(N); i++) {
        const st = N.open + i * N.step;
        if (st >= g.a && st < g.b && slotOk(N, clock, P, S.di, i, du)) slots.push(i);
      }
      return { ...g, slots };
    }).filter((g) => g.slots.length);
    const nw = groups.length ? null : nextWin(N, clock, P, du, S.di + 1) || fw;
    return (
      <>
        <h3>{N.names.time}</h3>
        <p className="lead">{(N.fixedDur ? "Выберите, к какому времени приготовить заказ." : "Длительность: " + fmtDur(du) + ".") + " Под датой указано, сколько окон свободно."}</p>
        {S.t == null && fw ? (
          <button className="chip" data-jump={fw.di + ":" + fw.k} onClick={() => jump(fw.di, fw.k)}>
            {(N.qty ? "Как можно скорее" : "Ближайшее окно") + ": " + dayShort(clock, fw.di).toLowerCase() + ", " + fmtT(N, fw.k)}
          </button>
        ) : null}
        <div className="days" style={{ "--nd": N.nd } as React.CSSProperties}>
          {Array.from({ length: N.nd }, (_, i) => {
            const d = clock.days[i];
            const c = freeCount(N, clock, P, i, du);
            return (
              <button
                key={i}
                className={"day" + (S.di === i ? " on" : "")}
                data-day={i}
                aria-pressed={S.di === i}
                aria-label={dayFull(clock, i) + ", " + (c ? c + " " + plur(c, OKN) : "окон нет")}
                disabled={!c}
                onClick={() => {
                  setS(fixTime(N, clock, { ...S, di: i }));
                  pop(".day.on");
                  later(() => {
                    if (rt.motion?.G) gsap.fromTo(".slot", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power4.out", stagger: { amount: 0.12 }, clearProps: "transform,opacity" });
                  });
                }}
              >
                <span>{i === 0 ? "сегодня" : WD[d.getDay()]}</span>
                <b>{d.getDate()}</b>
                <small>
                  {c ? c : "нет"}
                  <i> {c ? plur(c, OKN) : "окон"}</i>
                </small>
              </button>
            );
          })}
        </div>
        {groups.map((g) => (
          <div key={g.n} style={{ display: "contents" }}>
            <div className="sg">{g.n}</div>
            <div className="slots">
              {g.slots.map((i) => (
                <button key={i} className={"slot" + (S.t === i ? " on" : "")} data-slot={i} aria-pressed={S.t === i} onClick={() => jump(S.di, i)}>
                  {fmtT(N, i)}
                </button>
              ))}
            </div>
          </div>
        ))}
        {!groups.length ? (
          <div className="empty">
            <b>На {dayFull(clock, S.di)} свободных окон нет.</b>
            {nw ? (
              <button className="lnk" data-jump={nw.di + ":" + nw.k} onClick={() => jump(nw.di, nw.k)}>
                Ближайшее окно: {dayShort(clock, nw.di).toLowerCase()}, {fmtT(N, nw.k)}
              </button>
            ) : (
              <>
                На ближайшую неделю окон нет. Позвоните: <a href={"tel:" + tel}>{N.phone}</a>
              </>
            )}
          </div>
        ) : null}
      </>
    );
  };

  const contactPanel = () => {
    const e = S.err;
    const setPay = (pay: "cash" | "kaspi") => {
      setS({ ...S, pay });
      pop(".pay.on i");
    };
    return (
      <>
        <h3>Контакты</h3>
        <p className="lead">Напомним о визите и сообщим, если что-то изменится.</p>
        <form
          id="cf"
          noValidate
          onSubmit={(ev) => {
            ev.preventDefault();
            submit();
          }}
        >
          <div className={"fld" + (e.name ? " bad" : "")}>
            <label htmlFor="fn">Имя</label>
            <input
              id="fn"
              autoComplete="given-name"
              value={S.name}
              placeholder="Как к вам обращаться"
              aria-invalid={e.name ? true : undefined}
              aria-describedby={e.name ? "fn-e" : undefined}
              onChange={(ev) => {
                const name = ev.target.value;
                const err = { ...S.err };
                if (err.name && name.trim().length >= 2) delete err.name; // ошибка снимается, как только значение стало верным
                setS({ ...S, name, err });
              }}
            />
            {e.name ? (
              <div className="er" id="fn-e">
                {e.name}
              </div>
            ) : null}
          </div>
          <div className={"fld" + (e.phone ? " bad" : "")}>
            <label htmlFor="fp">Телефон</label>
            <input
              id="fp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={S.phone}
              placeholder="+7 (700) 000-00-00"
              aria-invalid={e.phone ? true : undefined}
              aria-describedby={e.phone ? "fp-e" : undefined}
              onChange={(ev) => {
                const { text, digits } = maskPhone(ev.target.value);
                const err = { ...S.err };
                if (err.phone && digits === 10) delete err.phone;
                setS({ ...S, phone: text, err });
              }}
            />
            {e.phone ? (
              <div className="er" id="fp-e">
                {e.phone}
              </div>
            ) : null}
          </div>
          {N.car ? (
            <div className="fld">
              <label htmlFor="fc">
                Автомобиль <span className="hint">(по желанию)</span>
              </label>
              <input id="fc" value={S.car} placeholder="Марка, модель, госномер" onChange={(ev) => setS({ ...S, car: ev.target.value })} />
            </div>
          ) : null}
          <div className="fld">
            <label>Оплата</label>
            <div className="pays">
              <button type="button" className={"pay" + (S.pay === "cash" ? " on" : "")} data-pay="cash" aria-pressed={S.pay === "cash"} onClick={() => setPay("cash")}>
                <i />
                <span>
                  <b>{N.cash}</b>
                  <span>Оплата на месте</span>
                </span>
              </button>
              <button type="button" className={"pay" + (S.pay === "kaspi" ? " on" : "")} data-pay="kaspi" aria-pressed={S.pay === "kaspi"} onClick={() => setPay("kaspi")}>
                <i />
                <span>
                  <b>Kaspi</b>
                  <span>Если у бизнеса подключён Kaspi Pay</span>
                </span>
              </button>
            </div>
          </div>
          <p className="hint">Предоплаты нет. Сайт сам ничего не отправляет: после подтверждения заявку можно отправить в WhatsApp своей кнопкой.</p>
        </form>
      </>
    );
  };

  const donePanel = () => (
    <div className="okb">
      <h3>{N.done}</h3>
      <p className="hint">
        {N.no} № {S.ticket}
      </p>
      <dl>
        {m ? (
          <div>
            <dt>Мастер</dt>
            <dd>{m.n}</dd>
          </div>
        ) : null}
        <div>
          <dt>{N.sumItems}</dt>
          <dd>{listTxt(N, S)}</dd>
        </div>
        <div>
          <dt>{N.sumTime}</dt>
          <dd>{clock ? whenTxt(N, clock, S) : ""}</dd>
        </div>
        <div>
          <dt>Где</dt>
          <dd>
            {b0.n}, {b0.a}
          </dd>
        </div>
        <div>
          <dt>Гость</dt>
          <dd>{S.name}</dd>
        </div>
        <div>
          <dt>Оплата</dt>
          <dd>{S.pay === "cash" ? "Наличными" : "Kaspi"}</dd>
        </div>
        <div>
          <dt>Итого</dt>
          <dd>{money(tot)}</dd>
        </div>
      </dl>
      <div className="okact">
        <a className="btn" id="wa" href={clock ? waLink(N, clock, S) : "#"} target="_blank" rel="noopener">
          Отправить заявку в WhatsApp
        </a>
        <button
          className="lnk"
          data-again="1"
          onClick={() => {
            put({ anim: { on: true, dir: -1 } });
            setS(fresh());
          }}
        >
          {N.qty ? "Новый заказ" : "Новая запись"}
        </button>
      </div>
      <p className="hint oknote">Заявка уйдёт только после вашей отправки в WhatsApp.</p>
    </div>
  );

  const revCount = (N.provs ?? []).reduce((n, p) => n + p.rev, 0);
  const media = N.media;
  const social = N.social ?? (demo ? { instagram: "https://instagram.com/", telegram: "https://t.me/", twoGis: "https://2gis.kz/astana" } : null);

  return (
    <>
      <a className="skip" href="#book" onClick={anchor("#book")}>
        Перейти к записи
      </a>

      <header className="top">
        <div className="w">
          <a className="brand" href="#top" id="brand" data-pz onClick={anchor("#top")}>
            {N.brand}
          </a>
          {!single ? (
            <nav
              className="tabs"
              id="tabs"
              role="tablist"
              aria-label="Сфера"
              ref={tabsRef}
              onKeyDown={(e) => {
                /* стрелки влево и вправо переключают вкладки с клавиатуры */
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                const bs = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-tab]"));
                const i = bs.indexOf(document.activeElement as HTMLElement);
                if (i < 0) return;
                const nb = bs[(i + (e.key === "ArrowRight" ? 1 : bs.length - 1)) % bs.length];
                nb.focus();
                nb.click();
              }}
            >
              <span className="tind off" id="tind" />
              {niches.map((n) => (
                <button key={n.id} role="tab" data-tab={n.id} aria-selected={tab === n.id} onClick={() => switchTo(n.id)}>
                  {n.tab}
                </button>
              ))}
            </nav>
          ) : null}
          <a className="btn sm" href="#book" id="topcta" onClick={anchor("#book")}>
            {N.qty ? "Заказать" : "Записаться"}
          </a>
        </div>
        <div className="prog" id="prog" aria-hidden="true" />
      </header>

      <main id="top">
        <section className="hero" id="hero">
          <div className="media" id="media">
            <div className="mclip">
              <div className="mi" key={N.id}>
                {media.type === "video" ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={media.poster ? asset(media.poster) : media.fb} alt="" />
                    <video
                      muted
                      loop
                      playsInline
                      autoPlay
                      preload="metadata"
                      src={asset(media.src)}
                      onLoadedData={(e) => {
                        const v = e.currentTarget;
                        v.classList.add("ok");
                        v.play().catch(() => {});
                      }}
                    />
                  </>
                ) : (
                  <Pic pair={[media.src, media.fb]} eager />
                )}
              </div>
              <i className="mwipe" />
            </div>
            <i className="mfr" />
            <span className="mtag">{media.tag}</span>
          </div>
          <div className="htxt">
            <div className="hhead">
              <p className="kick ln">
                <span id="kick">{N.kick}</span>
              </p>
              <h1 id="h1">
                {N.h1.map((l) => (
                  <span className="ln" key={l}>
                    <span>{l}</span>
                  </span>
                ))}
              </h1>
            </div>
            <div className="hbody">
              <p className="sub ln">
                <span id="sub">{N.sub}</span>
              </p>
              <div className="hact" id="hact">
                <a className="btn" href="#book" id="cta" onClick={anchor("#book")}>
                  {N.cta}
                </a>
                <a className="lnk" href="#tiles" id="cta2" onClick={anchor("#tiles")}>
                  {N.cta2}
                </a>
              </div>
            </div>
            <ul className="facts" id="facts">
              {N.facts.map((f) => (
                <li key={f[1]}>
                  <b>{f[0]}</b>
                  <span>{f[1]}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="now" aria-label="Сегодня">
          <div className="w">
            <div className="nowbar rv" id="nowbar">
              <div className="nc">
                <small data-pz>
                  {b0.n}
                  {nowbar ? " · " + nowbar.st.today : ""}
                </small>
                <b>
                  <i className={"dot" + (nowbar?.st.on ? " on" : "")} />
                  {nowbar ? nowbar.st.txt : b0.h}
                </b>
              </div>
              <a className="nc" href="#book" onClick={anchor("#book")}>
                <small>{N.qty ? "Приготовим к" : "Ближайшее окно"}</small>
                <b>{!nowbar || !clock ? "Выберите время онлайн" : nowbar.w ? dayShort(clock, nowbar.w.di) + ", " + fmtT(N, nowbar.w.k) : "На неделю окон нет"}</b>
              </a>
              <div className="nc">
                <small>{N.prov ? "Мужская стрижка" : "Цены"}</small>
                <b>от {money(N.prov ? cutFrom(N) : minAll(N))}</b>
              </div>
              <div className="nc">
                <small>Оплата на месте</small>
                <b>Наличные или Kaspi</b>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" id="tiles" style={{ borderTop: 0 }}>
          <div className="w">
            <div className="sec-h rv">
              <h2 id="tilesH">{N.tilesH}</h2>
              <p id="tilesP">{N.tilesP}</p>
              {personal ? <p className="pznote">Пример: услуги и цены заменим на ваши.</p> : null}
            </div>
            <div className="tgrid" id="tgrid">
              {N.prov
                ? N.provs!.map((p) => {
                    const pw = clock ? nextWin(N, clock, p.id) : null;
                    return (
                      <button key={p.id} className="tile" data-master={p.id} onClick={() => pickTile({ mid: p.id })}>
                        <span className="tph">
                          <span className="tpi">
                            <Pic pair={p.img} alt={p.n} eager />
                          </span>
                          <span className="tn">{p.n}</span>
                        </span>
                        <span className="tb">
                          <span className="rl">{p.r}</span>
                          <span className="stars">
                            <i aria-hidden="true">★★★★★</i>
                            <b>{p.rate}</b>
                            <span>{p.rev} отзывов</span>
                          </span>
                          <span className="tpl">
                            {["fade", "both", "beard"]
                              .filter((x) => p.pr[x] != null && N.items[x])
                              .map((x) => (
                                <span key={x}>
                                  {N.items[x].n}
                                  <b>{money(p.pr[x])}</b>
                                </span>
                              ))}
                          </span>
                          <span className="tf">
                            <b>Стрижка от {money(p.pr.cut)}</b>
                            <span>{pw && clock ? "Окно: " + dayShort(clock, pw.di).toLowerCase() + ", " + fmtT(N, pw.k) : ""}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })
                : (N.feat ?? []).map((key) => {
                    const it = N.items[key];
                    return (
                      <button key={key} className="tile" data-feat={key} onClick={() => pickTile({ sel: q(S, key) ? S.sel : { ...S.sel, [key]: 1 } })}>
                        <span className="tph">
                          <span className="tpi">{it.img ? <Pic pair={it.img} alt={it.n} eager /> : null}</span>
                          <span className="tgo" aria-hidden="true">
                            {N.go}
                          </span>
                        </span>
                        <span className="tb">
                          <span className="tn">{it.n}</span>
                          <span className="rl">{it.t}</span>
                          <span className="tf">
                            <b>{money(it.p ?? 0)}</b>
                            <span>{it.d ? fmtDur(it.d) : ""}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
            </div>
          </div>
        </section>

        <section className="sec" id="book">
          <div className="w">
            <div className="sec-h rv">
              <h2 id="bookH">{N.bookH}</h2>
              <p id="bookP">{N.bookP}</p>
            </div>
            <div className="bwrap rv">
              <div className="bmain">
                <ol className="steps" id="steps">
                  {N.steps.map((s, i) => {
                    const back = i < S.step && !S.done; // пройденные шаги можно открыть заново, вперёд перескочить нельзя
                    return (
                      <li key={s} className={i < S.step || S.done ? "dn" : ""} aria-current={i === S.step && !S.done ? "step" : undefined}>
                        <button className="sb" data-goto={i} disabled={!back} aria-label={back ? "Вернуться к шагу «" + N.names[s] + "»" : undefined} onClick={() => back && setStep(i)}>
                          <b />
                          {N.names[s]}
                        </button>
                      </li>
                    );
                  })}
                </ol>
                <div className="panel" id="panel" ref={panelRef} key={N.id + ":" + (S.done ? "done" : k)}>
                  {S.done ? donePanel() : k === "prov" ? provPanel() : k === "items" ? itemsPanel() : k === "time" ? timePanel() : contactPanel()}
                </div>
                <p className="nhint" id="nhint" aria-live="polite" hidden={S.done}>
                  {navHint(N, S)}
                </p>
                <div className="bnav" id="bnav" hidden={S.done}>
                  <button className="lnk" id="bback" hidden={S.step === 0} onClick={() => S.step > 0 && setStep(S.step - 1)}>
                    Назад
                  </button>
                  <button className="btn" id="bnext" disabled={!ok} onClick={next}>
                    {nextLabel}
                  </button>
                </div>
              </div>
              <aside className="sum" id="sum" aria-label="Ваш заказ">
                <h3>{N.qty ? "Ваш заказ" : "Ваша запись"}</h3>
                <dl>
                  {N.prov ? (
                    <div>
                      <dt>Мастер</dt>
                      <dd className={m ? undefined : "mt"}>{m ? m.n : "Не выбран"}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>{N.sumItems}</dt>
                    <dd className={ks.length ? undefined : "mt"}>
                      {ks.length ? (
                        <ul>
                          {ks.map((key) => (
                            <li key={key} data-k={key}>
                              <span>
                                {N.items[key].n}
                                {q(S, key) > 1 ? " × " + q(S, key) : ""}
                              </span>
                              <span>{money((price(N, S, key) ?? 0) * q(S, key))}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "Пока пусто"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>{N.sumTime}</dt>
                    <dd className={S.t == null ? "mt" : undefined}>{S.t == null || !clock ? "Не выбрано" : whenTxt(N, clock, S)}</dd>
                  </div>
                </dl>
                <div className="tt">
                  <span>Итого</span>
                  {/* сумму ведёт эффект выше: она досчитывается анимацией */}
                  <b ref={totRef} suppressHydrationWarning>
                    {money(0)}
                  </b>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {N.rev ? (
          <section className="sec" id="rev">
            <div className="w">
              <div className="sec-h rv">
                <h2 id="revH">{N.revH}</h2>
                <p id="revP">{N.revP}</p>
              </div>
              <div className="rvw rv" id="revB">
                <div className="rsum">
                  <b>{N.rev.avg}</b>
                  <div>
                    <div className="stars">
                      <i aria-hidden="true">★★★★★</i>
                    </div>
                    <p>
                      {revCount} {plur(revCount, ["отзыв", "отзыва", "отзывов"])}
                      {N.provs?.length === 3 ? " о трёх мастерах" : ""}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="rcards">
                    {N.rev.items.map((r) => (
                      <figure className="rcard" key={r.n}>
                        <blockquote>{r.t}</blockquote>
                        <footer>
                          <span>
                            <b>{r.n}</b>, мастер <em>{r.m}</em>
                          </span>
                          <span>{r.d}</span>
                        </footer>
                      </figure>
                    ))}
                  </div>
                  {demo ? <p className="rnote">Это демо: имена, отзывы и оценки вымышлены.</p> : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="foot">
        <div className="w" id="foot">
          <div className="ftop">
            <div className="fbig">
              <span data-pz>{N.brand}</span>
            </div>
            <div className="fcall">
              <p>{N.qty ? "Заказ по телефону и онлайн" : "Запись по телефону и онлайн"}</p>
              <a className="big" href={"tel:" + tel} data-pz>
                {IC.phone}
                {N.phone}
              </a>
              {N.email ? (
                <a href={"mailto:" + N.email}>
                  {IC.mail}
                  {N.email}
                </a>
              ) : null}
            </div>
          </div>
          <div className="fcols">
            {N.branches.map((b) => {
              const bs = clock ? brState(clock, b) : null;
              return (
                <div key={b.n}>
                  <small>Филиал</small>
                  <h4>{b.n}</h4>
                  <ul className="fl">
                    <li>
                      {IC.pin}
                      <span data-pz>Астана, {b.a}</span>
                    </li>
                    <li>
                      {IC.clock}
                      <span>
                        {b.h}
                        {bs ? (
                          <span className="st">
                            <i className={"dot" + (bs.on ? " on" : "")} />
                            {bs.txt}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  </ul>
                </div>
              );
            })}
            <div>
              <small>Оплата</small>
              <h4>На месте</h4>
              <ul className="fl">
                <li>
                  <span>{N.cash} или через Kaspi, если он подключён. Предоплата не нужна.</span>
                </li>
              </ul>
            </div>
            {social || tel ? (
              <div>
                <small>Соцсети</small>
                <h4>Мы на связи</h4>
                <ul className="fl fsoc">
                  {social?.instagram ? (
                    <li>
                      <a href={social.instagram} target="_blank" rel="noopener">
                        Instagram
                      </a>
                    </li>
                  ) : null}
                  {social?.telegram ? (
                    <li>
                      <a href={social.telegram} target="_blank" rel="noopener">
                        Telegram
                      </a>
                    </li>
                  ) : null}
                  <li>
                    <a href={"https://wa.me/" + tel.replace("+", "")} target="_blank" rel="noopener">
                      WhatsApp
                    </a>
                  </li>
                  {social?.twoGis ? (
                    <li>
                      <a href={social.twoGis} target="_blank" rel="noopener">
                        2ГИС
                      </a>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="fbot">
            <span suppressHydrationWarning>
              © {clock ? clock.days[0].getFullYear() : BUILD_YEAR} <span data-pz>{N.brand}</span>
            </span>
            {demo ? <span>{personal ? "Пример сайта. Услуги, цены, мастера и отзывы демонстрационные." : "Демо-версия. Название, адреса, телефон, отзывы и оценки вымышлены."}</span> : null}
          </div>
        </div>
      </footer>

      <div className={"mbar" + (showBar ? " show" : "")} id="mbar">
        <div>
          <small id="mbs">{cnt ? "Выбрано: " + cnt : N.qty ? "Предзаказ без очереди" : "Онлайн-запись"}</small>
          <b id="mbb">{cnt ? money(tot) : "Без предоплаты"}</b>
        </div>
        <button className="btn sm" id="mbn" disabled={bar.inBook ? !ok : false} onClick={mbarClick}>
          {bar.inBook ? nextLabel : N.qty ? "Заказать" : "Записаться"}
        </button>
      </div>
      <div className="cut" id="cut" aria-hidden="true">
        <i />
        <i />
      </div>
    </>
  );
}
