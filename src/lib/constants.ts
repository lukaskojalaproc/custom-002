import type { CriterionKey, ProjectType, Reliability } from './types';

export const VAT = 0.21;

export const PROJECT_TYPES: ProjectType[] = [
  'Komercinis',
  'Gyvenamasis',
  'Logistikos / pramoninis',
  'Viešasis',
  'Viešbučių / turizmo',
];

export const RELIABILITY: Reliability[] = ['aukštas', 'vidutinis', 'žemas'];

export const CERTIFICATIONS = [
  'Ypatingų statinių statybos atestatas',
  'Neypatingų statinių statybos atestatas',
  'Kultūros paveldo statinių atestatas',
  'ISO 9001',
  'ISO 14001',
  'ISO 45001',
];

export const CONTRACTOR_SOURCES = [
  'Ankstesnis konkursas',
  'Rinkos informacija',
  'Rekomendacija',
  'Rangovo iniciatyva',
];

export const MANAGERS = ['Rūta Kazlauskienė', 'Tomas Petrauskas', 'Ieva Stankevičiūtė'];

export interface PhaseMeta {
  key: string;
  title: string;
  steps: number[];
}

export const PHASES: PhaseMeta[] = [
  { key: 'prep', title: 'Pasiruošimas', steps: [1, 2, 3] },
  { key: 'tender', title: 'Konkursas', steps: [4, 5, 6] },
  { key: 'nego', title: 'Derybos', steps: [7, 8, 9, 10] },
  { key: 'decision', title: 'Sprendimas', steps: [11, 12, 13] },
];

export interface StepMeta {
  n: number;
  title: string;
  short: string;
  description: string;
}

export const STEPS: StepMeta[] = [
  {
    n: 1,
    title: 'Rangovų sąrašo sudarymas',
    short: 'Rangovai',
    description:
      'Generalinių rangovų sąrašas atrenkamas iš sistemos istorinės bazės pagal specializaciją, patikimumą, atestaciją, ankstesnių konkursų ir derybų istoriją bei rinkos informaciją.',
  },
  {
    n: 2,
    title: 'Pirkimo paketo paruošimas',
    short: 'Dokumentai',
    description:
      'Prieš kvietimą pirkimo komanda paruošia pilną generalinės rangos pirkimo paketą – 10 privalomų dokumentų.',
  },
  {
    n: 3,
    title: 'Kvietimo išsiuntimas',
    short: 'Kvietimas',
    description:
      'Atrinktiems rangovams siunčiama oficiali konkurso užklausa su projekto aprašymu, sąlygomis ir nuoroda į dokumentaciją.',
  },
  {
    n: 4,
    title: 'Klausimų–atsakymų etapas',
    short: 'Klausimai',
    description:
      'Iki termino rangovai teikia klausimus. Atsakymai koordinuojami su užsakovu ir projektuotojais, fiksuojami vienoje lentelėje ir, jei aktualu, siunčiami visiems dalyviams.',
  },
  {
    n: 5,
    title: 'Pirminių pasiūlymų gavimas',
    short: 'Pasiūlymai',
    description:
      'Pasibaigus terminui registruojami rangovų pirminiai pasiūlymai: kaina, sąmata, grafikas, pastabos sutarčiai, išlygos ir kvalifikacijos dokumentai.',
  },
  {
    n: 6,
    title: 'Pirminė pasiūlymų analizė',
    short: 'Analizė',
    description:
      'Nustatoma, kurie pasiūlymai atitinka sąlygas, yra palyginami ir gali būti įtraukiami į derybų procesą.',
  },
  {
    n: 7,
    title: 'Komercinės ir teisinės derybos',
    short: 'Derybos',
    description:
      'Derybos vykdomos dviem kryptimis: komercinės (kaina, įkainiai, apimtys, grafikas) ir teisinės (sutarties sąlygos). Galimi 1–3 derybų ratai.',
  },
  {
    n: 8,
    title: 'Pasiūlymų suvienodinimas',
    short: 'Suvienodinimas',
    description:
      'Visų rangovų pasiūlymai suvienodinami, kad būtų palyginami pagal vienodą apimtį, sąlygas ir kainos struktūrą.',
  },
  {
    n: 9,
    title: 'Patikslintų sąlygų išsiuntimas',
    short: 'Patikslinimai',
    description:
      'Rangovams siunčiamos patikslintos sąlygos ir prašymas pateikti atnaujintą arba galutinį pasiūlymą.',
  },
  {
    n: 10,
    title: 'Finalinių pasiūlymų gavimas',
    short: 'Finaliniai',
    description:
      'Po paskutinio derybų rato registruojami finaliniai pasiūlymai – galutinis rangovo įsipareigojimas pagal suvienodintas sąlygas.',
  },
  {
    n: 11,
    title: 'Vertinimas pagal metodiką',
    short: 'Vertinimas',
    description:
      'Finaliniai pasiūlymai vertinami pagal 6 kriterijus su svoriais: kaina, laiko kaina, terminai, sutarties pastabos, atestacija ir patikimumas.',
  },
  {
    n: 12,
    title: 'Rangovo pasirinkimas',
    short: 'Pasirinkimas',
    description:
      'Pasirenkamas optimaliausias rangovas – ne vien pagal mažiausią kainą, o pagal bendrą naudą ir riziką. Paruošiamas sprendimo pagrindimas.',
  },
  {
    n: 13,
    title: 'Istorinių duomenų kaupimas',
    short: 'Istorija',
    description:
      'Visa pirkimo eiga išsaugoma kaip istoriniai duomenys, kurie formuoja pirkimų duomenų branduolį būsimiems pirkimams.',
  },
];

