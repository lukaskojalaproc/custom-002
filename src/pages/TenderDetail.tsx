import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Download, History, Pencil } from 'lucide-react';
import { Button, Field, Input, KV, Modal, NumberInput, Progress, Select, StatusBadge, Textarea, useToast } from '../components/ui';
import { MANAGERS, PHASES, PROJECT_TYPES, STEPS } from '../lib/constants';
import { progressPct, stepState, tenderStatus } from '../lib/calc';
import { eur, fmtDate, fmtDateShort, num } from '../lib/format';
import { downloadFile } from '../lib/io';
import { useStore } from '../lib/store';
import type { ProjectType, Tender } from '../lib/types';
import { Step01 } from './steps/Step01Contractors';
import { Step02 } from './steps/Step02Documents';
import { Step03 } from './steps/Step03Invitation';
import { Step04 } from './steps/Step04Questions';
import { Step05 } from './steps/Step05Offers';
import { Step06 } from './steps/Step06Analysis';
import { Step07 } from './steps/Step07Negotiations';
import { Step08 } from './steps/Step08Leveling';
import { Step09 } from './steps/Step09Clarification';
import { Step10 } from './steps/Step10FinalOffers';
import { Step11 } from './steps/Step11Evaluation';
import { Step12 } from './steps/Step12Selection';
import { Step13 } from './steps/Step13History';

const STEP_VIEWS = [Step01, Step02, Step03, Step04, Step05, Step06, Step07, Step08, Step09, Step10, Step11, Step12, Step13];

function EditTenderModal({ t, onClose }: { t: Tender; onClose: () => void }) {
  const { updateTender } = useStore();
  const toast = useToast();
  const [f, setF] = useState({
    name: t.name,
    projectType: t.projectType,
    location: t.location,
    areaM2: t.areaM2,
    budgetNet: t.budgetNet,
    manager: t.manager,
    description: t.description,
  });
  const managers = Array.from(new Set([t.manager, ...MANAGERS]));
  return (
    <Modal
      title="Pirkimo informacija"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Atšaukti
          </Button>
          <Button
            disabled={!f.name.trim()}
            onClick={() => {
              updateTender(t.id, (d) => Object.assign(d, f));
              toast('Pirkimo informacija atnaujinta');
              onClose();
            }}
          >
            Išsaugoti
          </Button>
        </>
      }
    >
      <div className="grid-2">
        <Field label="Pavadinimas" className="span-2">
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Projekto tipas">
          <Select options={PROJECT_TYPES} value={f.projectType} onChange={(e) => setF({ ...f, projectType: e.target.value as ProjectType })} />
        </Field>
        <Field label="Vieta">
          <Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
        </Field>
        <Field label="Plotas, m²">
          <NumberInput value={f.areaM2} onChange={(n) => setF({ ...f, areaM2: n })} />
        </Field>
        <Field label="Biudžetas, EUR be PVM">
          <NumberInput value={f.budgetNet} step={100000} onChange={(n) => setF({ ...f, budgetNet: n })} />
        </Field>
        <Field label="Atsakingas pirkimų vadovas" className="span-2">
          <Select options={managers} value={f.manager} onChange={(e) => setF({ ...f, manager: e.target.value })} />
        </Field>
        <Field label="Aprašymas" className="span-2">
          <Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}

function ActivityModal({ t, onClose }: { t: Tender; onClose: () => void }) {
  return (
    <Modal title="Pirkimo veiksmų žurnalas" subtitle="Atsekamumas: visi pirkimo veiksmai" onClose={onClose}>
      <div className="timeline">
        {t.activity.map((a, i) => (
          <div key={i} className="timeline-item">
            <span className="dot" />
            <div>
              <div>{a.text}</div>
              <div className="small muted">{fmtDate(a.at)}</div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function TenderDetail() {
  const { id, step } = useParams();
  const { state } = useStore();
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [log, setLog] = useState(false);
  const t = state.tenders.find((x) => x.id === id);
  if (!t) return <Navigate to="/pirkimai" replace />;

  const selected = Math.min(13, Math.max(1, Number(step) || t.currentStep));
  const View = STEP_VIEWS[selected - 1];
  const go = (n: number) => nav(`/pirkimai/${t.id}/${n}`);

  return (
    <>
      <div className="crumbs">
        <Link to="/pirkimai">Pirkimai</Link>
        <ChevronRight size={14} />
        <span>{t.code}</span>
      </div>
      <div className="tender-hero">
        <div className="tender-hero-top">
          <div style={{ minWidth: 0, flex: '1 1 320px' }}>
            <div className="row gap wrap">
              <h1>{t.name}</h1>
              <StatusBadge value={tenderStatus(t)} />
            </div>
            <p className="muted mt-sm">{t.description}</p>
          </div>
          <div className="row gap wrap">
            <Button variant="ghost" size="sm" icon={<History size={15} />} onClick={() => setLog(true)}>
              Žurnalas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Download size={15} />}
              onClick={() => downloadFile(`${t.code}.json`, JSON.stringify(t, null, 2))}
            >
              Eksportuoti
            </Button>
            <Button variant="secondary" size="sm" icon={<Pencil size={15} />} onClick={() => setEditing(true)}>
              Redaguoti
            </Button>
          </div>
        </div>
        <KV
          items={[
            ['Kodas', t.code],
            ['Pirkimo tipas', 'Generalinė ranga'],
            ['Projekto tipas', t.projectType],
            ['Vieta', t.location || '—'],
            ['Plotas', t.areaM2 ? `${num(t.areaM2)} m²` : '—'],
            ['Biudžetas be PVM', eur(t.budgetNet)],
            ['Pirkimų vadovas', t.manager],
            ['Sukurta', fmtDateShort(t.createdAt)],
          ]}
        />
        <div className="row gap mt">
          <div className="grow">
            <Progress value={progressPct(t)} />
          </div>
          <span className="small muted nowrap">{t.completedSteps.length} / 13 etapų atlikta</span>
        </div>
      </div>

      <div className="tender-layout">
        <nav className="stepnav" aria-label="Pirkimo etapai">
          {PHASES.map((p) => (
            <div key={p.key}>
              <div className="stepnav-phase">{p.title}</div>
              {p.steps.map((n) => {
                const st = stepState(t, n);
                return (
                  <button
                    key={n}
                    type="button"
                    className={`stepnav-item is-${st} ${selected === n ? 'is-selected' : ''}`}
                    onClick={() => go(n)}
                    aria-current={selected === n ? 'step' : undefined}
                  >
                    <span className="stepnav-num">{st === 'done' ? '✓' : n}</span>
                    <span className="stepnav-label">{STEPS[n - 1].title}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{ minWidth: 0 }}>
          <div className="mobile-steps">
            <Select
              aria-label="Etapas"
              value={String(selected)}
              onChange={(e) => go(Number(e.target.value))}
              options={STEPS.map((s) => ({
                value: String(s.n),
                label: `${s.n}. ${s.title}${t.completedSteps.includes(s.n) ? ' ✓' : ''}`,
              }))}
            />
          </div>
          <View key={`${t.id}-${selected}`} t={t} />
        </div>
      </div>
      {editing && <EditTenderModal t={t} onClose={() => setEditing(false)} />}
      {log && <ActivityModal t={t} onClose={() => setLog(false)} />}
    </>
  );
}
