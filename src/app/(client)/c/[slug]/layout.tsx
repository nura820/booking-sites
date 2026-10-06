import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { SiteDocument, siteMetadata, siteViewport } from "@/components/site/document";
import { CLIENTS } from "@/data/clients";
import "../../../site.css";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => CLIENTS.map((c) => ({ slug: c.slug }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const c = CLIENTS.find((x) => x.slug === slug);
  return c ? siteMetadata(c.site, false) : {};
}
export async function generateViewport({ params }: Params): Promise<Viewport> {
  const { slug } = await params;
  return siteViewport(CLIENTS.find((x) => x.slug === slug)?.site.id ?? "auto");
}

export default async function ClientLayout({ children, params }: { children: React.ReactNode } & Params) {
  const { slug } = await params;
  const c = CLIENTS.find((x) => x.slug === slug);
  if (!c) notFound();
  return <SiteDocument niche={c.site.id}>{children}</SiteDocument>;
}
