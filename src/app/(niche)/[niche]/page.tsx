import { Site } from "@/components/site/site";
import { NICHES, NICHE_IDS } from "@/data/niches";
import type { NicheId } from "@/data/types";

/** Демо, открытое сразу в одной из сфер: /barber/, /coffee/, /auto/. Вкладки остаются. */
export default async function NichePage({ params }: { params: Promise<{ niche: string }> }) {
  const { niche } = await params;
  return <Site niches={NICHE_IDS.map((id) => NICHES[id])} initial={niche as NicheId} demo />;
}
