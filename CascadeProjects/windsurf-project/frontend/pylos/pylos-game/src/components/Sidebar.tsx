import { useState } from 'react';
import type { GameState } from '../game/types';

export interface SidebarProps {
  state: GameState;
  onNewGame: () => void;
  onFinishRecovery: () => void;
  gameOverText?: string;
}

function Sidebar({ state, onNewGame, onFinishRecovery, gameOverText }: SidebarProps) {
  const { currentPlayer, reserves, phase, recovery } = state;
  const [showRules, setShowRules] = useState<boolean>(false);
  const info: string = (() => {
    if (gameOverText) return gameOverText;
    if (phase === 'recover') {
      const remaining = recovery?.remaining ?? 0;
      const minReq = recovery?.minRequired ?? 0;
      return `Recupera ${minReq > 0 ? `al menos ${minReq}` : 'hasta'} ${remaining} pieza(s).`;
    }
    if (phase === 'selectMoveDest') return 'Elige un destino válido para subir la pieza.';
    return 'Elige una casilla vacía para colocar o toca una pieza libre para moverla.';
  })();

  return (
    <aside className="sidebar">
      <h2>Pylos</h2>
      <div className="panel">
        <div className="row grid-3">
          <div>
            <strong>Turno:</strong>{' '}
            <span
              className={[
                'piece',
                currentPlayer === 'L' ? 'piece--light' : 'piece--dark',
              ].join(' ')}
              title={currentPlayer === 'L' ? 'Claras (L)' : 'Oscuras (D)'}
              aria-label={currentPlayer === 'L' ? 'Claras (L)' : 'Oscuras (D)'}
            />
          </div>
          <div><strong>Reserva L:</strong> {reserves.L}</div>
          <div><strong>Reserva D:</strong> {reserves.D}</div>
        </div>
        <div className="row"><strong>Fase:</strong> {phase}</div>
        <div className="row info">{info}</div>
      </div>

      <div className="panel">
        <div className="row actions">
          <button onClick={onNewGame}>Nuevo juego</button>
          {phase === 'recover' && (
            <button onClick={onFinishRecovery} className="primary">Terminar recuperación</button>
          )}
          <button className="push-right" onClick={() => setShowRules((v) => !v)}>
            {showRules ? 'Ocultar reglas clave' : 'Mostrar reglas clave'}
          </button>
        </div>
      </div>

      

      {showRules && (
        <div className="panel small">
          <p>Reglas clave:</p>
          <ul>
            <li>Coloca en casillas soportadas (2x2 abajo).</li>
            <li>Para mover, solo subir niveles y pieza debe estar libre.</li>
            <li>Formar cuadrado propio permite recuperar 1–2 piezas libres.</li>
            <li>También puntúan las líneas (4 abajo, 3 en segundo nivel).</li>
          </ul>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
