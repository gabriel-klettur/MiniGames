import Board from './components/Board';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { resetGame } from './store/gameSlice';
import './App.css';
import type { RootState } from './store';

function App() {
  const dispatch = useAppDispatch();
  const winner = useAppSelector((s: RootState) => s.game.winner);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start gap-6 p-6 bg-[#242424] text-white">
      <header className="w-full max-w-3xl flex items-center justify-between">
        <h1 className="text-2xl font-bold">Squadro</h1>
        <div className="flex items-center gap-3">
          {winner && (
            <span className="text-emerald-400 font-semibold">Ganador: {winner}</span>
          )}
          <button onClick={() => dispatch(resetGame())}>Reiniciar</button>
        </div>
      </header>
      <main className="w-full max-w-3xl">
        <Board />
      </main>
      <footer className="w-full max-w-3xl text-xs text-neutral-400">
        Estilo inspirado en Quoridor frontend (texto en español, tema oscuro, Redux).
      </footer>
    </div>
  );
}

export default App;
