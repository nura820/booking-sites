import type { Metadata, Viewport } from "next";
import { asset } from "@/lib/paths";
import "../../studio.css";

export const metadata: Metadata = {
  title: "QSA Studio: сайт с онлайн-записью для бизнеса в Астане",
  description: "Сайт с онлайн-записью или предзаказом под ваш бизнес в Астане. Запуск 10 000–15 000 ₸, срок 2–3 дня, оплата на Kaspi после того, как сайт готов.",
  openGraph: { type: "website", title: "QSA Studio: сайт с онлайн-записью для вашего бизнеса", description: "Запуск 10 000–15 000 ₸, срок 2–3 дня. Оплата на Kaspi после того, как сайт готов." },
  formatDetection: { telephone: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#EEF0F3" };

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link href={asset("assets/fonts/fonts.css")} rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