export interface DocTypeMeta {
  key: string;
  title: string;
  description: string;
}

export const DOC_TYPES: DocTypeMeta[] = [
  {
    key: 'technical',
    title: 'Techninė dokumentacija',
    description: 'Projektinė dokumentacija, brėžiniai, techniniai sprendiniai, modeliai, aiškinamieji raštai.',
  },
  {
    key: 'conditions',
    title: 'Konkurso pirkimo sąlygos',
    description: 'Konkurso eiga, terminai, pateikimo tvarka, vertinimo principai, reikalaujami dokumentai.',
  },
  {
    key: 'priceForm',
    title: 'Kainos pasiūlymo forma / biudžetas',
    description: 'Iš anksto paruošta kainos pateikimo forma rangovų komerciniams pasiūlymams.',
  },
  {
    key: 'nda',
    title: 'Konfidencialumo įsipareigojimas',
    description: 'Projektinės, komercinės ir kitos jautrios informacijos konfidencialumas.',
  },
  {
    key: 'contract',
    title: 'Rangos darbų sutarties projektas',
    description: 'Sutarties sąlygų bazė rangovų pastaboms ir teisinėms deryboms.',
  },
  {
    key: 'insurance',
    title: 'Statybos visų rizikų draudimo sąlygos',
    description: 'Reikalavimai draudimui projekto įgyvendinimo metu.',
  },
  {
    key: 'solutions',
    title: 'Projekto sprendinių aprašymas',
    description: 'Pagrindiniai projektiniai, techniniai ir organizaciniai sprendiniai.',
  },
  {
    key: 'qaForm',
    title: 'Klausimų–atsakymų forma',
    description: 'Šablonas rangovų klausimams ir užsakovo atsakymams.',
  },
  {
    key: 'bim',
    title: 'Reikalavimai 3D modeliui TDP stadijai',
    description: 'Modeliavimo, informacijos struktūros ir modelio pateikimo kokybės reikalavimai.',
  },
  {
    key: 'protocol',
    title: 'Komercinės dalies susitikimo protokolo šablonas',
    description: 'Derybose fiksuojami komerciniai, sutartiniai ir terminų susitarimai.',
  },
];

export const QA_TOPICS = [
  'Techninė dokumentacija',
  'Projekto sprendiniai',
  'Darbų apimtys',
  'Sutarties sąlygos',
  'Kainos pasiūlymo forma',
  'Terminai',
  'Draudimas',
  '3D modelio reikalavimai',
  'Kitos konkurso sąlygos',
];

export const RELATED_DOCS = ['Brėžinys', 'Sąmata', 'Sutartis', 'Konkurso sąlygos', '3D modelis', 'Draudimo sąlygos', 'Kita'];

export const ANALYSIS_CHECKS: { key: string; label: string }[] = [
  { key: 'onTime', label: 'Pasiūlymas pateiktas laiku' },
  { key: 'docs', label: 'Pateikti visi privalomi dokumentai' },
  { key: 'priceForm', label: 'Užpildyta kainos pasiūlymo forma' },
  { key: 'compliance', label: 'Nėra esminių neatitikimų konkurso sąlygoms' },
  { key: 'comparable', label: 'Kaina palyginama su kitais pasiūlymais' },
  { key: 'reservations', label: 'Išlygos neturi esminės įtakos kainai, terminams ar rizikai' },
  { key: 'qualification', label: 'Rangovas atitinka kvalifikacinius reikalavimus' },
];

export const COMMERCIAL_TOPICS = [
  'Bendra kaina',
  'Atskiros sąmatos pozicijos',
  'Preliminarūs / neapibrėžti įkainiai',
  'Įtraukti ir neįtraukti darbai',
  'Alternatyvūs sprendiniai',
  'Laiko grafikas',
  'Mokėjimo sąlygos',
  'Kainos indeksavimas / fiksavimas',
  'Rizikų paskirstymas',
];

