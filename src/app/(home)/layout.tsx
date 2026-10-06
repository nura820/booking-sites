import { SiteDocument, siteMetadata, siteViewport } from "@/components/site/document";
import { NICHES } from "@/data/niches";
import "../site.css";

export const metadata = siteMetadata(NICHES.auto, true);
export const viewport = siteViewport("auto");

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteDocument niche="auto" personalScript>
      {children}
    </SiteDocument>
  );
}
