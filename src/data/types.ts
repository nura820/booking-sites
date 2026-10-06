/** Данные одной точки (сферы). Всё, что видит посетитель, берётся отсюда. */

export type NicheId = "auto" | "coffee" | "barber";
export type StepKey = "prov" | "items" | "time" | "contact";

/** Часы на день недели (0 = воскресенье): [открытие, закрытие] в минутах от полуночи или null для выходного. */
export type WeekHours = Record<0 | 1 | 2 | 3 | 4 | 5 | 6, [number, number] | null>;

/** Картинка: [файл в assets, запасная ссылка]. */
export type Img = [string, string];

export interface Item {
  /** название */
  n: string;
  /** описание */
  t: string;
  /** длительность в минутах (у кофейни нет) */
  d?: number;
  /** цена в тенге (у барбершопа цены у мастеров) */
  p?: number;
  img?: Img;
}

export interface Provider {
  id: string;
  n: string;
  /** роль, одна строка */
  r: string;
  rate: string;
  rev: number;
  /** услуга с пометкой «Чаще берут» */
  pop: string;
  img: Img;
  /** цены мастера по услугам; услуги без цены мастер не делает */
  pr: Record<string, number>;
}

export interface Branch {
  n: string;
  a: string;
  /** часы работы словами, для подвала */
  h: string;
  s: WeekHours;
}

export interface Review {
  n: string;
  m: string;
  d: string;
  t: string;
}

export interface Niche {
  id: NicheId;
  tab: string;
  brand: string;
  kick: string;
  h1: string[];
  sub: string;
  cta: string;
  cta2: string;
  go: string;
  facts: [string, string][];
  media: { type: "video" | "img"; src: string; poster?: string; fb: string; tag: string };
  tilesH: string;
  tilesP: string;
  bookH: string;
  bookP: string;
  /** есть выбор мастера */
  prov: boolean;
  /** количество позиций (кофейня) */
  qty: boolean;
  open: number;
  close: number;
  step: number;
  /** на сколько дней вперёд идёт запись */
  nd: number;
  /** за сколько минут до визита закрывается окно */
  lead: number;
  /** фиксированная длительность заказа, 0 если считается по услугам */
  fixedDur: number;
  /** показывать ли демонстрационную занятость окон */
  hasBusy: boolean;
  /** спрашивать автомобиль */
  car?: boolean;
  steps: StepKey[];
  names: Partial<Record<StepKey, string>>;
  itemsLead: string;
  sumItems: string;
  sumTime: string;
  cash: string;
  done: string;
  no: string;
  /** подсказка, когда на шаге услуг ничего не выбрано */
  need: string;
  items: Record<string, Item>;
  order: string[];
  cats: { n: string; k: string[] }[];
  feat?: string[];
  pop?: Record<string, 1>;
  provs?: Provider[];
  revH?: string;
  revP?: string;
  rev?: { avg: string; items: Review[] };
  branches: Branch[];
  phone: string;
  /** номер WhatsApp владельца: только цифры с кодом страны. Пусто: посетитель сам выбирает чат. */
  ownerWhatsapp: string;
  email: string;
  /** ссылки на соцсети; в демо подставляются заглушки */
  social?: { instagram?: string; telegram?: string; twoGis?: string };
  /** цвета шторок при смене сферы */
  cut: [string, string];
}
