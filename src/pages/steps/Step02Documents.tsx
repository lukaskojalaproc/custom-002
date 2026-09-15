import { useRef } from 'react';
import { FileText, Upload, Wand2, X } from 'lucide-react';
import { Button, Callout, Progress, Select } from '../../components/ui';
import { DOC_TYPES } from '../../lib/constants';
import { fileSize, isoDate, uid } from '../../lib/format';
import { logActivity } from '../../lib/store';
import type { DocStatus } from '../../lib/types';
import { MiniStat, StepShell, useTenderUpdate, type StepProps } from './shared';

const TEMPLATES: Record<string, string> = {
  conditions: 'Konkurso_salygos',
  priceForm: 'Kainos_pasiulymo_forma',
  nda: 'Konfidencialumo_isipareigojimas',
  contract: 'Rangos_sutarties_projektas',
  qaForm: 'Klausimu_atsakymu_forma',
  protocol: 'Komercinio_susitikimo_protokolas',
};

const STATUSES: { value: DocStatus; label: string }[] = [
  { value: 'nepradėta', label: 'Nepradėta' },
  { value: 'rengiama', label: 'Rengiama' },
  { value: 'paruošta', label: 'Paruošta' },
];

export function Step02({ t }: StepProps) {
  const update = useTenderUpdate(t);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const ready = t.documents.filter((d) => d.status === 'paruošta').length;
  const files = t.documents.flatMap((d) => d.files);

  const addFiles = (key: string, list: FileList | null) => {
    if (!list?.length) return;
    update((d) => {
      const doc = d.documents.find((x) => x.key === key)!;
      Array.from(list).forEach((f) => {
        const existing = doc.files.find((x) => x.name === f.name);
        if (existing) {
          existing.version += 1;
          existing.size = f.size;
          existing.uploadedAt = isoDate();
        } else {
          doc.files.push({ id: uid('f'), name: f.name, size: f.size, uploadedAt: isoDate(), version: 1 });
        }
      });
      if (doc.status === 'nepradėta') doc.status = 'rengiama';
      logActivity(d, `Įkelti failai: ${Array.from(list).map((f) => f.name).join(', ')}`);
    });
  };

  const fromTemplate = (key: string) =>
    update((d) => {
      const doc = d.documents.find((x) => x.key === key)!;
      doc.files.push({ id: uid('f'), name: `${TEMPLATES[key]}_${d.code}.docx`, size: 48_000 + Math.round(Math.random() * 90_000), uploadedAt: isoDate(), version: 1 });
      if (doc.status === 'nepradėta') doc.status = 'rengiama';
      logActivity(d, `Sugeneruotas dokumentas iš šablono: ${TEMPLATES[key]}`);
    });

  const setStatus = (key: string, status: DocStatus) =>
    update((d) => {
      d.documents.find((x) => x.key === key)!.status = status;
    });

  const removeFile = (key: string, id: string) =>
    update((d) => {
      const doc = d.documents.find((x) => x.key === key)!;
      doc.files = doc.files.filter((f) => f.id !== id);
    });

  const markAllWithFiles = () =>
    update((d) => {
      d.documents.forEach((doc) => {
        if (doc.files.length) doc.status = 'paruošta';
      });
    });

  return (
    <StepShell
      t={t}
      n={2}
      blocker={ready < DOC_TYPES.length ? `Paruošta ${ready} iš ${DOC_TYPES.length} dokumentų` : null}
      actions={
        <Button variant="secondary" size="sm" onClick={markAllWithFiles}>
          Pažymėti dokumentus su failais paruoštais
        </Button>
      }
    >
      <div className="mini-stats">
        <MiniStat label="Paruošti dokumentai" value={`${ready} / ${DOC_TYPES.length}`} />
        <MiniStat label="Įkelti failai" value={files.length} />
        <MiniStat label="Bendras dydis" value={fileSize(files.reduce((s, f) => s + f.size, 0))} />
        <MiniStat label="Atnaujintos versijos" value={files.filter((f) => f.version > 1).length} />
      </div>
      <Progress value={(ready / DOC_TYPES.length) * 100} />
      <Callout>
        Prototipe failai saugomi kaip metaduomenys (pavadinimas, dydis, versija). Pakartotinai įkėlus to paties pavadinimo failą,
        sukuriama nauja versija. Dalį dokumentų galima sugeneruoti iš šablono.
      </Callout>
      <div>
        {DOC_TYPES.map((dt, i) => {
          const doc = t.documents.find((x) => x.key === dt.key) ?? { key: dt.key, status: 'nepradėta' as DocStatus, files: [] };
          return (
            <div key={dt.key} className={`doc-row ${doc.status === 'paruošta' ? 'is-ready' : ''}`}>
              <div className="doc-num">{i + 1}</div>
              <div style={{ minWidth: 0 }}>
                <div className="strong">{dt.title}</div>
                <div className="small muted">{dt.description}</div>
                {doc.files.length > 0 && (
                  <div className="doc-files">
                    {doc.files.map((f) => (
                      <span key={f.id} className="file-chip">
                        <FileText size={14} className="faint" />
                        {f.name}
                        <span className="faint">{fileSize(f.size)}</span>
                        {f.version > 1 && <span className="chip chip-warn" style={{ padding: '0 5px' }}>v{f.version}</span>}
                        <button type="button" aria-label={`Pašalinti ${f.name}`} onClick={() => removeFile(dt.key, f.id)}>
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="doc-actions">
                {TEMPLATES[dt.key] && doc.files.length === 0 && (
                  <Button size="sm" variant="ghost" icon={<Wand2 size={15} />} onClick={() => fromTemplate(dt.key)}>
                    Iš šablono
                  </Button>
                )}
                <Button size="sm" variant="secondary" icon={<Upload size={15} />} onClick={() => inputs.current[dt.key]?.click()}>
                  Įkelti
                </Button>
                <input
                  type="file"
                  multiple
                  hidden
                  ref={(el) => {
                    inputs.current[dt.key] = el;
                  }}
                  onChange={(e) => {
                    addFiles(dt.key, e.target.files);
                    e.target.value = '';
                  }}
                />
                <div style={{ width: 130 }}>
                  <Select
                    className="input-sm"
                    aria-label="Statusas"
                    options={STATUSES}
                    value={doc.status}
                    onChange={(e) => setStatus(dt.key, e.target.value as DocStatus)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </StepShell>
  );
}
