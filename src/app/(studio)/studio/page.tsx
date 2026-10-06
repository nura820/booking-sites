/* eslint-disable @next/next/no-img-element */
import { Reveal } from "@/components/studio/reveal";
import { WHATSAPP, waUrl } from "@/data/studio";
import { asset } from "@/lib/paths";

const Wa = ({ className, children, ...rest }: { className?: string; children: React.ReactNode; "data-in"?: boolean }) => (
  <a className={className} data-wa href={waUrl()} target="_blank" rel="noopener" {...rest}>
    {children}
  </a>
);

const DEMOS = [
  { id: "auto", img: "assets/studio-demo-auto.jpg", alt: "Демо-сайт автосервиса: заголовок и кнопка записи в бокс", cap: "Автосервис: запись на услугу и время" },
  { id: "coffee", img: "assets/studio-demo-coffee.jpg", alt: "Демо-сайт кофейни: главный экран с предзаказом", cap: "Кофейня: предзаказ к приходу" },
  { id: "barber", img: "assets/studio-demo-barber.jpg", alt: "Демо-сайт барбершопа: главный экран с записью к мастеру", cap: "Барбершоп: запись к мастеру" },
];

export default function StudioPage() {
  return (
    <>
      <a className="skip" href="#main">
        Перейти к содержанию
      </a>

      <header className="top">
        <div className="wrap">
          <a className="logo" href="#main">
            QSA Studio
          </a>
          <nav className="nav" aria-label="Разделы страницы">
            <a href="#demo">Демо</a>
            <a href="#price">Цена</a>
            <a href="#how">Как это проходит</a>
            <Wa className="btn sm">Написать в WhatsApp</Wa>
          </nav>
        </div>
      </header>

      <main id="main">
        <div className="hero">
          <div className="wrap">
            <div data-in>
              <h1>Сайт с онлайн-записью для вашего бизнеса</h1>
              <p className="lead">Клиент сам выбирает услугу и время с телефона, а вы получаете заявку в WhatsApp. Для кофейни вместо записи будет предзаказ.</p>
              <div className="cta">
                <Wa className="btn">Написать в WhatsApp</Wa>
                <a className="link" href="#demo">
                  Посмотреть демо
                </a>
              </div>
            </div>
            <a className="frame" href={asset("barber/")} data-in aria-label="Открыть демо барбершопа">
              <img src={asset("assets/studio-demo-barber.jpg")} width={1280} height={800} alt="Главный экран демо-сайта барбершопа с кнопкой «Записаться»" />
            </a>
          </div>
        </div>

        <section id="demo">
          <div className="wrap">
            <h2 data-in>Три готовых примера</h2>
            <p className="sub" data-in>
              Откройте любой с телефона и пройдите запись до конца. Ваш сайт будет устроен так же, но с вашими услугами, ценами и фотографиями.
            </p>
            <div className="demos">
              {DEMOS.map((d) => (
                <a className="demo" href={asset(d.id + "/")} data-in key={d.id}>
                  <span className="frame">
                    <img src={asset(d.img)} width={1280} height={800} loading="lazy" alt={d.alt} />
                  </span>
                  <span className="cap">
                    <span>{d.cap}</span>
                    <b>Открыть</b>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="incl">
          <div className="wrap">
            <h2 data-in>Что входит</h2>
            <ul className="incl">
              <li data-in>
                <h3>Настройка под ваш бизнес</h3>
                <p>Ваши услуги, цены, мастера и часы работы. Вносим всё сами.</p>
              </li>
              <li data-in>
                <h3>Запись без звонков</h3>
                <p>Клиент выбирает услугу и свободное время сам, в любое время суток.</p>
              </li>
              <li data-in>
                <h3>Заявка в WhatsApp</h3>
                <p>После записи клиент отправляет вам готовое сообщение: имя, телефон, услуга, дата и время.</p>
              </li>
              <li data-in>
                <h3>Работает с телефона</h3>
                <p>Сайт открывается по ссылке, приложение ставить не нужно. Ссылку можно поставить в Instagram и 2ГИС.</p>
              </li>
            </ul>
          </div>
        </section>

        <section id="price">
          <div className="wrap">
            <div className="price" data-in>
              <div>
                <h2>Цена для первых клиентов</h2>
                <p className="sum">
                  <span>10 000–15 000 ₸</span>
                </p>
                <p className="sub">Разовая оплата за запуск. Ежемесячной платы нет.</p>
                <p className="honest">Студия новая. Цена низкая, потому что нам нужны первые отзывы.</p>
              </div>
              <ul className="terms">
                <li>
                  <span>Оплата</span>
                  <div>На Kaspi, после того как сайт готов и вы его посмотрели.</div>
                </li>
                <li>
                  <span>Срок</span>
                  <div>2–3 дня с момента, когда вы прислали данные.</div>
                </li>
                <li>
                  <span>Правки</span>
                  <div>Две волны правок после запуска и месяц исправлений входят в цену.</div>
                </li>
                <li>
                  <span>Адрес сайта</span>
                  <div>Без собственного домена: сайт работает по нашей ссылке.</div>
                </li>
                <li>
                  <span>Дальше</span>
                  <div>Новые цены, новый мастер или новые услуги: 2 000–3 000 ₸ за обращение.</div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="how">
          <div className="wrap">
            <h2 data-in>Как это проходит</h2>
            <ol className="steps">
              <li data-in>
                <h3>Вы пишете в WhatsApp</h3>
                <p>Присылаете услуги, цены, мастеров и часы работы. Можно просто фото прайса.</p>
              </li>
              <li data-in>
                <h3>Мы всё вносим сами</h3>
                <p>Через 2–3 дня присылаем ссылку на готовый сайт.</p>
              </li>
              <li data-in>
                <h3>Вы смотрите и правите</h3>
                <p>Говорите, что изменить. Две волны правок входят в цену.</p>
              </li>
              <li data-in>
                <h3>Оплата на Kaspi</h3>
                <p>Платите, когда сайт готов. Ещё месяц исправляем ошибки бесплатно.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className="end">
          <div className="wrap">
            <h2 data-in>Напишите, и мы покажем, как это будет у вас</h2>
            <p className="sub" data-in>
              Достаточно названия и сферы. Остальное спросим сами.
            </p>
            <Wa className="btn" data-in>
              Написать в WhatsApp
            </Wa>
            {/* Подсказка про номер нужна только пока номер не задан */}
            {!WHATSAPP ? (
              <p className="note" data-in>
                Кнопка открывает WhatsApp с готовым текстом. Отправьте его на номер, с которого вам пришла ссылка на эту страницу.
              </p>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <span>QSA Studio, Астана</span>
          <span>Сайты с онлайн-записью для малого бизнеса</span>
        </div>
      </footer>
      <Reveal />
    </>
  );
}
