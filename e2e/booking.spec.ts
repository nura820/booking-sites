import { expect, test, type Page } from "@playwright/test";

const noHScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

/** Нажатие без ожидания окончания анимации: проверяется поведение, а не движение. */
const tap = (page: Page, sel: string) => page.locator(sel).first().click();

async function pickTime(page: Page) {
  // первый день, где есть окна, открывается сам; берём первое свободное окно
  await expect(page.locator(".slot").first()).toBeVisible();
  await tap(page, ".slot");
  await expect(page.locator(".slot.on")).toHaveCount(1);
}

async function contact(page: Page, phoneTyped: string) {
  await page.locator("#fn").fill("Асхат");
  await page.locator("#fp").pressSequentially(phoneTyped);
  await expect(page.locator("#fp")).toHaveValue("+7 (701) 123-45-67");
}

test("автосервис: запись от услуги до заявки в WhatsApp", async ({ page }) => {
  await page.goto("auto/");
  await expect(page.locator("body")).toHaveAttribute("data-n", "auto");
  await expect(page.locator("#bnext")).toBeDisabled();
  await expect(page.locator("#nhint")).toContainText("Отметьте хотя бы одну работу");

  await tap(page, '[data-svc="oil"]');
  await tap(page, '[data-svc="tire"]');
  await expect(page.locator('[data-svc="oil"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#sum .tt b")).toHaveText("27 000 ₸");
  await tap(page, '[data-svc="tire"]'); // снять отметку
  await expect(page.locator("#sum .tt b")).toHaveText("12 000 ₸");

  await page.locator("#bnext").click();
  await expect(page.locator("#panel")).toContainText("Длительность: 45 мин");
  await pickTime(page);
  await page.locator("#bnext").click();

  // пустые контакты не проходят
  await page.locator("#bnext").click();
  await expect(page.locator("#fn-e")).toContainText("Введите имя");
  await expect(page.locator("#fp-e")).toContainText("Введите номер полностью");
  await contact(page, "87011234567");
  await expect(page.locator("#fn-e")).toHaveCount(0); // ошибка снимается, как только значение верное
  await page.locator("#fc").fill("Camry 70");
  await page.locator('[data-pay="kaspi"]').click();
  await page.locator("#bnext").click();

  const okb = page.locator(".okb");
  await expect(okb).toContainText("Вы записаны");
  await expect(okb).toContainText("Замена масла и фильтра");
  await expect(okb).toContainText("12 000 ₸");
  const href = decodeURIComponent((await page.locator("#wa").getAttribute("href"))!);
  expect(href).toContain("https://wa.me/?text=Запись с сайта «Гараж 7»");
  expect(href).toContain("Имя: Асхат");
  expect(href).toContain("Телефон: +7 (701) 123-45-67");
  expect(href).toContain("Автомобиль: Camry 70");
  expect(href).toContain("Оплата: Kaspi");
  expect(href).toContain("Итого: 12 000 ₸");
  await expect(page.locator("#bnav")).toBeHidden();

  await page.locator("[data-again]").click();
  await expect(page.locator("#sum .tt b")).toHaveText("0 ₸");
  await expect(page.locator('[data-svc="oil"]')).toHaveAttribute("aria-pressed", "false");
  await noHScroll(page);
});

test("кофейня: количество и предзаказ ко времени", async ({ page }) => {
  await page.goto("coffee/");
  await tap(page, '[data-qty="cap"][data-d="1"]');
  await tap(page, '[data-qty="cap"][data-d="1"]');
  await tap(page, '[data-qty="croi"][data-d="1"]');
  await expect(page.locator("#sum")).toContainText("Капучино × 2");
  await expect(page.locator("#sum .tt b")).toHaveText("4 200 ₸");
  await tap(page, '[data-qty="cap"][data-d="-1"]');
  await expect(page.locator("#sum .tt b")).toHaveText("2 700 ₸");
  await page.locator("#bnext").click();
  await expect(page.locator("#panel")).toContainText("к какому времени приготовить заказ");
  await pickTime(page);
  await page.locator("#bnext").click();
  await expect(page.locator("#fc")).toHaveCount(0); // автомобиль спрашивает только автосервис
  await contact(page, "7011234567");
  await expect(page.locator("#bnext")).toHaveText("Оформить заказ");
  await page.locator("#bnext").click();
  await expect(page.locator(".okb")).toContainText("Заказ принят");
  expect(decodeURIComponent((await page.locator("#wa").getAttribute("href"))!)).toContain("Заказ с сайта «Крема»");
});

test("барбершоп: мастер, его цены, возврат к шагу", async ({ page }) => {
  await page.goto("barber/");
  await expect(page.locator("#steps li")).toHaveCount(4);
  await expect(page.locator("#bnext")).toBeDisabled();
  await tap(page, '[data-pick="a"]');
  await page.locator("#bnext").click();
  await expect(page.locator("#panel h3")).toContainText("мастер Арман");
  await expect(page.locator('[data-svc="shave"]')).toHaveCount(0); // Арман не бреет
  await tap(page, '[data-svc="fade"]');
  await expect(page.locator("#sum .tt b")).toHaveText("6 500 ₸");

  // назад к мастеру: у Данияра другая цена
  await page.locator('#steps [data-goto="0"]').click();
  await tap(page, '[data-pick="d"]');
  await page.locator("#bnext").click();
  await expect(page.locator("#sum .tt b")).toHaveText("5 000 ₸");
  await page.locator("#bnext").click();
  await pickTime(page);
  await page.locator("#bnext").click();
  await contact(page, "+77011234567");
  await page.locator("#bnext").click();
  await expect(page.locator(".okb")).toContainText("Данияр");
  const href = decodeURIComponent((await page.locator("#wa").getAttribute("href"))!);
  expect(href).toContain("Мастер: Данияр");
  expect(href).toContain("Услуги: Фейд");
});

test("карточка мастера на главной сразу ведёт к его услугам", async ({ page }) => {
  await page.goto("barber/");
  await page.locator('.tile[data-master="t"]').click();
  await expect(page.locator("#panel h3")).toContainText("мастер Тимур");
  await expect(page.locator("#book")).toBeInViewport();
});
