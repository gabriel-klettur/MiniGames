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
  };
  const defaultEval: EvalParams = {
    w_race: 1.0,
    w_clash: 0.8,
    w_sprint: 0.6,
    w_block: 0.3,
    done_bonus: 5.0,
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
