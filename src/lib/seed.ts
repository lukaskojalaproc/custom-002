import { ANALYSIS_CHECKS, DEFAULT_WEIGHTS, DOC_TYPES, SELECTION_FACTORS } from './constants';
import { contractorMap, evaluate, leveledPrice, negotiationIds, openLegalCount } from './calc';
import { addDays, isoDate } from './format';
import type {
  AppState,
  ClauseStatus,
  Contractor,
  NegotiationRound,
  PackageDoc,
  ProjectType,
  Question,
  Tender,
} from './types';

export const STATE_VERSION = 4;

/* Demo data is generated relative to "today" so deadlines always look current. */
const T0 = isoDate();
const d = (offset: number) => addDays(T0, offset);

function rng(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const roundK = (n: number) => Math.round(n / 1000) * 1000;

/* ---------------- contractors (fictional) ---------------- */

const YP = 'Ypatingų statinių statybos atestatas';
const NYP = 'Neypatingų statinių statybos atestatas';

function contractor(
  id: string,
  name: string,
  city: string,
  specializations: ProjectType[],
  reliability: Contractor['reliability'],
  certs: [string, number][],
  extra: Partial<Contractor>,
): Contractor {
  const slug = name
    .replace(/^UAB\s*/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z]/g, '')
    .slice(0, 14);
  return {
    id,
    name,
    companyCode: `30${(Number(id.slice(1)) * 7919 + 1234567).toString().slice(0, 7)}`,
    city,
    specializations,
    reliability,
    certifications: certs.map(([n, off]) => ({ name: n, validUntil: d(off) })),
    contactPerson: '',
    email: `pirkimai@${slug}.lt`,
    phone: `+370 6${(Number(id.slice(1)) * 1234567).toString().slice(0, 7)}`,
    employees: 120,
    revenueM: 40,
    source: 'Ankstesnis konkursas',
    marketInfo: '',
    notes: '',
    addedAt: d(-900),
    ...extra,
  };
}

const CONTRACTORS: Contractor[] = [
  contractor('c1', 'UAB „Statybų linija“', 'Vilnius', ['Komercinis', 'Viešasis', 'Gyvenamasis'], 'aukštas',
    [[YP, 540], ['ISO 9001', 400], ['ISO 45001', 400]],
    { contactPerson: 'Mindaugas Jonaitis', employees: 420, revenueM: 118, marketInfo: 'Stabili apyvartos augimo tendencija, 3 dideli komerciniai objektai Vilniuje.', notes: 'Stipri projektų valdymo komanda.' }),
  contractor('c2', 'UAB „Nerijos rangos grupė“', 'Klaipėda', ['Viešbučių / turizmo', 'Gyvenamasis', 'Komercinis'], 'vidutinis',
    [[YP, 210], ['ISO 9001', 300]],
    { contactPerson: 'Rasa Lukošienė', employees: 180, revenueM: 46, source: 'Rinkos informacija', marketInfo: 'Aktyvi Vakarų Lietuvos rinkoje, patirtis viešbučių statyboje.' }),
  contractor('c3', 'UAB „Baltic Build Partners“', 'Vilnius', ['Komercinis', 'Logistikos / pramoninis'], 'aukštas',
    [[YP, 700], ['ISO 9001', 500], ['ISO 14001', 500], ['ISO 45001', 500]],
    { contactPerson: 'Andrius Vaitkus', employees: 510, revenueM: 164, marketInfo: 'Tarptautinės grupės dukterinė įmonė, BREEAM patirtis.' }),
  contractor('c4', 'UAB „Kauno statybų centras“', 'Kaunas', ['Gyvenamasis', 'Komercinis', 'Logistikos / pramoninis'], 'vidutinis',
    [[YP, 90], ['ISO 9001', 120]],
    { contactPerson: 'Darius Mockus', employees: 260, revenueM: 71, notes: 'Atestato galiojimas baigiasi per 3 mėn. – sekti.' }),
  contractor('c5', 'UAB „Monolitas LT“', 'Kaunas', ['Logistikos / pramoninis', 'Gyvenamasis'], 'aukštas',
    [[YP, 480], ['ISO 9001', 480], ['ISO 45001', 200]],
    { contactPerson: 'Gintarė Petrulienė', employees: 300, revenueM: 88, marketInfo: 'Stipri monolitinių konstrukcijų kompetencija.' }),
  contractor('c6', 'UAB „Aukštaitijos rangovas“', 'Panevėžys', ['Viešasis', 'Gyvenamasis'], 'vidutinis',
    [[NYP, 330], [YP, 330]],
    { contactPerson: 'Vytautas Kairys', employees: 140, revenueM: 32, source: 'Rekomendacija' }),
  contractor('c7', 'UAB „Vakarų konstrukcija“', 'Klaipėda', ['Logistikos / pramoninis', 'Viešbučių / turizmo'], 'žemas',
    [[YP, 160]],
    { contactPerson: 'Karolis Šimkus', employees: 95, revenueM: 21, notes: 'Ankstesniame projekte vėlavo 2 mėn.', marketInfo: 'Finansiniai rodikliai silpnėja.' }),
  contractor('c8', 'UAB „Tvirtas pamatas“', 'Vilnius', ['Viešasis', 'Komercinis'], 'vidutinis',
    [[YP, 600], ['ISO 9001', 250]],
    { contactPerson: 'Laura Žukauskienė', employees: 220, revenueM: 54 }),
  contractor('c9', 'UAB „Nordic Construct LT“', 'Vilnius', ['Komercinis', 'Viešbučių / turizmo'], 'aukštas',
    [[YP, 820], ['ISO 9001', 600], ['ISO 14001', 600]],
    { contactPerson: 'Erikas Lindqvist', employees: 380, revenueM: 132, source: 'Rinkos informacija', marketInfo: 'Skandinaviška kokybės sistema, stiprus biurų segmente.' }),
  contractor('c10', 'UAB „Žalgirio statyba“', 'Kaunas', ['Gyvenamasis', 'Logistikos / pramoninis'], 'vidutinis',
    [[YP, 260], ['ISO 45001', 260]],
    { contactPerson: 'Paulius Grigas', employees: 170, revenueM: 39 }),
  contractor('c11', 'UAB „Dzūkijos statybos“', 'Alytus', ['Viešasis', 'Gyvenamasis'], 'vidutinis',
    [[NYP, 400], [YP, 400], ['Kultūros paveldo statinių atestatas', 400]],
    { contactPerson: 'Asta Mikalauskė', employees: 110, revenueM: 25, source: 'Rangovo iniciatyva' }),
  contractor('c12', 'UAB „Šiaulių rangos namai“', 'Šiauliai', ['Komercinis', 'Viešasis'], 'žemas',
    [[YP, -24]],
    { contactPerson: 'Tadas Butkus', employees: 80, revenueM: 17, notes: 'Atestatas nebegalioja – prieš kviečiant pareikalauti atnaujinto.' }),
  contractor('c13', 'UAB „Urban Rangovas“', 'Vilnius', ['Komercinis', 'Gyvenamasis', 'Viešasis'], 'aukštas',
    [[YP, 380], ['ISO 9001', 380], ['ISO 14001', 380]],
    { contactPerson: 'Simona Rimkutė', employees: 290, revenueM: 97 }),
  contractor('c14', 'UAB „Pramonės statiniai“', 'Kaunas', ['Logistikos / pramoninis'], 'aukštas',
    [[YP, 450], ['ISO 9001', 450]],
    { contactPerson: 'Rimantas Olšauskas', employees: 240, revenueM: 76, marketInfo: 'Specializacija – sandėliai, gamyklos, šaldymo centrai.' }),
];

