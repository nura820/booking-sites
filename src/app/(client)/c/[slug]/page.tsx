import { notFound } from "next/navigation";
import { Site } from "@/components/site/site";
import { CLIENTS } from "@/data/clients";

/** Сайт одного клиента: одна сфера, без вкладок и без пометок «демо». */
export default async function ClientPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = CLIENTS.find((x) => x.slug === slug);
  if (!c) notFound();
  return <Site niches={[c.site]} initial={c.site.id} demo={false} />;
}
