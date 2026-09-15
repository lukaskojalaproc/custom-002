import { DEFAULT_WEIGHTS, PHASES, STEPS, VAT } from './constants';
import { daysBetween, isoDate } from './format';
import type { AppState, Contractor, CriterionKey, ProjectType, Tender } from './types';

export const withVat = (n: number) => Math.round(n * (1 + VAT));

export const today = () => isoDate();

export function contractorMap(contractors: Contractor[]): Record<string, Contractor> {
  return Object.fromEntries(contractors.map((c) => [c.id, c]));
}

/* ---------- step / status ---------- */

export type StepState = 'done' | 'current' | 'upcoming';

export function stepState(t: Tender, n: number): StepState {
  if (t.completedSteps.includes(n)) return 'done';
  if (t.currentStep === n) return 'current';
  return 'upcoming';
}

export function progressPct(t: Tender): number {
  return Math.round((t.completedSteps.length / STEPS.length) * 100);
}

export function phaseOf(step: number) {
  return PHASES.find((p) => p.steps.includes(step)) ?? PHASES[0];
}

export type TenderStatus = 'Ruošiamas' | 'Konkursas' | 'Derybos' | 'Sprendimas' | 'Užbaigtas';

export function tenderStatus(t: Tender): TenderStatus {
  if (t.completedSteps.includes(12)) return 'Užbaigtas';
  const phase = phaseOf(t.currentStep).key;
  if (phase === 'prep') return 'Ruošiamas';
  if (phase === 'tender') return 'Konkursas';
  if (phase === 'nego') return 'Derybos';
  return 'Sprendimas';
}

export function isActive(t: Tender) {
  return tenderStatus(t) !== 'Užbaigtas';
}

/* ---------- participants ---------- */

export const invitedIds = (t: Tender) => t.participants.map((p) => p.contractorId);

export const submittedIds = (t: Tender) => t.initialOffers.map((o) => o.contractorId);

/** Contractors that passed primary analysis and entered negotiations. */
export function negotiationIds(t: Tender): string[] {
  return t.initialOffers
    .filter((o) => {
      const a = t.analysis[o.contractorId];
      if (a && a.toNegotiation !== null) return a.toNegotiation;
      return o.status !== 'atmestinas';
    })
    .map((o) => o.contractorId);
}

/* ---------- prices ---------- */

export function initialPrice(t: Tender, cid: string): number | undefined {
  return t.initialOffers.find((o) => o.contractorId === cid)?.priceNet;
}

export function negotiatedPrice(t: Tender, cid: string): number | undefined {
  const base = initialPrice(t, cid);
  if (base == null) return undefined;
  const impact = t.rounds.flatMap((r) => r.commercial).filter((c) => c.contractorId === cid);
  return base + impact.reduce((s, c) => s + c.priceImpact, 0);
}

export function levelingAdjustment(t: Tender, cid: string): number {
  return t.leveling.reduce((s, row) => s + (row.cells[cid]?.amount ?? 0), 0);
}

export function leveledPrice(t: Tender, cid: string): number | undefined {
  const p = negotiatedPrice(t, cid);
  return p == null ? undefined : p + levelingAdjustment(t, cid);
}

export function finalPrice(t: Tender, cid: string): number | undefined {
  return t.finalOffers.find((o) => o.contractorId === cid)?.priceNet;
}

export function priceChange(t: Tender, cid: string): { abs: number; pct: number } | undefined {
  const a = initialPrice(t, cid);
  const b = finalPrice(t, cid);
  if (a == null || b == null) return undefined;
  return { abs: b - a, pct: ((b - a) / a) * 100 };
}

export function openLegalCount(t: Tender, cid: string): number {
  // Only the latest status of each topic counts.
  const latest = new Map<string, string>();
  t.rounds.forEach((r) => r.legal.filter((l) => l.contractorId === cid).forEach((l) => latest.set(l.topic, l.status)));
  return [...latest.values()].filter((s) => s === 'atvira').length;
}

/* ---------- evaluation ---------- */

