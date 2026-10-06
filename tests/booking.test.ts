import { describe, expect, it } from "vitest";
import { NICHES } from "@/data/niches";
import { dur, fixSel, fmtDur, fresh, freeCount, makeClock, maskPhone, money, navOk, nextWin, price, slotOk, total, validateContact, waLink, waText, whenTxt, brState } from "@/lib/booking";

// понедельник, 5 октября 2026, 10:00
const clock = makeClock(new Date(2026, 9, 5, 10, 0));
const { auto, coffee, barber } = NICHES;

describe("формат", () => {
  it("деньги и длительность", () => {
    expect(money(12000)).toBe("12 000 ₸");
    expect(money(900)).toBe("900 ₸");
    expect(fmtDur(45)).toBe("45 мин");
    expect(fmtDur(90)).toBe("1 ч 30 мин");
    expect(fmtDur(120)).toBe("2 ч");
  });
});

describe("маска телефона", () => {
  const typed = (s: string) => {
    // набор по одной клавише: в поле каждый раз лежит уже отформатированный текст
    let v = "";
    for (const ch of s) v = maskPhone(v + ch).text;
    return v;
  };
  it("разные способы набора дают один номер", () => {
    for (const s of ["87011234567", "77011234567", "7011234567", "+77011234567"]) expect(typed(s)).toBe("+7 (701) 123-45-67");
  });
  it("вставка целиком", () => {
    expect(maskPhone("8 (701) 123-45-67").text).toBe("+7 (701) 123-45-67");
    expect(maskPhone("").text).toBe("");
  });
});

describe("окна", () => {
  it("сегодня нельзя записаться на прошедшее время и ближе запаса", () => {
    // автосервис: открытие 9:00, шаг 30, запас 30 минут; сейчас 10:00 → 10:00 (k=2) нельзя, 10:30 (k=3) уже по запасу можно, если не занято
    expect(slotOk(auto, clock, "x", 0, 0, 30)).toBe(false);
    expect(slotOk(auto, clock, "x", 0, 2, 30)).toBe(false);
  });
  it("услуга не выходит за закрытие", () => {
    const last = Math.floor((auto.close - auto.open) / auto.step) - 1;
    expect(slotOk(auto, clock, "x", 1, last, 180)).toBe(false);
  });
  it("в выходной филиала окон нет", () => {
    const closed = { ...barber, branches: [barber.branches[1]] }; // понедельник выходной
    expect(freeCount(closed, clock, "t", 0, 45)).toBe(0);
    expect(brState(clock, closed.branches[0]).txt).toBe("Сегодня выходной");
  });
  it("ближайшее окно существует и подходит", () => {
    const w = nextWin(auto, clock, "x", 60)!;
    expect(w).not.toBeNull();
    expect(slotOk(auto, clock, "x", w.di, w.k, 60)).toBe(true);
  });
  it("у кофейни нет занятости: свободно всё рабочее время после запаса", () => {
    expect(freeCount(coffee, clock, "x", 1, 15)).toBe((coffee.close - coffee.open) / coffee.step);
  });
});

describe("выбор и сумма", () => {
  it("автосервис: длительность и цена складываются", () => {
    const S = { ...fresh(), sel: { oil: 1, tire: 1 } };
    expect(dur(auto, S)).toBe(105);
    expect(total(auto, S)).toBe(27000);
  });
  it("кофейня: количество умножает цену, длительность фиксированная", () => {
    const S = { ...fresh(), sel: { cap: 2, croi: 1 } };
    expect(total(coffee, S)).toBe(4200);
    expect(dur(coffee, S)).toBe(15);
  });
  it("барбершоп: цена зависит от мастера, чужие услуги снимаются", () => {
    const S = { ...fresh(), mid: "t", sel: { cut: 1, kids: 1 } };
    expect(price(barber, S, "cut")).toBe(7000);
    expect(price(barber, S, "kids")).toBeNull(); // Тимур детские стрижки не делает
    expect(fixSel(barber, S).sel).toEqual({ cut: 1 });
    expect(price(barber, { ...S, mid: "d" }, "cut")).toBe(4000);
  });
  it("кнопка «Далее» закрыта, пока шаг не заполнен", () => {
    expect(navOk(barber, fresh())).toBe(false);
    expect(navOk(barber, { ...fresh(), mid: "a" })).toBe(true);
    expect(navOk(auto, fresh())).toBe(false);
    expect(navOk(auto, { ...fresh(), sel: { oil: 1 } })).toBe(true);
  });
});

describe("контакты и заявка", () => {
  it("проверка имени и телефона", () => {
    expect(validateContact({ ...fresh(), name: "А", phone: "+7 (701) 123" })).toEqual({ name: "Введите имя, хотя бы две буквы", phone: "Введите номер полностью: +7 и ещё 10 цифр" });
    expect(validateContact({ ...fresh(), name: "Асхат", phone: "+7 (701) 123-45-67" })).toEqual({});
  });
  it("текст заявки в WhatsApp", () => {
    const w = nextWin(barber, clock, "a", 60)!;
    const S = { ...fresh(), mid: "a", sel: { fade: 1 }, di: w.di, t: w.k, name: "Асхат", phone: "+7 (701) 123-45-67", ticket: 1234 };
    const text = waText(barber, clock, S);
    expect(text).toContain("Запись с сайта «Чернило», № 1234");
    expect(text).toContain("Мастер: Арман");
    expect(text).toContain("Услуги: Фейд");
    expect(text).toContain("Итого: 6 500 ₸");
    expect(text).toContain(whenTxt(barber, clock, S));
    expect(waLink(barber, clock, S).startsWith("https://wa.me/?text=")).toBe(true);
    expect(waLink({ ...barber, ownerWhatsapp: "+7 701 123-45-67" }, clock, S)).toContain("https://wa.me/77011234567?text=");
  });
});