export const LEGAL_TOPICS = [
  'Rangos sutarties sąlygos',
  'Atsakomybės',
  'Garantijos',
  'Delspinigiai',
  'Draudimas',
  'Force majeure',
  'Sutarties nutraukimas',
  'Papildomų darbų valdymas',
  'Atsiskaitymo mechanizmas',
  'Ginčų sprendimas',
];

export const LEVELING_AREAS = [
  'Darbų apimtis',
  'Įtraukti / neįtraukti darbai',
  'Techninės išlygos',
  'Komercinės sąlygos',
  'Sutartinės išlygos',
  'Terminai',
  'Grafiko prielaidos',
  'Kainos struktūra',
  'Alternatyvūs pasiūlymai',
  'Papildomos rizikos',
];

export const CLARIFICATION_ITEMS: { key: string; label: string; placeholder: string }[] = [
  { key: 'scope', label: 'Patikslintos apimtys', placeholder: 'Pvz., į apimtį įtraukiami lauko tinklai iki sklypo ribos…' },
  { key: 'answers', label: 'Atsakymai į esminius klausimus', placeholder: 'Svarbiausi K&A etapo atsakymai…' },
  { key: 'corrections', label: 'Komercinės ir techninės korekcijos', placeholder: 'Sąmatos pozicijų, sprendinių korekcijos…' },
  { key: 'conditions', label: 'Suvienodintos sąlygos', placeholder: 'Vienodos sutarties, mokėjimo, garantijų sąlygos…' },
  { key: 'assumptions', label: 'Derybų metu sutartos prielaidos', placeholder: 'Grafiko, rizikų, kainos fiksavimo prielaidos…' },
];

export interface CriterionMeta {
  key: CriterionKey;
  title: string;
  description: string;
}

export const CRITERIA: CriterionMeta[] = [
  {
    key: 'price',
    title: 'Kaina',
    description: 'Bendra suma, kainos struktūra, sąmatos pagrįstumas, skirtumas nuo biudžeto ir kitų pasiūlymų.',
  },
  {
    key: 'timeCost',
    title: 'Laiko kaina',
    description: 'Finansinė grafiko įtaka: kaina + trukmė × užsakovo mėnesio išlaidos.',
  },
  {
    key: 'schedule',
    title: 'Terminai',
    description: 'Darbų trukmė, etapų logika, mobilizacija, kritinis kelias, grafiko realistiškumas.',
  },
  {
    key: 'contract',
    title: 'Sutarties pastabos',
    description: 'Nukrypimai nuo sutarties projekto ir papildoma rizika užsakovui.',
  },
  {
    key: 'qualification',
    title: 'Atestacija',
    description: 'Atestatai, kvalifikacija, patirtis, specialistai ir teisė vykdyti darbus.',
  },
  {
    key: 'reliability',
    title: 'Patikimumas',
    description: 'Ankstesnė patirtis, kokybė, finansinis stabilumas, reputacija.',
  },
];

export const DEFAULT_WEIGHTS: Record<CriterionKey, number> = {
  price: 40,
  timeCost: 15,
  schedule: 10,
  contract: 15,
  qualification: 10,
  reliability: 10,
};

export const SELECTION_FACTORS: { key: string; label: string }[] = [
  { key: 'price', label: 'Kaina' },
  { key: 'terms', label: 'Terminai' },
  { key: 'contract', label: 'Sutartinės sąlygos' },
  { key: 'reliability', label: 'Rangovo patikimumas' },
  { key: 'qualification', label: 'Kvalifikacija' },
  { key: 'risk', label: 'Rizikų valdymas' },
  { key: 'completeness', label: 'Pasiūlymo pilnumas' },
  { key: 'feasibility', label: 'Įgyvendinimo tikimybė pagal grafiką ir biudžetą' },
];

export const HISTORY_GOALS = [
  'Greičiau formuoti rangovų sąrašus',
  'Palyginti kainas tarp projektų',
  'Analizuoti rangovų elgseną derybose',
  'Matyti realų kainos sumažėjimą po derybų',
  'Vertinti rangovų patikimumą',
  'Automatizuoti pirkimo dokumentų generavimą',
  'Kurti kainų, terminų ir rizikų palyginimo modelį',
];

export const ALGORITHM_GOALS = [
  'Vienodai organizuoti generalinės rangos konkursus',
  'Centralizuotai valdyti visus pirkimo dokumentus',
  'Sistemingai rinkti rangovų pasiūlymus',
  'Struktūruotai vykdyti derybas',
  'Objektyviai palyginti rangovus',
  'Pagrįstai pasirinkti laimėtoją',
  'Kaupti istorinius duomenis būsimiems pirkimams',
  'Mažinti priklausomybę nuo individualios darbuotojų patirties',
  'Formuoti ilgalaikę rangovų, kainų ir rizikų duomenų bazę',
];
