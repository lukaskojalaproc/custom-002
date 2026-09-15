const eurFmt = new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const numFmt = new Intl.NumberFormat('lt-LT', { maximumFractionDigits: 0 });

export const eur = (n: number | undefined | null) => (n == null || Number.isNaN(n) ? '—' : eurFmt.format(n));

export const num = (n: number) => numFmt.format(n);

/** Decimal with Lithuanian separator, e.g. 3,4 */
export const dec = (n: number, digits = 1) => n.toLocaleString('lt-LT', { maximumFractionDigits: digits });

export function eurCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toLocaleString('lt-LT', { maximumFractionDigits: 2 })} mln. €`;
  if (abs >= 1_000) return `${(n / 1_000).toLocaleString('lt-LT', { maximumFractionDigits: 0 })} tūkst. €`;
  return eur(n);
}

export function pct(n: number, digits = 1): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toLocaleString('lt-LT', { maximumFractionDigits: digits, minimumFractionDigits: digits })} %`;
}

/** Local calendar date as YYYY-MM-DD (never via toISOString, which shifts by timezone). */
export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return isoDate(new Date(y, m - 1, d + days));
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

const MONTHS = ['saus.', 'vas.', 'kov.', 'bal.', 'geg.', 'birž.', 'liep.', 'rugp.', 'rugs.', 'spal.', 'lapkr.', 'gruod.'];

export function fmtDate(iso?: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${y} m. ${MONTHS[m - 1]} ${d} d.`;
}

export function fmtDateShort(iso?: string): string {
  if (!iso) return '—';
  return iso.slice(0, 10).replace(/-/g, '.');
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

export function fileSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toLocaleString('lt-LT', { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function initials(name: string): string {
  return name
    .replace(/UAB|„|“|"/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 9 && (mod100 < 11 || mod100 > 19)) return few;
  return many;
}
