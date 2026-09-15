import { useNavigate } from 'react-router-dom';
import { Link2, Send } from 'lucide-react';
import { Button, Callout, Field, Input, Select, StatusBadge, Textarea, useToast } from '../../components/ui';
import { DOC_TYPES, MANAGERS } from '../../lib/constants';
import { fmtDate, fmtDateShort, isoDate } from '../../lib/format';
import { completeStep, logActivity, useContractors } from '../../lib/store';
import type { ParticipationStatus } from '../../lib/types';
import { StepShell, useTenderUpdate, type StepProps } from './shared';

const RESPONSES: { value: ParticipationStatus; label: string }[] = [
  { value: 'pakviestas', label: 'Pakviestas' },
  { value: 'patvirtino', label: 'Patvirtino dalyvavimą' },
  { value: 'atsisakė', label: 'Atsisakė' },
  { value: 'pateikė', label: 'Pateikė pasiūlymą' },
];

export function Step03({ t }: StepProps) {
  const update = useTenderUpdate(t);
  const cs = useContractors();
  const toast = useToast();
  const nav = useNavigate();
  const sent = !!t.invitation.sentAt;
  const inv = t.invitation;
  const readyDocs = t.documents.filter((d) => d.status === 'paruošta').length;
  const deadlineError = inv.questionsDeadline >= inv.offerDeadline ? 'Klausimų terminas turi būti ankstesnis nei pasiūlymų terminas' : null;
  const link = `https://app.procfly.com/konkursai/${t.code.toLowerCase()}`;
  const managers = Array.from(new Set([t.manager, ...MANAGERS]));

  const send = () => {
    update((d) => {
      d.invitation.sentAt = isoDate();
      d.participants.forEach((p) => {
        if (p.status === 'atrinktas') p.status = 'pakviestas';
      });
      completeStep(d, 3);
      logActivity(d, `Kvietimas išsiųstas ${d.participants.length} rangovams`);
    });
    toast(`Kvietimas išsiųstas ${t.participants.length} rangovams`);
    nav(`/pirkimai/${t.id}/4`);
  };

  const setResponse = (cid: string, status: ParticipationStatus) =>
    update((d) => {
      const p = d.participants.find((x) => x.contractorId === cid)!;
      p.status = status;
      p.respondedAt = status === 'pakviestas' ? undefined : p.respondedAt ?? isoDate();
    });

  const blocker = !t.participants.length
    ? 'Rangovų sąrašas tuščias (1 etapas)'
    : deadlineError
      ? deadlineError
      : !sent
        ? 'Išsiųskite kvietimą rangovams'
        : null;

  return (
    <StepShell t={t} n={3} blocker={blocker}>
      {!sent && readyDocs < DOC_TYPES.length && (
        <Callout tone="warning" title="Dokumentų paketas nepilnas">
          Paruošta {readyDocs} iš {DOC_TYPES.length} dokumentų. Rekomenduojama kvietimą siųsti tik su pilnu paketu.
        </Callout>
      )}
      {sent && (
        <Callout tone="success" title={`Kvietimas išsiųstas ${fmtDate(inv.sentAt)}`}>
          Klausimai priimami iki {fmtDate(inv.questionsDeadline)} · rangovų atsakymus stebėkite žemiau
        </Callout>
      )}

      <div className="layout-1-1">
        <div className="stack">
          <div className="section-title">Sistemoje fiksuojama</div>
          <div className="table-wrap">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Duomenų laukas</th>
                  <th>Reikšmė</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Pirkimo pavadinimas</td>
                  <td className="strong">{t.name}</td>
                </tr>
                <tr>
                  <td>Pirkimo tipas</td>
                  <td>Generalinė ranga</td>
                </tr>
                <tr>
                  <td>Išsiuntimo data</td>
                  <td>{sent ? fmtDate(inv.sentAt) : <span className="muted">Dar neišsiųsta</span>}</td>
                </tr>
                <tr>
                  <td>Dalyviai</td>
                  <td>
                    <div className="row gap wrap">
                      {t.participants.map((p) => (
                        <span key={p.contractorId} className="chip">
                          {cs[p.contractorId]?.name}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Dokumentų paketas</td>
                  <td>
                    {readyDocs} / {DOC_TYPES.length} dokumentų · {t.documents.reduce((s, d) => s + d.files.length, 0)} failai
                  </td>
                </tr>
                <tr>
                  <td>Pasiūlymo terminas</td>
                  <td>
                    {sent ? (
                      fmtDate(inv.offerDeadline)
                    ) : (
                      <Input
                        type="date"
                        className="input-sm"
                        value={inv.offerDeadline}
                        onChange={(e) => update((d) => void (d.invitation.offerDeadline = e.target.value))}
                      />
                    )}
                  </td>
                </tr>
                <tr>
                  <td>Klausimų terminas</td>
                  <td>
                    {sent ? (
                      fmtDate(inv.questionsDeadline)
                    ) : (
                      <Input
                        type="date"
                        className="input-sm"
                        value={inv.questionsDeadline}
                        aria-invalid={!!deadlineError}
                        onChange={(e) => update((d) => void (d.invitation.questionsDeadline = e.target.value))}
                      />
                    )}
                  </td>
                </tr>
                <tr>
                  <td>Atsakingas pirkimų vadovas</td>
                  <td>
                    {sent ? (
                      t.manager
                    ) : (
                      <Select className="input-sm" options={managers} value={t.manager} onChange={(e) => update((d) => void (d.manager = e.target.value))} />
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {!sent && (
            <Field label="Kvietimo tekstas">
              <Textarea rows={4} value={inv.message} onChange={(e) => update((d) => void (d.invitation.message = e.target.value))} />
            </Field>
          )}
          {!sent && (
            <div>
              <Button icon={<Send size={16} />} disabled={!t.participants.length || !!deadlineError} onClick={send}>
                Siųsti kvietimą ({t.participants.length})
              </Button>
            </div>
          )}
        </div>

        <div className="stack">
          <div className="section-title">Kvietimo peržiūra</div>
          <div className="email-preview">
            <div className="email-meta">
              <div>
                <span>Kam:</span> {t.participants.map((p) => cs[p.contractorId]?.email).join(', ') || '—'}
              </div>
              <div>
                <span>Tema:</span> Kvietimas dalyvauti generalinės rangos konkurse – {t.name}
              </div>
            </div>
            <div className="email-body">
              <p>Laba diena,</p>
              <p>{inv.message}</p>
              <div>
                <strong style={{ fontWeight: 500 }}>Projektas:</strong> {t.name}, {t.location}. {t.description}
              </div>
              <ul>
                <li>Pirkimo tipas: generalinė ranga</li>
                <li>Klausimų pateikimo terminas: {fmtDateShort(inv.questionsDeadline)}</li>
                <li>Pasiūlymų pateikimo terminas: {fmtDateShort(inv.offerDeadline)}</li>
                <li>Vertinimas pagal 6 kriterijų metodiką, derybų ratai: 1–3</li>
              </ul>
              <span className="email-link">
                <Link2 size={15} /> Atsisiųsti pirkimo dokumentaciją
              </span>
              <span className="small faint">{link}</span>
              <p>
                Pagarbiai,
                <br />
                {t.manager}, pirkimų vadovas
              </p>
            </div>
          </div>

          {sent && (
            <>
              <div className="section-title">Rangovų atsakymai</div>
              <div className="table-wrap">
                <table className="table table-compact">
                  <tbody>
                    {t.participants.map((p) => (
                      <tr key={p.contractorId}>
                        <td>
                          <div className="strong">{cs[p.contractorId]?.name}</div>
                          <div className="cell-sub">{p.respondedAt ? `Atsakė ${fmtDateShort(p.respondedAt)}` : 'Laukiama atsakymo'}</div>
                        </td>
                        <td style={{ width: 200 }}>
                          {p.status === 'pateikė' ? (
                            <StatusBadge value="pateikė" label="Pateikė pasiūlymą" />
                          ) : (
                            <Select
                              className="input-sm"
                              aria-label="Atsakymas"
                              options={RESPONSES.filter((r) => r.value !== 'pateikė')}
                              value={p.status}
                              onChange={(e) => setResponse(p.contractorId, e.target.value as ParticipationStatus)}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </StepShell>
  );
}
