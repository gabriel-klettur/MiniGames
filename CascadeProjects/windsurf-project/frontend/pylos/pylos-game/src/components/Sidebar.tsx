import type { GameState } from '../game/types';

export interface SidebarProps {
  state: GameState;
  onNewGame: () => void;
  onToggleVariant: () => void;
  onFinishRecovery: () => void;
  gameOverText?: string;
}

function Sidebar({ state, onNewGame, onToggleVariant, onFinishRecovery, gameOverText }: SidebarProps) {
  const { currentPlayer, reserves, phase, options, recovery } = state;
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
        <div className="row"><strong>Turno:</strong> {currentPlayer === 'L' ? 'Claras (L)' : 'Oscuras (D)'} </div>
        <div className="row"><strong>Reserva L:</strong> {reserves.L}</div>
        <div className="row"><strong>Reserva D:</strong> {reserves.D}</div>
        <div className="row"><strong>Fase:</strong> {phase}</div>
        <div className="row info">{info}</div>
      </div>

      <div className="panel">
        <button onClick={onNewGame}>Nuevo juego</button>
        <label className="toggle">
          <input type="checkbox" checked={options.variantLines} onChange={onToggleVariant} /> Variante de líneas
        </label>
        {phase === 'recover' && (
          <button onClick={onFinishRecovery} className="primary">Terminar recuperación</button>
        )}
      </div>

      <div className="panel small">
        <p>Reglas clave:</p>
        <ul>
          <li>Coloca en casillas soportadas (2x2 abajo).</li>
          <li>Para mover, solo subir niveles y pieza debe estar libre.</li>
          <li>Formar cuadrado propio permite recuperar 1–2 piezas libres.</li>
          <li>Variante: también puntúan líneas (4 abajo, 3 en segundo nivel).</li>
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
