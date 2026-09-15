import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Database, Presentation } from 'lucide-react';
import { Card, PageHeader } from '../components/ui';
import { ALGORITHM_GOALS, HISTORY_GOALS, PHASES, STEPS } from '../lib/constants';
import { useStore } from '../lib/store';

const CAPTURED: Record<number, string> = {
  1: 'Specializacija, patikimumas, atestacija, konkursų ir derybų istorija, rinkos informacija',
  2: '10 privalomų dokumentų, failai, versijos, parengtumo statusas',
  3: 'Pavadinimas, tipas, išsiuntimo data, dalyviai, dokumentų paketas, terminai, atsakingas vadovas',
  4: 'Rangovas, data, kategorija, klausimas, atsakymas, atsakymo data, išsiųsta visiems, susijęs dokumentas',
  5: 'Gavimo data, kaina be / su PVM, sąmatos ir grafiko statusas, pastabos, išlygos, kvalifikacija, statusas',
  6: '7 atitikties kriterijai, kainų palyginimas, sprendimas dėl derybų',
  7: 'Derybų ratai, komerciniai susitarimai ir kainos poveikis, sutarties sąlygų palyginimas, protokolai',
  8: 'Apimčių, išlygų ir sąlygų suvienodinimo matrica, suvienodinta kaina',
  9: 'Patikslintos apimtys, atsakymai, korekcijos, sąlygos, prielaidos, terminas',
  10: 'Finalinė kaina, pokytis, terminas, sutarties pastabos, rizikos, atestacija, patikimumas, rekomendacija',
  11: '6 kriterijų svoriai, balai, bendras įvertinimas, reitingas',
  12: 'Pasirinktas rangovas, 8 sprendimo aspektai, pagrindimas, tvirtinimas',
  13: '17 istorinių rodiklių pirkimų duomenų branduoliui',
};

export function About() {
  const { state } = useStore();
  const demo = state.tenders.find((t) => t.id === 't1');
  const demoDone = state.tenders.find((t) => t.id === 't3');

  return (
    <>
      <PageHeader
        eyebrow="Sistemos aprašymas"
        title="Generalinės rangos pirkimo algoritmas"
        subtitle="Standartizuotas, atsekamas ir duomenimis pagrįstas procesas nuo rangovų sąrašo iki istorinių duomenų kaupimo. Sistema įgyvendina visus 13 algoritmo etapų."
      />

      <div className="layout-2-1">
        <Card title="Proceso schema" subtitle="13 etapų, sugrupuotų į 4 fazes">
          <div className="flow">
            {STEPS.map((s) => (
              <div key={s.n} className="flow-step">
                <div className="flow-num">{s.n}</div>
                <div className="flow-body">
                  <h3>
                    {s.title}
                    <span className="phase-tag">{PHASES.find((p) => p.steps.includes(s.n))?.title}</span>
                  </h3>
                  <p>{s.description}</p>
                  <p className="small">
                    <strong style={{ fontWeight: 500, color: 'var(--navy)' }}>Sistemoje fiksuojama:</strong> {CAPTURED[s.n]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="stack">
          <Card title="Algoritmo tikslas">
            <ul className="check-list">
              {ALGORITHM_GOALS.map((g) => (
                <li key={g}>
                  <CheckCircle2 size={16} />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Trukmė">
            <div className="row gap">
              <Clock size={20} className="faint" style={{ flex: 'none' }} />
              <p>
                Įprastai <strong style={{ fontWeight: 500 }}>3–4 mėnesiai</strong>, priklausomai nuo projekto sudėtingumo, rangovų
                skaičiaus, klausimų kiekio ir derybinių ratų (1–3) skaičiaus.
              </p>
            </div>
          </Card>

          <Card title="Istorinių duomenų nauda">
            <div className="row gap" style={{ alignItems: 'flex-start' }}>
              <Database size={20} className="faint" style={{ flex: 'none' }} />
              <ul className="check-list">
                {HISTORY_GOALS.map((g) => (
                  <li key={g}>
                    <CheckCircle2 size={16} />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card title="Demonstracijos scenarijus">
            <div className="row gap" style={{ alignItems: 'flex-start' }}>
              <Presentation size={20} className="faint" style={{ flex: 'none' }} />
              <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>
                  <Link to="/">Apžvalga</Link> – aktyvūs pirkimai, terminai ir užduotys.
                </li>
                {demo && (
                  <li>
                    <Link to={`/pirkimai/${demo.id}/7`}>{demo.name}</Link> – vykdomos derybos: pridėkite susitarimą, sugeneruokite
                    protokolą, tęskite suvienodinimą, patikslinimus, finalinius pasiūlymus ir vertinimą.
                  </li>
                )}
                {demoDone && (
                  <li>
                    <Link to={`/pirkimai/${demoDone.id}/11`}>{demoDone.name}</Link> – užbaigtas pirkimas: vertinimas, pasirinkimo
                    pagrindimas ir istoriniai duomenys.
                  </li>
                )}
                <li>
                  <Link to="/rangovai">Rangovų bazė</Link> ir <Link to="/analitika">istorinė analitika</Link>.
                </li>
                <li>Sukurkite naują pirkimą ir pereikite visus 13 etapų nuo nulio.</li>
              </ol>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
