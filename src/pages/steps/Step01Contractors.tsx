import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Button, Callout, Checkbox, Empty, IconButton, StatusBadge } from '../../components/ui';
import { certificationValid, contractorStats, matchScore } from '../../lib/calc';
import { logActivity, useStore } from '../../lib/store';
import { StepShell, useTenderUpdate, type StepProps } from './shared';

export function Step01({ t }: StepProps) {
  const { state } = useStore();
  const update = useTenderUpdate(t);
  const [q, setQ] = useState('');
  const [specOnly, setSpecOnly] = useState(true);
  const sent = !!t.invitation.sentAt;
  const byId = useMemo(() => Object.fromEntries(state.contractors.map((c) => [c.id, c])), [state.contractors]);

  const suggestions = useMemo(() => {
    const selected = new Set(t.participants.map((p) => p.contractorId));
    const s = q.trim().toLowerCase();
    return state.contractors
      .filter((c) => !selected.has(c.id))
      .filter((c) => !specOnly || c.specializations.includes(t.projectType))
      .filter((c) => !s || `${c.name} ${c.city}`.toLowerCase().includes(s))
      .map((c) => {
        const stats = contractorStats(state, c.id);
        return { c, stats, score: matchScore(c, t.projectType, stats), valid: certificationValid(c) };
      })
      .sort((a, b) => b.score - a.score);
  }, [state, t.participants, t.projectType, q, specOnly]);

  const invalid = t.participants.filter((p) => byId[p.contractorId] && !certificationValid(byId[p.contractorId]));

  const add = (cid: string) =>
    update((d) => {
      d.participants.push({ contractorId: cid, status: sent ? 'pakviestas' : 'atrinktas' });
      logActivity(d, `Į rangovų sąrašą įtrauktas ${byId[cid].name}`);
    });
  const remove = (cid: string) =>
    update((d) => {
      d.participants = d.participants.filter((p) => p.contractorId !== cid);
    });

  return (
    <StepShell t={t} n={1} blocker={t.participants.length < 3 ? `Įtraukite bent 3 rangovus (dabar ${t.participants.length})` : null}>
      {invalid.length > 0 && (
        <Callout tone="warning" title="Atestacijos įspėjimas">
          {invalid.map((p) => byId[p.contractorId].name).join(', ')} – atestatas nebegalioja. Prieš kviečiant pareikalaukite atnaujinto
          dokumento.
        </Callout>
      )}
      <div className="layout-1-1">
        <div>
          <div className="section-title">Pirkimo rangovų sąrašas ({t.participants.length})</div>
          {t.participants.length === 0 ? (
            <div className="panel panel-soft">
              <Empty title="Sąrašas tuščias" text="Įtraukite rangovus iš rekomenduojamų dešinėje." />
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rangovas</th>
                    <th>Statusas</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {t.participants.map((p) => {
                    const c = byId[p.contractorId];
                    if (!c) return null;
                    return (
                      <tr key={p.contractorId}>
                        <td>
                          <Link to={`/rangovai/${c.id}`} className="cell-title" style={{ color: 'var(--navy)' }}>
                            {c.name}
                          </Link>
                          <div className="cell-sub">
                            {c.city} · {c.specializations.includes(t.projectType) ? 'specializacija atitinka' : 'kita specializacija'}
                          </div>
                          <div className="row gap wrap mt-sm">
                            <StatusBadge value={c.reliability} label={`Patikimumas: ${c.reliability}`} />
                            {certificationValid(c) ? (
                              <span className="chip chip-ok">Atestatas galioja</span>
                            ) : (
                              <span className="chip chip-bad">Atestatas negalioja</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <StatusBadge value={p.status} />
                        </td>
                        <td className="text-right">
                          {!sent && (
                            <IconButton label="Pašalinti iš sąrašo" onClick={() => remove(p.contractorId)}>
                              <Trash2 size={16} />
                            </IconButton>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <div className="section-title">Rekomenduojami iš istorinės bazės</div>
          <div className="row gap wrap" style={{ marginBottom: 12 }}>
            <div className="search" style={{ background: '#fff', border: '1px solid var(--border)', width: 220 }}>
              <Search size={16} />
              <input placeholder="Ieškoti" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Checkbox label={`Tik specializacija „${t.projectType}“`} checked={specOnly} onChange={setSpecOnly} />
          </div>
          {suggestions.length === 0 && <p className="muted">Tinkamų rangovų nerasta. Išjunkite specializacijos filtrą arba pridėkite rangovą į bazę.</p>}
          {suggestions.map(({ c, stats, score, valid }) => (
            <div key={c.id} className="suggest">
              <div className="score-ring" style={{ ['--v' as string]: score }} title="Atitikimo balas">
                <span>{score}</span>
              </div>
              <div className="grow">
                <div className="strong">{c.name}</div>
                <div className="row gap wrap mt-sm">
                  <StatusBadge value={c.reliability} label={`Patikimumas: ${c.reliability}`} />
                  {valid ? <span className="chip chip-ok">Atestatas galioja</span> : <span className="chip chip-bad">Atestatas negalioja</span>}
                  {stats.invited > 0 && (
                    <span className="chip">
                      Dalyvavo {stats.submitted}/{stats.invited}
                    </span>
                  )}
                  {stats.wins > 0 && <span className="chip chip-ok">Laimėjo {stats.wins}</span>}
                </div>
              </div>
              <Button size="sm" variant="secondary" icon={<Plus size={15} />} onClick={() => add(c.id)}>
                Įtraukti
              </Button>
            </div>
          ))}
        </div>
      </div>
    </StepShell>
  );
}
