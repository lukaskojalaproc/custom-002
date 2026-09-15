import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarClock, Clock, FileStack, TrendingDown, Wallet } from 'lucide-react';
import { Badge, Card, Empty, PageHeader, Progress, Stat, StatusBadge } from '../components/ui';
import { PHASES, STEPS } from '../lib/constants';
import { avgReductionPct, isActive, openLegalCount, progressPct, tenderDurationDays, tenderStatus, today } from '../lib/calc';
import { daysBetween, eurCompact, fmtDate, fmtDateShort, pct } from '../lib/format';
import { useStore } from '../lib/store';
import type { Tender } from '../lib/types';

interface Deadline {
  tender: Tender;
  label: string;
  date: string;
  step: number;
}

function deadlinesOf(t: Tender): Deadline[] {
  const out: Deadline[] = [];
  const now = today();
  if (t.invitation.sentAt && !t.completedSteps.includes(4) && t.invitation.questionsDeadline >= now)
    out.push({ tender: t, label: 'Klausimų terminas', date: t.invitation.questionsDeadline, step: 4 });
  if (t.invitation.sentAt && !t.completedSteps.includes(5) && t.invitation.offerDeadline >= now)
    out.push({ tender: t, label: 'Pirminių pasiūlymų terminas', date: t.invitation.offerDeadline, step: 5 });
  const last = t.rounds[t.rounds.length - 1];
  if (last?.clarification?.sentAt && !t.completedSteps.includes(10) && last.clarification.deadline >= now)
    out.push({ tender: t, label: 'Finalinių pasiūlymų terminas', date: last.clarification.deadline, step: 10 });
  return out;
}

function tasksOf(t: Tender): { text: string; step: number }[] {
  const tasks: { text: string; step: number }[] = [];
  const s = t.currentStep;
  if (s === 1 && t.participants.length < 3) tasks.push({ text: 'Sudarykite rangovų sąrašą (min. 3)', step: 1 });
  if (s === 2) {
    const missing = t.documents.filter((d) => d.status !== 'paruošta').length;
    if (missing) tasks.push({ text: `Paruoškite ${missing} pirkimo dokumentus`, step: 2 });
  }
  if (s === 3) tasks.push({ text: 'Išsiųskite kvietimą rangovams', step: 3 });
  const unanswered = t.questions.filter((q) => !q.answer).length;
  if (unanswered && !t.completedSteps.includes(4)) tasks.push({ text: `Atsakykite į ${unanswered} rangovų klausimus`, step: 4 });
  if (s === 7) {
    const open = t.participants.reduce((n, p) => n + openLegalCount(t, p.contractorId), 0);
    if (open) tasks.push({ text: `${open} atviros teisinės sąlygos derybose`, step: 7 });
  }
  if (s >= 8 && s <= 12 && !t.completedSteps.includes(s)) tasks.push({ text: `Tęskite etapą „${STEPS[s - 1].title}“`, step: s });
  return tasks;
}

