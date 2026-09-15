import { useNavigate } from 'react-router-dom';
import { ArrowRight, RefreshCw, Send, Wand2 } from 'lucide-react';
import { Button, Callout, Field, Input, Textarea, useToast } from '../../components/ui';
import { CLARIFICATION_ITEMS } from '../../lib/constants';
import { negotiationIds } from '../../lib/calc';
import { addDays, fmtDate, fmtDateShort, isoDate } from '../../lib/format';
import { completeStep, logActivity, reopenStep, useContractors } from '../../lib/store';
import type { Clarification, Tender } from '../../lib/types';
import { StepShell, useTenderUpdate, type StepProps } from './shared';

function autoFill(t: Tender): Record<string, string> {
  const round = t.rounds[t.rounds.length - 1];
  const excluded = t.leveling.filter((r) => Object.values(r.cells).some((c) => c.state === 'neįtraukta')).map((r) => r.description);
  const answered = t.questions.filter((q) => q.answer);
  const agreements = [...new Set(round.commercial.map((c) => c.agreement))].slice(0, 3);
  const agreed = round.legal.filter((l) => l.status === 'sutarta' && l.agreed);
  const agreedUnique = [...new Map(agreed.map((l) => [l.topic, l])).values()];
  return {
    scope: excluded.length ? `Į apimtį įtraukiama: ${excluded.join('; ')}.` : 'Apimtis nekeičiama – pagal pirkimo dokumentus.',
    answers: `Pridedama atnaujinta K&A lentelė: ${answered.length} atsakymai, iš jų ${answered.filter((q) => q.sentToAll).length} išsiųsti visiems dalyviams.`,
    corrections: agreements.length ? `${agreements.join('; ')}.` : 'Komercinių korekcijų nėra.',
    conditions: agreedUnique.length ? agreedUnique.map((l) => `${l.topic}: ${l.agreed}`).join(' ') : 'Taikomos sutarties projekto sąlygos.',
    assumptions: 'Kaina fiksuojama visam sutarties laikotarpiui; grafiko prielaidos – pagal derybų protokolus.',
  };
}

