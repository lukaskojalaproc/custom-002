import { useState } from 'react';
import { FileText, Plus, Scale, Trash2 } from 'lucide-react';
import { Button, Callout, Empty, IconButton, Input, NumberInput, Segmented, Select, StatusBadge, Tabs, Textarea, useToast } from '../../components/ui';
import { COMMERCIAL_TOPICS, LEGAL_TOPICS } from '../../lib/constants';
import { initialPrice, negotiatedPrice, negotiationIds, openLegalCount } from '../../lib/calc';
import { eur, fmtDate, isoDate, pct, uid } from '../../lib/format';
import { COMMERCIAL_BANK, LEGAL_BANK } from '../../lib/seed';
import { logActivity, useContractors } from '../../lib/store';
import type { ClauseStatus, NegotiationRound, Tender } from '../../lib/types';
import { MiniStat, PrintModal, StepShell, shortName, useTenderUpdate, type StepProps } from './shared';

const CLAUSE_STATUSES: { value: ClauseStatus; label: string }[] = [
  { value: 'atvira', label: 'Atvira' },
  { value: 'sutarta', label: 'Sutarta' },
  { value: 'atmesta', label: 'Atmesta' },
];

function ProtocolDoc({ t, round, cid, name, contact }: { t: Tender; round: NegotiationRound; cid: string; name: string; contact: string }) {
  const items = round.commercial.filter((c) => c.contractorId === cid);
  const legal = round.legal.filter((l) => l.contractorId === cid && l.status === 'sutarta');
  const impact = items.reduce((s, c) => s + c.priceImpact, 0);
  return (
    <>
      <h2>Komercinės dalies susitikimo protokolas</h2>
      <p>
        {t.name} ({t.code}) · {round.n} derybų ratas
      </p>
      <table>
        <tbody>
          <tr>
            <th style={{ width: '30%' }}>Rangovas</th>
            <td>{name}</td>
          </tr>
          <tr>
            <th>Susitikimo data</th>
            <td>{fmtDate(round.meetingDates[cid] ?? round.startedAt)}</td>
          </tr>
          <tr>
            <th>Dalyviai</th>
            <td>
              {t.manager} (užsakovo pirkimų vadovas); {contact || 'rangovo atstovas'} ({name})
            </td>
          </tr>
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th>Nr.</th>
            <th>Tema</th>
            <th>Susitarimas</th>
            <th>Poveikis kainai</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c, i) => (
            <tr key={c.id}>
              <td>{i + 1}</td>
              <td>{c.topic}</td>
              <td>{c.agreement}</td>
              <td>{eur(c.priceImpact)}</td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan={4}>Komercinių susitarimų nėra</td>
            </tr>
          )}
        </tbody>
      </table>
      <table>
        <tbody>
          <tr>
            <th style={{ width: '30%' }}>Pirminė kaina be PVM</th>
            <td>{eur(initialPrice(t, cid))}</td>
          </tr>
          <tr>
            <th>Poveikis šiame rate</th>
            <td>{eur(impact)}</td>
          </tr>
          <tr>
            <th>Kaina po derybų be PVM</th>
            <td>{eur(negotiatedPrice(t, cid))}</td>
          </tr>
        </tbody>
      </table>
      {legal.length > 0 && (
        <>
          <p style={{ marginTop: 12 }}>Sutartiniai susitarimai:</p>
          <ul>
            {legal.map((l) => (
              <li key={l.id}>
                {l.topic}: {l.agreed}
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="print-sign">
        <div>Užsakovo atstovas: {t.manager}</div>
        <div>Rangovo atstovas: {contact || name}</div>
      </div>
    </>
  );
}

function LegalSummaryDoc({ t, cid, name }: { t: Tender; cid: string; name: string }) {
  const items = t.rounds.flatMap((r) => r.legal.filter((l) => l.contractorId === cid).map((l) => ({ ...l, round: r.n })));
  return (
    <>
      <h2>Teisinių derybų santrauka</h2>
      <p>
        {t.name} ({t.code}) · {name} · palyginamoji versija: pirminė sutartis vs derybinė su komentarais
      </p>
      <table>
        <thead>
          <tr>
            <th>Sąlyga</th>
            <th>Pakeitimas</th>
            <th>Rangovo komentaras</th>
            <th>Statusas</th>
          </tr>
        </thead>
        <tbody>
          {items.map((l) => (
            <tr key={l.id}>
              <td>
                {l.topic}
                <div className="small muted">{l.round} ratas</div>
              </td>
              <td>
                <span className="del">{l.original}</span>
                <br />
                {l.agreed ? <span className="ins">{l.agreed}</span> : <em className="muted">Sutarta redakcija dar nesuderinta</em>}
              </td>
              <td>{l.proposed}</td>
              <td>{CLAUSE_STATUSES.find((s) => s.value === l.status)?.label}</td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan={4}>Teisinių pastabų nėra</td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

export function Step07({ t }: StepProps) {
  const update = useTenderUpdate(t);
  const cs = useContractors();
  const toast = useToast();
  const nego = negotiationIds(t);
  const [roundIdx, setRoundIdx] = useState(Math.max(0, t.rounds.length - 1));
  const [cid, setCid] = useState(nego[0] ?? '');
  const [mode, setMode] = useState<'commercial' | 'legal'>('commercial');
  const [doc, setDoc] = useState<null | 'protocol' | 'summary'>(null);
  const [draft, setDraft] = useState({ topic: COMMERCIAL_TOPICS[0], agreement: '', impact: 0 });
  const [legalTopic, setLegalTopic] = useState(LEGAL_TOPICS[1]);

  const round = t.rounds[roundIdx];
  const lastRound = t.rounds[t.rounds.length - 1];
  const canAddRound = t.rounds.length < 3 && (!lastRound || !!lastRound.clarification?.sentAt);

  const startRound = () => {
    const n = t.rounds.length + 1;
    update((d) => {
      d.rounds.push({ n, startedAt: isoDate(), meetingDates: {}, commercial: [], legal: [] });
      logActivity(d, `Pradėtas ${n} derybų ratas`);
    });
    setRoundIdx(n - 1);
    toast(`Pradėtas ${n} derybų ratas`);
  };

  const addCommercial = () => {
    update((d) => {
      d.rounds[roundIdx].commercial.push({ id: uid('cm'), contractorId: cid, topic: draft.topic, agreement: draft.agreement.trim(), priceImpact: draft.impact });
    });
    setDraft({ topic: draft.topic, agreement: '', impact: 0 });
  };

  const addLegal = () => {
    const tpl = LEGAL_BANK.find((l) => l.topic === legalTopic);
    update((d) => {
      d.rounds[roundIdx].legal.push({
        id: uid('lg'),
        contractorId: cid,
        topic: legalTopic,
        original: tpl?.original ?? '',
        proposed: tpl?.proposed ?? '',
        agreed: '',
        status: 'atvira',
      });
    });
  };

  const editLegal = (id: string, patch: Partial<{ agreed: string; proposed: string; status: ClauseStatus }>) =>
    update((d) => {
      const it = d.rounds[roundIdx].legal.find((x) => x.id === id);
      if (it) Object.assign(it, patch);
    });

  const blocker = !nego.length
    ? 'Nėra pasiūlymų, įtrauktų į derybas (6 etapas)'
    : !t.rounds.length
      ? 'Pradėkite derybų ratą'
      : !t.rounds.some((r) => r.commercial.length || r.legal.length)
        ? 'Užfiksuokite bent vieną derybų susitarimą'
        : null;

  const commercial = round?.commercial.filter((c) => c.contractorId === cid) ?? [];
  const legal = round?.legal.filter((l) => l.contractorId === cid) ?? [];
  const roundImpact = commercial.reduce((s, c) => s + c.priceImpact, 0);
  const name = cs[cid]?.name ?? '';

  return (
    <StepShell
      t={t}
      n={7}
      blocker={blocker}
      actions={
        t.rounds.length > 0 && (
          <Button size="sm" variant="secondary" icon={<Plus size={15} />} disabled={!canAddRound} onClick={startRound} title="Naujas ratas pradedamas išsiuntus patikslinimų užklausą">
            Naujas derybų ratas
          </Button>
        )
      }
    >
      {!nego.length ? (
        <Callout tone="warning">Į derybas neįtrauktas nė vienas pasiūlymas. Grįžkite į pirminę analizę.</Callout>
      ) : !t.rounds.length ? (
        <div className="panel panel-soft">
          <Empty
            icon={<Scale size={22} />}
            title="Derybos dar nepradėtos"
            text={`Į derybas įtraukti ${nego.length} rangovai. Galimi 1–3 derybų ratai.`}
            action={<Button onClick={startRound}>Pradėti 1 derybų ratą</Button>}
          />
        </div>
      ) : (
        <>
          <div>
            <div className="section-title">Derybų suvestinė</div>
            <div className="table-wrap">
              <table className="table table-compact">
                <thead>
                  <tr>
                    <th>Rangovas</th>
                    <th className="num">Pirminė kaina</th>
                    <th className="num">Kaina po derybų</th>
                    <th className="num">Pokytis</th>
                    <th className="num">Atviros sąlygos</th>
                  </tr>
                </thead>
                <tbody>
                  {nego.map((id) => {
                    const a = initialPrice(t, id) ?? 0;
                    const b = negotiatedPrice(t, id) ?? a;
                    return (
                      <tr key={id} className={`is-click ${id === cid ? 'is-highlight' : ''}`} onClick={() => setCid(id)}>
                        <td className="cell-title">{cs[id]?.name}</td>
                        <td className="num">{eur(a)}</td>
                        <td className="num strong">{eur(b)}</td>
                        <td className="num">{pct(((b - a) / a) * 100)}</td>
                        <td className="num">{openLegalCount(t, id) || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="row gap wrap between">
            <Segmented
              options={t.rounds.map((r, i) => ({ value: String(i), label: `${r.n} ratas${r.clarification?.sentAt ? ' ✓' : ''}` }))}
              value={String(roundIdx)}
              onChange={(v) => setRoundIdx(Number(v))}
            />
            <span className="small muted">
              Ratas pradėtas {fmtDate(round.startedAt)} · {t.rounds.length} iš maks. 3 ratų
            </span>
          </div>

          <Tabs items={nego.map((id) => ({ value: id, label: shortName(cs[id]?.name ?? id) }))} value={cid} onChange={setCid} />

          <div className="row gap wrap between">
            <Segmented
              options={[
                { value: 'commercial', label: 'Komercinės derybos' },
                { value: 'legal', label: 'Teisinės derybos' },
              ]}
              value={mode}
              onChange={setMode}
            />
            <div className="row gap wrap">
              <label className="row gap small muted">
                Susitikimas
                <Input
                  type="date"
                  className="input-sm"
                  style={{ width: 150 }}
                  value={round.meetingDates[cid] ?? ''}
                  onChange={(e) => update((d) => void (d.rounds[roundIdx].meetingDates[cid] = e.target.value))}
                />
              </label>
              {mode === 'commercial' ? (
                <Button size="sm" variant="secondary" icon={<FileText size={15} />} onClick={() => setDoc('protocol')}>
                  Susitikimo protokolas
                </Button>
              ) : (
                <Button size="sm" variant="secondary" icon={<FileText size={15} />} onClick={() => setDoc('summary')}>
                  Teisinė santrauka
                </Button>
              )}
            </div>
          </div>

          {mode === 'commercial' ? (
            <>
              <div className="mini-stats">
                <MiniStat label="Pirminė kaina" value={eur(initialPrice(t, cid))} />
                <MiniStat label={`Poveikis ${round.n} rate`} value={eur(roundImpact)} />
                <MiniStat label="Kaina po derybų" value={eur(negotiatedPrice(t, cid))} />
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tema</th>
                      <th>Susitarimas</th>
                      <th className="num">Poveikis kainai</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {commercial.map((c) => (
                      <tr key={c.id}>
                        <td className="nowrap">{c.topic}</td>
                        <td>{c.agreement}</td>
                        <td className={`num ${c.priceImpact < 0 ? 'text-green' : ''}`}>{eur(c.priceImpact)}</td>
                        <td className="text-right">
                          <IconButton
                            label="Pašalinti"
                            onClick={() => update((d) => void (d.rounds[roundIdx].commercial = d.rounds[roundIdx].commercial.filter((x) => x.id !== c.id)))}
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                    {!commercial.length && (
                      <tr>
                        <td colSpan={4} className="muted">
                          Šiame rate komercinių susitarimų dar nėra.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={{ width: 220 }}>
                        <Select
                          className="input-sm"
                          aria-label="Tema"
                          options={COMMERCIAL_TOPICS}
                          value={draft.topic}
                          onChange={(e) => {
                            const topic = e.target.value;
                            const tpl = COMMERCIAL_BANK.find((b) => b.topic === topic);
                            setDraft((x) => ({ ...x, topic, agreement: x.agreement || tpl?.agreement || '' }));
                          }}
                        />
                      </td>
                      <td>
                        <Input
                          className="input-sm"
                          placeholder="Susitarimo aprašymas"
                          value={draft.agreement}
                          onChange={(e) => setDraft({ ...draft, agreement: e.target.value })}
                        />
                      </td>
                      <td style={{ width: 150 }}>
                        <NumberInput
                          className="input-sm"
                          aria-label="Poveikis kainai, EUR"
                          step={1000}
                          value={draft.impact || undefined}
                          placeholder="−50000"
                          onChange={(n) => setDraft({ ...draft, impact: n })}
                        />
                      </td>
                      <td>
                        <Button size="sm" icon={<Plus size={15} />} disabled={!draft.agreement.trim()} onClick={addCommercial}>
                          Pridėti
                        </Button>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="small muted">Neigiama suma – kainos sumažėjimas, teigiama – padidėjimas (pvz., įtraukus papildomus darbus).</p>
            </>
          ) : (
            <>
              {legal.length === 0 && <p className="muted">Šiame rate teisinių pastabų dar nėra.</p>}
              {legal.map((l) => (
                <div key={l.id} className="clause">
                  <div className="row between gap wrap">
                    <div className="strong">{l.topic}</div>
                    <div className="row gap">
                      <StatusBadge value={l.status} />
                      <div style={{ width: 130 }}>
                        <Select className="input-sm" aria-label="Statusas" options={CLAUSE_STATUSES} value={l.status} onChange={(e) => editLegal(l.id, { status: e.target.value as ClauseStatus })} />
                      </div>
                      <IconButton
                        label="Pašalinti"
                        onClick={() => update((d) => void (d.rounds[roundIdx].legal = d.rounds[roundIdx].legal.filter((x) => x.id !== l.id)))}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
                  </div>
                  <div className="clause-grid">
                    <div>
                      <div className="clause-col-label">Pirminė sutartis</div>
                      <div className="clause-col">{l.original}</div>
                    </div>
                    <div>
                      <div className="clause-col-label">Rangovo pastaba</div>
                      <Textarea rows={3} value={l.proposed} onChange={(e) => editLegal(l.id, { proposed: e.target.value })} />
                    </div>
                    <div>
                      <div className="clause-col-label">Sutarta redakcija</div>
                      <Textarea rows={3} value={l.agreed} placeholder="Suderinta sąlygos redakcija…" onChange={(e) => editLegal(l.id, { agreed: e.target.value })} />
                    </div>
                  </div>
                </div>
              ))}
              <div className="row gap wrap">
                <div style={{ width: 260 }}>
                  <Select aria-label="Sąlyga" options={LEGAL_TOPICS} value={legalTopic} onChange={(e) => setLegalTopic(e.target.value)} />
                </div>
                <Button variant="secondary" icon={<Plus size={15} />} onClick={addLegal}>
                  Pridėti sutarties sąlygą
                </Button>
              </div>
            </>
          )}
        </>
      )}
      {doc === 'protocol' && round && (
        <PrintModal title="Komercinės dalies protokolas" onClose={() => setDoc(null)}>
          <ProtocolDoc t={t} round={round} cid={cid} name={name} contact={cs[cid]?.contactPerson ?? ''} />
        </PrintModal>
      )}
      {doc === 'summary' && (
        <PrintModal title="Teisinių derybų santrauka" onClose={() => setDoc(null)}>
          <LegalSummaryDoc t={t} cid={cid} name={name} />
        </PrintModal>
      )}
    </StepShell>
  );
}