/* ---------------- content banks ---------------- */

const QUESTION_BANK: Omit<Question, 'id' | 'contractorId' | 'askedAt' | 'answeredAt' | 'sentToAll'>[] = [
  { category: 'Techninis', topic: 'Techninė dokumentacija', relatedDoc: 'Brėžinys', text: 'Brėžinyje A-104 ir specifikacijoje nesutampa langų kiekiai. Kuris dokumentas yra prioritetinis?', answer: 'Prioritetas teikiamas brėžiniams. Patikslinta specifikacija įkelta į dokumentų paketą (v2).' },
  { category: 'Komercinis', topic: 'Kainos pasiūlymo forma', relatedDoc: 'Sąmata', text: 'Ar kainos formos eilutė 3.4 „Laikinieji statiniai“ turi apimti statybvietės apsaugą?', answer: 'Taip, statybvietės apsauga įtraukiama į 3.4 eilutę.' },
  { category: 'Teisinis', topic: 'Sutarties sąlygos', relatedDoc: 'Sutartis', text: 'Ar užsakovas sutiktų delspinigius riboti 10 % sutarties kainos?', answer: 'Delspinigių ribojimas bus svarstomas derybų metu. Pasiūlymą teikite pagal pateiktą projektą.' },
  { category: 'Techninis', topic: 'Darbų apimtys', relatedDoc: 'Brėžinys', text: 'Ar į apimtį įeina lauko inžinerinių tinklų prijungimo darbai iki sklypo ribos?', answer: 'Taip, iki sklypo ribos. Prisijungimo mokesčius tinklų operatoriams moka užsakovas.' },
  { category: 'Teisinis', topic: 'Draudimas', relatedDoc: 'Draudimo sąlygos', text: 'Ar statybos visų rizikų draudimo išskaita gali būti 10 000 EUR vietoje 5 000 EUR?', answer: 'Ne, išskaita lieka 5 000 EUR.' },
  { category: 'Techninis', topic: '3D modelio reikalavimai', relatedDoc: '3D modelis', text: 'Kokiu formatu ir detalumo lygiu turi būti pateikiamas TDP modelis?', answer: 'IFC 4 formatu, LOD 300 architektūrai ir konstrukcijoms, LOD 250 inžinerinėms sistemoms.' },
  { category: 'Komercinis', topic: 'Terminai', relatedDoc: 'Konkurso sąlygos', text: 'Ar galima pratęsti pasiūlymo pateikimo terminą 5 darbo dienomis?', answer: 'Terminas nekeičiamas.' },
  { category: 'Techninis', topic: 'Projekto sprendiniai', relatedDoc: 'Brėžinys', text: 'Ar požeminės automobilių stovėjimo aikštelės hidroizoliacija numatyta „baltos vonios“ principu?', answer: 'Taip, numatyta vandeniui nelaidaus betono konstrukcija su papildoma membrana sandūrose.' },
  { category: 'Komercinis', topic: 'Kitos konkurso sąlygos', relatedDoc: 'Konkurso sąlygos', text: 'Ar privaloma pateikti banko garantiją pasiūlymo užtikrinimui?', answer: 'Pasiūlymo užtikrinimas nereikalaujamas. Sutarties įvykdymo garantija – 5 %.' },
  { category: 'Teisinis', topic: 'Sutarties sąlygos', relatedDoc: 'Sutartis', text: 'Ar numatytas kainos indeksavimas pagal statybos sąnaudų indeksą?', answer: 'Indeksavimas taikomas tik medžiagoms, kai pokytis viršija 5 %.' },
  { category: 'Komercinis', topic: 'Kainos pasiūlymo forma', relatedDoc: 'Sąmata', text: 'Ar sąmatoje reikia išskirti generalinio rangovo valdymo išlaidas atskira eilute?', answer: 'Taip, prašome išskirti atskira eilute 1.2.' },
  { category: 'Techninis', topic: 'Darbų apimtys', relatedDoc: 'Brėžinys', text: 'Ar vidaus apdailos darbai nuomininkų patalpose įeina į apimtį?', answer: 'Ne, nuomininkų patalpos perduodamos „shell & core“ būklės.' },
  { category: 'Teisinis', topic: 'Draudimas', relatedDoc: 'Draudimo sąlygos', text: 'Ar reikalingas profesinės civilinės atsakomybės draudimas projektavimo daliai?', answer: 'Taip, ne mažesnis nei 500 000 EUR draudimo suma.' },
  { category: 'Techninis', topic: 'Techninė dokumentacija', relatedDoc: 'Brėžinys', text: 'Ar bus pateikti geologinių tyrimų duomenys papildomiems gręžiniams?', answer: 'Papildomų gręžinių ataskaita įkelta į dokumentų paketą.' },
];

