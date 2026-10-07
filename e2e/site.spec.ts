import { expect, test } from "@playwright/test";

test("вкладки переключают сферу, адрес не меняется", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("body")).toHaveAttribute("data-n", "auto");
  await page.locator('[data-tab="coffee"]').click();
  await expect(page.locator("body")).toHaveAttribute("data-n", "coffee");
  await expect(page.locator("#brand")).toHaveText("Крема");
  await expect(page.locator('[data-tab="coffee"]')).toHaveAttribute("aria-selected", "true");
  await expect(page).toHaveTitle("Крема, онлайн-запись");
  expect(new URL(page.url()).pathname).toBe("/booking-sites/");
  // пока идёт склейка, повторные нажатия не принимаются: ждём её окончания
  await expect(page.locator("#cut")).toBeHidden();
  await page.locator('[data-tab="barber"]').click();
  await expect(page.locator("h1")).toContainText("Стрижка.");
  await expect(page.locator("#rev")).toBeVisible();
  await expect(page.locator("#cut")).toBeHidden();
  await page.locator('[data-tab="auto"]').click();
  await expect(page.locator("#rev")).toHaveCount(0);
  await expect(page.locator(".tile")).toHaveCount(4);
});

test("старая ссылка ?n=barber открывает барбершоп", async ({ page }) => {
  await page.goto("./?n=barber");
  await expect(page).toHaveURL(/\/booking-sites\/barber\/$/);
  await expect(page.locator("body")).toHaveAttribute("data-n", "barber");
  await page.goto("./?n=COFFEE");
  await expect(page.locator("body")).toHaveAttribute("data-n", "coffee");
  await page.goto("./?n=nothing");
  await expect(page.locator("body")).toHaveAttribute("data-n", "auto");
});

test("именной пример: название, адрес и телефон из ссылки, без разметки", async ({ page }) => {
  const q = "b=" + encodeURIComponent("Barber House <b>x</b>") + "&a=" + encodeURIComponent("ул. Кенесары, 40") + "&t=" + encodeURIComponent("+7 701 123 45 67");
  await page.goto("./?n=barber&" + q);
  await expect(page).toHaveURL(/\/barber\/\?b=/);
  await expect(page.locator("#brand")).toHaveText("Barber House b x /b");
  await expect(page.locator("#tabs")).toHaveCount(0); // именной пример выглядит как сайт одного бизнеса
  await expect(page).toHaveTitle(/^Barber House/);
  await expect(page.locator("#foot")).toContainText("ул. Кенесары, 40");
  await expect(page.locator("#foot a.big")).toHaveAttribute("href", "tel:+77011234567");
  await expect(page.locator(".pznote")).toHaveText("Пример: услуги и цены заменим на ваши.");
  await expect(page.locator("#foot")).not.toContainText("example");
  await expect(page.locator("#brand b")).toHaveCount(0);
  // название доходит до экрана подтверждения
  await page.locator('.tile[data-master="t"]').click();
  await page.locator('[data-svc="cut"]').click();
  await page.locator("#bnext").click();
  await page.locator(".slot").first().click();
  await page.locator("#bnext").click();
  await page.locator("#fn").fill("Асхат");
  await page.locator("#fp").fill("87011234567");
  await page.locator("#bnext").click();
  expect(decodeURIComponent((await page.locator("#wa").getAttribute("href"))!)).toContain("«Barber House b x /b»");
});

test("сайт клиента: одна сфера, без вкладок и пометок «демо»", async ({ page }) => {
  await page.goto("c/primer/");
  await expect(page.locator("body")).toHaveAttribute("data-n", "barber");
  await expect(page.locator("#brand")).toHaveText("Образец");
  await expect(page.locator("#tabs")).toHaveCount(0);
  await expect(page.locator("#rev")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Демо");
  await expect(page.locator("body")).not.toContainText("вымышлен");
  await expect(page.locator(".tile")).toHaveCount(3);
});

test("страница студии: демо по ссылкам, кнопка WhatsApp", async ({ page }) => {
  await page.goto("studio/");
  await expect(page.locator("h1")).toHaveText("Сайт с онлайн-записью для вашего бизнеса");
  await expect(page.locator("[data-wa]").first()).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/);
  await page.locator(".demo").nth(1).click();
  await expect(page).toHaveURL(/\/coffee\/$/);
  await expect(page.locator("body")).toHaveAttribute("data-n", "coffee");
});

