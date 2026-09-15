import { useState } from 'react';
import { ListPlus, Plus, Trash2 } from 'lucide-react';
import { BarList } from '../../components/charts';
import { Button, Callout, Empty, IconButton, Input, NumberInput, Select } from '../../components/ui';
import { LEVELING_AREAS } from '../../lib/constants';
import { leveledPrice, levelingAdjustment, negotiatedPrice, negotiationIds } from '../../lib/calc';
import { eur, eurCompact, pct, uid } from '../../lib/format';
import { useContractors } from '../../lib/store';
import type { LevelState } from '../../lib/types';
import { StepShell, shortName, useTenderUpdate, type StepProps } from './shared';

const STATES: { value: LevelState; label: string }[] = [
  { value: 'įtraukta', label: 'Įtraukta' },
  { value: 'neįtraukta', label: 'Neįtraukta' },
  { value: 'išlyga', label: 'Išlyga' },
];

const DEFAULT_ROWS: [string, string][] = [
  ['Darbų apimtis', 'Lauko inžineriniai tinklai iki sklypo ribos'],
  ['Įtraukti / neįtraukti darbai', 'Teritorijos sutvarkymas ir želdiniai'],
  ['Techninės išlygos', 'Fasado sistemos alternatyva'],
  ['Grafiko prielaidos', 'Žiemos darbų priemonės'],
  ['Papildomos rizikos', 'Geologinių sąlygų rizikos rezervas'],
];

export function Step08({ t }: StepProps) {
  const update = useTenderUpdate(t);
  const cs = useContractors();
  const nego = negotiationIds(t);
  const [area, setArea] = useState(LEVELING_AREAS[0]);
  const [desc, setDesc] = useState('');

  const addRow = (a: string, description: string) =>
    update((d) => {
      d.leveling.push({
        id: uid('lv'),
        area: a,
        description,
        cells: Object.fromEntries(nego.map((cid) => [cid, { state: 'įtraukta' as LevelState, amount: 0 }])),
      });
    });

  const setCell = (rowId: string, cid: string, patch: Partial<{ state: LevelState; amount: number }>) =>
    update((d) => {
      const row = d.leveling.find((r) => r.id === rowId)!;
      const cell = row.cells[cid] ?? { state: 'įtraukta', amount: 0 };
      Object.assign(cell, patch);
      if (patch.state === 'įtraukta') cell.amount = 0;
      row.cells[cid] = cell;
    });

  const leveled = nego.map((cid) => ({ cid, v: leveledPrice(t, cid) ?? 0 }));
  const minLeveled = Math.min(...leveled.map((x) => x.v));

  return (
    <StepShell
      t={t}
      n={8}
      blocker={!nego.length ? 'Nėra derybose dalyvaujančių rangovų' : !t.leveling.length ? 'Pridėkite bent vieną suvienodinimo eilutę' : null}
    >
      <Callout>
        Suvienodinimo matrica užtikrina, kad visi pasiūlymai būtų palyginami pagal vienodą apimtį ir sąlygas. <b>Neįtraukta</b> – pridedama
        trūkstamų darbų vertė, <b>išlyga</b> – korekcija dėl rangovo išlygos (gali būti neigiama).
      </Callout>

      {!t.leveling.length ? (
        <div className="panel panel-soft">
          <Empty
            icon={<ListPlus size={22} />}
            title="Matrica tuščia"
            text="Pradėkite nuo tipinių eilučių arba pridėkite savo."
            action={
              <Button variant="secondary" onClick={() => DEFAULT_ROWS.forEach(([a, dsc]) => addRow(a, dsc))}>
                Įkelti tipines eilutes
              </Button>
            }
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table level-table">
            <thead>
              <tr>
                <th>Sritis</th>
                {nego.map((cid) => (
                  <th key={cid}>{shortName(cs[cid]?.name ?? cid)}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {t.leveling.map((row) => (
                <tr key={row.id}>
                  <td style={{ minWidth: 220 }}>
                    <div className="cell-sub">{row.area}</div>
                    <div className="strong">{row.description}</div>
                  </td>
                  {nego.map((cid) => {
                    const cell = row.cells[cid] ?? { state: 'įtraukta', amount: 0 };
                    return (
                      <td key={cid}>
                        <div className="level-cell">
                          <Select
                            className="input-sm"
                            aria-label="Būsena"
                            options={STATES}
                            value={cell.state}
                            onChange={(e) => setCell(row.id, cid, { state: e.target.value as LevelState })}
                          />
                          {cell.state !== 'įtraukta' && (
                            <NumberInput
                              className="input-sm"
                              aria-label="Korekcija, EUR"
                              step={1000}
                              value={cell.amount}
                              onChange={(n) => setCell(row.id, cid, { amount: n })}
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td>
                    <IconButton label="Pašalinti eilutę" onClick={() => update((d) => void (d.leveling = d.leveling.filter((r) => r.id !== row.id)))}>
                      <Trash2 size={15} />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Kaina po derybų</td>
                {nego.map((cid) => (
                  <td key={cid} className="num">
                    {eur(negotiatedPrice(t, cid))}
                  </td>
                ))}
                <td />
              </tr>
              <tr>
                <td>Suvienodinimo korekcijos</td>
                {nego.map((cid) => (
                  <td key={cid} className="num">
                    {eur(levelingAdjustment(t, cid))}
                  </td>
                ))}
                <td />
              </tr>
              <tr>
                <td>Suvienodinta kaina</td>
                {leveled.map(({ cid, v }) => (
                  <td key={cid} className="num" style={{ color: v === minLeveled ? '#027a5a' : undefined }}>
                    {eur(v)}
                    {v === minLeveled && <div className="small">mažiausia</div>}
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="row gap wrap">
        <div style={{ width: 240 }}>
          <Select aria-label="Sritis" options={LEVELING_AREAS} value={area} onChange={(e) => setArea(e.target.value)} />
        </div>
        <div className="grow" style={{ minWidth: 220 }}>
          <Input placeholder="Aprašymas, pvz., Laikinieji statiniai" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <Button
          variant="secondary"
          icon={<Plus size={15} />}
          disabled={!desc.trim() || !nego.length}
          onClick={() => {
            addRow(area, desc.trim());
            setDesc('');
          }}
        >
          Pridėti eilutę
        </Button>
      </div>

      {t.leveling.length > 0 && (
        <div className="panel">
          <div className="section-title">Suvienodintos kainos</div>
          <BarList
            items={[...leveled]
              .sort((a, b) => a.v - b.v)
              .map(({ cid, v }) => ({
                id: cid,
                label: cs[cid]?.name ?? '',
                value: v,
                detail: `Korekcijos ${eur(levelingAdjustment(t, cid))} · nuo biudžeto ${pct(((v - t.budgetNet) / t.budgetNet) * 100)}`,
              }))}
            format={eurCompact}
            reference={{ value: t.budgetNet, label: 'Biudžetas' }}
          />
        </div>
      )}
    </StepShell>
  );
}