const COMMERCIAL_BANK = [
  { topic: 'Bendra kaina', agreement: 'Sutarta taikyti bendrą nuolaidą visai sutarties kainai', pct: -0.018 },
  { topic: 'Atskiros sąmatos pozicijos', agreement: 'Peržiūrėti monolitinių konstrukcijų ir armatūros įkainiai', pct: -0.012 },
  { topic: 'Preliminarūs / neapibrėžti įkainiai', agreement: 'Preliminarios sumos pakeistos fiksuotais įkainiais pagal specifikaciją', pct: -0.008 },
  { topic: 'Įtraukti ir neįtraukti darbai', agreement: 'Į apimtį įtrauktas teritorijos sutvarkymas ir želdiniai', pct: 0.004 },
  { topic: 'Alternatyvūs sprendiniai', agreement: 'Priimtas lygiavertis fasado sistemos sprendinys', pct: -0.01 },
  { topic: 'Laiko grafikas', agreement: 'Mobilizacija per 3 savaites, grafikas suderintas su užsakovu', pct: 0 },
  { topic: 'Mokėjimo sąlygos', agreement: 'Mokėjimas per 30 d. nuo atliktų darbų akto, be avanso', pct: -0.003 },
  { topic: 'Kainos indeksavimas / fiksavimas', agreement: 'Kaina fiksuojama visam sutarties laikotarpiui', pct: 0.002 },
  { topic: 'Rizikų paskirstymas', agreement: 'Geologinių sąlygų rizika lieka užsakovui', pct: -0.006 },
];

