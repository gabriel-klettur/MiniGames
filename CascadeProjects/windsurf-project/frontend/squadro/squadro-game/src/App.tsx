import { useEffect, useRef } from 'react';
import Board from './components/Board';
import HeaderPanel from './components/HeaderPanel';
import InfoPanel from './components/InfoPanel';
import DevToolsPanel from './components/DevTools/DevToolsPanel';
import FootPanel from './components/FootPanel';
import './App.css';
import { useAppDispatch, useAppSelector } from './store/hooks';
import type { RootState } from './store';
import { store } from './store';
import { movePiece, setAIBusy } from './store/gameSlice';
import { findBestMove } from './ai/search';

function App() {
  const dispatch = useAppDispatch();
  const { ai, winner, turn } = useAppSelector((s: RootState) => s.game);
  const timerRef = useRef<number | null>(null);

  // Advanced autoplay for AI side using time-bounded search
  useEffect(() => {
    let cancelled = false;
    // cleanup any pending
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!ai?.enabled) return;
    if (winner) return;
    if (turn !== ai.aiSide) return;
    if (ai.busy) return;

    const computeDepth = (d: number) => {
      if (d >= 10) return 6;
      if (d >= 8) return 5;
      if (d >= 6) return 4;
      if (d >= 4) return 3;
      return 2;
    };
    const computeTime = () => {
      if (ai.timeMode === 'manual') return Math.max(50, Math.min(30000, Math.round(ai.timeSeconds * 1000)));
      // auto mode: map speed to a sensible budget
      if (ai.speed === 'rapido') return 200;
      if (ai.speed === 'normal') return 700;
      if (ai.speed === 'lento') return 1400;
      // 'auto' speed default
      return 800;
    };

    const go = async () => {
      dispatch(setAIBusy(true));
      try {
        const state: RootState = store.getState();
        const gs = state.game;
        const res = await findBestMove(gs, { maxDepth: computeDepth(ai.difficulty), timeLimitMs: computeTime() });
        if (cancelled) return;
        const moveId = res.moveId;
        if (moveId) dispatch(movePiece(moveId));
      } finally {
        if (!cancelled) dispatch(setAIBusy(false));
      }
    };

    // small defer to allow UI to render busy state
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void go();
    }, 0);

    return () => {
      cancelled = true;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [ai?.enabled, ai?.aiSide, ai?.speed, ai?.timeMode, ai?.timeSeconds, ai?.difficulty, ai?.busy, turn, winner, dispatch]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-x-hidden">
      <div className="w-full px-[10px]">
        <HeaderPanel />
      </div>
      {/* Full-width play area with exact 10px side margins (no horizontal overflow) */}
      <div className="w-full px-[10px] flex flex-col gap-4 overflow-x-hidden">
        {/* InfoPanel above the board */}
        <div className=" p-4">
          <InfoPanel />
        </div>
        <main className="w-full overflow-x-hidden">
          <Board />
        </main>
        {/* DevTools placed directly below the board */}
        <DevToolsPanel />
      </div>
      <footer className="w-full max-w-4xl">
        <FootPanel />
      </footer>
    </div>
  );
}

export default App;
