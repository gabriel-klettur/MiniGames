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
    tempo: 5,
  };
  const [p1Engine, setP1EngineState] = useState<EngineOptions>({ ...defaultEngine });
  const [p2Engine, setP2EngineState] = useState<EngineOptions>({ ...defaultEngine });
  const [p1Eval, setP1EvalState] = useState<EvalParams>({ ...defaultEval });
  const [p2Eval, setP2EvalState] = useState<EvalParams>({ ...defaultEval });
  const setP1Engine = useCallback((next: Partial<EngineOptions> | ((prev: EngineOptions) => EngineOptions)) => {
    setP1EngineState(prev => (typeof next === 'function' ? (next as any)(prev) : { ...prev, ...next }));
  }, []);
  const setP2Engine = useCallback((next: Partial<EngineOptions> | ((prev: EngineOptions) => EngineOptions)) => {
    setP2EngineState(prev => (typeof next === 'function' ? (next as any)(prev) : { ...prev, ...next }));
  }, []);
  const setP1Eval = useCallback((next: Partial<EvalParams> | ((prev: EvalParams) => EvalParams)) => {
    setP1EvalState(prev => (typeof next === 'function' ? (next as any)(prev) : { ...prev, ...next }));
  }, []);
  const setP2Eval = useCallback((next: Partial<EvalParams> | ((prev: EvalParams) => EvalParams)) => {
    setP2EvalState(prev => (typeof next === 'function' ? (next as any)(prev) : { ...prev, ...next }));
  }, []);

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
    resetDefaults,
  };
}
