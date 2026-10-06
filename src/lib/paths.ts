const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Путь к файлу из public с учётом адреса публикации: asset("assets/x.jpg"). Внешние ссылки не меняются. */
export function asset(path: string) {
  return /^https?:/.test(path) ? path : `${BASE}/${path.replace(/^\//, "")}`;
}
