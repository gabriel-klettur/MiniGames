import bolaA from '../../assets/bola_a.webp';
import bolaB from '../../assets/bola_b.webp';
export interface IAUserPanelProps {
  depth: number; // 1..10
  onChangeDepth: (d: number) => void;
  onAIMove: () => void;
  disabled?: boolean;
  // Autoplay de IA (Play/Stop)
  aiAutoplayActive?: boolean;
  onToggleAiAutoplay?: () => void;
  // Control por color: IA controla L/D hasta fin de partidas o nuevo toggle
  aiControlL?: boolean;
  aiControlD?: boolean;
  onToggleAiControlL?: () => void;
  onToggleAiControlD?: () => void;
}

/**
 * IAUserPanel: Controles principales de IA para el usuario (Mover IA,
 * profundidad) colocados bajo el Header. La configuración de tiempo se
 * mueve al IAPanel dentro de DevTools.
 * Compacto y centrado, reutiliza estilos del sistema (panel, segmented, etc.).
 */
export default function IAUserPanel(props: IAUserPanelProps) {
  const {
    depth,
    onChangeDepth,
    onAIMove,
    disabled = false,
    aiControlL = false,
    aiControlD = false,
    onToggleAiControlL,
    onToggleAiControlD,
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
          {/* Toggle IA controla L (Naranja/Bola B) */}
          <button
            onClick={onToggleAiControlL}
            aria-pressed={aiControlL}
            title={aiControlL ? 'Devolver control a jugador Naranja (L)' : 'IA controla Naranja (L)'}
            aria-label={aiControlL ? 'Devolver control a jugador Naranja (L)' : 'IA controla Naranja (L)'}
          >
            <img src={bolaB} alt="Ficha naranja (L)" width={14} height={14} />
            {/* Robot status to the right: passive when off, green blinking when on */}
            <svg
              className={[
                'robot-icon',
                aiControlL ? 'is-active is-thinking' : 'is-passive',
              ].join(' ')}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{ marginLeft: 4 }}
            >
              <path fill="currentColor" d="M11 2h2v3h-2z"/>
              <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
              <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
              <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
              <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
            </svg>
            <span className="sr-only">{aiControlL ? 'Jugador controla L' : 'IA controla L'}</span>
          </button>
          {/* Toggle IA controla D (Marrón/Bola A) */}
          <button
            onClick={onToggleAiControlD}
            aria-pressed={aiControlD}
            title={aiControlD ? 'Devolver control a jugador Marrón (D)' : 'IA controla Marrón (D)'}
            aria-label={aiControlD ? 'Devolver control a jugador Marrón (D)' : 'IA controla Marrón (D)'}
          >
            <img src={bolaA} alt="Ficha marrón (D)" width={14} height={14} />
            {/* Robot status to the right: passive when off, green blinking when on */}
            <svg
              className={[
                'robot-icon',
                aiControlD ? 'is-active is-thinking' : 'is-passive',
              ].join(' ')}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{ marginLeft: 4 }}
            >
              <path fill="currentColor" d="M11 2h2v3h-2z"/>
              <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
              <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
              <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
              <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
            </svg>
            <span className="sr-only">{aiControlD ? 'Jugador controla D' : 'IA controla D'}</span>
          </button>
          <button
            className="primary"
            onClick={onAIMove}
            disabled={disabled}
            aria-label="Mover IA"
            title="Mover IA"
          >
            {/* Robot/IA icon similar to HeaderPanel IA toggle */}
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

