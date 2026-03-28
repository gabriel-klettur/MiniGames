import { useGame } from '../game/store';

function Stars({ count }: { count: number }) {
  return <span aria-label={`estrellas: ${count}`}>{'⭐'.repeat(count)}</span>;
}

export default function InfoPanel() {
  const { state } = useGame();
  return (
    <section className="info-panel" aria-label="Información de partida">
      <div className="row" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className={`player-badge ${state.currentPlayer === 1 ? 'active' : ''}`}>
          <span>J1</span>
          <Stars count={state.players[1].stars} />
        </div>
        <div style={{ width: 10 }} />
        <div className={`player-badge ${state.currentPlayer === 2 ? 'active' : ''}`}>
          <span>J2</span>
          <Stars count={state.players[2].stars} />
        </div>
      </div>
    </section>
  );
}

