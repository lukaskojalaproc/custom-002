import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileStack, Plus, Search } from 'lucide-react';
import { NewTenderModal } from '../components/NewTenderModal';
import { Button, Card, Empty, PageHeader, Progress, Select, StatusBadge, Tabs } from '../components/ui';
import { PROJECT_TYPES, STEPS } from '../lib/constants';
import { isActive, progressPct, tenderStatus } from '../lib/calc';
import { eur, fmtDateShort } from '../lib/format';
import { useStore } from '../lib/store';

type Filter = 'all' | 'active' | 'done';

export function Tenders() {
  const { state } = useStore();
  const nav = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [creating, setCreating] = useState(false);

  const list = useMemo(
    () =>
      state.tenders
        .filter((t) => (filter === 'all' ? true : filter === 'active' ? isActive(t) : !isActive(t)))
        .filter((t) => !type || t.projectType === type)
        .filter((t) => `${t.name} ${t.code} ${t.location}`.toLowerCase().includes(q.trim().toLowerCase()))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [state.tenders, filter, q, type],
  );

  const counts = {
    all: state.tenders.length,
    active: state.tenders.filter(isActive).length,
    done: state.tenders.filter((t) => !isActive(t)).length,
  };

  return (
    <>
      <PageHeader
        title="Pirkimai"
        subtitle="Visi generalinės rangos konkursai – nuo pasiruošimo iki istorinių duomenų."
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setCreating(true)}>
            Naujas pirkimas
          </Button>
        }
      />
      <Card flush>
        <div style={{ padding: '16px 20px 0' }}>
          <Tabs
            value={filter}
            onChange={setFilter}
            items={[
              { value: 'all', label: 'Visi', count: counts.all },
              { value: 'active', label: 'Aktyvūs', count: counts.active },
              { value: 'done', label: 'Užbaigti', count: counts.done },
            ]}
          />
          <div className="row gap wrap" style={{ marginBottom: 16 }}>
            <div className="search" style={{ background: '#fff', border: '1px solid var(--border)' }}>
              <Search size={16} />
              <input placeholder="Ieškoti pagal pavadinimą, kodą, vietą" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div style={{ width: 220 }}>
              <Select options={[{ value: '', label: 'Visi projektų tipai' }, ...PROJECT_TYPES]} value={type} onChange={(e) => setType(e.target.value)} />
            </div>
          </div>
        </div>
        {list.length === 0 ? (
          <Empty icon={<FileStack size={22} />} title="Pirkimų nerasta" text="Pakeiskite filtrus arba sukurkite naują pirkimą." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Pirkimas</th>
                  <th>Projekto tipas</th>
                  <th className="num">Biudžetas be PVM</th>
                  <th>Etapas</th>
                  <th>Rangovai</th>
                  <th>Vadovas</th>
                  <th>Sukurta</th>
                  <th>Statusas</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id} className="is-click" onClick={() => nav(`/pirkimai/${t.id}`)}>
                    <td>
                      <div className="cell-title">{t.name}</div>
                      <div className="cell-sub">
                        {t.code} · {t.location}
                      </div>
                    </td>
                    <td>{t.projectType}</td>
                    <td className="num">{eur(t.budgetNet)}</td>
                    <td style={{ minWidth: 150 }}>
                      <div className="small">
                        {t.currentStep}. {STEPS[t.currentStep - 1].short}
                      </div>
                      <div className="mt-sm">
                        <Progress value={progressPct(t)} />
                      </div>
                    </td>
                    <td className="num">{t.participants.length}</td>
                    <td className="nowrap">{t.manager}</td>
                    <td className="num">{fmtDateShort(t.createdAt)}</td>
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
      {creating && <NewTenderModal onClose={() => setCreating(false)} />}
    </>
  );
}
