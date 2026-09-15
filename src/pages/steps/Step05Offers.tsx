import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { BarList } from '../../components/charts';
import { Button, Field, Input, Modal, NumberInput, Segmented, Select, StatusBadge, Textarea, useToast } from '../../components/ui';
import { withVat } from '../../lib/calc';
import { eur, eurCompact, fmtDateShort, isoDate, pct } from '../../lib/format';
import { logActivity, useContractors } from '../../lib/store';
import type { EstimateStatus, InitialOffer, OfferStatus, Tender } from '../../lib/types';
import { MiniStat, StepShell, useTenderUpdate, type StepProps } from './shared';

const yesNo = [
  { value: 'yes', label: 'Yra' },
  { value: 'no', label: 'Nėra' },
];

function OfferModal({ t, cid, onClose }: { t: Tender; cid: string; onClose: () => void }) {
  const update = useTenderUpdate(t);
  const cs = useContractors();
  const toast = useToast();
  const existing = t.initialOffers.find((o) => o.contractorId === cid);
  const [o, setO] = useState<InitialOffer>(
    () =>
      existing ?? {
        contractorId: cid,
        receivedAt: isoDate(),
        priceNet: 0,
        durationMonths: 18,
        estimate: 'pateikta',
        schedule: 'pateiktas',
        contractRemarks: false,
        technicalReservations: false,
        qualificationDocs: 'pateikti',
        status: 'tinkamas',
        notes: '',
      },
  );
  const set = <K extends keyof InitialOffer>(k: K, v: InitialOffer[K]) => setO((x) => ({ ...x, [k]: v }));

  const save = () => {
    update((d) => {
      const i = d.initialOffers.findIndex((x) => x.contractorId === cid);
      if (i >= 0) d.initialOffers[i] = o;
      else d.initialOffers.push(o);
      const p = d.participants.find((x) => x.contractorId === cid);
      if (p) {
        p.status = 'pateikė';
        p.respondedAt = p.respondedAt ?? o.receivedAt;
      }
      if (!existing) logActivity(d, `Gautas ${cs[cid]?.name} pirminis pasiūlymas`);
    });
    toast(existing ? 'Pasiūlymas atnaujintas' : 'Pasiūlymas užregistruotas');
    onClose();
  };

  const removeOffer = () => {
    update((d) => {
      d.initialOffers = d.initialOffers.filter((x) => x.contractorId !== cid);
      delete d.analysis[cid];
      const p = d.participants.find((x) => x.contractorId === cid);
      if (p) p.status = 'patvirtino';
    });
    onClose();
  };

  return (
    <Modal
      title={cs[cid]?.name ?? 'Pasiūlymas'}
      subtitle="Pirminis pasiūlymas"
      onClose={onClose}
      width={760}
      footer={
        <>
          {existing && (
            <Button variant="danger" icon={<Trash2 size={15} />} onClick={removeOffer} style={{ marginRight: 'auto' }}>
              Pašalinti
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Atšaukti
          </Button>
          <Button disabled={o.priceNet <= 0} onClick={save}>
            Išsaugoti
          </Button>
        </>
      }
    >
      <div className="grid-2">
        <Field label="Pasiūlymo gavimo data">
          <Input type="date" value={o.receivedAt} onChange={(e) => set('receivedAt', e.target.value)} />
        </Field>
        <Field label="Darbų trukmė, mėn.">
          <NumberInput value={o.durationMonths} min={1} onChange={(n) => set('durationMonths', n)} />
        </Field>
        <Field label="Bendra kaina, EUR be PVM" required>
          <NumberInput value={o.priceNet || undefined} step={10000} onChange={(n) => set('priceNet', n)} />
        </Field>
        <Field label="Su PVM (21 %)">
          <Input value={o.priceNet ? eur(withVat(o.priceNet)) : '—'} disabled />
        </Field>
        <Field label="Užpildytos sąmatos statusas">
          <Select options={['pateikta', 'nepateikta', 'nepilna']} value={o.estimate} onChange={(e) => set('estimate', e.target.value as EstimateStatus)} />
        </Field>
        <Field label="Grafiko statusas">
          <Select options={['pateiktas', 'nepateiktas']} value={o.schedule} onChange={(e) => set('schedule', e.target.value as InitialOffer['schedule'])} />
        </Field>
        <div className="field">
          <span className="field-label">Sutarties pastabos</span>
          <Segmented options={yesNo} value={o.contractRemarks ? 'yes' : 'no'} onChange={(v) => set('contractRemarks', v === 'yes')} />
        </div>
        <div className="field">
          <span className="field-label">Techninės išlygos</span>
          <Segmented options={yesNo} value={o.technicalReservations ? 'yes' : 'no'} onChange={(v) => set('technicalReservations', v === 'yes')} />
        </div>
        <Field label="Kvalifikacijos dokumentai">
          <Select
            options={['pateikti', 'trūksta']}
            value={o.qualificationDocs}
            onChange={(e) => set('qualificationDocs', e.target.value as InitialOffer['qualificationDocs'])}
          />
        </Field>
        <Field label="Pasiūlymo statusas">
          <Select options={['tinkamas', 'tikslintinas', 'atmestinas']} value={o.status} onChange={(e) => set('status', e.target.value as OfferStatus)} />
        </Field>
        <Field label="Pastabos" className="span-2">
          <Textarea rows={2} value={o.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

export function Step05({ t }: StepProps) {
  const cs = useContractors();
  const [editing, setEditing] = useState<string | null>(null);
  const eligible = t.participants.filter((p) => p.status !== 'atsisakė' && p.status !== 'atrinktas');
  const offers = t.initialOffers;
  const prices = offers.map((o) => o.priceNet);
  const min = prices.length ? Math.min(...prices) : 0;
  const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  return (
    <StepShell t={t} n={5} blocker={offers.length < 2 ? `Užregistruokite bent 2 pasiūlymus (dabar ${offers.length})` : null}>
      <div className="mini-stats">
        <MiniStat label="Gauta pasiūlymų" value={`${offers.length} / ${eligible.length}`} />
        <MiniStat label="Mažiausia kaina" value={offers.length ? eurCompact(min) : '—'} />
        <MiniStat label="Vidutinė kaina" value={offers.length ? eurCompact(avg) : '—'} />
        <MiniStat label="Vidurkis nuo biudžeto" value={offers.length ? pct(((avg - t.budgetNet) / t.budgetNet) * 100) : '—'} />
      </div>

      <div className="table-wrap">
        <table className="table table-compact">
          <thead>
            <tr>
              <th>Rangovas</th>
              <th>Gauta</th>
              <th className="num">Kaina be PVM</th>
              <th className="num">Su PVM</th>
              <th>Sąmata</th>
              <th>Grafikas</th>
              <th>Sutarties pastabos</th>
              <th>Tech. išlygos</th>
              <th>Kvalifikacija</th>
              <th>Statusas</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {eligible.map((p) => {
              const o = offers.find((x) => x.contractorId === p.contractorId);
              const late = o && o.receivedAt > t.invitation.offerDeadline;
              return (
                <tr key={p.contractorId}>
                  <td>
                    <div className="cell-title nowrap">{cs[p.contractorId]?.name}</div>
                    {o && <div className="cell-sub">{o.durationMonths} mėn. trukmė</div>}
                  </td>
                  {o ? (
                    <>
                      <td className="num">
                        {fmtDateShort(o.receivedAt)}
                        {late && (
                          <div>
                            <span className="chip chip-bad">Pavėluota</span>
                          </div>
                        )}
                      </td>
                      <td className="num strong">{eur(o.priceNet)}</td>
                      <td className="num">{eur(withVat(o.priceNet))}</td>
                      <td>
                        <StatusBadge value={o.estimate} />
                      </td>
                      <td>
                        <StatusBadge value={o.schedule} />
                      </td>
                      <td>{o.contractRemarks ? <span className="chip chip-warn">Yra</span> : <span className="chip">Nėra</span>}</td>
                      <td>{o.technicalReservations ? <span className="chip chip-warn">Yra</span> : <span className="chip">Nėra</span>}</td>
                      <td>
                        <StatusBadge value={o.qualificationDocs} />
                      </td>
                      <td>
                        <StatusBadge value={o.status} />
                      </td>
                      <td>
                        <Button size="sm" variant="ghost" icon={<Pencil size={14} />} onClick={() => setEditing(p.contractorId)}>
                          Redaguoti
                        </Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td colSpan={9} className="muted">
                        Pasiūlymas dar negautas · terminas {fmtDateShort(t.invitation.offerDeadline)}
                      </td>
                      <td>
                        <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => setEditing(p.contractorId)}>
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

      {offers.length > 0 && (
        <div className="panel">
          <div className="section-title">Pirminių kainų palyginimas su biudžetu</div>
          <BarList
            items={[...offers]
              .sort((a, b) => a.priceNet - b.priceNet)
              .map((o) => ({
                id: o.contractorId,
                label: cs[o.contractorId]?.name ?? '',
                value: o.priceNet,
                detail: `Nuo biudžeto ${pct(((o.priceNet - t.budgetNet) / t.budgetNet) * 100)}`,
                muted: o.status === 'atmestinas',
              }))}
            format={eurCompact}
            reference={{ value: t.budgetNet, label: 'Biudžetas' }}
          />
        </div>
      )}
      {editing && <OfferModal t={t} cid={editing} onClose={() => setEditing(null)} />}
    </StepShell>
  );
}
