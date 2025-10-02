export interface IAUserPanelProps {
  depth: number; // 1..10
  onChangeDepth: (d: number) => void;
  onAIMove: () => void;
  disabled?: boolean;
  // Autoplay de IA (Play/Stop)
  aiAutoplayActive?: boolean;
  onToggleAiAutoplay?: () => void;
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
    aiAutoplayActive = false,
    onToggleAiAutoplay,
    busy = false,
    progress = null,
    busyElapsedMs = 0,
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
          <button
            onClick={onAIMove}
            disabled={disabled || busy}
            aria-label={busy ? 'IA pensando' : 'Mover IA'}
            title={busy ? 'IA pensando…' : 'Mover IA'}
          >
            {busy ? (
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span className="ia-btn__spinner" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.25" />
                    <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </span>
                <span className="btn-label" aria-live="polite">
                  Pensando{progress?.depth ? ` d${progress.depth}` : ''}{typeof busyElapsedMs === 'number' ? ` · ${(busyElapsedMs / 1000).toFixed(1)}s` : ''}
                </span>
                <span className="ia-btn__dots" aria-hidden="true">
                  <span>•</span><span>•</span><span>•</span>
                </span>
              </span>
            ) : (
              <>
                {/* Icono de robot/IA */}
                <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M11 2h2v3h-2z"/>
                  <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
                  <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
                  <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
                  <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
                </svg>
                <span className="sr-only">Mover IA</span>
              </>
            )}
          </button>
          <button
            onClick={onToggleAiAutoplay}
            aria-pressed={aiAutoplayActive}
            disabled={disabled && !aiAutoplayActive}
            title={aiAutoplayActive ? 'Detener autoplay de la IA' : 'Iniciar autoplay de la IA'}
            aria-label={aiAutoplayActive ? 'Detener autoplay de la IA' : 'Iniciar autoplay de la IA'}
          >
            {aiAutoplayActive ? (
              // Stop (square)
              <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M6 6h12v12H6z" />
              </svg>
            ) : (
              // Play (triangle)
              <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M8 5v14l11-7z" />
              </svg>
            )}
            <span className="sr-only">{aiAutoplayActive ? 'Detener autoplay de la IA' : 'Iniciar autoplay de la IA'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