export function Dashboard() {
  const { state } = useStore();
  const nav = useNavigate();
  const active = state.tenders.filter(isActive);
  const done = state.tenders.filter((t) => !isActive(t));

  const kpi = useMemo(() => {
    const reductions = done.map(avgReductionPct).filter((x): x is number => x != null);
    const durations = done.map(tenderDurationDays).filter((x): x is number => x != null);
    return {
      budget: active.reduce((s, t) => s + t.budgetNet, 0),
      reduction: reductions.length ? reductions.reduce((a, b) => a + b, 0) / reductions.length : 0,
      duration: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
    };
  }, [active, done]);

  const deadlines = active
    .flatMap(deadlinesOf)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 6);
  const tasks = active.flatMap((t) => tasksOf(t).map((x) => ({ ...x, tender: t })));
  const activity = state.tenders
    .flatMap((t) => t.activity.map((a) => ({ ...a, tender: t })))
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 8);
  const firstName = state.user?.name.split(' ')[0] ?? '';

  return (
    <>
      <PageHeader title={`Labas, ${firstName}`} subtitle={`${fmtDate(today())} · generalinės rangos pirkimų apžvalga`} />

      <div className="grid-4">
        <Stat label="Aktyvūs pirkimai" value={active.length} sub={`${done.length} užbaigti`} icon={<FileStack size={18} />} />
        <Stat label="Aktyvių pirkimų biudžetas" value={eurCompact(kpi.budget)} sub="be PVM" icon={<Wallet size={18} />} />
        <Stat
          label="Vid. kainos pokytis po derybų"
          value={pct(kpi.reduction)}
          sub="užbaigtų pirkimų vidurkis"
          icon={<TrendingDown size={18} />}
        />
        <Stat
          label="Vid. pirkimo trukmė"
          value={`${(kpi.duration / 30).toLocaleString('lt-LT', { maximumFractionDigits: 1 })} mėn.`}
          sub="nuo sukūrimo iki sprendimo"
          icon={<Clock size={18} />}
        />
      </div>

      <div className="layout-2-1 mt">
        <Card title="Aktyvūs pirkimai" subtitle="Eiga pagal 13 etapų algoritmą" flush>
          {active.length === 0 ? (
            <Empty title="Aktyvių pirkimų nėra" text="Sukurkite naują pirkimą viršuje." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pirkimas</th>
                    <th>Etapas</th>
                    <th style={{ width: 160 }}>Eiga</th>
                    <th>Statusas</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((t) => (
                    <tr key={t.id} className="is-click" onClick={() => nav(`/pirkimai/${t.id}`)}>
                      <td>
                        <div className="cell-title">{t.name}</div>
                        <div className="cell-sub">
                          {t.code} · {t.projectType} · {eurCompact(t.budgetNet)}
                        </div>
                      </td>
                      <td>
                        <div className="nowrap">
                          {t.currentStep}. {STEPS[t.currentStep - 1].short}
                        </div>
                        <div className="cell-sub">{t.manager}</div>
                      </td>
                      <td>
                        <Progress value={progressPct(t)} />
                        <div className="cell-sub mt-sm">{t.completedSteps.length} / 13 etapų</div>
                      </td>
                      <td>
                        <StatusBadge value={tenderStatus(t)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Artėjantys terminai">
          {deadlines.length === 0 ? (
            <p className="muted">Artimiausių terminų nėra.</p>
          ) : (
            <div className="list">
              {deadlines.map((d, i) => {
                const left = daysBetween(today(), d.date);
                return (
                  <div key={i} className="list-item is-click" onClick={() => nav(`/pirkimai/${d.tender.id}/${d.step}`)}>
                    <CalendarClock size={18} className="faint" />
                    <div className="grow">
                      <div className="strong">{d.label}</div>
                      <div className="small muted">{d.tender.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="small num">{fmtDateShort(d.date)}</div>
                      <Badge tone={left <= 7 ? 'amber' : 'gray'}>{left === 0 ? 'Šiandien' : `po ${left} d.`}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid-3 mt">
        <Card title="Laukia jūsų veiksmų">
          {tasks.length === 0 ? (
            <p className="muted">Visi veiksmai atlikti.</p>
          ) : (
            <div className="list">
              {tasks.map((x, i) => (
                <div key={i} className="list-item is-click" onClick={() => nav(`/pirkimai/${x.tender.id}/${x.step}`)}>
                  <AlertCircle size={18} style={{ color: 'var(--amber)' }} />
                  <div className="grow">
                    <div>{x.text}</div>
                    <div className="small muted">{x.tender.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Pirkimai pagal fazę">
          <div className="list">
            {PHASES.map((p) => {
              const list = active.filter((t) => p.steps.includes(t.currentStep));
              return (
                <div key={p.key} className="list-item">
                  <div className="grow">
                    <div className="strong">{p.title}</div>
                    <div className="small muted">
                      {p.steps[0]}–{p.steps[p.steps.length - 1]} etapai
                    </div>
                  </div>
                  <div className="mini-stat-value">{list.length}</div>
                </div>
              );
            })}
            <div className="list-item">
              <div className="grow">
                <div className="strong">Užbaigti</div>
                <div className="small muted">Istorinė bazė</div>
              </div>
              <div className="mini-stat-value">{done.length}</div>
            </div>
          </div>
        </Card>

        <Card title="Paskutiniai veiksmai">
          <div className="timeline">
            {activity.map((a, i) => (
              <div key={i} className="timeline-item">
                <span className="dot" />
                <div>
                  <div>{a.text}</div>
                  <div className="small muted">
                    {a.tender.name} · {fmtDateShort(a.at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
