import { Wand2 } from 'lucide-react';
import { BarList } from '../../components/charts';
import { Button, Callout, Checkbox, Empty, Input, Segmented } from '../../components/ui';
import { ANALYSIS_CHECKS } from '../../lib/constants';
import { certificationValid } from '../../lib/calc';
import { eur, eurCompact, pct } from '../../lib/format';
import { useContractors } from '../../lib/store';
import type { AnalysisRecord, Contractor, InitialOffer, Tender } from '../../lib/types';
import { StepShell, useTenderUpdate, type StepProps } from './shared';

const SHORT: Record<string, string> = {
  onTime: 'Laiku',
  docs: 'Dokumentai',
  priceForm: 'Kainos forma',
  compliance: 'Atitiktis',
  comparable: 'Palyginama',
  reservations: 'Išlygos',
  qualification: 'Kvalifikacija',
};

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function autoChecks(t: Tender, o: InitialOffer, c: Contractor | undefined, med: number): Record<string, boolean> {
  return {
    onTime: o.receivedAt <= t.invitation.offerDeadline,
    docs: o.qualificationDocs === 'pateikti' && o.schedule === 'pateiktas',
    priceForm: o.estimate === 'pateikta',
    compliance: o.status !== 'atmestinas',
    comparable: Math.abs((o.priceNet - med) / med) < 0.15,
    reservations: !o.technicalReservations,
    qualification: o.qualificationDocs === 'pateikti' && (!c || certificationValid(c)),
  };
}

export function Step06({ t }: StepProps) {
  const update = useTenderUpdate(t);
  const cs = useContractors();
  const offers = t.initialOffers;
  const med = offers.length ? median(offers.map((o) => o.priceNet)) : 0;

  const recordOf = (o: InitialOffer): AnalysisRecord =>
    t.analysis[o.contractorId] ?? { checks: autoChecks(t, o, cs[o.contractorId], med), comment: '', toNegotiation: null };

  const edit = (cid: string, fn: (r: AnalysisRecord) => void) =>
    update((d) => {
      const o = d.initialOffers.find((x) => x.contractorId === cid)!;
      const r = d.analysis[cid] ?? { checks: autoChecks(d, o, cs[cid], med), comment: '', toNegotiation: null };
      fn(r);
      d.analysis[cid] = r;
      if (r.toNegotiation === false) o.status = 'atmestinas';
      else if (r.toNegotiation === true && o.status === 'atmestinas') o.status = 'tinkamas';
    });

  const applyAuto = () =>
    update((d) => {
      d.initialOffers.forEach((o) => {
        const checks = autoChecks(d, o, cs[o.contractorId], med);
        const critical = checks.onTime && checks.docs && checks.priceForm && checks.qualification && checks.compliance;
        d.analysis[o.contractorId] = {
          checks,
          comment: d.analysis[o.contractorId]?.comment ?? '',
          toNegotiation: critical,
        };
        if (!critical) o.status = 'atmestinas';
      });
    });

  const undecided = offers.filter((o) => recordOf(o).toNegotiation === null).length;
  const toNego = offers.filter((o) => recordOf(o).toNegotiation === true).length;
  const blocker = !offers.length
    ? 'Nėra pirminių pasiūlymų (5 etapas)'
    : undecided
      ? `Priimkite sprendimą dėl visų pasiūlymų (liko ${undecided})`
      : !toNego
        ? 'Bent vienas pasiūlymas turi būti įtrauktas į derybas'
        : null;

  return (
    <StepShell
      t={t}
      n={6}
      blocker={blocker}
      actions={
        <Button size="sm" variant="secondary" icon={<Wand2 size={15} />} disabled={!offers.length} onClick={applyAuto}>
          Automatinis įvertinimas
        </Button>
      }
    >
      {!offers.length ? (
        <Empty title="Pasiūlymų nėra" text="Pirmiausia užregistruokite pirminius pasiūlymus." />
      ) : (
        <>
          <Callout>
            Kriterijai iš anksto pažymimi automatiškai pagal užregistruotus pasiūlymo duomenis. Pirkimų komanda juos patikrina ir priima
            sprendimą, ar pasiūlymas įtraukiamas į derybas.
          </Callout>
          <ol className="small muted" style={{ margin: 0, paddingLeft: 18, columns: 2, columnGap: 32 }}>
            {ANALYSIS_CHECKS.map((c) => (
              <li key={c.key}>
                <span className="strong" style={{ color: 'var(--navy)' }}>
                  {SHORT[c.key]}
                </span>{' '}
                – {c.label.toLowerCase()}
              </li>
            ))}
          </ol>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Pasiūlymas</th>
                  {ANALYSIS_CHECKS.map((c) => (
                    <th key={c.key} title={c.label}>
                      {SHORT[c.key]}
                    </th>
                  ))}
                  <th>Sprendimas</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((o) => {
                  const r = recordOf(o);
                  const dev = ((o.priceNet - med) / med) * 100;
                  return (
                    <tr key={o.contractorId}>
                      <td style={{ minWidth: 220 }}>
                        <div className="cell-title">{cs[o.contractorId]?.name}</div>
                        <div className="cell-sub">
                          {eur(o.priceNet)} · nuo medianos {pct(dev)}
                        </div>
                        <Input
                          className="input-sm mt-sm"
                          placeholder="Komentaras"
                          value={r.comment}
                          onChange={(e) => edit(o.contractorId, (x) => void (x.comment = e.target.value))}
                        />
                      </td>
                      {ANALYSIS_CHECKS.map((c) => (
                        <td key={c.key}>
                          <Checkbox
                            label=""
                            checked={!!r.checks[c.key]}
                            onChange={(v) => edit(o.contractorId, (x) => void (x.checks = { ...x.checks, [c.key]: v }))}
                          />
                        </td>
                      ))}
                      <td>
                        <Segmented
                          size="sm"
                          options={[
                            { value: 'yes', label: 'Į derybas' },
                            { value: 'no', label: 'Atmesti' },
                          ]}
                          value={r.toNegotiation === null ? ('' as 'yes') : r.toNegotiation ? 'yes' : 'no'}
                          onChange={(v) => edit(o.contractorId, (x) => void (x.toNegotiation = v === 'yes'))}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="panel">
            <div className="section-title">
              Kainų palyginimas
              <span className="small muted">Mediana {eurCompact(med)} · pilki – atmesti</span>
            </div>
            <BarList
              items={[...offers]
                .sort((a, b) => a.priceNet - b.priceNet)
                .map((o) => ({
                  id: o.contractorId,
                  label: cs[o.contractorId]?.name ?? '',
                  value: o.priceNet,
                  detail: `Nuo biudžeto ${pct(((o.priceNet - t.budgetNet) / t.budgetNet) * 100)}`,
                  muted: recordOf(o).toNegotiation === false,
                }))}
              format={eurCompact}
              reference={{ value: t.budgetNet, label: 'Biudžetas' }}
            />
          </div>
        </>
      )}
    </StepShell>
  );
}
