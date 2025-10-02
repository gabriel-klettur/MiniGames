import { useGame } from '../game/store';
export interface HeaderProps {
  showIA?: boolean;
  onToggleIA?: () => void;
}

export default function HeaderPanel({ showIA = true, onToggleIA }: HeaderProps) {
  const { state, dispatch } = useGame();
  return (
    <header className="header-bar">
      <div className="row header">
        <h2>Soluna</h2>
        <div className="header-actions">
          {/* Nueva partida (icono + chip) */}
          <button onClick={() => dispatch({ type: 'reset-game' })} aria-label="Nueva partida" title="Nueva partida">
            <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M11 11V5a1 1 0 1 1 2 0v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6z"/>
            </svg>
            <span className="sr-only">Nueva partida</span>
          </button>
          {/* Alternar IAUserPanel (icono IA) */}
          <button
            onClick={onToggleIA}
            aria-pressed={showIA}
            aria-label="Alternar panel de IA"
            title="IA"
          >
            <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M11 2h2v3h-2z"/>
              <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
              <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
              <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
              <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
            </svg>
            <span className="sr-only">IA</span>
          </button>
          {/* Nueva ronda como acción primaria visible solo cuando aplica */}
          {state.roundOver && !state.gameOver && (
            <button className="primary" onClick={() => dispatch({ type: 'new-round' })}>Nueva ronda</button>
          )}
        </div>
      </div>
    </header>
  );
}

