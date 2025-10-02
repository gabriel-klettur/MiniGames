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

/**
 * IAUserPanel (Soluna): Controles principales de IA para el usuario (Mover IA,
 * dificultad) colocados bajo el Header. La configuración de tiempo se deja
 * para un panel avanzado (DevTools IAPanel) si se desea.
 */
export default function IAUserPanel(props: IAUserPanelProps) {
  const {
    depth,
    onChangeDepth,
    onAIMove,
    disabled = false,
    aiControlP1 = false,
    aiControlP2 = false,
    onToggleAiControlP1,
    onToggleAiControlP2,
  } = props;

  return (
    <section className="panel small iauser-panel" aria-label="Controles de IA (usuario)">
      <div className="row actions iauser-inline" aria-label="Dificultad y acciones de IA">
        <div className="iauser-left" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="iauser-depth">Dificultad:</label>
          <select
            id="iauser-depth"
            value={depth}
            onChange={(e) => onChangeDepth(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="iauser-right" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {/* Toggle IA controla P1 */}
          <button
            onClick={onToggleAiControlP1}
            aria-pressed={aiControlP1}
            title={aiControlP1 ? 'Devolver control a jugador P1' : 'IA controla P1'}
            aria-label={aiControlP1 ? 'Devolver control a jugador P1' : 'IA controla P1'}
          >
            <svg
              className={[
                'robot-icon',
                aiControlP1 ? 'is-active is-thinking' : 'is-passive',
              ].join(' ')}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path fill="currentColor" d="M11 2h2v3h-2z"/>
              <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
              <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
              <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
              <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
            </svg>
            <span className="sr-only">{aiControlP1 ? 'Jugador controla P1' : 'IA controla P1'}</span>
          </button>
          {/* Toggle IA controla P2 */}
          <button
            onClick={onToggleAiControlP2}
            aria-pressed={aiControlP2}
            title={aiControlP2 ? 'Devolver control a jugador P2' : 'IA controla P2'}
            aria-label={aiControlP2 ? 'Devolver control a jugador P2' : 'IA controla P2'}
          >
            <svg
              className={[
                'robot-icon',
                aiControlP2 ? 'is-active is-thinking' : 'is-passive',
              ].join(' ')}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path fill="currentColor" d="M11 2h2v3h-2z"/>
              <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
              <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
              <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
              <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
            </svg>
            <span className="sr-only">{aiControlP2 ? 'Jugador controla P2' : 'IA controla P2'}</span>
          </button>
          {/* Acción principal: Mover IA */}
          <button
            className="primary"
            onClick={onAIMove}
            disabled={disabled}
            aria-label="Mover IA"
            title="Mover IA"
          >
            <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M11 2h2v3h-2z"/>
              <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
              <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
              <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
              <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
            </svg>
            <span className="sr-only">Mover IA</span>
          </button>
        </div>
      </div>
    </section>
  );
}