test("нет горизонтальной прокрутки и ошибок в консоли", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
  for (const url of ["./", "coffee/", "barber/", "c/primer/", "studio/"]) {
    await page.goto(url);
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), url).toBeLessThanOrEqual(0);
  }
  expect(errors).toEqual([]);
});

test("сайт ничего не отправляет: нет запросов наружу, кроме запасных фото", async ({ page }) => {
  const foreign: string[] = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.hostname !== "localhost" && !/unsplash\.com|cloudinary\.com/.test(u.hostname) && u.protocol !== "data:") foreign.push(r.url());
    if (r.method() !== "GET") foreign.push(r.method() + " " + r.url());
  });
  await page.goto("barber/");
  await page.locator('.tile[data-master="t"]').click();
  await page.locator('[data-svc="cut"]').click();
  await page.locator("#bnext").click();
  await page.locator(".slot").first().click();
  await page.locator("#bnext").click();
  await page.locator("#fn").fill("Асхат");
  await page.locator("#fp").fill("87011234567");
  await page.locator("#bnext").click();
  await expect(page.locator(".okb")).toBeVisible();
  expect(foreign).toEqual([]);
});

// задача 17: на широком экране текст первого экрана барбершопа и кофейни стоит рядом с фото, а не на нём
for (const [w, h] of [[1440, 900], [1671, 795], [1100, 800]] as const) {
  test(`первый экран ${w}×${h}: текст не заходит на фото, общая левая линия`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: w, height: h });
    // границы блока и самих строк заголовка (по тексту, а не по блоку на всю колонку)
    const rects = () =>
      page.evaluate(() => {
        const box = (s: string) => document.querySelector(s)!.getBoundingClientRect();
        const lines = [...document.querySelectorAll("h1 .ln>span")].map((e) => {
          const r = document.createRange();
          r.selectNodeContents(e);
          return r.getBoundingClientRect();
        });
        return {
          media: [box(".media").left, box(".media").right],
          kick: box(".kick").left,
          sub: box(".sub").left,
          facts: box(".facts").left,
          left: Math.min(...lines.map((l) => l.left)),
          right: Math.max(...lines.map((l) => l.right)),
          lefts: lines.map((l) => l.left),
        };
      });

    await page.goto("./barber/");
    const b = await rects();
    // фото слева, текст правее с отступом
    expect(b.left).toBeGreaterThanOrEqual(b.media[1] + 16);
    for (const x of [...b.lefts, b.kick, b.sub, b.facts]) expect(Math.abs(x - b.left)).toBeLessThanOrEqual(2);

    await page.goto("./coffee/");
    const c = await rects();
    // фото справа, текст левее
    expect(c.right).toBeLessThanOrEqual(c.media[0] - 16);
  });
}

// задача 9: на телефоне первый экран по высоте равен содержимому, пустых тёмных полос нет
for (const [w, h] of [[390, 844], [375, 667]] as const) {
  test(`первый экран ${w}×${h}: высота по содержимому, без пустой полосы`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: w, height: h });
    for (const n of ["auto", "coffee", "barber"]) {
      await page.goto(`./${n}/`);
      const m = await page.evaluate(() => {
        const box = (s: string) => document.querySelector(s)!.getBoundingClientRect();
        return {
          minH: getComputedStyle(document.querySelector(".hero")!).minHeight,
          hero: box(".hero").bottom,
          facts: box(".facts").bottom,
          hact: box(".hact").bottom,
          factsTop: box(".facts").top,
          media: box(".media").bottom,
          kick: box(".kick").top,
          scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      expect(m.minH, n).toMatch(/^(0px|auto)$/);
      // под последним блоком только нижний отступ секции
      expect(m.hero - m.facts, n).toBeLessThanOrEqual(40);
      // между кнопками и цифрами нет провала
      expect(m.factsTop - m.hact, n).toBeLessThanOrEqual(44);
      expect(m.scroll, n).toBe(0);
      // автосервис: подпись и заголовок лежат на затемнённом низу кадра, а не под пустой полосой
      if (n === "auto") expect(m.media - m.kick).toBeGreaterThanOrEqual(w * 0.2);
    }
  });
}
