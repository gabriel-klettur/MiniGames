import { useGame } from '../../game/store';

export default function FasesPanel() {
  const { state } = useGame();
  const selected = state.towers.find(t => t.id === state.selectedId) || null;
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div>
        <strong>Turno:</strong> Jugador {state.currentPlayer}
        {state.roundOver && ' · Ronda terminada'}
        {state.gameOver && ' · Partida terminada'}
      </div>
      <div>
        {selected ? (
          <div>
            <div><strong>Torre seleccionada</strong></div>
            <div>Altura: {selected.height}</div>
            <div>Top: {selected.top}</div>
            <div>Posición: x={selected.pos.x.toFixed(3)} · y={selected.pos.y.toFixed(3)}</div>
          </div>
        ) : (
          <span>Selecciona una torre y luego otra para intentar apilar.</span>
        )}
      </div>
      <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>
        Torres en mesa: {state.towers.length}
      </div>
    </div>
  );
}

