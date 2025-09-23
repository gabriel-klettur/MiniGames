import { useGame } from '../game/store';

function Stars({ count }: { count: number }) {
  return <span>{'⭐'.repeat(count)}</span>;
}

export default function HeaderPanel() {
  const { state, dispatch } = useGame();
  return (
    <header className="header-panel card">
      <div className="title">Soluna</div>
      <div className="players">
        <div className={`player-badge ${state.currentPlayer === 1 ? 'active' : ''}`}>
          J1 <Stars count={state.players[1].stars} />
        </div>
        <div className={`player-badge ${state.currentPlayer === 2 ? 'active' : ''}`}>
          J2 <Stars count={state.players[2].stars} />
        </div>
      </div>
      <div className="actions">
        {state.roundOver && !state.gameOver && (
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'new-round' })}>Nueva ronda</button>
        )}
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'reset-game' })}>Reiniciar</button>
      </div>
    </header>
  );
}