const LEGAL_BANK = [
  { topic: 'Atsakomybės', original: 'Rangovas atsako už visus tiesioginius ir netiesioginius nuostolius.', proposed: 'Atsakomybė ribojama 50 % sutarties kainos, netiesioginiai nuostoliai neatlyginami.', agreed: 'Atsakomybė ribojama 100 % sutarties kainos, netiesioginiai nuostoliai neatlyginami.' },
  { topic: 'Garantijos', original: 'Garantinis laikotarpis – 10 metų paslėptiems defektams.', proposed: 'Garantinis laikotarpis – 5 metai.', agreed: '10 metų paslėptiems defektams, 5 metai apdailai.' },
  { topic: 'Delspinigiai', original: '0,1 % nuo sutarties kainos už kiekvieną pavėluotą dieną.', proposed: '0,02 % per dieną, bet ne daugiau kaip 5 %.', agreed: '0,05 % per dieną, bet ne daugiau kaip 10 %.' },
  { topic: 'Draudimas', original: 'Rangovas apdraudžia statybos visų rizikų draudimu 100 % vertės.', proposed: 'Draudimą organizuoja užsakovas.', agreed: 'Draudžia rangovas, išskaita 5 000 EUR.' },
  { topic: 'Force majeure', original: 'Taikoma pagal CK 6.212 str.', proposed: 'Įtraukti pandemiją ir medžiagų tiekimo sutrikimus.', agreed: 'Įtraukti tiekimo sutrikimai, jei jie dokumentais įrodomi.' },
  { topic: 'Sutarties nutraukimas', original: 'Užsakovas gali nutraukti sutartį be priežasties, įspėjęs prieš 30 d.', proposed: 'Kompensuojamas 10 % negautas pelnas.', agreed: 'Kompensuojamos faktiškai patirtos išlaidos ir demobilizacija.' },
  { topic: 'Papildomų darbų valdymas', original: 'Papildomi darbai – tik raštišku užsakovo sutikimu.', proposed: 'Papildomų darbų įkainiai pagal rinkos kainas.', agreed: 'Pagal sutarties įkainius, nesant – derinama su užsakovu.' },
  { topic: 'Atsiskaitymo mechanizmas', original: 'Mokėjimas per 60 d. nuo akto pasirašymo.', proposed: 'Mokėjimas per 30 d.', agreed: 'Mokėjimas per 45 d.' },
  { topic: 'Ginčų sprendimas', original: 'Ginčai sprendžiami Lietuvos Respublikos teismuose.', proposed: 'Ginčai sprendžiami Vilniaus komerciniame arbitražo teisme.', agreed: 'Teismuose, prieš tai – privalomos 30 d. derybos.' },
  { topic: 'Rangos sutarties sąlygos', original: 'Rangovas prisiima projektinių klaidų riziką.', proposed: 'Projekto klaidų rizika – užsakovo.', agreed: 'Bendra rizika iki 2 % sutarties kainos.' },
];

const LEVELING_BANK = [
  { area: 'Darbų apimtis', description: 'Lauko inžineriniai tinklai iki sklypo ribos', pct: 0.006 },
  { area: 'Įtraukti / neįtraukti darbai', description: 'Teritorijos sutvarkymas ir želdiniai', pct: 0.004 },
  { area: 'Techninės išlygos', description: 'Fasado sistema – lygiavertė alternatyva', pct: -0.003 },
  { area: 'Komercinės sąlygos', description: 'Statybvietės apsauga ir laikinieji statiniai', pct: 0.002 },
  { area: 'Grafiko prielaidos', description: 'Žiemos darbų priemonės (šildymas, apsauga)', pct: 0.003 },
  { area: 'Kainos struktūra', description: 'Generalinio rangovo valdymo išlaidos išskirtos atskirai', pct: 0 },
  { area: 'Papildomos rizikos', description: 'Geologinių sąlygų rizikos rezervas', pct: 0.005 },
];

const RISKS = [
  'Fasado sistemos tiekimo terminų rizika',
  'Ribotas pajėgumas žiemos sezonu',
  'Didelė priklausomybė nuo monolito subrangovo',
  'Reikšmingų rizikų nenustatyta',
  'Įtemptas grafikas kritiniame kelyje',
];

const FILE_NAMES: Record<string, string[]> = {
  technical: ['TP_architektura.pdf', 'TP_konstrukcijos.pdf', 'TP_inzinerija.zip'],
  conditions: ['Konkurso_salygos.pdf'],
  priceForm: ['Kainos_forma.xlsx'],
  nda: ['Konfidencialumo_isipareigojimas.docx'],
  contract: ['Rangos_sutarties_projektas.docx'],
  insurance: ['CAR_draudimo_salygos.pdf'],
  solutions: ['Projekto_sprendiniu_aprasymas.pdf'],
  qaForm: ['KA_forma.xlsx'],
  bim: ['BIM_reikalavimai_TDP.pdf'],
  protocol: ['Komercinio_susitikimo_protokolas.docx'],
};

/* ---------------- tender builder ---------------- */

interface TenderCfg {
  id: string;
  code: string;
  name: string;
  projectType: ProjectType;
  location: string;
  areaM2: number;
  budgetNet: number;
  manager: string;
  description: string;
  created: number;
  invited: string[];
  declined?: string[];
  noResponse?: string[];
  rejected?: string[];
  factors: Record<string, number>;
  durations: Record<string, number>;
  /** Step the tender is currently on; 14 = fully completed and archived. */
  step: number;
  rounds: number;
  seed: number;
}

