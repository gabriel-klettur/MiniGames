import type { ChangeEvent } from 'react';
import type { CompareHead } from './views/CompareBar';
import type { Dataset } from './views/Chart/ChartContainer';

export type TimeMode = 'auto' | 'manual';

export type MoveDetail = {
  index: number;
  elapsedMs: number;
  depthReached?: number;
  nodes?: number;
  nps?: number;
  score?: number;
  bestMove?: any;
  player?: 1 | 2;
  depthUsed?: number;
  applied?: boolean;
  at?: number;
};

export type InfoIARecord = {
  id: string;
  startedAt: number;
  durationMs: number;
  moves: number;
  winner: 1 | 2 | 0; // 0 = empate/técnico
  p1Depth: number;
  p2Depth: number;
  setId: string;
  setIndex?: number;
  details?: MoveDetail[];
};

export interface PlayerControlsProps {
  title: string;
  depth: number;
  onChangeDepth: (v: number) => void;
  timeMode: TimeMode;
  onChangeTimeMode: (m: TimeMode) => void;
  timeSeconds: number;
  onChangeTimeSeconds: (s: number) => void;
}

export interface InfoIAViewProps {
  // Header actions
  running: boolean;
  onStart: () => void;
  onStop: () => void;
  onDefaults: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onExportCSVDetails: () => void;
  onImportFiles: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearAll: () => void;

  // Tabs
  activeTab: 'repeats' | 'sim' | 'charts' | 'books';
  onChangeTab: (t: 'repeats' | 'sim' | 'charts' | 'books') => void;

  // Charts/compare
  compareHeads: CompareHead[];
  onAddCompare: () => void;
  onRemoveCompare: (id: string) => void;
  onClearCompare: () => void;
  chartDatasets: Dataset[];

  // Left panel
  visualize: boolean;
  onToggleVisualize: () => void;
  datasetLabel: string;

  // Results
  records: InfoIARecord[];

  // TimeBar
  moveIndex: number;
  moveElapsedMs: number;
  moveTargetMs?: number;
  // Progress metrics
  progDepth?: number;
  progNodes?: number;
  progNps?: number;
  progScore?: number;
  // Limits
  setsCount: number;
  onChangeSetsCount: (v: number) => void;
  // Per-player controls
  p1: PlayerControlsProps;
  p2: PlayerControlsProps;
  // Table actions
  onViewRecord: (id: string) => void;
  onCopyRecord: (id: string) => void;
  onDownloadRecord: (id: string) => void;
  onDeleteRecord: (id: string) => void;
}
