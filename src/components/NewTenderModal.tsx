import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MANAGERS, PROJECT_TYPES } from '../lib/constants';
import { useStore, type NewTenderInput } from '../lib/store';
import type { ProjectType } from '../lib/types';
import { Button, Field, Input, NumberInput, Select, Textarea, useToast } from './ui';

export function NewTenderModalBody({ onDone }: { onDone: () => void }) {
  const { createTender, state } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState<NewTenderInput>({
    name: '',
    projectType: 'Komercinis',
    location: '',
    areaM2: 0,
    budgetNet: 0,
    manager: state.user?.name && !MANAGERS.includes(state.user.name) ? state.user.name : MANAGERS[0],
    description: '',
  });
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof NewTenderInput>(k: K, v: NewTenderInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim().length > 2 && form.budgetNet > 0;
  const managers = Array.from(new Set([form.manager, ...MANAGERS]));

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    const id = createTender({ ...form, name: form.name.trim() });
    toast('Pirkimas sukurtas. Pradėkite nuo rangovų sąrašo.');
    onDone();
    nav(`/pirkimai/${id}`);
  };

  return (
    <>
      <div className="modal-body">
        <div className="grid-2">
          <Field label="Pirkimo pavadinimas" required className="span-2">
            <Input
              autoFocus
              value={form.name}
              placeholder="Pvz., Biurų pastatas „Upės vartai“"
              onChange={(e) => set('name', e.target.value)}
              aria-invalid={touched && form.name.trim().length <= 2}
            />
          </Field>
          <Field label="Projekto tipas">
            <Select options={PROJECT_TYPES} value={form.projectType} onChange={(e) => set('projectType', e.target.value as ProjectType)} />
          </Field>
          <Field label="Pirkimo tipas">
            <Input value="Generalinė ranga" disabled />
          </Field>
          <Field label="Vieta">
            <Input value={form.location} placeholder="Miestas, adresas" onChange={(e) => set('location', e.target.value)} />
          </Field>
          <Field label="Plotas, m²">
            <NumberInput value={form.areaM2 || undefined} min={0} onChange={(n) => set('areaM2', n)} />
          </Field>
          <Field label="Biudžetas, EUR be PVM" required hint={touched && form.budgetNet <= 0 ? 'Nurodykite biudžetą' : undefined}>
            <NumberInput value={form.budgetNet || undefined} min={0} step={100000} onChange={(n) => set('budgetNet', n)} />
          </Field>
          <Field label="Atsakingas pirkimų vadovas">
            <Select options={managers} value={form.manager} onChange={(e) => set('manager', e.target.value)} />
          </Field>
          <Field label="Trumpas projekto aprašymas" className="span-2">
            <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="modal-foot">
        <Button variant="secondary" onClick={onDone}>
          Atšaukti
        </Button>
        <Button onClick={submit} disabled={touched && !valid}>
          Sukurti pirkimą
        </Button>
      </div>
    </>
  );
}

export function NewTenderModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" style={{ maxWidth: 680 }} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>Naujas generalinės rangos pirkimas</h3>
            <p className="muted">Pirkimas bus vykdomas pagal 13 etapų algoritmą.</p>
          </div>
        </div>
        <NewTenderModalBody onDone={onClose} />
      </div>
    </div>
  );
}
