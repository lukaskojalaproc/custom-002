# ProcFly · Generalinės rangos pirkimai (MVP prototipas)

SaaS sistemos prototipas, įgyvendinantis **generalinės rangos pirkimo algoritmą** – standartizuotą, atsekamą ir duomenimis
pagrįstą procesą nuo rangovų sąrašo sudarymo iki istorinių duomenų kaupimo.

Prototipas skirtas pristatyti potencialiems klientams: jame veikia visa vartotojo sąsaja ir visi 13 algoritmo etapų,
tačiau nėra serverio ir duomenų bazės – duomenys saugomi naršyklėje (localStorage).

## Paleidimas

```bash
npm install
npm run dev
```

Atidarykite <http://localhost:5173/?demo> (`?demo` praleidžia prisijungimo langą).

### Vienas HTML failas (be serverio)

```bash
npm run build:single
```

Sukuriamas `dist-single/index.html` – vienas failas su visu kodu. Jį galima atidaryti dukart spustelėjus arba nusiųsti
klientui. Pridėjus `?demo` prie adreso, prisijungimo langas praleidžiamas.

### Įprastas build (talpinimui, pvz., Netlify / Vercel)

```bash
npm run build
```

Rezultatas – `dist/` katalogas su statiniais failais.

## Talpinimas Coolify (demo klientams)

Prototipas yra statinė svetainė – serverio logikos ir duomenų bazės nereikia. Kiekvieno lankytojo pakeitimai saugomi
**jo paties naršyklės localStorage**: jie išlieka perkrovus puslapį, nėra matomi kitiems lankytojams, o **atsijungus
demo duomenys atkuriami** – kitas pristatymas prasideda nuo švaraus lapo.

1. Įkelkite projektą į Git repozitoriją (GitHub / GitLab / Gitea).
2. Coolify: **+ New → Application → (Public / Private) Repository** ir pasirinkite repozitoriją bei šaką.
3. **Build Pack: Dockerfile** (projekte yra `Dockerfile`: Node build → nginx).
4. **Ports Exposes: `80`**, nurodykite domeną (pvz., `demo.procfly.com`) – Coolify automatiškai sukurs SSL sertifikatą.
5. **Deploy**. Kiekvienas `git push` gali automatiškai perdiegti (įjunkite *Auto Deploy*).

> **Svarbu:** naudokite *Build Pack: Dockerfile*, ne *Nixpacks*. Nixpacks diegia Node 22.11, o Vite 8 reikalauja
> Node ≥ 22.12 – build'as nepavyks. Build Pack keičiamas: *Configuration → General → Build Pack*.

Nuoroda klientui gali būti su `?demo` (pvz., `https://demo.procfly.com/?demo`) – tada prisijungimo langas praleidžiamas.

## Ką rodo prototipas

| Modulis | Aprašymas |
|---|---|
| **Apžvalga** | Aktyvūs pirkimai ir jų eiga, artėjantys terminai, laukiantys veiksmai, pirkimai pagal fazę, veiksmų srautas |
| **Pirkimai** | Visų konkursų sąrašas su filtrais; naujo pirkimo kūrimas |
| **Pirkimo kortelė** | 13 etapų vedlys (žr. žemiau), veiksmų žurnalas, eksportas į JSON |
| **Rangovai** | Rangovų bazė: specializacija, patikimumas, atestacija, dalyvavimo ir derybų istorija, profilis |
| **Istorinė analitika** | Kainos sumažėjimas po derybų, kaina už m², dažniausios sutarties pastabos, rangovų elgsena |
| **Pirkimo algoritmas** | Sistemos ir algoritmo aprašymas, proceso schema, demonstracijos scenarijus |
| **Nustatymai** | Profilis, duomenų eksportas / importas, demo duomenų atkūrimas |

## 13 algoritmo etapų sistemoje