function buildDocs(t: TenderCfg, r: () => number): PackageDoc[] {
  return DOC_TYPES.map((dt, i) => {
    let status: PackageDoc['status'] = 'paruošta';
    if (t.step <= 1) status = 'nepradėta';
    else if (t.step === 2) status = i < 6 ? 'paruošta' : i < 8 ? 'rengiama' : 'nepradėta';
    const files =
      status === 'nepradėta'
        ? []
        : FILE_NAMES[dt.key].map((name, j) => ({
            id: `${t.id}_f${i}_${j}`,
            name,
            size: Math.round(200_000 + r() * 9_000_000),
            uploadedAt: d(t.created + 3 + i),
            version: status === 'paruošta' && r() > 0.7 ? 2 : 1,
          }));
    return { key: dt.key, status, files };
  });
}

function buildTender(cfg: TenderCfg, contractors: Record<string, Contractor>): Tender {
  const r = rng(cfg.seed);
  const done = (n: number) => cfg.step > n;
  const createdAt = d(cfg.created);
  const sentAt = d(cfg.created + 14);
  const questionsDeadline = d(cfg.created + 35);
  const offerDeadline = d(cfg.created + 49);
  const declined = cfg.declined ?? [];
  const noResponse = cfg.noResponse ?? [];
  const rejected = cfg.rejected ?? [];
  const submitting = cfg.invited.filter((c) => !declined.includes(c) && !noResponse.includes(c));
  const activity: Tender['activity'] = [{ at: createdAt, text: 'Pirkimas sukurtas' }];

  const t: Tender = {
    id: cfg.id,
    code: cfg.code,
    name: cfg.name,
    projectType: cfg.projectType,
    location: cfg.location,
    areaM2: cfg.areaM2,
    budgetNet: cfg.budgetNet,
    manager: cfg.manager,
    description: cfg.description,
    createdAt,
    currentStep: Math.min(cfg.step, 13),
    completedSteps: Array.from({ length: Math.min(cfg.step - 1, 13) }, (_, i) => i + 1),
    participants: [],
    documents: buildDocs(cfg, r),
    invitation: {
      sentAt: done(3) ? sentAt : undefined,
      offerDeadline,
      questionsDeadline,
      message:
        'Kviečiame dalyvauti generalinės rangos konkurse. Pirkimo dokumentus rasite pateiktoje nuorodoje. Klausimus prašome teikti per klausimų–atsakymų formą iki nurodyto termino.',
    },
    questions: [],
    initialOffers: [],
    analysis: {},
    rounds: [],
    leveling: [],
    finalOffers: [],
    evaluation: { weights: { ...DEFAULT_WEIGHTS }, monthlyTimeCost: roundK(cfg.budgetNet * 0.004), overrides: {} },
    selection: { justification: '', considerations: {} },
    activity,
  };

  // 1 & 3 – participants
  t.participants = cfg.invited.map((cid) => {
    if (!done(3)) return { contractorId: cid, status: 'atrinktas' as const };
    if (declined.includes(cid))
      return { contractorId: cid, status: 'atsisakė' as const, respondedAt: d(cfg.created + 16 + Math.floor(r() * 5)), reason: 'Nepakanka pajėgumų nurodytu laikotarpiu' };
    if (noResponse.includes(cid)) return { contractorId: cid, status: 'pakviestas' as const };
    return {
      contractorId: cid,
      status: done(5) ? ('pateikė' as const) : ('patvirtino' as const),
      respondedAt: d(cfg.created + 15 + Math.floor(r() * 5)),
    };
  });
  if (done(1)) activity.push({ at: d(cfg.created + 2), text: `Sudarytas rangovų sąrašas (${cfg.invited.length})` });
  if (done(2)) activity.push({ at: d(cfg.created + 12), text: 'Pirkimo dokumentų paketas paruoštas' });
  if (done(3)) activity.push({ at: sentAt, text: `Kvietimas išsiųstas ${cfg.invited.length} rangovams` });

  // 4 – questions
  if (cfg.step >= 4) {
    const askers = cfg.invited.filter((c) => !declined.includes(c));
    const count = cfg.step === 4 ? 7 : 9 + Math.floor(r() * 4);
    const offset = Math.floor(r() * QUESTION_BANK.length);
    for (let i = 0; i < count; i++) {
      const q = QUESTION_BANK[(offset + i) % QUESTION_BANK.length];
      const askedOff = cfg.step === 4 ? cfg.created + 16 + i * 2 : cfg.created + 16 + Math.floor((i / count) * 18);
      const unanswered = cfg.step === 4 && i >= 4;
      const askedAt = d(Math.min(askedOff, cfg.step === 4 ? 0 : askedOff));
      t.questions.push({
        id: `${cfg.id}_q${i}`,
        contractorId: askers[i % askers.length],
        askedAt,
        category: q.category,
        topic: q.topic,
        text: q.text,
        relatedDoc: q.relatedDoc,
        answer: unanswered ? undefined : q.answer,
        answeredAt: unanswered ? undefined : addDays(askedAt, 2 + Math.floor(r() * 3)),
        sentToAll: !unanswered && q.category !== 'Teisinis' ? true : !unanswered && r() > 0.5,
      });
    }
    if (done(4)) activity.push({ at: questionsDeadline, text: `Klausimų etapas baigtas (${count} klausimai)` });
  }

  // 5 – initial offers
  if (done(5)) {
    t.initialOffers = submitting.map((cid) => {
      const isRejected = rejected.includes(cid);
      return {
        contractorId: cid,
        receivedAt: d(cfg.created + 47 + Math.floor(r() * 3)),
        priceNet: roundK(cfg.budgetNet * cfg.factors[cid]),
        durationMonths: cfg.durations[cid],
        estimate: isRejected ? 'nepilna' : 'pateikta',
        schedule: 'pateiktas',
        contractRemarks: r() > 0.25,
        technicalReservations: r() > 0.55,
        qualificationDocs: isRejected ? 'trūksta' : 'pateikti',
        status: isRejected ? 'atmestinas' : r() < 0.3 ? 'tikslintinas' : 'tinkamas',
        notes: isRejected ? 'Nepateiktas galiojantis ypatingų statinių atestatas, sąmata užpildyta ne pilnai.' : '',
      };
    });
    activity.push({ at: offerDeadline, text: `Gauti ${t.initialOffers.length} pirminiai pasiūlymai` });
  }

  // 6 – analysis
  if (done(6)) {
    t.initialOffers.forEach((o) => {
      const isRejected = rejected.includes(o.contractorId);
      t.analysis[o.contractorId] = {
        checks: Object.fromEntries(
          ANALYSIS_CHECKS.map((c) => [c.key, isRejected ? !['docs', 'qualification', 'priceForm'].includes(c.key) : true]),
        ),
        comment: isRejected ? 'Neatitinka kvalifikacinių reikalavimų – į derybas neįtraukiamas.' : 'Atitinka sąlygas, kviečiamas į derybas.',
        toNegotiation: !isRejected,
      };
    });
    activity.push({ at: d(cfg.created + 56), text: 'Pirminė analizė atlikta' });
  }

  // 7 & 9 – negotiation rounds
  if (cfg.step >= 7) {
    const nego = negotiationIds(t);
    const fullRounds = cfg.step > 9 ? cfg.rounds : 0;
    const totalRounds = Math.max(fullRounds, 1);
    for (let n = 1; n <= totalRounds; n++) {
      const partial = cfg.step === 7;
      const startOff = cfg.created + 58 + (n - 1) * 16;
      const isLast = n === totalRounds;
      const round: NegotiationRound = {
        n,
        startedAt: d(startOff),
        meetingDates: Object.fromEntries(nego.map((cid, i) => [cid, d(startOff + 1 + i)])),
        commercial: [],
        legal: [],
      };
      nego.forEach((cid, ci) => {
        if (partial && ci > 2) return;
        const base = t.initialOffers.find((o) => o.contractorId === cid)!.priceNet;
        // Distinct topics per contractor per round; the first one is always a price reduction.
        const picks = n === 1 ? 3 : 2;
        const reductions = COMMERCIAL_BANK.filter((b) => b.pct < 0);
        const start = Math.floor(r() * COMMERCIAL_BANK.length);
        const chosen = [reductions[(ci + n) % reductions.length], ...COMMERCIAL_BANK.slice(start), ...COMMERCIAL_BANK.slice(0, start)]
          .filter((b, i, arr) => arr.findIndex((x) => x.topic === b.topic) === i)
          .slice(0, picks);
        chosen.forEach((b, k) => {
          round.commercial.push({
            id: `${cfg.id}_r${n}_c${ci}_${k}`,
            contractorId: cid,
            topic: b.topic,
            agreement: b.agreement,
            priceImpact: roundK(base * b.pct * (0.6 + r() * 0.8)),
          });
        });
        for (let k = 0; k < 2; k++) {
          const b = LEGAL_BANK[(ci * 3 + n * 2 + k) % LEGAL_BANK.length];
          const x = r();
          let status: ClauseStatus = 'atvira';
          if (!partial) status = isLast ? (x < 0.8 ? 'sutarta' : x < 0.9 ? 'atmesta' : 'atvira') : x < 0.5 ? 'sutarta' : 'atvira';
          else status = x < 0.35 ? 'sutarta' : 'atvira';
          round.legal.push({ id: `${cfg.id}_r${n}_l${ci}_${k}`, contractorId: cid, ...b, status });
        }
      });
      if (!partial) {
        round.clarification = {
          sentAt: d(startOff + 10),
          deadline: d(startOff + 16),
          items: {
            scope: 'Į apimtį įtraukiami lauko inžineriniai tinklai iki sklypo ribos ir teritorijos sutvarkymas.',
            answers: 'Pridedama atnaujinta klausimų–atsakymų lentelė (esminiai atsakymai pažymėti).',
            corrections: 'Fasado sistema – leidžiama lygiavertė alternatyva; monolito įkainiai pagal suderintą specifikaciją.',
            conditions: 'Mokėjimas per 45 d., garantija 10 m. paslėptiems defektams, delspinigiai 0,05 % (max 10 %).',
            assumptions: 'Geologinė rizika – užsakovo; kaina fiksuojama visam sutarties laikotarpiui.',
          },
        };
      }
      t.rounds.push(round);
      activity.push({ at: round.startedAt, text: `Pradėtas ${n} derybų ratas` });
      if (round.clarification?.sentAt) activity.push({ at: round.clarification.sentAt, text: `Išsiųsta ${n} rato patikslinimų užklausa` });
    }
  }

  // 8 – leveling
  if (done(8)) {
    const nego = negotiationIds(t);
    t.leveling = LEVELING_BANK.map((b, i) => ({
      id: `${cfg.id}_lv${i}`,
      area: b.area,
      description: b.description,
      cells: Object.fromEntries(
        nego.map((cid) => {
          const base = t.initialOffers.find((o) => o.contractorId === cid)!.priceNet;
          const x = r();
          if (b.pct === 0 || x < 0.6) return [cid, { state: 'įtraukta' as const, amount: 0 }];
          if (x < 0.85) return [cid, { state: 'neįtraukta' as const, amount: roundK(Math.abs(b.pct) * base) }];
          return [cid, { state: 'išlyga' as const, amount: roundK(b.pct * base * 0.5) }];
        }),
      ),
    }));
  }

  // 10 – final offers
  if (done(10)) {
    const last = t.rounds[t.rounds.length - 1];
    t.finalOffers = negotiationIds(t).map((cid) => {
      const c = contractors[cid];
      const leveled = leveledPrice(t, cid)!;
      return {
        contractorId: cid,
        receivedAt: last.clarification?.deadline ?? d(cfg.created + 100),
        priceNet: roundK(leveled * (1 - r() * 0.012)),
        durationMonths: Math.max(8, cfg.durations[cid] - (r() > 0.5 ? 1 : 0)),
        contractRemarks: openLegalCount(t, cid) === 0 ? 'panaikintos' : 'likusios',
        risks: RISKS[Math.floor(r() * RISKS.length)],
        certification: c.certifications.some((x) => x.name === YP) ? 'atitinka' : 'neatitinka',
        reliability: c.reliability,
        recommendation: 'svarstyti',
      };
    });
    activity.push({ at: t.finalOffers[0]?.receivedAt ?? createdAt, text: `Gauti ${t.finalOffers.length} finaliniai pasiūlymai` });
  }

  // 11 & 12 – evaluation and selection
  if (done(11)) {
    const ranking = evaluate(t);
    t.finalOffers.forEach((o) => {
      const rank = ranking.find((x) => x.contractorId === o.contractorId)?.rank ?? 99;
      o.recommendation = rank === 1 ? 'kviesti' : rank <= 3 ? 'svarstyti' : 'atmesti';
    });
    const decidedAt = addDays(t.finalOffers[0].receivedAt, 12);
    activity.push({ at: addDays(decidedAt, -5), text: 'Atliktas vertinimas pagal metodiką' });
    if (done(12)) {
      const w = ranking[0];
      const c = contractors[w.contractorId];
      const cheapest = [...ranking].sort((a, b) => a.price - b.price)[0];
      t.selection = {
        winnerId: w.contractorId,
        decidedAt,
        approvedBy: cfg.manager,
        considerations: Object.fromEntries(SELECTION_FACTORS.map((f) => [f.key, true])),
        justification:
          `${c.name} surinko didžiausią bendrą įvertinimą (${w.total.toLocaleString('lt-LT')} balo iš 100). ` +
          (cheapest.contractorId === w.contractorId
            ? 'Pasiūlymas yra ir mažiausios kainos, '
            : 'Nors pasiūlymas nėra mažiausios kainos, ') +
          'rangovas pasižymi aukštu patikimumu, galiojančia atestacija, realistišku grafiku ir minimaliomis likusiomis sutarties išlygomis.',
      };
      activity.push({ at: decidedAt, text: `Pasirinktas rangovas: ${c.name}` });
    }
  }

  if (cfg.step > 13) {
    t.archivedAt = addDays(t.selection.decidedAt ?? createdAt, 3);
    activity.push({ at: t.archivedAt, text: 'Duomenys išsaugoti istorinėje bazėje' });
  }

  t.activity = activity.sort((a, b) => (a.at < b.at ? 1 : -1));
  return t;
}

