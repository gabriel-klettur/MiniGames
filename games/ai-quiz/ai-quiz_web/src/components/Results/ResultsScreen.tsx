import { useQuiz } from '../../contexts/QuizContext';
import { useI18n } from '../../i18n';
import ScoreBreakdown from './ScoreBreakdown';

export default function ResultsScreen() {
  const { state, dispatch } = useQuiz();
  const { t } = useI18n();
  const quiz = state.currentQuiz;

  if (!quiz) {
    return (
      <div className="text-center text-gray-400">
        <p>{t('results_none')}</p>
        <button onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })} className="mt-4 text-brand-400 hover:underline">
          {t('quiz_back_home')}
        </button>
      </div>
    );
  }

  const total = quiz.questions.length;
  const correct = quiz.answers.filter((a) => a.isCorrect).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const colorClass = pct >= 80 ? 'text-success-400' : pct >= 50 ? 'text-amber-400' : 'text-error-400';
  const bgClass = pct >= 80 ? 'from-success-500/[0.06]' : pct >= 50 ? 'from-amber-500/[0.06]' : 'from-error-500/[0.06]';

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      {/* Score hero */}
      <section className={`glass rounded-card bg-gradient-to-b ${bgClass} to-transparent p-8 text-center`}>
        {pct >= 90 && <p className="mb-2 text-3xl">🎉</p>}
        <p className={`text-5xl font-bold ${colorClass}`}>{pct}%</p>
        <p className="mt-2 text-gray-400">
          {t('results_correct', { correct, total })}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {pct >= 90 ? t('results_excellent') : pct >= 70 ? t('results_good') : pct >= 50 ? t('results_ok') : t('results_practice')}
        </p>
      </section>

      {/* Breakdown */}
      <ScoreBreakdown quiz={quiz} />

      {/* Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {state.mistakeBank.length > 0 && (
          <button
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'review' })}
            className="glass rounded-card px-4 py-3 text-center font-medium text-amber-300 transition-all duration-200 hover:shadow-glow-sm"
          >
            {t('results_review')} ({state.mistakeBank.length})
          </button>
        )}
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
          className="glass rounded-card px-4 py-3 text-center font-medium text-gray-200 transition-all duration-200 hover:shadow-glow-sm"
        >
          {t('results_home')}
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
          className="rounded-card bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 text-center font-medium text-white shadow-glow-sm transition-all duration-200 hover:shadow-glow-md hover:brightness-110"
        >
          {t('results_new_quiz')}
        </button>
      </div>
    </div>
  );
}
