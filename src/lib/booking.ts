/**
 * Логика записи: окна, длительность, цены, тексты. Чистые функции без страницы,
 * чтобы их можно было проверять тестами и использовать в любом компоненте.
 */
import type { Branch, Niche, Provider } from "@/data/types";

export interface BookingState {
  step: number;
  /** выбранный мастер */
  mid: string | null;
  /** услуга → количество */
  sel: Record<string, number>;
  /** индекс дня от сегодня */
  di: number;
  /** индекс окна или null */
  t: number | null;
  name: string;
  phone: string;
  car: string;
  pay: "cash" | "kaspi";
  err: { name?: string; phone?: string };
  done: boolean;
  ticket: number;
}

export const fresh = (): BookingState => ({ step: 0, mid: null, sel: {}, di: 0, t: null, name: "", phone: "", car: "", pay: "cash", err: {}, done: false, ticket: 0 });

/** Момент, относительно которого считаются окна: список дней и минуты от полуночи. */
export interface Clock {
  days: Date[];
  nowMin: number;
}

export function makeClock(now: Date): Clock {
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
  return { days, nowMin: now.getHours() * 60 + now.getMinutes() };
}

export const WD = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
export const MO = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
export const OKN: [string, string, string] = ["окно", "окна", "окон"];

export const money = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₸";
export function fmtDur(m: number) {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return (h ? h + " ч" : "") + (h && r ? " " : "") + (r ? r + " мин" : "");
}
const two = (n: number) => (n < 10 ? "0" : "") + n;
export const fmtMin = (x: number) => two(Math.floor(x / 60)) + ":" + two(x % 60);
export const fmtT = (N: Niche, k: number) => fmtMin(N.open + k * N.step);
export function plur(n: number, f: [string, string, string]) {
  const a = n % 10;
  const b = n % 100;
  return f[a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? 1 : 2];
}

export const slotCount = (N: Niche) => Math.floor((N.close - N.open) / N.step);
export const provOf = (N: Niche, id: string | null): Provider | null => N.provs?.find((p) => p.id === id) ?? null;

export function dayShort(c: Clock, di: number) {
  const d = c.days[di];
  return di === 0 ? "Сегодня" : di === 1 ? "Завтра" : WD[d.getDay()] + ", " + d.getDate() + " " + MO[d.getMonth()];
}
export function dayFull(c: Clock, di: number) {
  const d = c.days[di];
  return WD[d.getDay()] + ", " + d.getDate() + " " + MO[d.getMonth()];
}
function dayKey(c: Clock, di: number) {
  const d = c.days[di];
  return d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
}

/* Занятость демонстрационная, но правдоподобная: заняты пары соседних окон, около четверти дня. */
function hsh(a: number, b: number, c: number) {
  let x = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) % 100;
}
export const busy = (N: Niche, c: Clock, p: string, di: number, k: number) => N.hasBusy && hsh(dayKey(c, di), k >> 1, p.charCodeAt(0)) < 24;
export const hours = (c: Clock, b: Branch, di: number) => b.s[c.days[di].getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6];

/** Свободно ли окно k в день di у мастера p для услуги длительностью dur минут. */
export function slotOk(N: Niche, c: Clock, p: string, di: number, k: number, dur: number) {
  const n = Math.max(1, Math.ceil(dur / N.step));
  const st = N.open + k * N.step;
  const r = hours(c, N.branches[0], di);
  if (k + n > slotCount(N)) return false;
  if (!r || st < r[0] || st + n * N.step > r[1]) return false;
  for (let j = 0; j < n; j++) if (busy(N, c, p, di, k + j)) return false;
  if (di === 0 && st < c.nowMin + N.lead) return false;
  return true;
}

export function nextWin(N: Niche, c: Clock, p: string, d = 45, from = 0): { di: number; k: number } | null {
  for (let di = from; di < N.nd; di++) for (let k = 0; k < slotCount(N); k++) if (slotOk(N, c, p, di, k, d || 45)) return { di, k };
  return null;
}

export function freeCount(N: Niche, c: Clock, p: string, di: number, d: number) {
  let n = 0;
  for (let k = 0; k < slotCount(N); k++) if (slotOk(N, c, p, di, k, d)) n++;
  return n;
}

export function brState(c: Clock, b: Branch) {
  const r = hours(c, b, 0);
  if (!r) return { on: false, today: "выходной", txt: "Сегодня выходной" };
  const today = fmtMin(r[0]) + "–" + fmtMin(r[1]);
  if (c.nowMin < r[0]) return { on: false, today, txt: "Откроемся в " + fmtMin(r[0]) };
  if (c.nowMin < r[1]) return { on: true, today, txt: "Открыто до " + fmtMin(r[1]) };
  return { on: false, today, txt: "Сейчас закрыто" };
}

