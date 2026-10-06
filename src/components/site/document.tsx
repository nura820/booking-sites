import type { Metadata, Viewport } from "next";
import type { Niche } from "@/data/types";
import { asset } from "@/lib/paths";

/** Общий каркас страницы сайта записи. Цвета сферы включает атрибут data-n на body. */
export function SiteDocument({ niche, children, personalScript }: { niche: string; children: React.ReactNode; personalScript?: boolean }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        {/* Шрифты лежат в репозитории (public/assets/fonts), сайт не зависит от чужих серверов */}
        <link href={asset("assets/fonts/fonts.css")} rel="stylesheet" />
        {personalScript ? (
          // прячет демо-название, если в ссылке передано своё, чтобы оно не мелькало до подстановки
          <script dangerouslySetInnerHTML={{ __html: "try{if(/[?&](b|a|t)=/.test(location.search))document.documentElement.classList.add('pz')}catch(e){}" }} />
        ) : null}
      </head>
      <body data-n={niche} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

const THEME: Record<string, string> = { auto: "#0e1011", coffee: "#F1EADC", barber: "#12100e" };

export function siteMetadata(n: Niche, demo: boolean): Metadata {
  const title = demo ? "Онлайн-запись: автосервис, кофейня, барбершоп" : `${n.brand}, онлайн-запись`;
  const description = demo
    ? "Запись в автосервис, предзаказ кофе и запись к барберу онлайн: выберите услугу, время и оставьте телефон. Оплата на месте."
    : `${n.kick}. ${n.sub}`;
  return {
    title,
    description,
    openGraph: { type: "website", title, description: demo ? "Выберите услугу и время, оставьте телефон. Оплата на месте." : n.sub },
    formatDetection: { telephone: false },
    robots: demo ? undefined : { index: true, follow: true },
  };
}

export const siteViewport = (niche: string): Viewport => ({ width: "device-width", initialScale: 1, themeColor: THEME[niche] ?? "#111111" });
