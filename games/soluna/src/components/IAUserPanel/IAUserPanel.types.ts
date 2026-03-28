export interface IAUserPanelProps {
  depth: number; // 1..10
  onChangeDepth: (d: number) => void;
  onAIMove: () => void;
  disabled?: boolean;
  // Autoplay de IA (Play/Stop)
  aiAutoplayActive?: boolean;
  onToggleAiAutoplay?: () => void;
  // Control por jugador: IA controla P1/P2
  aiControlP1?: boolean;
  aiControlP2?: boolean;
  onToggleAiControlP1?: () => void;
  onToggleAiControlP2?: () => void;
  // Estado de cálculo
  busy?: boolean;
  progress?: { depth: number; score: number } | null;
  busyElapsedMs?: number;
}
