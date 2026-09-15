import { useState } from 'react';
import { FileText, Trophy, Wand2 } from 'lucide-react';
import { Button, Callout, Checkbox, Empty, Field, Input, StatusBadge, Textarea } from '../../components/ui';
import { CRITERIA, SELECTION_FACTORS } from '../../lib/constants';
import { evaluate } from '../../lib/calc';
import { eur, fmtDate, isoDate } from '../../lib/format';
import { useContractors } from '../../lib/store';
import type { Tender } from '../../lib/types';
import { PrintModal, StepShell, useTenderUpdate, type StepProps } from './shared';

function DecisionDoc({ t, names }: { t: Tender; names: Record<string, string> }) {
  const rows = evaluate(t);
  const w = t.selection.winnerId;
  return (
    <>
      <h2>Generalinio rangovo pasirinkimo pagrindimas</h2>
      <p>
        {t.name} ({t.code}) · {t.location}
      </p>
      <table>
        <tbody>
          <tr>
            <th style={{ width: '30%' }}>Pasirinktas rangovas</th>
            <td>{w ? names[w] : '—'}</td>
          </tr>
          <tr>
            <th>Sprendimo data</th>
            <td>{fmtDate(t.selection.decidedAt ?? isoDate())}</td>
          </tr>
          <tr>
            <th>Tvirtino</th>
            <td>{t.selection.approvedBy || t.manager}</td>
          </tr>
          <tr>
            <th>Biudžetas be PVM</th>
            <td>{eur(t.budgetNet)}</td>
          </tr>
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th>Vieta</th>
            <th>Rangovas</th>
            {CRITERIA.map((c) => (
              <th key={c.key}>
                {c.title} ({t.evaluation.weights[c.key]} %)
              </th>
            ))}
            <th>Balai</th>
            <th>Kaina be PVM</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.contractorId}>
              <td>{r.rank}</td>
              <td>{names[r.contractorId]}</td>
              {CRITERIA.map((c) => (
                <td key={c.key}>{r.scores[c.key]}</td>
              ))}
              <td>{r.total}</td>
              <td>{eur(r.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 12 }}>
        <b>Įvertinti aspektai:</b> {SELECTION_FACTORS.filter((f) => t.selection.considerations[f.key]).map((f) => f.label.toLowerCase()).join(', ')}.
      </p>
      <p style={{ marginTop: 8 }}>
        <b>Pagrindimas:</b> {t.selection.justification}
      </p>
      <div className="print-sign">
        <div>Pirkimų vadovas: {t.selection.approvedBy || t.manager}</div>
        <div>Užsakovo atstovas</div>
      </div>
    </>
  );
}

