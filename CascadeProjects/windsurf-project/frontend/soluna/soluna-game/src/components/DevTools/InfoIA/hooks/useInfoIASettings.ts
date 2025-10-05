import { useCallback, useEffect, useRef, useState } from 'react';
import type { TimeMode } from '../types';

export type ActiveTab = 'repeats' | 'sim' | 'charts' | 'books';

export interface InfoIASettings {
  // Tabs
  activeTab: ActiveTab;
  setActiveTab: (t: ActiveTab) => void;
  // Visualization
  visualize: boolean;
  toggleVisualize: () => void;
  vizRef: React.MutableRefObject<boolean>;
  datasetLabel: string;
  // Limits
  setsCount: number;
  setSetsCount: (n: number) => void;
  // Per-player
  p1Depth: number;
  p2Depth: number;
  setP1Depth: (n: number) => void;
  setP2Depth: (n: number) => void;
  p1Mode: TimeMode;
  p2Mode: TimeMode;
  setP1Mode: (m: TimeMode) => void;
  setP2Mode: (m: TimeMode) => void;
  p1Secs: number;
  p2Secs: number;
  setP1Secs: (s: number) => void;
  setP2Secs: (s: number) => void;
  // Helpers
  resetDefaults: () => void;
}

export function useInfoIASettings(): InfoIASettings {
  // Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('sim');

  // Visualization
  const [visualize, setVisualize] = useState<boolean>(true);
  const vizRef = useRef<boolean>(visualize);
  useEffect(() => { vizRef.current = visualize; }, [visualize]);
  const toggleVisualize = useCallback(() => setVisualize(v => !v), []);
  const datasetLabel = 'Local';

  // Limits
  const [setsCount, setSetsCount] = useState<number>(10);

  // Per-player controls
  const [p1Depth, setP1Depth] = useState<number>(3);
  const [p2Depth, setP2Depth] = useState<number>(3);
  const [p1Mode, setP1Mode] = useState<TimeMode>('auto');
  const [p2Mode, setP2Mode] = useState<TimeMode>('auto');
  const [p1Secs, setP1Secs] = useState<number>(3);
  const [p2Secs, setP2Secs] = useState<number>(3);

  const resetDefaults = useCallback(() => {
    setVisualize(true);
    setSetsCount(10);
    setP1Depth(3); setP2Depth(3);
    setP1Mode('auto'); setP2Mode('auto');
    setP1Secs(3); setP2Secs(3);
  }, []);

  return {
    activeTab,
    setActiveTab,
    visualize,
    toggleVisualize,
    vizRef,
    datasetLabel,
    setsCount,
    setSetsCount,
    p1Depth,
    p2Depth,
    setP1Depth,
    setP2Depth,
    p1Mode,
    p2Mode,
    setP1Mode,
    setP2Mode,
    p1Secs,
    p2Secs,
    setP1Secs,
    setP2Secs,
    resetDefaults,
  };
}
