import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { PairedBars } from '../../components/charts';
import { Button, Field, Input, Modal, NumberInput, Select, StatusBadge, Textarea, useToast } from '../../components/ui';
import { RELIABILITY } from '../../lib/constants';
import { certificationValid, initialPrice, leveledPrice, negotiationIds, openLegalCount, priceChange } from '../../lib/calc';
import { eur, eurCompact, isoDate, pct } from '../../lib/format';
import { logActivity, useContractors } from '../../lib/store';
import type { FinalOffer, Reliability, Tender } from '../../lib/types';
import { MiniStat, StepShell, useTenderUpdate, type StepProps } from './shared';

function FinalModal({ t, cid, onClose }: { t: Tender; cid: string; onClose: () => void }) {
  const update = useTenderUpdate(t);
  const cs = useContractors();
  const toast = useToast();
  const c = cs[cid];
  const existing = t.finalOffers.find((o) => o.contractorId === cid);
  const [o, setO] = useState<FinalOffer>(
    () =>
      existing ?? {
        contractorId: cid,
        receivedAt: isoDate(),
        priceNet: Math.round((leveledPrice(t, cid) ?? 0) / 1000) * 1000,
        durationMonths: t.initialOffers.find((x) => x.contractorId === cid)?.durationMonths ?? 18,
        contractRemarks: openLegalCount(t, cid) ? 'likusios' : 'panaikintos',
        risks: '',
        certification: c && certificationValid(c) ? 'atitinka' : 'neatitinka',
        reliability: c?.reliability ?? 'vidutinis',
        recommendation: 'svarstyti',
      },
  );
  const set = <K extends keyof FinalOffer>(k: K, v: FinalOffer[K]) => setO((x) => ({ ...x, [k]: v }));
  const init = initialPrice(t, cid) ?? 0;

  return (
    <Modal
      title={c?.name ?? 'Finalinis pasiūlymas'}
      subtitle="Finalinis pasiūlymas – galutinis rangovo įsipareigojimas pagal suvienodintas sąlygas"
      onClose={onClose}
      width={720}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Atšaukti
          </Button>
          <Button
            disabled={o.priceNet <= 0}
            onClick={() => {
              update((d) => {
                const i = d.finalOffers.findIndex((x) => x.contractorId === cid);
                if (i >= 0) d.finalOffers[i] = o;
                else d.finalOffers.push(o);
                if (!existing) logActivity(d, `Gautas ${c?.name} finalinis pasiūlymas`);
              });
              toast(existing ? 'Finalinis pasiūlymas atnaujintas' : 'Finalinis pasiūlymas užregistruotas');
              onClose();
            }}
          >
            Išsaugoti
          </Button>
        </>
      }
    >
      <div className="grid-2">
        <Field label="Finalinė kaina, EUR be PVM" hint={`Suvienodinta kaina: ${eur(leveledPrice(t, cid))}`}>
          <NumberInput value={o.priceNet} step={10000} onChange={(n) => set('priceNet', n)} />
        </Field>
        <Field label="Kainos pokytis nuo pirminio">
          <Input disabled value={init ? `${eur(o.priceNet - init)} (${pct(((o.priceNet - init) / init) * 100)})` : '—'} />
        </Field>
        <Field label="Finalus terminas, mėn.">
          <NumberInput value={o.durationMonths} min={1} onChange={(n) => set('durationMonths', n)} />
        </Field>
        <Field label="Gavimo data">
          <Input type="date" value={o.receivedAt} onChange={(e) => set('receivedAt', e.target.value)} />
        </Field>
        <Field label="Sutarties pastabos" hint={`Atvirų teisinių sąlygų: ${openLegalCount(t, cid)}`}>
          <Select
            options={['likusios', 'panaikintos']}
            value={o.contractRemarks}
            onChange={(e) => set('contractRemarks', e.target.value as FinalOffer['contractRemarks'])}
          />
        </Field>
        <Field label="Atestacija">
          <Select options={['atitinka', 'neatitinka']} value={o.certification} onChange={(e) => set('certification', e.target.value as FinalOffer['certification'])} />
        </Field>
        <Field label="Patikimumo vertinimas">
          <Select options={RELIABILITY} value={o.reliability} onChange={(e) => set('reliability', e.target.value as Reliability)} />
        </Field>
        <Field label="Rekomendacija">
          <Select
            options={['kviesti', 'svarstyti', 'atmesti']}
            value={o.recommendation}
            onChange={(e) => set('recommendation', e.target.value as FinalOffer['recommendation'])}
          />
        </Field>
        <Field label="Rizikos" className="span-2" hint="Identifikuotos rangovo arba užsakovo rizikos">
          <Textarea rows={2} value={o.risks} onChange={(e) => set('risks', e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

export function Step10({ t }: StepProps) {
  const cs = useContractors();
  const [editing, setEditing] = useState<string | null>(null);
  const nego = negotiationIds(t);
  const changes = t.finalOffers.map((o) => priceChange(t, o.contractorId)?.pct).filter((x): x is number => x != null);
  const missing = nego.filter((id) => !t.finalOffers.some((o) => o.contractorId === id)).length;

  return (
    <StepShell
      t={t}
      n={10}
      blocker={!nego.length ? 'Nėra derybose dalyvavusių rangovų' : missing ? `Užregistruokite visų finalininkų pasiūlymus (liko ${missing})` : null}
    >
      <div className="mini-stats">
        <MiniStat label="Gauta finalinių" value={`${t.finalOffers.length} / ${nego.length}`} />
        <MiniStat label="Vid. kainos pokytis" value={changes.length ? pct(changes.reduce((a, b) => a + b, 0) / changes.length) : '—'} />
        <MiniStat label="Mažiausia finalinė" value={t.finalOffers.length ? eurCompact(Math.min(...t.finalOffers.map((o) => o.priceNet))) : '—'} />
        <MiniStat label="Derybų ratų" value={t.rounds.length} />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Rangovas</th>
              <th className="num">Finalinė kaina</th>
              <th className="num">Kainos pokytis</th>
              <th className="num">Terminas</th>
              <th>Sutarties pastabos</th>
              <th>Rizikos</th>
              <th>Atestacija</th>
              <th>Patikimumas</th>
              <th>Rekomendacija</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {nego.map((id) => {
              const o = t.finalOffers.find((x) => x.contractorId === id);
              const ch = priceChange(t, id);
              return (
                <tr key={id}>
                  <td className="cell-title nowrap">{cs[id]?.name}</td>
                  {o ? (
                    <>
                      <td className="num strong">{eur(o.priceNet)}</td>
                      <td className={`num ${ch && ch.abs < 0 ? 'text-green' : ''}`}>
                        {ch ? (
                          <>
                            {eur(ch.abs)}
                            <div className="small">{pct(ch.pct)}</div>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="num">{o.durationMonths} mėn.</td>
                      <td>
                        <StatusBadge value={o.contractRemarks} />
                      </td>
                      <td style={{ minWidth: 180 }} className="small">
                        {o.risks || '—'}
                      </td>
                      <td>
                        <StatusBadge value={o.certification} />
                      </td>
                      <td>
                        <StatusBadge value={o.reliability} />
                      </td>
                      <td>
                        <StatusBadge value={o.recommendation} />
                      </td>
                      <td>
                        <Button size="sm" variant="ghost" icon={<Pencil size={14} />} onClick={() => setEditing(id)}>
                          Redaguoti
                        </Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td colSpan={8} className="muted">
                        Laukiama finalinio pasiūlymo · suvienodinta kaina {eur(leveledPrice(t, id))}
                      </td>
                      <td>
                        <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => setEditing(id)}>
                          Registruoti
                        </Button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {t.finalOffers.length > 0 && (
        <div className="panel">
          <div className="section-title">Pirminė ir finalinė kaina</div>
          <PairedBars
            labels={['Pirminė kaina', 'Finalinė kaina']}
            format={eurCompact}
            items={nego.map((id) => ({
              id,
              label: cs[id]?.name ?? id,
              a: initialPrice(t, id),
              b: t.finalOffers.find((o) => o.contractorId === id)?.priceNet,
            }))}
          />
        </div>
      )}
      {editing && <FinalModal t={t} cid={editing} onClose={() => setEditing(null)} />}
    </StepShell>
  );
}