const TENDERS: TenderCfg[] = [
  {
    id: 't1', code: 'GR-2026-007', name: 'Verslo centras „Neries krantinė“', projectType: 'Komercinis', location: 'Vilnius, Konstitucijos pr.',
    areaM2: 18400, budgetNet: 24_500_000, manager: 'Rūta Kazlauskienė', created: -72, step: 7, rounds: 1, seed: 11,
    description: 'A klasės biurų pastatas su 2 aukštų požemine automobilių stovėjimo aikštele. Siekiamas BREEAM Excellent sertifikatas.',
    invited: ['c1', 'c3', 'c9', 'c13', 'c8', 'c4', 'c12'], declined: ['c12'], noResponse: ['c4'], rejected: ['c8'],
    factors: { c1: 1.04, c3: 1.08, c9: 1.02, c13: 0.98, c8: 0.93 }, durations: { c1: 20, c3: 19, c9: 21, c13: 22, c8: 20 },
  },
  {
    id: 't2', code: 'GR-2026-009', name: 'Gyvenamasis kvartalas „Pušų slėnis“', projectType: 'Gyvenamasis', location: 'Kaunas, Aukštieji Šančiai',
    areaM2: 12600, budgetNet: 14_200_000, manager: 'Tomas Petrauskas', created: -28, step: 4, rounds: 0, seed: 23,
    description: '4 daugiabučiai gyvenamieji namai (148 butai) su požemine automobilių aikštele ir vidiniu kiemu.',
    invited: ['c4', 'c10', 'c5', 'c11', 'c6', 'c2'], declined: ['c6'],
    factors: {}, durations: {},
  },
  {
    id: 't6', code: 'GR-2026-011', name: 'Viešbutis Klaipėdos senamiestyje', projectType: 'Viešbučių / turizmo', location: 'Klaipėda, Tiltų g.',
    areaM2: 9200, budgetNet: 13_800_000, manager: 'Ieva Stankevičiūtė', created: -6, step: 2, rounds: 0, seed: 37,
    description: '4* viešbutis (160 kambarių) su konferencijų centru, rekonstruojant kultūros paveldo fasadą.',
    invited: ['c2', 'c9', 'c3', 'c11', 'c7'],
    factors: {}, durations: {},
  },
  {
    id: 't3', code: 'GR-2026-003', name: 'Logistikos centras „Via Baltica“', projectType: 'Logistikos / pramoninis', location: 'Kauno r., Ramučiai',
    areaM2: 32000, budgetNet: 19_800_000, manager: 'Tomas Petrauskas', created: -245, step: 14, rounds: 2, seed: 41,
    description: 'A klasės sandėliavimo ir logistikos centras su šaldymo zona ir administracinėmis patalpomis.',
    invited: ['c5', 'c14', 'c4', 'c10', 'c3', 'c7'], declined: ['c7'],
    factors: { c5: 1.01, c14: 0.97, c4: 1.06, c10: 0.99, c3: 1.09 }, durations: { c5: 13, c14: 14, c4: 15, c10: 14, c3: 12 },
  },
  {
    id: 't4', code: 'GR-2025-014', name: 'Mokykla-darželis Pilaitėje', projectType: 'Viešasis', location: 'Vilnius, Pilaitė',
    areaM2: 7800, budgetNet: 9_600_000, manager: 'Ieva Stankevičiūtė', created: -380, step: 14, rounds: 3, seed: 53,
    description: 'Mokykla-darželis 520 vaikų su sporto sale ir baseinu. Pastatas A++ energinio naudingumo klasės.',
    invited: ['c1', 'c8', 'c11', 'c6', 'c13'],
    factors: { c1: 1.07, c8: 1.02, c11: 0.99, c6: 1.05, c13: 1.1 }, durations: { c1: 16, c8: 17, c11: 18, c6: 17, c13: 15 },
  },
  {
    id: 't5', code: 'GR-2025-009', name: 'Biurų pastatas „Šiaurės vartai“', projectType: 'Komercinis', location: 'Vilnius, Šiaurės miestelis',
    areaM2: 11200, budgetNet: 15_300_000, manager: 'Rūta Kazlauskienė', created: -470, step: 14, rounds: 1, seed: 67,
    description: 'B+ klasės biurų pastatas su komercinėmis patalpomis pirmame aukšte.',
    invited: ['c1', 'c3', 'c9', 'c13', 'c2', 'c8'], noResponse: ['c2'],
    factors: { c1: 1.0, c3: 1.05, c9: 0.97, c13: 1.03, c8: 1.08 }, durations: { c1: 17, c3: 16, c9: 18, c13: 17, c8: 19 },
  },
];

export { COMMERCIAL_BANK, LEGAL_BANK };

export function createSeed(): AppState {
  const contractors = CONTRACTORS.map((c) => ({ ...c }));
  const map = contractorMap(contractors);
  return {
    version: STATE_VERSION,
    contractors,
    tenders: TENDERS.map((cfg) => buildTender(cfg, map)),
    user: null,
  };
}
