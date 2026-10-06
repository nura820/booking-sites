import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { SiteDocument, siteMetadata, siteViewport } from "@/components/site/document";
import { NICHES, NICHE_IDS } from "@/data/niches";
import type { NicheId } from "@/data/types";
import "../../site.css";

type Params = { params: Promise<{ niche: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => NICHE_IDS.map((niche) => ({ niche }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const n = NICHES[(await params).niche as NicheId];
  return n ? { ...siteMetadata(n, true), title: `${n.brand}, онлайн-запись` } : {};
}
export async function generateViewport({ params }: Params): Promise<Viewport> {
  return siteViewport((await params).niche);
}

export default async function NicheLayout({ children, params }: { children: React.ReactNode } & Params) {
  const { niche } = await params;
  if (!NICHES[niche as NicheId]) notFound();
  return (
    <SiteDocument niche={niche} personalScript>
      {children}
    </SiteDocument>
  );
}
