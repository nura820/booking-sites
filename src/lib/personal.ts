import type { Niche } from "@/data/types";

/**
 * Именной пример для потенциального клиента: ?b=<название>&a=<адрес>&t=<телефон>.
 * В параметры попадают только публичные данные бизнеса. Значения показываются как текст,
 * обрезаются до 60 знаков; ссылки и разметка из них не получаются.
 */
export interface Personal {
  brand?: string;
  address?: string;
  phone?: string;
}

const MAX = 60;

function clean(v: string | null): string | undefined {
  if (!v) return undefined;
  // управляющие символы и угловые скобки убираются, пробелы схлопываются
  const t = v.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX).trim();
  return t || undefined;
}

function cleanPhone(v: string | null): string | undefined {
  const t = clean(v);
  if (!t) return undefined;
  const p = t.replace(/[^\d+()\- ]/g, "").trim().slice(0, 20);
  return p.replace(/\D/g, "").length >= 10 ? p : undefined;
}

export function readPersonal(search: string): Personal | null {
  let q: URLSearchParams;
  try {
    q = new URLSearchParams(search);
  } catch {
    return null;
  }
  const p: Personal = { brand: clean(q.get("b")), address: clean(q.get("a")), phone: cleanPhone(q.get("t")) };
  return p.brand || p.address || p.phone ? p : null;
}

export function personalize(N: Niche, p: Personal): Niche {
  const [first, ...rest] = N.branches;
  return {
    ...N,
    brand: p.brand ?? N.brand,
    phone: p.phone ?? N.phone,
    // вымышленная почта и второй филиал демо в именном примере не показываются
    email: p.brand || p.phone ? "" : N.email,
    branches: p.address ? [{ ...first, a: p.address }] : p.brand ? [first] : [first, ...rest],
  };
}