| # | Etapas | Kas įgyvendinta |
|---|---|---|
| 1 | Rangovų sąrašas | Atranka iš istorinės bazės su atitikimo balu (specializacija, patikimumas, atestacija, istorija), atestacijos įspėjimai |
| 2 | Pirkimo paketas | 10 privalomų dokumentų, failų įkėlimas ir versijos, generavimas iš šablono, parengtumo statusai |
| 3 | Kvietimas | Visi specifikacijos laukai, terminų validacija, laiško peržiūra, siuntimas, rangovų atsakymų sekimas |
| 4 | Klausimai–atsakymai | Vieninga K&A lentelė su visais laukais, kategorijos, atsakymų siuntimas visiems dalyviams |
| 5 | Pirminiai pasiūlymai | Registracija su visais laukais (kaina be / su PVM, sąmata, grafikas, išlygos…), palyginimas su biudžetu |
| 6 | Pirminė analizė | 7 kriterijų matrica su automatiniu įvertinimu, sprendimas „į derybas / atmesti“ |
| 7 | Derybos | 1–3 ratai; komercinės (9 temos, poveikis kainai) ir teisinės (10 sąlygų, palyginamoji versija); protokolas ir santrauka spausdinimui / PDF |
| 8 | Suvienodinimas | Apimčių ir sąlygų matrica, korekcijos, suvienodinta kaina |
| 9 | Patikslinimų užklausa | 5 turinio blokai, automatinis užpildymas iš derybų, peržiūra, kitas ratas arba finaliniai pasiūlymai |
| 10 | Finaliniai pasiūlymai | Visi specifikacijos laukai, kainos pokytis nuo pirminio, pirminės vs finalinės kainos grafikas |
| 11 | Vertinimas | 6 kriterijai su keičiamais svoriais, laiko kaina, automatiniai balai ir rankinės korekcijos, reitingas |
| 12 | Pasirinkimas | 8 sprendimo aspektai, įspėjimai (ne lyderis / ne pigiausias), automatinis pagrindimas, sprendimo dokumentas |
| 13 | Istoriniai duomenys | 17 istorinių rodiklių suvestinė, išsaugojimas bazėje, eksportas |

## Demonstracijos scenarijus

1. **Apžvalga** – aktyvūs pirkimai, terminai ir užduotys.
2. **Verslo centras „Neries krantinė“** – vykdomos derybos (7 etapas): pridėkite susitarimą, sugeneruokite protokolą,
   tęskite suvienodinimą, patikslinimus, finalinius pasiūlymus, vertinimą ir pasirinkimą.
3. **Logistikos centras „Via Baltica“** – užbaigtas pirkimas: vertinimas, pagrindimas, istoriniai duomenys.
4. **Rangovų bazė** ir **Istorinė analitika**.
5. Sukurkite naują pirkimą ir pereikite visus 13 etapų nuo nulio.

## Techninė informacija

- React 19 + TypeScript + Vite, `react-router` (HashRouter – veikia ir iš failo), `lucide-react` piktogramos.
- Be UI bibliotekų – ProcFly prekės ženklo stilius (`src/styles.css`): spalvos `#029F74`, `#111A37`, `#B9EDDA`, `#F2F2F2`,
  šriftai Ubuntu ir Roboto.
- Duomenys: `src/lib/store.tsx` (React context + localStorage), demo duomenys `src/lib/seed.ts`
  (generuojami pagal šiandienos datą, kad terminai visada būtų aktualūs).
- Skaičiavimai (kainos, vertinimas, statistika): `src/lib/calc.ts`.
- Etapų ekranai: `src/pages/steps/Step01…Step13`.

## Prototipo ribojimai (kitas etapas)

- Nėra serverio ir duomenų bazės – duomenys matomi tik toje naršyklėje (galima eksportuoti / importuoti JSON).
- Failai saugomi tik kaip metaduomenys (pavadinimas, dydis, versija).
- Laiškai nesiunčiami – rodoma peržiūra ir fiksuojamas išsiuntimo faktas.
- Prisijungimas demonstracinis, be rolių teisių.
- Visi demo rangovai ir pirkimai – išgalvoti.