export function Step09({ t }: StepProps) {
  const update = useTenderUpdate(t);
  const cs = useContractors();
  const toast = useToast();
  const nav = useNavigate();
  const nego = negotiationIds(t);
  const idx = t.rounds.length - 1;
  const round = t.rounds[idx];
  const cl: Clarification = round?.clarification ?? { deadline: addDays(isoDate(), 10), items: {} };
  const sent = !!cl.sentAt;

  const patch = (fn: (c: Clarification) => void) =>
    update((d) => {
      const r = d.rounds[idx];
      const c = r.clarification ?? { deadline: cl.deadline, items: {} };
      fn(c);
      r.clarification = c;
    });

  const send = () => {
    patch((c) => void (c.sentAt = isoDate()));
    update((d) => logActivity(d, `Išsiųsta ${round.n} rato patikslinimų užklausa ${nego.length} rangovams`));
    toast(`Patikslinimų užklausa išsiųsta ${nego.length} rangovams`);
  };

  const nextRound = () => {
    const n = t.rounds.length + 1;
    update((d) => {
      d.rounds.push({ n, startedAt: isoDate(), meetingDates: {}, commercial: [], legal: [] });
      reopenStep(d, 7);
      logActivity(d, `Pradėtas ${n} derybų ratas`);
    });
    toast(`Pradėtas ${n} derybų ratas`);
    nav(`/pirkimai/${t.id}/7`);
  };

  const finish = () => {
    update((d) => {
      completeStep(d, 9);
      logActivity(d, 'Derybos baigtos, laukiama finalinių pasiūlymų');
    });
    nav(`/pirkimai/${t.id}/10`);
  };

  if (!round) {
    return (
      <StepShell t={t} n={9} blocker="Pirmiausia pradėkite derybų ratą (7 etapas)">
        <Callout tone="warning">Patikslintos sąlygos siunčiamos po derybų rato ir pasiūlymų suvienodinimo.</Callout>
      </StepShell>
    );
  }

  const filled = CLARIFICATION_ITEMS.filter((i) => cl.items[i.key]?.trim()).length;

  return (
    <StepShell
      t={t}
      n={9}
      blocker={!sent ? 'Išsiųskite patikslinimų užklausą' : null}
      completeLabel="Laukti finalinių pasiūlymų"
      actions={
        !sent && (
          <Button size="sm" variant="secondary" icon={<Wand2 size={15} />} onClick={() => patch((c) => void (c.items = { ...autoFill(t), ...Object.fromEntries(Object.entries(c.items).filter(([, v]) => v.trim())) }))}>
            Užpildyti iš derybų duomenų
          </Button>
        )
      }
    >
      <Callout>
        Derybų ratas <b>{round.n}</b> iš maksimaliai 3. Po užklausos galite pradėti kitą derybų ratą arba laukti finalinių pasiūlymų.
      </Callout>

      {sent && (
        <Callout tone="success" title={`Užklausa išsiųsta ${fmtDate(cl.sentAt)}`}>
          Atnaujintų / finalinių pasiūlymų terminas – {fmtDate(cl.deadline)}
          <div className="row gap wrap mt-sm">
            {!t.completedSteps.includes(9) && (
              <>
                <Button size="sm" icon={<ArrowRight size={15} />} onClick={finish}>
                  Laukti finalinių pasiūlymų
                </Button>
                {t.rounds.length < 3 && (
                  <Button size="sm" variant="secondary" icon={<RefreshCw size={15} />} onClick={nextRound}>
                    Pradėti {t.rounds.length + 1} derybų ratą
                  </Button>
                )}
              </>
            )}
          </div>
        </Callout>
      )}

      <div className="layout-1-1">
        <div className="stack">
          {CLARIFICATION_ITEMS.map((i) => (
            <Field key={i.key} label={i.label}>
              <Textarea
                rows={2}
                disabled={sent}
                placeholder={i.placeholder}
                value={cl.items[i.key] ?? ''}
                onChange={(e) => patch((c) => void (c.items = { ...c.items, [i.key]: e.target.value }))}
              />
            </Field>
          ))}
          <Field label="Finalinio pasiūlymo pateikimo terminas">
            <Input type="date" disabled={sent} value={cl.deadline} onChange={(e) => patch((c) => void (c.deadline = e.target.value))} />
          </Field>
          {!sent && (
            <div>
              <Button icon={<Send size={16} />} disabled={filled < 2 || !nego.length} onClick={send}>
                Siųsti užklausą ({nego.length})
              </Button>
              {filled < 2 && <span className="small muted" style={{ marginLeft: 10 }}>Užpildykite bent 2 laukus</span>}
            </div>
          )}
        </div>
        <div>
          <div className="section-title">Užklausos peržiūra</div>
          <div className="email-preview">
            <div className="email-meta">
              <div>
                <span>Kam:</span> {nego.map((id) => cs[id]?.name).join(', ')}
              </div>
              <div>
                <span>Tema:</span> {t.name}: patikslintos sąlygos ir prašymas pateikti {t.rounds.length >= 3 ? 'galutinį' : 'atnaujintą / galutinį'} pasiūlymą
              </div>
            </div>
            <div className="email-body">
              <p>Laba diena,</p>
              <p>
                Dėkojame už dalyvavimą {round.n} derybų rate. Siunčiame suvienodintas sąlygas ir prašome pateikti atnaujintą arba galutinį
                pasiūlymą iki <b>{fmtDateShort(cl.deadline)}</b>.
              </p>
              {CLARIFICATION_ITEMS.filter((i) => cl.items[i.key]?.trim()).map((i) => (
                <div key={i.key}>
                  <strong style={{ fontWeight: 500 }}>{i.label}.</strong> {cl.items[i.key]}
                </div>
              ))}
              <p>
                Pagarbiai,
                <br />
                {t.manager}
              </p>
            </div>
          </div>
        </div>
      </div>
    </StepShell>
  );
}
