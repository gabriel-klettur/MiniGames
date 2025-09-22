import { useGame } from '../game/store';

export default function FootPanel() {
  const { state } = useGame();
  const selected = state.towers.find(t => t.id === state.selectedId);
  return (
    <footer className="foot-panel">
      <div>
        Turno de: <strong>Jugador {state.currentPlayer}</strong>
        {state.roundOver && ' · Ronda terminada'}
        {state.gameOver && ' · Partida terminada'}
      </div>
      <div>
        {selected ? (
          <span>Torre seleccionada: altura {selected.height}, top {selected.top}</span>
        ) : (
          <span>Selecciona una torre y luego otra para intentar apilar.</span>
        )}
      </div>
    </footer>
  );
}