export function Step12({ t }: StepProps) {
  const update = useTenderUpdate(t);
  const cs = useContractors();
  const [doc, setDoc] = useState(false);
  const rows = evaluate(t);
  const sel = t.selection;
  const done = t.completedSteps.includes(12);
  const top = rows[0];
  const cheapest = [...rows].sort((a, b) => a.price - b.price)[0];
  const chosen = rows.find((r) => r.contractorId === sel.winnerId);
  const checked = SELECTION_FACTORS.filter((f) => sel.considerations[f.key]).length;
  const names = Object.fromEntries(Object.values(cs).map((c) => [c.id, c.name]));

  const generate = () => {
    if (!chosen) return;
    const c = cs[chosen.contractorId];
    const fo = t.finalOffers.find((o) => o.contractorId === chosen.contractorId);
    const text =
      `${c.name} surinko ${chosen.total.toLocaleString('lt-LT')} balo iš 100 ir užėmė ${chosen.rank} vietą pagal vertinimo metodiką. ` +
      (cheapest && cheapest.contractorId !== chosen.contractorId
        ? `Pasiūlymas ${eur(chosen.price - cheapest.price)} brangesnis už mažiausios kainos pasiūlymą, tačiau užtikrina geresnį bendros naudos ir rizikos santykį. `
        : 'Pasiūlymas yra ir mažiausios kainos. ') +
      `Darbų trukmė – ${fo?.durationMonths} mėn., atestacija ${fo?.certification}, patikimumas ${fo?.reliability}, sutarties pastabos ${fo?.contractRemarks}. ` +
      (fo?.risks ? `Identifikuotos rizikos: ${fo.risks.toLowerCase()}.` : '');
    update((d) => void (d.selection.justification = text));
  };

  const blocker = !rows.length
    ? 'Nėra įvertintų pasiūlymų (11 etapas)'
    : !sel.winnerId
      ? 'Pasirinkite rangovą'
      : checked < SELECTION_FACTORS.length
        ? `Įvertinkite visus sprendimo aspektus (${checked}/${SELECTION_FACTORS.length})`
        : sel.justification.trim().length < 30
          ? 'Parašykite sprendimo pagrindimą'
          : null;

  return (
    <StepShell
      t={t}
      n={12}
      blocker={blocker}
      completeLabel="Patvirtinti sprendimą"
      beforeComplete={(d) => {
        d.selection.decidedAt = isoDate();
        d.selection.approvedBy = d.selection.approvedBy || d.manager;
        d.finalOffers.forEach((o) => {
          if (o.contractorId === d.selection.winnerId) o.recommendation = 'kviesti';
        });
      }}
      actions={
        <Button size="sm" variant="secondary" icon={<FileText size={15} />} disabled={!sel.winnerId} onClick={() => setDoc(true)}>
          Sprendimo pagrindimas
        </Button>
      }
    >
      {!rows.length ? (
        <Empty title="Nėra vertinimo rezultatų" text="Atlikite vertinimą pagal metodiką." />
      ) : (
        <>
          {done && sel.winnerId && (
            <Callout tone="success" title={`Sprendimas patvirtintas ${fmtDate(sel.decidedAt)}`}>
              Pasirinktas {cs[sel.winnerId]?.name}. Pradedamas sutarties pasirašymo procesas.
            </Callout>
          )}
          <Callout title="Pasirinkimas neturi būti grindžiamas vien mažiausia kaina">
            Sprendimas vertina bendrą pasiūlymo naudą ir riziką: kainą, terminus, sutartines sąlygas, patikimumą, kvalifikaciją, rizikų valdymą,
            pilnumą ir įgyvendinimo tikimybę.
          </Callout>
          <div className="grid-3">
            {rows.map((r) => {
              const fo = t.finalOffers.find((o) => o.contractorId === r.contractorId);
              return (
                <button
                  key={r.contractorId}
                  type="button"
                  className={`winner-card ${sel.winnerId === r.contractorId ? 'is-selected' : ''}`}
                  disabled={done}
                  onClick={() => update((d) => void (d.selection.winnerId = r.contractorId))}
                >
                  <div className="row between">
                    <span className={`rank ${r.rank === 1 ? 'rank-1' : ''}`}>{r.rank}</span>
                    {sel.winnerId === r.contractorId && (
                      <span className="chip chip-ok">
                        <Trophy size={13} /> Pasirinktas
                      </span>
                    )}
                  </div>
                  <div className="strong">{cs[r.contractorId]?.name}</div>
                  <div className="row gap wrap">
                    <span className="chip">{r.total.toLocaleString('lt-LT')} b.</span>
                    <span className="chip">{eur(r.price)}</span>
                    <span className="chip">{fo?.durationMonths} mėn.</span>
                  </div>
                  {fo && <StatusBadge value={fo.recommendation} label={`Rekomendacija: ${fo.recommendation}`} />}
                </button>
              );
            })}
          </div>
          {chosen && top && chosen.contractorId !== top.contractorId && (
            <Callout tone="warning" title="Pasirinktas ne aukščiausiai įvertintas rangovas">
              Metodikos lyderis – {cs[top.contractorId]?.name}. Pagrindime būtina išsamiai paaiškinti nukrypimą.
            </Callout>
          )}
          {chosen && cheapest && chosen.contractorId !== cheapest.contractorId && (
            <Callout title="Ne mažiausios kainos pasiūlymas">
              Skirtumas nuo mažiausios kainos ({cs[cheapest.contractorId]?.name}) – {eur(chosen.price - cheapest.price)}.
            </Callout>
          )}

          <div className="layout-1-1">
            <div>
              <div className="section-title">Sprendimo aspektai</div>
              <div className="stack-sm">
                {SELECTION_FACTORS.map((f) => (
                  <Checkbox
                    key={f.key}
                    label={f.label}
                    disabled={done}
                    checked={!!sel.considerations[f.key]}
                    onChange={(v) => update((d) => void (d.selection.considerations = { ...d.selection.considerations, [f.key]: v }))}
                  />
                ))}
              </div>
            </div>
            <div className="stack">
              <Field label="Sprendimo pagrindimas">
                <Textarea
                  rows={6}
                  disabled={done}
                  value={sel.justification}
                  onChange={(e) => update((d) => void (d.selection.justification = e.target.value))}
                  placeholder="Kodėl pasirinktas šis rangovas…"
                />
              </Field>
              {!done && (
                <div>
                  <Button size="sm" variant="secondary" icon={<Wand2 size={15} />} disabled={!chosen} onClick={generate}>
                    Generuoti pagrindimą
                  </Button>
                </div>
              )}
              <Field label="Tvirtina">
                <Input
                  disabled={done}
                  value={sel.approvedBy ?? t.manager}
                  onChange={(e) => update((d) => void (d.selection.approvedBy = e.target.value))}
                />
              </Field>
            </div>
          </div>
        </>
      )}
      {doc && (
        <PrintModal title="Sprendimo pagrindimas" onClose={() => setDoc(false)}>
          <DecisionDoc t={t} names={names} />
        </PrintModal>
      )}
    </StepShell>
  );
}
