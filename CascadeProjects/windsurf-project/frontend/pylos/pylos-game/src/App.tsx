import { useMemo, useState } from 'react';
import './App.css';
import Board from './components/Board';
import Sidebar from './components/Sidebar';
import type { Position } from './game/types';
import { initialState, placeFromReserve, selectMoveSource, cancelMoveSelection, movePiece, recoverPiece, finishRecovery, validMoveDestinations, validReserveDestinations, isGameOver, recoverablePositions } from './game/rules';
import { posKey } from './game/board';

function App() {
  const [state, setState] = useState(() => initialState());
  const [gameOver, setGameOver] = useState<string | undefined>(undefined);

  const highlights: Set<string> = useMemo(() => {
    if (gameOver) return new Set();
    if (state.phase === 'recover' && state.recovery) {
      return new Set(recoverablePositions(state.board, state.recovery.player).map(posKey));
    }
    if (state.phase === 'selectMoveDest' && state.selectedSource) {
      return new Set(validMoveDestinations(state.board, state.selectedSource).map(posKey));
    }
    // phase 'play': highlight valid reserve placements
    return new Set(validReserveDestinations(state.board).map(posKey));
  }, [state, gameOver]);

  const updateAndCheck = (nextState: typeof state) => {
    setState(nextState);
    const over = isGameOver(nextState);
    if (over.over) {
      const text = over.winner ? `Ganador: ${over.winner === 'L' ? 'Claras (L)' : 'Oscuras (D)'} — ${over.reason ?? ''}` : 'Partida terminada';
      setGameOver(text);
    } else {
      setGameOver(undefined);
    }
  };

  const onCellClick = (pos: Position) => {
    if (gameOver) return;
    if (state.phase === 'recover') {
      const res = recoverPiece(state, pos);
      if (!res.error) updateAndCheck(res.state);
      return;
    }

    if (state.phase === 'selectMoveDest') {
      // allow switching source by clicking another free own piece
      const srcKey = state.selectedSource ? posKey(state.selectedSource) : '';
      if (state.selectedSource && posKey(pos) === srcKey) {
        const res = cancelMoveSelection(state);
        if (!res.error) updateAndCheck(res.state);
        return;
      }

      const attempt = movePiece(state, pos);
      if (!attempt.error) {
        updateAndCheck(attempt.state);
      }
      return;
    }

    // phase 'play'
    // Try place from reserve if clicked empty supported cell
    const placed = placeFromReserve(state, pos);
    if (!placed.error) {
      updateAndCheck(placed.state);
      return;
    }
    // Else, try selecting a movable source
    const sel = selectMoveSource(state, pos);
    if (!sel.error) {
      updateAndCheck(sel.state);
      return;
    }
  };

  const onNewGame = () => {
    setGameOver(undefined);
    setState(initialState({ variantLines: state.options.variantLines }));
  };

  const onToggleVariant = () => {
    setState((s) => ({ ...s, options: { ...s.options, variantLines: !s.options.variantLines } }));
  };

  const onFinishRecovery = () => {
    const res = finishRecovery(state);
    if (!res.error) updateAndCheck(res.state);
  };

  return (
    <div className="app">
      <Sidebar
        state={state}
        onNewGame={onNewGame}
        onToggleVariant={onToggleVariant}
        onFinishRecovery={onFinishRecovery}
        gameOverText={gameOver}
      />
      <div className="content">
        <Board
          state={state}
          onCellClick={onCellClick}
          highlights={highlights}
          selected={state.selectedSource}
          posKey={posKey}
        />
      </div>
    </div>
  );
}

export default App;
