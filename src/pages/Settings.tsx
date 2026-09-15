import { useRef, useState } from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';
import { Button, Callout, Card, Field, Input, KV, Modal, PageHeader, useToast } from '../components/ui';
import { isoDate } from '../lib/format';
import { downloadFile, readTextFile } from '../lib/io';
import { useStore } from '../lib/store';
import type { AppState } from '../lib/types';

export function SettingsPage() {
  const { state, setUser, resetDemo, replaceState } = useStore();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [name, setName] = useState(state.user?.name ?? '');
  const [role, setRole] = useState(state.user?.role ?? '');
  const size = new Blob([JSON.stringify(state)]).size;

  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await readTextFile(file)) as AppState;
      if (!Array.isArray(parsed.tenders) || !Array.isArray(parsed.contractors)) throw new Error('bad shape');
      replaceState({ ...parsed, user: state.user });
      toast(`Importuota: ${parsed.tenders.length} pirkimai, ${parsed.contractors.length} rangovai`);
    } catch {
      toast('Netinkamas failo formatas', 'warning');
    }
  };

  return (
    <>
      <PageHeader title="Nustatymai" subtitle="Profilis ir prototipo duomenų valdymas." />
      <div className="layout-1-1">
        <Card title="Profilis">
          <div className="stack">
            <Field label="Vardas, pavardė">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Rolė">
              <Input value={role} onChange={(e) => setRole(e.target.value)} />
            </Field>
            <Field label="El. paštas">
              <Input value={state.user?.email ?? ''} disabled />
            </Field>
            <div>
              <Button
                disabled={!name.trim()}
                onClick={() => {
                  if (state.user) setUser({ ...state.user, name: name.trim(), role });
                  toast('Profilis atnaujintas');
                }}
              >
                Išsaugoti
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Duomenys">
          <div className="stack">
            <Callout title="Lengvas saugojimas">
              Prototipas neturi duomenų bazės – visi duomenys saugomi šios naršyklės vietinėje atmintyje (localStorage). Juos galite
              eksportuoti į JSON failą ir importuoti kitame įrenginyje.
            </Callout>
            <KV
              items={[
                ['Pirkimai', state.tenders.length],
                ['Rangovai', state.contractors.length],
                ['Duomenų dydis', `${(size / 1024).toFixed(0)} KB`],
              ]}
            />
            <div className="row gap wrap">
              <Button
                variant="secondary"
                icon={<Download size={16} />}
                onClick={() => downloadFile(`procfly-duomenys-${isoDate()}.json`, JSON.stringify({ ...state, user: null }, null, 2))}
              >
                Eksportuoti JSON
              </Button>
              <Button variant="secondary" icon={<Upload size={16} />} onClick={() => fileRef.current?.click()}>
                Importuoti JSON
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  importFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <Button variant="danger" icon={<RotateCcw size={16} />} onClick={() => setConfirmReset(true)}>
                Atkurti demo duomenis
              </Button>
            </div>
          </div>
        </Card>
      </div>
      {confirmReset && (
        <Modal
          title="Atkurti demo duomenis?"
          subtitle="Visi jūsų pakeitimai šioje naršyklėje bus pakeisti pradiniais demonstraciniais duomenimis."
          onClose={() => setConfirmReset(false)}
          width={480}
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmReset(false)}>
                Atšaukti
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  resetDemo();
                  setConfirmReset(false);
                  toast('Demo duomenys atkurti');
                }}
              >
                Atkurti
              </Button>
            </>
          }
        >
          <p className="muted">Rekomenduojame prieš tai eksportuoti duomenis.</p>
        </Modal>
      )}
    </>
  );
}
