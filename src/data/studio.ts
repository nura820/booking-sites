/* Настройки страницы студии.
   WHATSAPP: номер студии только цифрами, например '77011234567'.
   Пока пусто, кнопка открывает WhatsApp без номера, и посетитель сам выбирает чат. */
export const WHATSAPP = "";
export const WA_TEXT = "Здравствуйте! Хочу сайт с онлайн-записью для своего бизнеса. Сфера: ";

export const waUrl = () => "https://wa.me/" + WHATSAPP.replace(/\D/g, "") + "?text=" + encodeURIComponent(WA_TEXT);
