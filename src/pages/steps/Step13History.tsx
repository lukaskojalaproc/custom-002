import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Download } from 'lucide-react';
import { Button, Callout } from '../../components/ui';
import { DOC_TYPES, HISTORY_GOALS } from '../../lib/constants';
import { avgReductionPct, finalPrice, tenderDurationDays } from '../../lib/calc';
import { daysBetween, dec, eurCompact, fmtDate, isoDate, pct } from '../../lib/format';
import { downloadFile } from '../../lib/io';
import { logActivity, useContractors } from '../../lib/store';
import { StepShell, type StepProps } from './shared';

export function Step13({ t }: StepProps) {
  const cs = useContractors();
  const name = (id: string) => cs[id]?.name ?? id;
  const submitted = t.initialOffers.map((o) => o.contractorId);
  const notParticipated = t.participants.filter((p) => !submitted.includes(p.contractorId));
  const range = (xs: number[]) => (xs.length ? `${eurCompact(Math.min(...xs))} – ${eurCompact(Math.max(...xs))}` : '');
  const durations = t.finalOffers.map((o) => o.durationMonths);
  const responses = t.participants
    .filter((p) => p.respondedAt && t.invitation.sentAt)
    .map((p) => daysBetween(t.invitation.sentAt!, p.respondedAt!));
  const remarks = new Map<string, number>();
  t.rounds.forEach((r) => r.legal.forEach((l) => remarks.set(l.topic, (remarks.get(l.topic) ?? 0) + 1)));
  const topRemarks = [...remarks.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const openClauses = t.rounds.flatMap((r) => r.legal).filter((l) => l.status === 'atvira').length;
  const red = avgReductionPct(t);
  const duration = tenderDurationDays(t);
  const winner = t.selection.winnerId;

  const items: [string, string][] = [
    ['Dalyvavę rangovai', submitted.map(name).join(', ')],
    ['Pakviesti, bet nedalyvavę', notParticipated.map((p) => `${name(p.contractorId)} (${p.status})`).join(', ') || (t.participants.length ? 'Nėra' : '')],
    ['Pirminės kainos', range(t.initialOffers.map((o) => o.priceNet))],
    ['Finalinės kainos', range(t.finalOffers.map((o) => o.priceNet))],
    ['Kainų pokyčiai po derybų', red != null ? `vidutiniškai ${pct(red)}` : ''],
    ['Derybų ratų skaičius', t.rounds.length ? String(t.rounds.length) : ''],
    ['Dažniausios rangovų pastabos', topRemarks.join(', ')],
    ['Sutarties išlygos', t.rounds.length ? `${openClauses} liko atviros iš ${t.rounds.flatMap((r) => r.legal).length}` : ''],
    ['Techninės išlygos', t.initialOffers.length ? `${t.initialOffers.filter((o) => o.technicalReservations).length} pasiūlymuose iš ${t.initialOffers.length}` : ''],
    ['Terminų pasiūlymai', durations.length ? `${Math.min(...durations)}–${Math.max(...durations)} mėn.` : ''],
    ['Rangovų atsakymo greitis', responses.length ? `vid. ${dec(responses.reduce((a, b) => a + b, 0) / responses.length)} d. nuo kvietimo` : ''],
    ['Kvalifikacijos atitiktis', t.finalOffers.length ? `${t.finalOffers.filter((o) => o.certification === 'atitinka').length} iš ${t.finalOffers.length} atitinka` : ''],
    ['Pasirinktas rangovas', winner ? `${name(winner)} · ${eurCompact(finalPrice(t, winner) ?? 0)}` : ''],
    ['Pasirinkimo pagrindimas', t.selection.justification ? `${t.selection.justification.slice(0, 140)}${t.selection.justification.length > 140 ? '…' : ''}` : ''],
    ['Pirkimo trukmė', duration != null ? `${duration} d. (${dec(duration / 30)} mėn.)` : ''],
    ['Projekto tipas', `${t.projectType} · ${t.areaM2 ? `${t.areaM2.toLocaleString('lt-LT')} m²` : ''}`],
    ['Pirkimo dokumentų paketas', `${t.documents.filter((d) => d.status === 'paruošta').length}/${DOC_TYPES.length} dokumentų, ${t.documents.reduce((s, d) => s + d.files.length, 0)} failai`],
  ];
  const captured = items.filter(([, v]) => v).length;

  return (
    <StepShell
      t={t}
      n={13}
      blocker={!t.completedSteps.includes(12) ? 'Pirmiausia patvirtinkite rangovo pasirinkimą (12 etapas)' : null}
      completeLabel="Išsaugoti istorinėje bazėje"
      beforeComplete={(d) => {
        d.archivedAt = isoDate();
        logActivity(d, 'Duomenys išsaugoti istorinėje bazėje');
      }}
      actions={
        <Button size="sm" variant="secondary" icon={<Download size={15} />} onClick={() => downloadFile(`${t.code}-istorija.json`, JSON.stringify(t, null, 2))}>
          Eksportuoti
        </Button>
      }
    >
      {t.archivedAt && (
        <Callout tone="success" title={`Išsaugota istorinėje bazėje ${fmtDate(t.archivedAt)}`}>
          Duomenys naudojami <Link to="/analitika">istorinėje analitikoje</Link> ir <Link to="/rangovai">rangovų profiliuose</Link>.
        </Callout>
      )}
      <div className="layout-2-1">
        <div>
          <div className="section-title">
            Pirkimų duomenų branduolys
            <span className="small muted">
              Užfiksuota {captured} iš {items.length}
            </span>
          </div>
          <div>
            {items.map(([label, value]) => (
              <div key={label} className="history-item">
                {value ? <CheckCircle2 size={17} style={{ color: 'var(--primary)' }} /> : <Circle size={17} className="faint" />}
                <div className="history-label">{label}</div>
                <div className={value ? '' : 'faint'}>{value || 'Dar nėra duomenų'}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel panel-soft">
          <div className="section-title">Ką tai leidžia ateityje</div>
          <ul className="check-list">
            {HISTORY_GOALS.map((g) => (
              <li key={g}>
                <CheckCircle2 size={16} />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </StepShell>
  );
}
