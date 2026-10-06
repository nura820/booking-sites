import type { NextConfig } from "next";

// Сайт публикуется на GitHub Pages по адресу /booking-sites/. Сборка статическая: сервера нет.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/booking-sites";

const config: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default config;
