import { useState, type FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '../components/Layout';
import { Button, Field, Input, Select } from '../components/ui';
import { useStore } from '../lib/store';

const ROLES = ['Pirkimų vadovas', 'Pirkimų specialistas', 'Užsakovo atstovas', 'Administratorius'];

const POINTS = [
  '13 etapų standartizuotas procesas',
  'Centralizuotas dokumentų paketas',
  'Struktūruotos derybos ir protokolai',
  'Objektyvus vertinimas pagal metodiką',
  'Rangovų istorija ir patikimumas',
  'Kainų ir derybų analitika',
];

export function Login() {
  const { setUser } = useStore();
  const [name, setName] = useState('Rūta Kazlauskienė');
  const [email, setEmail] = useState('ruta.kazlauskiene@procfly.lt');
  const [role, setRole] = useState(ROLES[0]);
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Įveskite vardą ir teisingą el. pašto adresą.');
      return;
    }
    setUser({ name: name.trim(), email: email.trim(), role });
  };

  return (
    <div className="login">
      <div className="login-brand">
        <Logo light />
        <h1>Generalinės rangos pirkimai – standartizuotai, atsekamai ir pagrįstai duomenimis.</h1>
        <p>
          Nuo rangovų sąrašo iki pasirašytos sutarties: vienoje vietoje valdykite dokumentus, klausimus, pasiūlymus, derybas ir
          vertinimą, o kiekvienas pirkimas papildo istorinę bazę.
        </p>
        <div className="login-points">
          {POINTS.map((p) => (
            <div key={p} className="login-point">
              <CheckCircle2 size={18} />
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="login-form-wrap">
        <div className="login-card">
          <h2>Prisijungti</h2>
          <p className="muted mt-sm">
            Demonstracinė versija: jūsų pakeitimai saugomi tik šioje naršyklėje, o atsijungus demo duomenys atkuriami.
          </p>
          <form onSubmit={submit} noValidate>
            <Field label="Vardas, pavardė">
              <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </Field>
            <Field label="El. paštas">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={!!error} />
            </Field>
            <Field label="Rolė">
              <Select options={ROLES} value={role} onChange={(e) => setRole(e.target.value)} />
            </Field>
            {error && <p className="text-danger small">{error}</p>}
            <Button type="submit">Tęsti</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
