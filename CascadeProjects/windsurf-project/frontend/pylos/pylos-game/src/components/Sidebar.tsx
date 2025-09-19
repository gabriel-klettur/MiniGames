import { useState } from 'react';
import type { GameState } from '../game/types';

export interface SidebarProps {
  state: GameState;
  onNewGame: () => void;
  onFinishRecovery?: () => void; // now handled by InfoPanel when needed
  gameOverText?: string;
  boardMode: 'pyramid' | 'stacked';
  onToggleBoardMode: () => void;
}

function Sidebar({ onNewGame, onToggleBoardMode }: SidebarProps) {
  const [showRules, setShowRules] = useState<boolean>(false);

  return (
    <aside className="sidebar">
      <h2>Pylos</h2>
      {/* Estado general movido a InfoPanel */}

      <div className="panel">
        <div className="row actions">
          <button onClick={onNewGame}>Nuevo</button>
          <button className="push-right" onClick={onToggleBoardMode}>Tablero</button>
          <button onClick={() => setShowRules((v) => !v)}>Reglas</button>
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
