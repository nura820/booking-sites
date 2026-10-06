import { describe, expect, it } from "vitest";
import { NICHES } from "@/data/niches";
import { personalize, readPersonal } from "@/lib/personal";

describe("именной пример", () => {
  it("без параметров ничего не меняется", () => {
    expect(readPersonal("")).toBeNull();
    expect(readPersonal("?n=barber")).toBeNull();
  });
  it("название, адрес и телефон подставляются", () => {
    const p = readPersonal("?n=barber&b=" + encodeURIComponent("Barber House") + "&a=" + encodeURIComponent("ул. Кенесары, 40") + "&t=" + encodeURIComponent("+7 701 123 45 67"))!;
    const N = personalize(NICHES.barber, p);
    expect(N.brand).toBe("Barber House");
    expect(N.branches).toHaveLength(1);
    expect(N.branches[0].a).toBe("ул. Кенесары, 40");
    expect(N.phone).toBe("+7 701 123 45 67");
    expect(N.email).toBe("");
    expect(N.items).toBe(NICHES.barber.items); // услуги и цены остаются демонстрационными
  });
  it("длина ограничена 60 знаками, разметка и ссылки не проходят", () => {
    const p = readPersonal("?b=" + encodeURIComponent("<script>alert(1)</script>" + "я".repeat(100)))!;
    expect(p.brand!.length).toBeLessThanOrEqual(60);
    expect(p.brand).not.toMatch(/[<>]/);
    expect(readPersonal("?t=" + encodeURIComponent("javascript:alert(1)"))).toBeNull();
    expect(readPersonal("?t=" + encodeURIComponent("https://evil.example/77011234567"))!.phone).toBe("77011234567");
  });
});
