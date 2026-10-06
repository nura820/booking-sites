import { Site } from "@/components/site/site";
import { NICHES, NICHE_IDS } from "@/data/niches";

/* Старые ссылки вида ?n=barber: до отрисовки переводим на страницу сферы, остальные параметры сохраняются. */
const REDIRECT = `try{var q=new URLSearchParams(location.search),n=(q.get('n')||'').toLowerCase();if(${JSON.stringify(NICHE_IDS)}.indexOf(n)>=0){q.delete('n');var s=q.toString();document.documentElement.style.visibility='hidden';location.replace(location.pathname.replace(/\\/?$/,'/')+n+'/'+(s?'?'+s:'')+location.hash)}}catch(e){}`;

export default function Home() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: REDIRECT }} />
      <Site niches={NICHE_IDS.map((id) => NICHES[id])} initial="auto" demo />
    </>
  );
}
