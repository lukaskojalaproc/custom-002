import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_WEIGHTS, DOC_TYPES, STEPS } from './constants';
import { addDays, isoDate, uid } from './format';
import { createSeed, STATE_VERSION } from './seed';
import type { AppState, Contractor, ProjectType, Tender, User } from './types';

const STORAGE_KEY = 'procfly-gr-state';

const DEMO_USER: User = { name: 'Rūta Kazlauskienė', email: 'ruta.kazlauskiene@procfly.lt', role: 'Pirkimų vadovas' };

function load(): AppState {
  let state: AppState | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.version === STATE_VERSION) state = parsed;
    }
  } catch {
    /* storage unavailable or corrupted – fall back to demo data */
  }
  state ??= createSeed();
  // `?demo` in the URL skips the login screen – handy for sharing a presentation link.
  if (!state.user && new URLSearchParams(window.location.search).has('demo')) state = { ...state, user: DEMO_USER };
  return state;
}

export interface NewTenderInput {
  name: string;
  projectType: ProjectType;
  location: string;
  areaM2: number;
  budgetNet: number;
  manager: string;
  description: string;
}

/** Mark a step done and move the tender to the next unfinished step. */
export function completeStep(t: Tender, n: number) {
  if (!t.completedSteps.includes(n)) t.completedSteps = [...t.completedSteps, n].sort((a, b) => a - b);
  const next = STEPS.find((s) => !t.completedSteps.includes(s.n));
  t.currentStep = next ? next.n : 13;
}

export function reopenStep(t: Tender, n: number) {
  t.completedSteps = t.completedSteps.filter((s) => s < n);
  t.currentStep = n;
}

export function logActivity(t: Tender, text: string) {
  t.activity = [{ at: isoDate(), text }, ...t.activity];
}

interface StoreValue {
  state: AppState;
  setUser: (u: User | null) => void;
  updateTender: (id: string, recipe: (draft: Tender) => void) => void;
  createTender: (input: NewTenderInput) => string;
  saveContractor: (c: Contractor) => void;
  resetDemo: () => void;
  replaceState: (s: AppState) => void;
}

const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota or private mode – keep working in memory */
    }
  }, [state]);

  // Signing out restores fresh demo data, so every demo session (or client) starts clean.
  const setUser = useCallback(
    (user: User | null) => setState((s) => (user ? { ...s, user } : { ...createSeed(), user: null })),
    [],
  );

  const updateTender = useCallback((id: string, recipe: (draft: Tender) => void) => {
    setState((s) => ({
      ...s,
      tenders: s.tenders.map((t) => {
        if (t.id !== id) return t;
        const draft = structuredClone(t);
        recipe(draft);
        return draft;
      }),
    }));
  }, []);

  const createTender = useCallback((input: NewTenderInput) => {
    const id = uid('t');
    const today = isoDate();
    setState((s) => {
      const year = today.slice(0, 4);
      const seq = s.tenders.filter((t) => t.code.includes(year)).length + 1;
      const tender: Tender = {
        id,
        code: `GR-${year}-${String(seq + 10).padStart(3, '0')}`,
        ...input,
        createdAt: today,
        currentStep: 1,
        completedSteps: [],
        participants: [],
        documents: DOC_TYPES.map((d) => ({ key: d.key, status: 'nepradėta', files: [] })),
        invitation: {
          offerDeadline: addDays(today, 49),
          questionsDeadline: addDays(today, 35),
          message:
            'Kviečiame dalyvauti generalinės rangos konkurse. Pirkimo dokumentus rasite pateiktoje nuorodoje. Klausimus prašome teikti per klausimų–atsakymų formą iki nurodyto termino.',
        },
        questions: [],
        initialOffers: [],
        analysis: {},
        rounds: [],
        leveling: [],
        finalOffers: [],
        evaluation: {
          weights: { ...DEFAULT_WEIGHTS },
          monthlyTimeCost: Math.round((input.budgetNet * 0.004) / 1000) * 1000,
          overrides: {},
        },
        selection: { justification: '', considerations: {} },
        activity: [{ at: today, text: 'Pirkimas sukurtas' }],
      };
      return { ...s, tenders: [tender, ...s.tenders] };
    });
    return id;
  }, []);

  const saveContractor = useCallback((c: Contractor) => {
    setState((s) => {
      const exists = s.contractors.some((x) => x.id === c.id);
      return {
        ...s,
        contractors: exists ? s.contractors.map((x) => (x.id === c.id ? c : x)) : [c, ...s.contractors],
      };
    });
  }, []);

  const resetDemo = useCallback(() => setState((s) => ({ ...createSeed(), user: s.user })), []);
  const replaceState = useCallback((next: AppState) => setState({ ...next, version: STATE_VERSION }), []);

  const value = useMemo(
    () => ({ state, setUser, updateTender, createTender, saveContractor, resetDemo, replaceState }),
    [state, setUser, updateTender, createTender, saveContractor, resetDemo, replaceState],
  );
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export function useContractors() {
  const { state } = useStore();
  return useMemo(() => Object.fromEntries(state.contractors.map((c) => [c.id, c])), [state.contractors]);
}
