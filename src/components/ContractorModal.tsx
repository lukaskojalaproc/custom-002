import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CERTIFICATIONS, CONTRACTOR_SOURCES, PROJECT_TYPES, RELIABILITY } from '../lib/constants';
import { addDays, isoDate, uid } from '../lib/format';
import { useStore } from '../lib/store';
import type { Contractor, Reliability } from '../lib/types';
import { Button, Checkbox, Field, IconButton, Input, Modal, NumberInput, Select, Textarea, useToast } from './ui';

function blank(): Contractor {
  return {
    id: uid('c'),
    name: '',
    companyCode: '',
    city: '',
    specializations: [],
    certifications: [{ name: CERTIFICATIONS[0], validUntil: addDays(isoDate(), 365) }],
    reliability: 'vidutinis',
    contactPerson: '',
    email: '',
    phone: '',
    employees: 0,
    revenueM: 0,
    source: CONTRACTOR_SOURCES[1],
    marketInfo: '',
    notes: '',
    addedAt: isoDate(),
  };
}

export function ContractorModal({ initial, onClose }: { initial?: Contractor; onClose: (saved?: Contractor) => void }) {
  const { saveContractor } = useStore();
  const toast = useToast();
  const [c, setC] = useState<Contractor>(() => (initial ? structuredClone(initial) : blank()));
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof Contractor>(k: K, v: Contractor[K]) => setC((x) => ({ ...x, [k]: v }));
  const valid = c.name.trim().length > 2;

  const save = () => {
    setTouched(true);
    if (!valid) return;
    saveContractor({ ...c, name: c.name.trim() });
    toast(initial ? 'Rangovo duomenys atnaujinti' : 'Rangovas įtrauktas į bazę');
    onClose(c);
  };

  return (
    <Modal
      title={initial ? 'Redaguoti rangovą' : 'Naujas rangovas'}
      subtitle="Rangovų bazė pildoma pagal specializaciją, patikimumą, atestaciją ir rinkos informaciją."
      onClose={() => onClose()}
      width={760}
      footer={
        <>
          <Button variant="secondary" onClick={() => onClose()}>
            Atšaukti
          </Button>
          <Button onClick={save}>Išsaugoti</Button>
        </>
      }
    >
      <div className="grid-2">
        <Field label="Įmonės pavadinimas" required className="span-2">
          <Input
            value={c.name}
            placeholder="UAB „…“"
            onChange={(e) => set('name', e.target.value)}
            aria-invalid={touched && !valid}
            autoFocus
          />
        </Field>
        <Field label="Įmonės kodas">
          <Input value={c.companyCode} onChange={(e) => set('companyCode', e.target.value)} />
        </Field>
        <Field label="Miestas">
          <Input value={c.city} onChange={(e) => set('city', e.target.value)} />
        </Field>
        <Field label="Patikimumas">
          <Select options={RELIABILITY} value={c.reliability} onChange={(e) => set('reliability', e.target.value as Reliability)} />
        </Field>
        <Field label="Šaltinis">
          <Select options={CONTRACTOR_SOURCES} value={c.source} onChange={(e) => set('source', e.target.value)} />
        </Field>
        <div className="field span-2">
          <span className="field-label">Specializacija</span>
          <div className="row gap-lg wrap">
            {PROJECT_TYPES.map((p) => (
              <Checkbox
                key={p}
                label={p}
                checked={c.specializations.includes(p)}
                onChange={(v) => set('specializations', v ? [...c.specializations, p] : c.specializations.filter((x) => x !== p))}
              />
            ))}
          </div>
        </div>
        <div className="field span-2">
          <span className="field-label">Atestacija ir sertifikatai</span>
          <div className="stack-sm">
            {c.certifications.map((cert, i) => (
              <div key={i} className="row gap">
                <div className="grow">
                  <Select
                    options={Array.from(new Set([cert.name, ...CERTIFICATIONS]))}
                    value={cert.name}
                    onChange={(e) =>
                      set(
                        'certifications',
                        c.certifications.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                      )
                    }
                  />
                </div>
                <div style={{ width: 170 }}>
                  <Input
                    type="date"
                    value={cert.validUntil}
                    aria-label="Galioja iki"
                    onChange={(e) =>
                      set(
                        'certifications',
                        c.certifications.map((x, j) => (j === i ? { ...x, validUntil: e.target.value } : x)),
                      )
                    }
                  />
                </div>
                <IconButton label="Pašalinti" onClick={() => set('certifications', c.certifications.filter((_, j) => j !== i))}>
                  <Trash2 size={16} />
                </IconButton>
              </div>
            ))}
            <div>
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus size={15} />}
                onClick={() => set('certifications', [...c.certifications, { name: CERTIFICATIONS[3], validUntil: addDays(isoDate(), 365) }])}
              >
                Pridėti sertifikatą
              </Button>
            </div>
          </div>
        </div>
        <Field label="Kontaktinis asmuo">
          <Input value={c.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} />
        </Field>
        <Field label="El. paštas">
          <Input type="email" value={c.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Telefonas">
          <Input value={c.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <div className="grid-2">
          <Field label="Darbuotojai">
            <NumberInput value={c.employees || undefined} onChange={(n) => set('employees', n)} />
          </Field>
          <Field label="Apyvarta, mln. €">
            <NumberInput value={c.revenueM || undefined} onChange={(n) => set('revenueM', n)} />
          </Field>
        </div>
        <Field label="Rinkos informacija" className="span-2">
          <Textarea rows={2} value={c.marketInfo} onChange={(e) => set('marketInfo', e.target.value)} />
        </Field>
        <Field label="Vidinės pastabos" className="span-2">
          <Textarea rows={2} value={c.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
