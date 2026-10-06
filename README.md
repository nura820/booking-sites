# Сайты с онлайн-записью (QSA Studio)

Демо на три сферы (автосервис, кофейня, барбершоп), страница студии и сайты клиентов. Посетитель выбирает услугу и время и отправляет готовую заявку владельцу в WhatsApp. Сайт сам никуда ничего не отправляет.

- Демо: https://nura820.github.io/booking-sites/ (сразу в сфере: `/barber/`, `/coffee/`, `/auto/`)
- Студия: https://nura820.github.io/booking-sites/studio/
- Правила работы: [CLAUDE.md](CLAUDE.md). Очередь задач: [TASKS.md](TASKS.md).

## Именной пример для потенциального клиента

    https://nura820.github.io/booking-sites/barber/?b=Название&a=Адрес&t=+7 701 123 45 67

Все параметры необязательны. Услуги, цены и мастера остаются демонстрационными. В ссылку ставить только публичные данные бизнеса.

## Сайт клиента

Добавьте запись в `src/data/clients.ts` (в файле есть пошаговая инструкция и образец). Страница появится по адресу `/c/<slug>/` после слияния в `main`.

## Запуск и проверки

    npm install
    npm run dev                 # разработка: http://localhost:3000/booking-sites/
    npm run build && npm run preview   # собранный сайт, как на GitHub Pages: http://localhost:4173/booking-sites/
    npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e

Публикация: при каждом изменении `main` workflow `pages.yml` проходит проверки и выкладывает сайт на GitHub Pages (в настройках репозитория источник Pages должен быть «GitHub Actions»).
