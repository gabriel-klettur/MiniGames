import type { GameState } from '../../../game/types';
import type { AIMove } from '../../../ia/index';

export interface IAPanelProps {
  state: GameState;
  depth: number; // 1..10
  onChangeDepth: (d: number) => void;
  onAIMove: () => void;
  disabled?: boolean;
  // Control profesional: modo Auto o Manual (0..30 s)
  timeMode: 'auto' | 'manual';
  timeSeconds: number; // 0..30
  onChangeTimeMode: (m: 'auto' | 'manual') => void;
  onChangeTimeSeconds: (secs: number) => void;
  busy?: boolean;
  progress?: { depth: number; score: number } | null;
  // Result summary (último cálculo)
  evalScore?: number | null;
  depthReached?: number | null;
  pv?: AIMove[];
  rootMoves?: Array<{ move: AIMove; score: number }>;
  nodes?: number;
  elapsedMs?: number;
  nps?: number;
  rootPlayer?: 1 | 2;
  moving?: boolean; // si hay animación en curso
  // Autoplay IA (se mantienen para compatibilidad pero no se renderiza botón)
  aiAutoplayActive?: boolean;
  onToggleAiAutoplay?: () => void;
  // Tiempo en curso mientras está pensando
  busyElapsedMs?: number;
  // Engine flags (toggles + params)
  aiEnableTT: boolean;
  onToggleAiEnableTT: () => void;
  aiFailSoft: boolean;
  onToggleAiFailSoft: () => void;
  aiPreferHashMove: boolean;
  onToggleAiPreferHashMove: () => void;
  aiEnablePVS: boolean;
  onToggleAiEnablePVS: () => void;
  aiEnableAspiration: boolean;
  onToggleAiEnableAspiration: () => void;
  aiAspirationDelta: number;
  onChangeAiAspirationDelta: (n: number) => void;
  aiEnableKillers: boolean;
  onToggleAiEnableKillers: () => void;
  aiEnableHistory: boolean;
  onToggleAiEnableHistory: () => void;
  aiEnableQuiescence: boolean;
  onToggleAiEnableQuiescence: () => void;
  aiQuiescenceDepth: number;
  onChangeAiQuiescenceDepth: (n: number) => void;
}

export type TabKey = 'control' | 'analysis';
