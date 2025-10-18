import { useCallback, useEffect, useRef, useState } from 'react';
import type { TimeMode } from '../types';
import type { EngineOptions } from '../../../../ia/search/types';
import type { EvalParams } from '../../../../ia/evalTypes';

export type ActiveTab = 'repeats' | 'sim' | 'charts' | 'books';

export interface InfoIASettings {
  activeTab: ActiveTab;
  setActiveTab: (t: ActiveTab) => void;
  visualize: boolean;
  toggleVisualize: () => void;
  vizRef: React.MutableRefObject<boolean>;
  datasetLabel: string;
  gamesCount: number;
  setGamesCount: (n: number) => void;
  // Global execution options
  useRootParallel: boolean;
  setUseRootParallel: (v: boolean) => void;
  workers: number;
  setWorkers: (n: number) => void;
  // Openings: number of initial plies to play randomly
  randomOpeningPlies: number;
  setRandomOpeningPlies: (n: number) => void;
  // Exploration epsilon (epsilon-greedy probability per move post-opening)
  exploreEps: number;
  setExploreEps: (n: number) => void;
  // Starting player eligibility per game (per player)
  startEligibleLight: boolean;
  setStartEligibleLight: (v: boolean) => void;
  startEligibleDark: boolean;
  setStartEligibleDark: (v: boolean) => void;
  // Trace per-move heuristics summary when available
  traceHeuristics: boolean;
  setTraceHeuristics: (v: boolean) => void;
  p1Depth: number; p2Depth: number;
  setP1Depth: (n: number) => void; setP2Depth: (n: number) => void;
  p1Mode: TimeMode; p2Mode: TimeMode;
  setP1Mode: (m: TimeMode) => void; setP2Mode: (m: TimeMode) => void;
  p1Secs: number; p2Secs: number;
  setP1Secs: (s: number) => void; setP2Secs: (s: number) => void;
  // Per-player engine options (subset supported by Squadro)
  p1Engine: EngineOptions; setP1Engine: (next: Partial<EngineOptions> | ((prev: EngineOptions) => EngineOptions)) => void;
  p2Engine: EngineOptions; setP2Engine: (next: Partial<EngineOptions> | ((prev: EngineOptions) => EngineOptions)) => void;
  // Per-player evaluation weights
  p1Eval: EvalParams; setP1Eval: (next: Partial<EvalParams> | ((prev: EvalParams) => EvalParams)) => void;
  p2Eval: EvalParams; setP2Eval: (next: Partial<EvalParams> | ((prev: EvalParams) => EvalParams)) => void;
  // AutoTune settings (global)
  autoTuneEnabled: boolean; setAutoTuneEnabled: (v: boolean) => void;
  autoTuneLr: number; setAutoTuneLr: (n: number) => void;
  autoTuneReg: number; setAutoTuneReg: (n: number) => void;
  autoTuneK: number; setAutoTuneK: (n: number) => void;
  // AutoTune persistence
  autoTuneAutoSave: boolean; setAutoTuneAutoSave: (v: boolean) => void;
  autoTuneSaveEvery: number; setAutoTuneSaveEvery: (n: number) => void;
  // AutoTune logging
  autoTuneLog: boolean; setAutoTuneLog: (v: boolean) => void;
  // AutoTune warmup plies to skip updates at the start of each game
  autoTuneWarmupPlies: number; setAutoTuneWarmupPlies: (n: number) => void;
  // AutoTune per-side toggles
  autoTuneTuneLight: boolean; setAutoTuneTuneLight: (v: boolean) => void;
  autoTuneTuneDark: boolean; setAutoTuneTuneDark: (v: boolean) => void;
  // AutoTune advanced (stabilization)
  autoTunePatience: number; setAutoTunePatience: (n: number) => void;
  autoTuneLrDecay: number; setAutoTuneLrDecay: (n: number) => void;
  autoTuneUseEMA: boolean; setAutoTuneUseEMA: (v: boolean) => void;
  autoTuneEMABeta: number; setAutoTuneEMABeta: (n: number) => void;
  resetDefaults: () => void;
}

