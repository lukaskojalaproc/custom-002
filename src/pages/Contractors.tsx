import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search } from 'lucide-react';
import { ContractorModal } from '../components/ContractorModal';
import { Button, Card, Checkbox, Empty, PageHeader, Select, StatusBadge } from '../components/ui';
import { PROJECT_TYPES, RELIABILITY } from '../lib/constants';
import { certificationValid, contractorStats } from '../lib/calc';
import { pct } from '../lib/format';
import { useStore } from '../lib/store';

export function Contractors() {
  const { state } = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [spec, setSpec] = useState('');
  const [rel, setRel] = useState('');
  const [validOnly, setValidOnly] = useState(false);
  const [adding, setAdding] = useState(false);

  const rows = useMemo(
    () =>
      state.contractors
        .map((c) => ({ c, s: contractorStats(state, c.id), valid: certificationValid(c) }))
        .filter(({ c }) => `${c.name} ${c.city}`.toLowerCase().includes(q.trim().toLowerCase()))
        .filter(({ c }) => !spec || c.specializations.includes(spec as never))
        .filter(({ c }) => !rel || c.reliability === rel)
        .filter(({ valid }) => !validOnly || valid)
        .sort((a, b) => b.s.invited - a.s.invited || a.c.name.localeCompare(b.c.name, 'lt')),
    [state, q, spec, rel, validOnly],
  );

  return (
    <>
      <PageHeader
        title="Rangovų bazė"
        subtitle="Nuolat pildomas generalinių rangovų sąrašas su dalyvavimo, pasiūlymų ir derybų istorija."
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setAdding(true)}>
            Pridėti rangovą
          </Button>
        }
      />
      <Card flush>
        <div className="row gap wrap" style={{ padding: '18px 20px' }}>
          <div className="search" style={{ background: '#fff', border: '1px solid var(--border)' }}>
            <Search size={16} />
            <input placeholder="Ieškoti rangovo" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div style={{ width: 210 }}>
            <Select options={[{ value: '', label: 'Visos specializacijos' }, ...PROJECT_TYPES]} value={spec} onChange={(e) => setSpec(e.target.value)} />
          </div>
          <div style={{ width: 180 }}>
            <Select
              options={[{ value: '', label: 'Visi patikimumo lygiai' }, ...RELIABILITY.map((r) => ({ value: r, label: `Patikimumas: ${r}` }))]}
              value={rel}
              onChange={(e) => setRel(e.target.value)}
            />
          </div>
          <Checkbox label="Tik galiojantis atestatas" checked={validOnly} onChange={setValidOnly} />
        </div>
        {rows.length === 0 ? (
          <Empty icon={<Building2 size={22} />} title="Rangovų nerasta" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Rangovas</th>
                  <th>Specializacija</th>
                  <th>Patikimumas</th>
                  <th>Atestacija</th>
                  <th className="num">Pakviestas</th>
                  <th className="num">Pateikė</th>
                  <th className="num">Laimėjo</th>
                  <th className="num">Vid. kainos pokytis</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ c, s, valid }) => (
                  <tr key={c.id} className="is-click" onClick={() => nav(`/rangovai/${c.id}`)}>
                    <td>
                      <div className="cell-title">{c.name}</div>
                      <div className="cell-sub">
                        {c.city} · {c.source}
                      </div>
                    </td>
                    <td>
                      <div className="row gap wrap" style={{ maxWidth: 300 }}>
                        {c.specializations.map((x) => (
                          <span key={x} className="chip">
                            {x}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <StatusBadge value={c.reliability} />
                    </td>
                    <td>{valid ? <span className="chip chip-ok">Galioja</span> : <span className="chip chip-bad">Negalioja</span>}</td>
                    <td className="num">{s.invited}</td>
                    <td className="num">{s.submitted}</td>
                    <td className="num">{s.wins}</td>
                    <td className="num">{s.avgChangePct != null ? pct(s.avgChangePct) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {adding && (
        <ContractorModal
          onClose={(saved) => {
            setAdding(false);
            if (saved) nav(`/rangovai/${saved.id}`);
          }}
        />
      )}
    </>
  );
}
