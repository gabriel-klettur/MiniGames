import { useEffect, useRef } from 'react';
import type { QuizState } from '../data/types';
import type { QuizAction } from '../contexts/QuizContext';

const STATS_KEY = 'ai-quiz:stats';
const MISTAKES_KEY = 'ai-quiz:mistakes';
const CONFIG_KEY = 'ai-quiz:config';

/** Hydrate state from localStorage on mount, persist on change. */
export function useQuizPersistence(
  state: QuizState,
  dispatch: React.Dispatch<QuizAction>,
) {
  const didHydrate = useRef(false);

  // Hydrate once on mount
  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;

    try {
      const statsRaw = localStorage.getItem(STATS_KEY);
      const mistakesRaw = localStorage.getItem(MISTAKES_KEY);
      const configRaw = localStorage.getItem(CONFIG_KEY);

      const hydration: Partial<QuizState> = {};
      if (statsRaw) hydration.stats = JSON.parse(statsRaw);
      if (mistakesRaw) hydration.mistakeBank = JSON.parse(mistakesRaw);
      if (configRaw) hydration.quizConfig = JSON.parse(configRaw);

      if (Object.keys(hydration).length > 0) {
        dispatch({ type: 'HYDRATE', state: hydration });
      }
    } catch { /* corrupt storage — start fresh */ }
  }, [dispatch]);

  // Persist stats
  useEffect(() => {
    if (!didHydrate.current) return;
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(state.stats));
    } catch { /* ignore */ }
  }, [state.stats]);

  // Persist mistakes
  useEffect(() => {
    if (!didHydrate.current) return;
    try {
      localStorage.setItem(MISTAKES_KEY, JSON.stringify(state.mistakeBank));
    } catch { /* ignore */ }
  }, [state.mistakeBank]);

  // Persist config
  useEffect(() => {
    if (!didHydrate.current) return;
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(state.quizConfig));
    } catch { /* ignore */ }
  }, [state.quizConfig]);
}
