import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Printer, RotateCcw, TriangleAlert } from 'lucide-react';
import { Badge, Button, Modal, useToast } from '../../components/ui';
import { STEPS } from '../../lib/constants';
import { completeStep, logActivity, reopenStep, useStore } from '../../lib/store';
import type { Tender } from '../../lib/types';

export interface StepProps {
  t: Tender;
}

export const shortName = (name: string) => name.replace(/^UAB\s*/, '').replace(/[„“"]/g, '');

export function useTenderUpdate(t: Tender) {
  const { updateTender } = useStore();
  return (recipe: (d: Tender) => void) => updateTender(t.id, recipe);
}

export function StepShell({
  t,
  n,
  blocker,
  actions,
  children,
  completeLabel,
  beforeComplete,
}: {
  t: Tender;
  n: number;
  blocker?: string | null;
  actions?: ReactNode;
  children: ReactNode;
  completeLabel?: string;
  /** Extra mutations applied in the same update as completing the step. */
  beforeComplete?: (d: Tender) => void;
}) {
  const update = useTenderUpdate(t);
  const toast = useToast();
  const nav = useNavigate();
  const meta = STEPS[n - 1];
  const done = t.completedSteps.includes(n);

  const complete = () => {
    update((d) => {
      beforeComplete?.(d);
      completeStep(d, n);
      logActivity(d, `Etapas „${meta.title}“ atliktas`);
    });
    toast(`${n} etapas „${meta.short}“ atliktas`);
    if (n < 13) nav(`/pirkimai/${t.id}/${n + 1}`);
  };

  const reopen = () => {
    update((d) => {
      reopenStep(d, n);
      logActivity(d, `Etapas „${meta.title}“ atidarytas redagavimui`);
    });
    toast('Etapas atidarytas redagavimui', 'info');
  };

  return (
    <div className="step">
      <div className="step-head">
        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="eyebrow">{n} etapas iš 13</div>
          <h2>{meta.title}</h2>
          <p className="muted">{meta.description}</p>
        </div>
        <div className="step-head-actions">
          {actions}
          {done ? (
            <Badge tone="green" dot>
              Atlikta
            </Badge>
          ) : t.currentStep === n ? (
            <Badge tone="amber" dot>
              Vykdoma
            </Badge>
          ) : (
            <Badge>Laukia</Badge>
          )}
        </div>
      </div>
      <div className="step-body">{children}</div>
      <div className="step-foot">
        {done ? (
          <>
            <span className="muted">
              <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} /> Etapas atliktas
            </span>
            <div className="row gap">
              <Button variant="ghost" size="sm" icon={<RotateCcw size={15} />} onClick={reopen}>
                Atidaryti iš naujo
              </Button>
              {n < 13 && (
                <Button variant="secondary" size="sm" icon={<ArrowRight size={15} />} onClick={() => nav(`/pirkimai/${t.id}/${n + 1}`)}>
                  Kitas etapas
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            {blocker ? (
              <span className="hint-warn small">
                <TriangleAlert size={15} /> {blocker}
              </span>
            ) : (
              <span className="muted small">
                <CheckCircle2 size={15} /> Reikalingi duomenys užpildyti
              </span>
            )}
            <Button disabled={!!blocker} onClick={complete} icon={<CheckCircle2 size={16} />}>
              {completeLabel ?? 'Pažymėti atliktu ir tęsti'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function PrintModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      width={820}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Uždaryti
          </Button>
          <Button icon={<Printer size={16} />} onClick={() => window.print()}>
            Spausdinti / PDF
          </Button>
        </>
      }
    >
      <div className="printable print-doc">{children}</div>
    </Modal>
  );
}

export function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="mini-stat">
      <div className="mini-stat-label">{label}</div>
      <div className="mini-stat-value">{value}</div>
    </div>
  );
}
