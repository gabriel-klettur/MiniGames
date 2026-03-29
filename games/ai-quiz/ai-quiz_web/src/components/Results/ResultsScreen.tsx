import { useQuiz } from '../../contexts/QuizContext';
import ScoreBreakdown from './ScoreBreakdown';

export default function ResultsScreen() {
  const { state, dispatch } = useQuiz();
  const quiz = state.currentQuiz;

  if (!quiz) {
    return (
      <div className="text-center text-gray-400">
        <p>No hay resultados disponibles.</p>
        <button onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })} className="mt-4 text-brand-400 hover:underline">
          Volver al inicio
        </button>
      </div>
    );
  }

  const total = quiz.questions.length;
  const correct = quiz.answers.filter((a) => a.isCorrect).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const colorClass = pct >= 80 ? 'text-success-400' : pct >= 50 ? 'text-amber-400' : 'text-error-400';
  const bgClass = pct >= 80 ? 'from-success-500/10' : pct >= 50 ? 'from-amber-500/10' : 'from-error-500/10';

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      {/* Score hero */}
      <section className={`rounded-card bg-gradient-to-b ${bgClass} to-transparent border border-gray-800 p-8 text-center`}>
        {pct >= 90 && <p className="mb-2 text-3xl">🎉</p>}
        <p className={`text-5xl font-bold ${colorClass}`}>{pct}%</p>
        <p className="mt-2 text-gray-400">
          {correct} de {total} correctas
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {pct >= 90 ? '¡Excelente dominio!' : pct >= 70 ? '¡Buen trabajo!' : pct >= 50 ? 'Vas por buen camino' : 'Sigue practicando 💪'}
        </p>
      </section>

      {/* Breakdown */}
      <ScoreBreakdown quiz={quiz} />

      {/* Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {state.mistakeBank.length > 0 && (
          <button
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'review' })}
            className="rounded-card bg-amber-600/20 px-4 py-3 text-center font-medium text-amber-300 transition hover:bg-amber-600/30"
          >
            🔄 Repasar errores ({state.mistakeBank.length})
          </button>
        )}
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
          className="rounded-card bg-gray-800 px-4 py-3 text-center font-medium text-gray-200 transition hover:bg-gray-700"
        >
          🏠 Inicio
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
          className="rounded-card bg-brand-600 px-4 py-3 text-center font-medium text-white transition hover:bg-brand-500"
        >
          🎯 Nuevo Quiz
        </button>
      </div>
    </div>
  );
}