export function useInfoIASettings(): InfoIASettings {
  const [activeTab, setActiveTab] = useState<ActiveTab>('sim');
  const [visualize, setVisualize] = useState<boolean>(true);
  const vizRef = useRef<boolean>(visualize);
  useEffect(() => { vizRef.current = visualize; }, [visualize]);
  const toggleVisualize = useCallback(() => setVisualize(v => !v), []);
  const datasetLabel = 'Local';

  const [gamesCount, setGamesCount] = useState<number>(10);
  const [useRootParallel, setUseRootParallel] = useState<boolean>(false);
  const [workers, setWorkers] = useState<number>(typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 2) : 2);
  const [randomOpeningPlies, setRandomOpeningPlies] = useState<number>(0);
  const [exploreEps, setExploreEps] = useState<number>(0);
  const [traceHeuristics, setTraceHeuristics] = useState<boolean>(false);
  const [startEligibleLight, setStartEligibleLight] = useState<boolean>(true);
  const [startEligibleDark, setStartEligibleDark] = useState<boolean>(true);
  const [p1Depth, setP1Depth] = useState<number>(3);
  const [p2Depth, setP2Depth] = useState<number>(3);
  const [p1Mode, setP1Mode] = useState<TimeMode>('auto');
  const [p2Mode, setP2Mode] = useState<TimeMode>('auto');
  const [p1Secs, setP1Secs] = useState<number>(3);
  const [p2Secs, setP2Secs] = useState<number>(3);

  const defaultEngine: EngineOptions = {
    enableTT: true,
    enableKillers: true,
    enableHistory: true,
    enablePVS: true,
    enableLMR: true,
    lmrMinDepth: 3,
    lmrLateMoveIdx: 3,
    lmrReduction: 1,
    preferHashMove: true,
    orderingJitterEps: 0,
    enableTablebase: false,
    // Repetition defaults
    drawScore: 0,
    preferDrawWhenLosing: true,
  };
  const defaultEval: EvalParams = {
    // Document scale defaults
    w_race: 1.0,
    w_clash: 50.0,
    w_sprint: 8.0,
    w_block: 10.0,
    // Additional weights (as multipliers for their point terms)
    w_chain: 1.0,
    w_parity: 1.0,
    w_struct: 1.0,
    w_ones: 1.0,
    w_return: 1.0,
    w_waste: 1.0,
    w_mob: 1.0,
    done_bonus: 200.0,
    sprint_threshold: 2,
  };
  const [p1Engine, setP1EngineState] = useState<EngineOptions>(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('squadro.infoia.p1');
        if (raw) {
          const obj = JSON.parse(raw);
          if (obj && typeof obj === 'object' && obj.engine && typeof obj.engine === 'object') {
            return { ...defaultEngine, ...obj.engine } as EngineOptions;
          }
        }
      }
    } catch {}
    return { ...defaultEngine };
  });
  const [p2Engine, setP2EngineState] = useState<EngineOptions>(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('squadro.infoia.p2');
        if (raw) {
          const obj = JSON.parse(raw);
          if (obj && typeof obj === 'object' && obj.engine && typeof obj.engine === 'object') {
            return { ...defaultEngine, ...obj.engine } as EngineOptions;
          }
        }
      }
    } catch {}
    return { ...defaultEngine };
  });
  const [p1Eval, setP1EvalState] = useState<EvalParams>(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('squadro.infoia.p1');
        if (raw) {
          const obj = JSON.parse(raw);
          if (obj && typeof obj === 'object' && obj.eval && typeof obj.eval === 'object') {
            return { ...defaultEval, ...obj.eval } as EvalParams;
          }
        }
      }
    } catch {}
    return { ...defaultEval };
  });
  const [p2Eval, setP2EvalState] = useState<EvalParams>(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('squadro.infoia.p2');
        if (raw) {
          const obj = JSON.parse(raw);
          if (obj && typeof obj === 'object' && obj.eval && typeof obj.eval === 'object') {
            return { ...defaultEval, ...obj.eval } as EvalParams;
          }
        }
      }
    } catch {}
    return { ...defaultEval };
  });
  // AutoTune (global) defaults
  const [autoTuneEnabled, setAutoTuneEnabled] = useState<boolean>(false);
  const [autoTuneLr, setAutoTuneLr] = useState<number>(0.001);
  const [autoTuneReg, setAutoTuneReg] = useState<number>(0.00001);
  const [autoTuneK, setAutoTuneK] = useState<number>(400);
  const [autoTuneAutoSave, setAutoTuneAutoSave] = useState<boolean>(false);
  const [autoTuneSaveEvery, setAutoTuneSaveEvery] = useState<number>(10);
  const [autoTuneLog, setAutoTuneLog] = useState<boolean>(false);
  const [autoTuneWarmupPlies, setAutoTuneWarmupPlies] = useState<number>(0);
  const [autoTuneTuneLight, setAutoTuneTuneLight] = useState<boolean>(true);
  const [autoTuneTuneDark, setAutoTuneTuneDark] = useState<boolean>(true);
  // Advanced AutoTune
  const [autoTunePatience, setAutoTunePatience] = useState<number>(200);
  const [autoTuneLrDecay, setAutoTuneLrDecay] = useState<number>(0.5);
  const [autoTuneUseEMA, setAutoTuneUseEMA] = useState<boolean>(false);
  const [autoTuneEMABeta, setAutoTuneEMABeta] = useState<number>(0.1);
  const setP1Engine = useCallback((next: Partial<EngineOptions> | ((prev: EngineOptions) => EngineOptions)) => {
    setP1EngineState(prev => (typeof next === 'function' ? (next as any)(prev) : { ...prev, ...next }));
  }, []);
  const setP2Engine = useCallback((next: Partial<EngineOptions> | ((prev: EngineOptions) => EngineOptions)) => {
    setP2EngineState(prev => (typeof next === 'function' ? (next as any)(prev) : { ...prev, ...next }));
  }, []);
  const setP1Eval = useCallback((next: Partial<EvalParams> | ((prev: EvalParams) => EvalParams)) => {
    setP1EvalState(prev => {
      const resolved = (typeof next === 'function' ? (next as any)(prev) : { ...prev, ...next });
      // Persist immediately to localStorage to avoid losing updates on fast reloads
      try {
        if (typeof window !== 'undefined') {
          const data = { depth: p1Depth, mode: p1Mode, secs: p1Secs, engine: p1Engine, eval: resolved };
          localStorage.setItem('squadro.infoia.p1', JSON.stringify(data));
        }
      } catch {}
      return resolved;
    });
  }, [p1Depth, p1Mode, p1Secs, p1Engine]);
  const setP2Eval = useCallback((next: Partial<EvalParams> | ((prev: EvalParams) => EvalParams)) => {
    setP2EvalState(prev => {
      const resolved = (typeof next === 'function' ? (next as any)(prev) : { ...prev, ...next });
      try {
        if (typeof window !== 'undefined') {
          const data = { depth: p2Depth, mode: p2Mode, secs: p2Secs, engine: p2Engine, eval: resolved };
          localStorage.setItem('squadro.infoia.p2', JSON.stringify(data));
        }
      } catch {}
      return resolved;
    });
  }, [p2Depth, p2Mode, p2Secs, p2Engine]);

  // LocalStorage persistence (per player)
  const LS_P1 = 'squadro.infoia.p1';
  const LS_P2 = 'squadro.infoia.p2';
  // Avoid saving defaults before we finish loading from localStorage
  const hydratedRef = useRef<boolean>(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw1 = localStorage.getItem(LS_P1);
      if (raw1) {
        const obj = JSON.parse(raw1);
        if (obj && typeof obj === 'object') {
          if (typeof obj.depth === 'number') setP1Depth(Number(obj.depth));
          if (obj.mode === 'auto' || obj.mode === 'manual') setP1Mode(obj.mode);
          if (typeof obj.secs === 'number') setP1Secs(Number(obj.secs));
          if (obj.engine && typeof obj.engine === 'object') setP1EngineState({ ...defaultEngine, ...obj.engine });
          if (obj.eval && typeof obj.eval === 'object') setP1EvalState({ ...defaultEval, ...obj.eval });
        }
      }
    } catch {}
    try {
      const raw2 = localStorage.getItem(LS_P2);
      if (raw2) {
        const obj = JSON.parse(raw2);
        if (obj && typeof obj === 'object') {
          if (typeof obj.depth === 'number') setP2Depth(Number(obj.depth));
          if (obj.mode === 'auto' || obj.mode === 'manual') setP2Mode(obj.mode);
          if (typeof obj.secs === 'number') setP2Secs(Number(obj.secs));
          if (obj.engine && typeof obj.engine === 'object') setP2EngineState({ ...defaultEngine, ...obj.engine });
          if (obj.eval && typeof obj.eval === 'object') setP2EvalState({ ...defaultEval, ...obj.eval });
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Mark as hydrated after attempting both loads
  useEffect(() => { hydratedRef.current = true; }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hydratedRef.current) return; // wait initial load
    try {
      const data = { depth: p1Depth, mode: p1Mode, secs: p1Secs, engine: p1Engine, eval: p1Eval };
      localStorage.setItem(LS_P1, JSON.stringify(data));
    } catch {}
  }, [p1Depth, p1Mode, p1Secs, p1Engine, p1Eval]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hydratedRef.current) return; // wait initial load
    try {
      const data = { depth: p2Depth, mode: p2Mode, secs: p2Secs, engine: p2Engine, eval: p2Eval };
      localStorage.setItem(LS_P2, JSON.stringify(data));
    } catch {}
  }, [p2Depth, p2Mode, p2Secs, p2Engine, p2Eval]);

  const resetDefaults = useCallback(() => {
    setVisualize(true);
    setGamesCount(10);
    setUseRootParallel(false);
    setWorkers(typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 2) : 2);
    setRandomOpeningPlies(0);
    setExploreEps(0);
    setTraceHeuristics(false);
    setP1Depth(3); setP2Depth(3);
    setP1Mode('auto'); setP2Mode('auto');
    setP1Secs(3); setP2Secs(3);
    setP1EngineState({ ...defaultEngine });
    setP2EngineState({ ...defaultEngine });
    setP1EvalState({ ...defaultEval });
    setP2EvalState({ ...defaultEval });
    setAutoTuneEnabled(false);
    setAutoTuneLr(0.001);
    setAutoTuneReg(0.00001);
    setAutoTuneK(400);
    setAutoTuneAutoSave(false);
    setAutoTuneSaveEvery(10);
    setAutoTuneLog(false);
    setAutoTuneWarmupPlies(0);
    setAutoTuneTuneLight(true);
    setAutoTuneTuneDark(true);
    setAutoTunePatience(200);
    setAutoTuneLrDecay(0.5);
    setAutoTuneUseEMA(false);
    setAutoTuneEMABeta(0.1);
    try { if (typeof window !== 'undefined') { localStorage.removeItem(LS_P1); localStorage.removeItem(LS_P2); } } catch {}
  }, []);

  return {
    activeTab, setActiveTab,
    visualize, toggleVisualize, vizRef, datasetLabel,
    gamesCount, setGamesCount,
    useRootParallel, setUseRootParallel,
    workers, setWorkers,
    randomOpeningPlies, setRandomOpeningPlies,
    exploreEps, setExploreEps,
    traceHeuristics, setTraceHeuristics,
    startEligibleLight, setStartEligibleLight,
    startEligibleDark, setStartEligibleDark,
    p1Depth, p2Depth, setP1Depth, setP2Depth,
    p1Mode, p2Mode, setP1Mode, setP2Mode,
    p1Secs, p2Secs, setP1Secs, setP2Secs,
    p1Engine, setP1Engine,
    p2Engine, setP2Engine,
    p1Eval, setP1Eval,
    p2Eval, setP2Eval,
    autoTuneEnabled, setAutoTuneEnabled,
    autoTuneLr, setAutoTuneLr,
    autoTuneReg, setAutoTuneReg,
    autoTuneK, setAutoTuneK,
    autoTuneAutoSave, setAutoTuneAutoSave,
    autoTuneSaveEvery, setAutoTuneSaveEvery,
    autoTuneLog, setAutoTuneLog,
    autoTuneWarmupPlies, setAutoTuneWarmupPlies,
    autoTuneTuneLight, setAutoTuneTuneLight,
    autoTuneTuneDark, setAutoTuneTuneDark,
    autoTunePatience, setAutoTunePatience,
    autoTuneLrDecay, setAutoTuneLrDecay,
    autoTuneUseEMA, setAutoTuneUseEMA,
    autoTuneEMABeta, setAutoTuneEMABeta,
    resetDefaults,
  };
}
