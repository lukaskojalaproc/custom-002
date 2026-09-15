import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Award, ChevronRight, Clock, FileCheck2, Pencil, TrendingDown, Trophy } from 'lucide-react';
import { ContractorModal } from '../components/ContractorModal';
import { Avatar, Button, Card, KV, PageHeader, Stat, StatusBadge } from '../components/ui';
import { certificationValid, contractorStats, priceChange, today } from '../lib/calc';
import { eur, fmtDateShort, num, pct } from '../lib/format';
import { useStore } from '../lib/store';

export function ContractorProfile() {
  const { id } = useParams();
  const { state } = useStore();
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const c = state.contractors.find((x) => x.id === id);
  if (!c) return <Navigate to="/rangovai" replace />;
  const s = contractorStats(state, c.id);
  const valid = certificationValid(c);
  const now = today();

  return (
    <>
      <div className="crumbs">
        <Link to="/rangovai">Rangovai</Link>
        <ChevronRight size={14} />
        <span>{c.name}</span>
      </div>
      <PageHeader
        title={
          <span className="row gap">
            <Avatar name={c.name} size={40} />
            {c.name}
          </span>
        }
        subtitle={`${c.city} · įmonės kodas ${c.companyCode || '—'} · bazėje nuo ${fmtDateShort(c.addedAt)}`}
        actions={
          <Button variant="secondary" icon={<Pencil size={16} />} onClick={() => setEditing(true)}>
            Redaguoti
          </Button>
        }
      />

      <div className="grid-4">
        <Stat label="Pakviestas į konkursus" value={s.invited} sub={`${s.declined} kartus atsisakė`} icon={<FileCheck2 size={18} />} />
        <Stat label="Pateikė pasiūlymų" value={s.submitted} sub={s.invited ? `${Math.round((s.submitted / s.invited) * 100)} % dalyvavimas` : '—'} icon={<Award size={18} />} />
        <Stat label="Laimėti konkursai" value={s.wins} sub={`${s.finalists} kartus finalininkas`} icon={<Trophy size={18} />} />
        <Stat
          label="Vid. kainos pokytis po derybų"
          value={s.avgChangePct != null ? pct(s.avgChangePct) : '—'}
          sub={s.avgResponseDays != null ? `Atsako vid. per ${s.avgResponseDays.toLocaleString('lt-LT', { maximumFractionDigits: 1 })} d.` : 'Atsakymo greitis nežinomas'}
          icon={<TrendingDown size={18} />}
        />
      </div>

      <div className="layout-2-1 mt">
        <div className="stack">
          <Card title="Konkursų istorija" subtitle="Dalyvavimas, kainos ir rezultatai" flush>
            {s.tenders.length === 0 ? (
              <p className="muted" style={{ padding: '0 24px 20px' }}>
                Rangovas dar nedalyvavo konkursuose.
              </p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Pirkimas</th>
                      <th>Dalyvavimas</th>
                      <th className="num">Pirminė kaina</th>
                      <th className="num">Finalinė kaina</th>
                      <th className="num">Pokytis</th>
                      <th>Rezultatas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.tenders.map((r) => {
                      const ch = priceChange(r.tender, c.id);
                      return (
                        <tr key={r.tender.id} className="is-click" onClick={() => nav(`/pirkimai/${r.tender.id}`)}>
                          <td>
                            <div className="cell-title">{r.tender.name}</div>
                            <div className="cell-sub">
                              {r.tender.code} · {r.tender.projectType}
                            </div>
                          </td>
                          <td>
                            <StatusBadge value={r.status} />
                          </td>
                          <td className="num">{eur(r.initial)}</td>
                          <td className="num">{eur(r.final)}</td>
                          <td className="num">{ch ? pct(ch.pct) : '—'}</td>
                          <td>
                            {r.won ? (
                              <span className="chip chip-ok">
                                <Trophy size={13} /> Laimėjo
                              </span>
                            ) : r.tender.selection.decidedAt ? (
                              <span className="chip">Nelaimėjo</span>
                            ) : (
                              <span className="chip chip-warn">Vykdoma</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Elgsena derybose">
            {s.topRemarks.length === 0 ? (
              <p className="muted">Derybų duomenų dar nėra.</p>
            ) : (
              <>
                <p className="muted small">Dažniausios rangovo pastabos sutarties projektui:</p>
                <div className="row gap wrap mt-sm">
                  {s.topRemarks.map((r) => (
                    <span key={r.topic} className="chip">
                      {r.topic} · {r.count}
                    </span>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        <div className="stack">
          <Card title="Įmonės informacija">
            <KV
              items={[
                ['Patikimumas', <StatusBadge key="r" value={c.reliability} />],
                ['Šaltinis', c.source],
                ['Darbuotojai', c.employees ? num(c.employees) : '—'],
                ['Apyvarta', c.revenueM ? `${c.revenueM} mln. €` : '—'],
                ['Kontaktinis asmuo', c.contactPerson || '—'],
                ['El. paštas', c.email || '—'],
                ['Telefonas', c.phone || '—'],
              ]}
            />
            <div className="mt">
              <div className="field-label">Specializacija</div>
              <div className="row gap wrap mt-sm">
                {c.specializations.map((x) => (
                  <span key={x} className="chip">
                    {x}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          <Card
            title="Atestacija"
            actions={valid ? <span className="chip chip-ok">Galioja</span> : <span className="chip chip-bad">Negalioja</span>}
          >
            <div className="list">
              {c.certifications.map((x, i) => (
                <div key={i} className="list-item">
                  <Clock size={16} className="faint" />
                  <div className="grow">{x.name}</div>
                  <span className={`small num ${x.validUntil < now ? 'text-danger' : 'muted'}`}>iki {fmtDateShort(x.validUntil)}</span>
                </div>
              ))}
            </div>
          </Card>

          {(c.marketInfo || c.notes) && (
            <Card title="Rinkos informacija ir pastabos">
              {c.marketInfo && <p>{c.marketInfo}</p>}
              {c.notes && <p className="muted mt-sm">{c.notes}</p>}
            </Card>
          )}
        </div>
      </div>
      {editing && <ContractorModal initial={c} onClose={() => setEditing(false)} />}
    </>
  );
}
