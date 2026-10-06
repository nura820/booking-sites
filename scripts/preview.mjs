// Локальный просмотр собранного сайта так же, как на GitHub Pages: http://localhost:4173/booking-sites/
// Запуск: npm run build && npm run preview
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/booking-sites";
const PORT = Number(process.env.PORT ?? 4173);
const ROOT = join(process.cwd(), "out");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".ico": "image/x-icon" };

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (!url.pathname.startsWith(BASE)) {
    res.writeHead(302, { Location: BASE + "/" }).end();
    return;
  }
  let file = normalize(join(ROOT, decodeURIComponent(url.pathname.slice(BASE.length))));
  if (!file.startsWith(ROOT)) return void res.writeHead(403).end();
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream", "Accept-Ranges": "none" }).end(body);
  } catch {
    const body = await readFile(join(ROOT, "404.html")).catch(() => "404");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" }).end(body);
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}${BASE}/`));