/* ====== выбор ====== */
export const q = (S: BookingState, k: string) => S.sel[k] || 0;
export const keys = (N: Niche, S: BookingState) => N.order.filter((k) => q(S, k) > 0);
export const count = (N: Niche, S: BookingState) => keys(N, S).reduce((n, k) => n + q(S, k), 0);
export function dur(N: Niche, S: BookingState) {
  if (N.fixedDur) return N.fixedDur;
  return keys(N, S).reduce((s, k) => s + (N.items[k].d ?? 0) * q(S, k), 0);
}
/** Цена услуги: у барбершопа зависит от мастера; null, если мастер её не делает или не выбран. */
export function price(N: Niche, S: BookingState, k: string): number | null {
  if (N.prov) {
    const m = provOf(N, S.mid);
    return m && m.pr[k] != null ? m.pr[k] : null;
  }
  return N.items[k].p ?? null;
}
export const total = (N: Niche, S: BookingState) => keys(N, S).reduce((s, k) => s + (price(N, S, k) || 0) * q(S, k), 0);
export const minAll = (N: Niche) => Math.min(...Object.values(N.items).map((i) => i.p ?? Infinity));
export const cutFrom = (N: Niche) => Math.min(...(N.provs ?? []).map((m) => m.pr.cut));
export const pid = (N: Niche, S: BookingState) => (N.prov ? S.mid || "t" : "x");
export const stepKey = (N: Niche, S: BookingState) => N.steps[S.step];

/** Убирает услуги, которых нет у выбранного мастера. */
export function fixSel(N: Niche, S: BookingState): BookingState {
  if (!N.prov) return S;
  const m = provOf(N, S.mid);
  if (!m) return S;
  return { ...S, sel: Object.fromEntries(Object.entries(S.sel).filter(([k]) => m.pr[k] != null)) };
}
/** Сбрасывает выбранное время, если оно больше не подходит. */
export function fixTime(N: Niche, c: Clock, S: BookingState): BookingState {
  if (S.t != null && !slotOk(N, c, pid(N, S), S.di, S.t, Math.max(dur(N, S), N.step))) return { ...S, t: null };
  return S;
}

export function navOk(N: Niche, S: BookingState) {
  const k = stepKey(N, S);
  return k === "prov" ? !!S.mid : k === "items" ? count(N, S) > 0 : k === "time" ? S.t != null : true;
}
export function navHint(N: Niche, S: BookingState) {
  if (navOk(N, S)) return "";
  const k = stepKey(N, S);
  return k === "prov" ? "Выберите мастера: у каждого свои цены и своё расписание." : k === "items" ? N.need : k === "time" ? "Выберите время, чтобы продолжить." : "";
}

export const listTxt = (N: Niche, S: BookingState) => keys(N, S).map((k) => N.items[k].n + (q(S, k) > 1 ? " × " + q(S, k) : "")).join(", ");
export function whenTxt(N: Niche, c: Clock, S: BookingState) {
  if (S.t == null) return "";
  return N.fixedDur ? dayShort(c, S.di) + ", к " + fmtT(N, S.t) : dayFull(c, S.di) + ", " + fmtT(N, S.t) + "–" + fmtMin(N.open + S.t * N.step + dur(N, S));
}

/** Заявка владельцу: сайт только открывает WhatsApp с готовым текстом, отправляет сам посетитель. */
export function waText(N: Niche, c: Clock, S: BookingState) {
  const m = N.prov ? provOf(N, S.mid) : null;
  const L = [(N.qty ? "Заказ" : "Запись") + " с сайта «" + N.brand + "», № " + S.ticket, "Имя: " + S.name, "Телефон: " + S.phone];
  if (S.car) L.push("Автомобиль: " + S.car);
  if (m) L.push("Мастер: " + m.n);
  L.push(N.sumItems + ": " + listTxt(N, S), N.sumTime + ": " + whenTxt(N, c, S), "Где: " + N.branches[0].n + ", " + N.branches[0].a, "Оплата: " + (S.pay === "cash" ? "наличными на месте" : "Kaspi"), "Итого: " + money(total(N, S)));
  return L.join("\n");
}
export function waLink(N: Niche, c: Clock, S: BookingState) {
  const num = String(N.ownerWhatsapp || "").replace(/\D/g, "");
  return "https://wa.me/" + num + "?text=" + encodeURIComponent(waText(N, c, S));
}

/**
 * Маска телефона. «+7» в начале ставит сама маска: эту семёрку отбрасываем.
 * Набранные 8 или 7 считаем кодом страны, только когда цифр стало 11,
 * иначе первая цифра номера терялась бы при наборе с клавиатуры.
 */
export function maskPhone(raw: string): { text: string; digits: number } {
  let d = raw.replace(/\D/g, "");
  if (/^\s*\+\s*7/.test(raw) || /^7 \(/.test(raw)) d = d.slice(1);
  if (d.length === 11 && (d[0] === "7" || d[0] === "8")) d = d.slice(1);
  d = d.slice(0, 10);
  const text = d ? "+7 (" + d.slice(0, 3) + (d.length > 3 ? ") " + d.slice(3, 6) : "") + (d.length > 6 ? "-" + d.slice(6, 8) : "") + (d.length > 8 ? "-" + d.slice(8, 10) : "") : "";
  return { text, digits: d.length };
}

export function validateContact(S: BookingState) {
  const e: BookingState["err"] = {};
  if (S.name.trim().length < 2) e.name = "Введите имя, хотя бы две буквы";
  if (S.phone.replace(/\D/g, "").length !== 11) e.phone = "Введите номер полностью: +7 и ещё 10 цифр";
  return e;
}

/** При переходе на шаг времени: если время не выбрано, открыть первый день, где есть окна. */
export function firstOpenDay(N: Niche, c: Clock, S: BookingState): number {
  const du = Math.max(dur(N, S), N.step);
  for (let di = S.di; di < N.nd; di++) for (let k = 0; k < slotCount(N); k++) if (slotOk(N, c, pid(N, S), di, k, du)) return di;
  return S.di;
}
