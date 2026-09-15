import { RotateCcw } from 'lucide-react';
import { BarList, ScoreMeter } from '../../components/charts';
import { Badge, Button, Callout, Empty, Field, IconButton, NumberInput } from '../../components/ui';
import { CRITERIA, DEFAULT_WEIGHTS } from '../../lib/constants';
import { evaluate } from '../../lib/calc';
import { eur } from '../../lib/format';
import { useContractors } from '../../lib/store';
import type { CriterionKey } from '../../lib/types';
import { StepShell, useTenderUpdate, type StepProps } from './shared';

const FORMULAS: Record<CriterionKey, string> = {
  price: 'mažiausia kaina / rangovo kaina × 10',
  timeCost: '(kaina + trukmė × mėn. išlaidos): mažiausia / rangovo × 10',
  schedule: 'trumpiausia trukmė / rangovo trukmė × 10',
  contract: 'pastabos panaikintos = 10; likusios = 8 − 1,5 × atviros sąlygos (min. 3)',
  qualification: 'atitinka = 10; neatitinka = 0',
  reliability: 'aukštas = 10; vidutinis = 6,5; žemas = 3',
};

export function Step11({ t }: StepProps) {
  const update = useTenderUpdate(t);
  const cs = useContractors();
  const rows = evaluate(t);
  const w = t.evaluation.weights;
  const sum = (Object.values(w) as number[]).reduce((a, b) => a + b, 0);

  const setOverride = (cid: string, k: CriterionKey, v: number | undefined) =>
    update((d) => {
      const cur = { ...(d.evaluation.overrides[cid] ?? {}) };
      if (v == null) delete cur[k];
      else cur[k] = Math.max(0, Math.min(10, v));
      d.evaluation.overrides[cid] = cur;
    });

  return (
    <StepShell
      t={t}
      n={11}
      blocker={!rows.length ? 'Nėra finalinių pasiūlymų (10 etapas)' : sum !== 100 ? `Kriterijų svorių suma turi būti 100 % (dabar ${sum} %)` : null}
    >
      <div className="panel panel-soft">
        <div className="section-title">
          Vertinimo metodika
          <div className="row gap">
            <Badge tone={sum === 100 ? 'green' : 'red'}>Svorių suma: {sum} %</Badge>
            <Button size="sm" variant="ghost" icon={<RotateCcw size={14} />} onClick={() => update((d) => void (d.evaluation.weights = { ...DEFAULT_WEIGHTS }))}>
              Numatytieji
            </Button>
          </div>
        </div>
        <div className="grid-3">
          {CRITERIA.map((c) => (
            <Field key={c.key} label={`${c.title}, %`} hint={c.description}>
              <NumberInput
                value={w[c.key]}
                min={0}
                max={100}
                onChange={(n) => update((d) => void (d.evaluation.weights[c.key] = n))}
              />
            </Field>
          ))}
        </div>
        <div className="grid-3 mt">
          <Field label="Užsakovo išlaidos per mėnesį, EUR" hint="Naudojama laiko kainai: finansavimas, negautos pajamos, priežiūra">
            <NumberInput
              value={t.evaluation.monthlyTimeCost}
              step={5000}
              onChange={(n) => update((d) => void (d.evaluation.monthlyTimeCost = n))}
            />
          </Field>
        </div>
      </div>

      {!rows.length ? (
        <Empty title="Nėra ką vertinti" text="Užregistruokite finalinius pasiūlymus." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table table-compact eval-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Rangovas</th>
                  {CRITERIA.map((c) => (
                    <th key={c.key} title={FORMULAS[c.key]}>
                      {c.title}
                      <div className="faint" style={{ fontWeight: 400 }}>
                        {w[c.key]} %
                      </div>
                    </th>
                  ))}
                  <th className="num">Balai</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.contractorId} className={r.rank === 1 ? 'is-highlight' : ''}>
                    <td>
                      <span className={`rank ${r.rank === 1 ? 'rank-1' : ''}`}>{r.rank}</span>
                    </td>
                    <td style={{ minWidth: 180 }}>
                      <div className="cell-title">{cs[r.contractorId]?.name}</div>
                      <div className="cell-sub">
                        {eur(r.price)} · laiko kaina {eur(r.adjustedPrice)}
                      </div>
                    </td>
                    {CRITERIA.map((c) => {
                      const overridden = t.evaluation.overrides[r.contractorId]?.[c.key] != null;
                      return (
                        <td key={c.key}>
                          <div className="row gap" style={{ gap: 4 }}>
                            <NumberInput
                              className="input-sm"
                              style={{ width: 64 }}
                              aria-label={`${c.title} balas`}
                              min={0}
                              max={10}
                              step={0.5}
                              value={r.scores[c.key]}
                              onChange={(n) => setOverride(r.contractorId, c.key, n)}
                            />
                            {overridden && (
                              <IconButton label={`Grąžinti automatinį (${r.auto[c.key]})`} onClick={() => setOverride(r.contractorId, c.key, undefined)}>
                                <RotateCcw size={13} />
                              </IconButton>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="num">
                      <div className="strong" style={{ fontSize: 16 }}>
                        {r.total.toLocaleString('lt-LT')}
                      </div>
                      <ScoreMeter value={r.total} max={100} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Callout>
            Balai (0–10) apskaičiuojami automatiškai pagal finalinius pasiūlymus; ekspertinius vertinimus galima koreguoti rankiniu būdu.
            Užveskite pelę ant kriterijaus pavadinimo, kad pamatytumėte formulę. Bendras balas = Σ (svoris × balas) / 10, maks. 100.
          </Callout>
          <div className="panel">
            <div className="section-title">Bendras įvertinimas</div>
            <BarList
              max={100}
              items={rows.map((r) => ({
                id: r.contractorId,
                label: cs[r.contractorId]?.name ?? '',
                value: r.total,
                tag: r.rank === 1 ? '1 vieta' : undefined,
                detail: `Kaina ${eur(r.price)}`,
              }))}
              format={(n) => `${n.toLocaleString('lt-LT')} b.`}
            />
          </div>
        </>
      )}
    </StepShell>
  );
}
