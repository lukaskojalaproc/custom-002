import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Coins, Repeat, TrendingDown, Trophy } from 'lucide-react';
import { BarList, PairedBars } from '../components/charts';
import { Card, Empty, PageHeader, Select, Stat } from '../components/ui';
import { PROJECT_TYPES } from '../lib/constants';
import { avgReductionPct, contractorStats, finalPrice, initialPrice, isActive, tenderDurationDays } from '../lib/calc';
import { eur, eurCompact, pct } from '../lib/format';
import { useStore } from '../lib/store';

export function Analytics() {
  const { state } = useStore();
  const nav = useNavigate();
  const [type, setType] = useState('');

  const done = useMemo(
    () => state.tenders.filter((t) => !isActive(t) && (!type || t.projectType === type)),
    [state.tenders, type],
  );

  const data = useMemo(() => {
    const reductions = done.map((t) => ({ t, r: avgReductionPct(t) ?? 0 }));
    const savings = done.reduce(
      (s, t) => s + t.finalOffers.reduce((a, o) => a + ((initialPrice(t, o.contractorId) ?? o.priceNet) - o.priceNet), 0),
      0,
    );
    const winnerSavings = done.reduce((s, t) => {
      const w = t.selection.winnerId;
      if (!w) return s;
      return s + ((initialPrice(t, w) ?? 0) - (finalPrice(t, w) ?? 0));
    }, 0);
    const rounds = done.length ? done.reduce((s, t) => s + t.rounds.length, 0) / done.length : 0;
    const durations = done.map(tenderDurationDays).filter((x): x is number => x != null);
    const perM2 = PROJECT_TYPES.map((pt) => {
      const list = done.filter((t) => t.projectType === pt && t.selection.winnerId && t.areaM2);
      if (!list.length) return null;
      const v = list.reduce((s, t) => s + (finalPrice(t, t.selection.winnerId!) ?? 0) / t.areaM2, 0) / list.length;
      return { id: pt, label: pt, value: Math.round(v), detail: `${list.length} pirkimai` };
    }).filter((x): x is NonNullable<typeof x> => x != null);

    const remarks = new Map<string, number>();
    done.forEach((t) => t.rounds.forEach((r) => r.legal.forEach((l) => remarks.set(l.topic, (remarks.get(l.topic) ?? 0) + 1))));

    const contractors = state.contractors
      .map((c) => ({ c, s: contractorStats(state, c.id) }))
      .filter(({ s }) => s.invited > 0)
      .sort((a, b) => b.s.wins - a.s.wins || b.s.submitted - a.s.submitted);

    return {
      reductions,
      savings,
      winnerSavings,
      rounds,
      avgDuration: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      avgReduction: reductions.length ? reductions.reduce((s, x) => s + x.r, 0) / reductions.length : 0,
      perM2,
      remarks: [...remarks.entries()].map(([k, v]) => ({ id: k, label: k, value: v })).sort((a, b) => b.value - a.value).slice(0, 7),
      contractors,
    };
  }, [done, state]);

  return (
    <>
      <PageHeader
        title="Istorinė analitika"
        subtitle="Pirkimų duomenų branduolys: kainų pokyčiai po derybų, rangovų elgsena, trukmės ir sutarčių išlygos."
        actions={
          <div style={{ width: 230 }}>
            <Select
              aria-label="Projekto tipas"
              options={[{ value: '', label: 'Visi projektų tipai' }, ...PROJECT_TYPES]}
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </div>
        }
      />

      {done.length === 0 ? (
        <Card>
          <Empty title="Užbaigtų pirkimų nėra" text="Analitika formuojama iš užbaigtų pirkimų istorinių duomenų." />
        </Card>
      ) : (
        <>
          <div className="grid-4">
            <Stat label="Užbaigti pirkimai" value={done.length} sub="istorinėje bazėje" icon={<Trophy size={18} />} />
            <Stat label="Vid. kainos pokytis po derybų" value={pct(data.avgReduction)} sub="visų finalininkų vidurkis" icon={<TrendingDown size={18} />} />
            <Stat label="Sumažinta laimėtojų kaina" value={eurCompact(data.winnerSavings)} sub={`visų finalininkų: ${eurCompact(data.savings)}`} icon={<Coins size={18} />} />
            <Stat
              label="Vid. derybų ratų / trukmė"
              value={`${data.rounds.toLocaleString('lt-LT', { maximumFractionDigits: 1 })} / ${(data.avgDuration / 30).toLocaleString('lt-LT', { maximumFractionDigits: 1 })} mėn.`}
              sub="derybų ratai / pirkimo trukmė"
              icon={<Repeat size={18} />}
            />
          </div>

          <div className="layout-1-1 mt">
            <Card title="Kainos sumažėjimas po derybų" subtitle="Vidutinis finalininkų kainos sumažėjimas, %">
              <BarList
                items={data.reductions.map(({ t, r }) => ({
                  id: t.id,
                  label: t.name,
                  value: Math.max(0, -r),
                  detail: `${t.rounds.length} derybų ratai · ${t.finalOffers.length} finalininkai`,
                }))}
                format={(n) => `${n.toLocaleString('lt-LT', { maximumFractionDigits: 1 })} %`}
              />
            </Card>
            <Card title="Laimėtojo pirminė ir finalinė kaina" subtitle="Pirkimai istorinėje bazėje">
              <PairedBars
                labels={['Pirminė kaina', 'Finalinė kaina']}
                format={eurCompact}
                items={done
                  .filter((t) => t.selection.winnerId)
                  .map((t) => ({
                    id: t.id,
                    label: t.name,
                    a: initialPrice(t, t.selection.winnerId!),
                    b: finalPrice(t, t.selection.winnerId!),
                  }))}
              />
            </Card>
            <Card title="Kaina už m² pagal projekto tipą" subtitle="Laimėtojo finalinė kaina be PVM / plotas">
              <BarList items={data.perM2} format={(n) => `${n.toLocaleString('lt-LT')} €/m²`} />
            </Card>
            <Card title="Dažniausios sutarties pastabos" subtitle="Teisinių derybų temos, kartai">
              <BarList items={data.remarks} format={(n) => String(n)} />
            </Card>
          </div>

          <Card title="Rangovų elgsena" subtitle="Dalyvavimas, derybų rezultatai ir atsakymo greitis" flush className="mt">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rangovas</th>
                    <th className="num">Pakviestas</th>
                    <th className="num">Pateikė</th>
                    <th className="num">Dalyvavimas</th>
                    <th className="num">Vid. kainos pokytis</th>
                    <th className="num">Atsakymo greitis</th>
                    <th className="num">Laimėjo</th>
                    <th>Dažniausia pastaba</th>
                  </tr>
                </thead>
                <tbody>
                  {data.contractors.map(({ c, s }) => (
                    <tr key={c.id} className="is-click" onClick={() => nav(`/rangovai/${c.id}`)}>
                      <td className="cell-title">{c.name}</td>
                      <td className="num">{s.invited}</td>
                      <td className="num">{s.submitted}</td>
                      <td className="num">{Math.round((s.submitted / s.invited) * 100)} %</td>
                      <td className="num">{s.avgChangePct != null ? pct(s.avgChangePct) : '—'}</td>
                      <td className="num">{s.avgResponseDays != null ? `${s.avgResponseDays.toLocaleString('lt-LT', { maximumFractionDigits: 1 })} d.` : '—'}</td>
                      <td className="num">{s.wins}</td>
                      <td>{s.topRemarks[0]?.topic ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Užbaigti pirkimai" flush className="mt">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pirkimas</th>
                    <th className="num">Biudžetas</th>
                    <th className="num">Laimėtojo kaina</th>
                    <th className="num">Nuo biudžeto</th>
                    <th className="num">Derybų ratai</th>
                    <th className="num">Trukmė</th>
                  </tr>
                </thead>
                <tbody>
                  {done.map((t) => {
                    const fp = t.selection.winnerId ? finalPrice(t, t.selection.winnerId) : undefined;
                    return (
                      <tr key={t.id} className="is-click" onClick={() => nav(`/pirkimai/${t.id}/13`)}>
                        <td>
                          <div className="cell-title">{t.name}</div>
                          <div className="cell-sub">
                            {t.code} · {t.projectType}
                          </div>
                        </td>
                        <td className="num">{eur(t.budgetNet)}</td>
                        <td className="num">{eur(fp)}</td>
                        <td className="num">{fp ? pct(((fp - t.budgetNet) / t.budgetNet) * 100) : '—'}</td>
                        <td className="num">{t.rounds.length}</td>
                        <td className="num">
                          <Clock size={13} className="faint" /> {tenderDurationDays(t) ?? '—'} d.
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