export interface ScoreRow {
  contractorId: string;
  scores: Record<CriterionKey, number>;
  auto: Record<CriterionKey, number>;
  total: number;
  rank: number;
  price: number;
  adjustedPrice: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function evaluate(t: Tender): ScoreRow[] {
  const offers = t.finalOffers.filter((o) => o.recommendation !== 'atmesti');
  if (!offers.length) return [];
  const weights = t.evaluation?.weights ?? DEFAULT_WEIGHTS;
  const monthly = t.evaluation?.monthlyTimeCost ?? 0;
  const minPrice = Math.min(...offers.map((o) => o.priceNet));
  const adjusted = offers.map((o) => o.priceNet + o.durationMonths * monthly);
  const minAdj = Math.min(...adjusted);
  const minDur = Math.min(...offers.map((o) => o.durationMonths));

  const rows = offers.map((o, i) => {
    const auto: Record<CriterionKey, number> = {
      price: round1((minPrice / o.priceNet) * 10),
      timeCost: round1((minAdj / adjusted[i]) * 10),
      schedule: round1((minDur / o.durationMonths) * 10),
      contract:
        o.contractRemarks === 'panaikintos' ? 10 : round1(Math.max(3, 8 - 1.5 * openLegalCount(t, o.contractorId))),
      qualification: o.certification === 'atitinka' ? 10 : 0,
      reliability: o.reliability === 'aukštas' ? 10 : o.reliability === 'vidutinis' ? 6.5 : 3,
    };
    const ov = t.evaluation?.overrides?.[o.contractorId] ?? {};
    const scores = { ...auto, ...ov } as Record<CriterionKey, number>;
    const total = round1(
      (Object.keys(weights) as CriterionKey[]).reduce((s, k) => s + (weights[k] * (scores[k] ?? 0)) / 10, 0),
    );
    return { contractorId: o.contractorId, scores, auto, total, rank: 0, price: o.priceNet, adjustedPrice: adjusted[i] };
  });
  rows.sort((a, b) => b.total - a.total);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

/* ---------- history / contractor stats ---------- */

export function tenderDurationDays(t: Tender): number | undefined {
  if (!t.selection.decidedAt) return undefined;
  return daysBetween(t.createdAt, t.selection.decidedAt);
}

export function avgReductionPct(t: Tender): number | undefined {
  const changes = t.finalOffers.map((o) => priceChange(t, o.contractorId)?.pct).filter((x): x is number => x != null);
  if (!changes.length) return undefined;
  return changes.reduce((s, x) => s + x, 0) / changes.length;
}

export interface ContractorStats {
  invited: number;
  submitted: number;
  declined: number;
  wins: number;
  avgChangePct?: number;
  avgResponseDays?: number;
  finalists: number;
  tenders: { tender: Tender; status: string; won: boolean; initial?: number; final?: number }[];
  topRemarks: { topic: string; count: number }[];
}

export function contractorStats(state: AppState, cid: string): ContractorStats {
  const rows: ContractorStats['tenders'] = [];
  const changes: number[] = [];
  const responses: number[] = [];
  const remarks = new Map<string, number>();
  let submitted = 0;
  let declined = 0;
  let wins = 0;
  let finalists = 0;
  state.tenders.forEach((t) => {
    const p = t.participants.find((x) => x.contractorId === cid);
    if (!p || p.status === 'atrinktas') return;
    const won = t.selection.winnerId === cid && !!t.selection.decidedAt;
    if (won) wins++;
    if (p.status === 'atsisakė') declined++;
    const initial = initialPrice(t, cid);
    const final = finalPrice(t, cid);
    if (initial != null) submitted++;
    if (final != null) finalists++;
    const ch = priceChange(t, cid);
    if (ch) changes.push(ch.pct);
    if (p.respondedAt && t.invitation.sentAt) responses.push(daysBetween(t.invitation.sentAt, p.respondedAt));
    t.rounds.forEach((r) =>
      r.legal.filter((l) => l.contractorId === cid).forEach((l) => remarks.set(l.topic, (remarks.get(l.topic) ?? 0) + 1)),
    );
    rows.push({ tender: t, status: p.status, won, initial, final });
  });
  const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : undefined);
  return {
    invited: rows.length,
    submitted,
    declined,
    wins,
    finalists,
    avgChangePct: avg(changes),
    avgResponseDays: avg(responses),
    tenders: rows,
    topRemarks: [...remarks.entries()]
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
  };
}

export function certificationValid(c: Contractor): boolean {
  const now = today();
  return c.certifications.some((x) => x.name.includes('statinių statybos atestatas') && x.validUntil >= now);
}

/** Heuristic fit score (0–100) used to suggest contractors for a new tender. */
export function matchScore(c: Contractor, projectType: ProjectType, stats: ContractorStats): number {
  let s = 0;
  if (c.specializations.includes(projectType)) s += 35;
  s += c.reliability === 'aukštas' ? 25 : c.reliability === 'vidutinis' ? 15 : 5;
  if (certificationValid(c)) s += 20;
  if (stats.invited > 0) s += Math.round((stats.submitted / stats.invited) * 10);
  if (stats.wins > 0) s += 5;
  if (stats.avgChangePct != null && stats.avgChangePct < -3) s += 5;
  return Math.min(100, s);
}
