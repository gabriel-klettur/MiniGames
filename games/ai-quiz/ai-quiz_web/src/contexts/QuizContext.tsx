import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
  QuizState, QuizConfig, CurrentQuiz, UserAnswer, ViewId, Category, CategoryStats,
} from '../data/types';
import { CATEGORIES } from '../data/categories';

/* ── Initial state ─────────────────────────────────────────── */

function emptyStats(): QuizState['stats'] {
  const byCategory = {} as Record<Category, CategoryStats>;
  for (const c of CATEGORIES) byCategory[c.id] = { correct: 0, total: 0 };
  return {
    totalAnswered: 0,
    totalCorrect: 0,
    streak: 0,
    bestStreak: 0,
    byCategory,
    byDifficulty: { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 } },
  };
}

const defaultConfig: QuizConfig = {
  categories: CATEGORIES.map((c) => c.id),
  difficulties: [1, 2, 3],
  questionCount: 10,
  questionTypes: ['definition-to-term', 'term-to-definition', 'true-false', 'match-columns'],
};

export const INITIAL_STATE: QuizState = {
  currentView: 'home',
  quizConfig: defaultConfig,
  currentQuiz: null,
  stats: emptyStats(),
  mistakeBank: [],
};

/* ── Actions ───────────────────────────────────────────────── */

export type QuizAction =
  | { type: 'SET_VIEW'; view: ViewId }
  | { type: 'SET_CONFIG'; config: Partial<QuizConfig> }
  | { type: 'START_QUIZ'; quiz: CurrentQuiz }
  | { type: 'ANSWER_QUESTION'; answer: UserAnswer }
  | { type: 'NEXT_QUESTION' }
  | { type: 'FINISH_QUIZ' }
  | { type: 'CLEAR_MISTAKE'; conceptId: string }
  | { type: 'RESET_STATS' }
  | { type: 'HYDRATE'; state: Partial<QuizState> };

/* ── Reducer ───────────────────────────────────────────────── */

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.view };

    case 'SET_CONFIG':
      return { ...state, quizConfig: { ...state.quizConfig, ...action.config } };

    case 'START_QUIZ':
      return { ...state, currentQuiz: action.quiz, currentView: 'quiz' };

    case 'ANSWER_QUESTION':
      return reduceAnswer(state, action.answer);

    case 'NEXT_QUESTION': {
      if (!state.currentQuiz) return state;
      const next = state.currentQuiz.currentIndex + 1;
      if (next >= state.currentQuiz.questions.length) {
        return { ...state, currentView: 'results' };
      }
      return { ...state, currentQuiz: { ...state.currentQuiz, currentIndex: next } };
    }

    case 'FINISH_QUIZ':
      return { ...state, currentView: 'results' };

    case 'CLEAR_MISTAKE':
      return { ...state, mistakeBank: state.mistakeBank.filter((id) => id !== action.conceptId) };

    case 'RESET_STATS':
      return { ...state, stats: emptyStats(), mistakeBank: [] };

    case 'HYDRATE':
      return { ...state, ...action.state };

    default:
      return state;
  }
}

function reduceAnswer(state: QuizState, answer: UserAnswer): QuizState {
  if (!state.currentQuiz) return state;
  const q = state.currentQuiz.questions[state.currentQuiz.currentIndex];
  const stats = { ...state.stats };
  stats.totalAnswered += 1;

  if (answer.isCorrect) {
    stats.totalCorrect += 1;
    stats.streak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
  } else {
    stats.streak = 0;
  }

  const catStat = { ...stats.byCategory[q.category] };
  catStat.total += 1;
  if (answer.isCorrect) catStat.correct += 1;
  stats.byCategory = { ...stats.byCategory, [q.category]: catStat };

  const diffStat = { ...stats.byDifficulty[q.difficulty] };
  diffStat.total += 1;
  if (answer.isCorrect) diffStat.correct += 1;
  stats.byDifficulty = { ...stats.byDifficulty, [q.difficulty]: diffStat };

  let mistakeBank = state.mistakeBank;
  if (!answer.isCorrect) {
    const conceptId = typeof q.correctAnswer === 'string' ? q.correctAnswer : q.correctAnswer[0];
    if (!mistakeBank.includes(conceptId)) {
      mistakeBank = [...mistakeBank, conceptId];
    }
  }

  return {
    ...state,
    stats,
    mistakeBank,
    currentQuiz: {
      ...state.currentQuiz,
      answers: [...state.currentQuiz.answers, answer],
    },
  };
}

/* ── Context ───────────────────────────────────────────────── */

interface QuizContextValue {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
}

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, INITIAL_STATE);
  return <QuizContext value={{ state, dispatch }}>{children}</QuizContext>;
}

export function useQuiz(): QuizContextValue {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz must be used inside QuizProvider');
  return ctx;
}
