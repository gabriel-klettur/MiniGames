import { useQuiz } from '../../contexts/QuizContext';
import StatsOverview from './StatsOverview';
import QuizConfigurator from './QuizConfigurator';

export default function HomeScreen() {
  const { state, dispatch } = useQuiz();

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-gray-100 sm:text-4xl">
          🧠 AI Quiz
        </h1>
        <p className="mt-2 text-gray-400">
          Aprende los conceptos de IA para videojuegos con tests interactivos
        </p>
      </section>

      {/* Stats */}
      <StatsOverview stats={state.stats} />

      {/* Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'study' })}
          className="rounded-card bg-gray-800 px-4 py-4 text-center font-medium text-gray-200 shadow-card transition hover:bg-gray-700"
        >
          📖 Modo Estudio
        </button>
        <button
          onClick={() => document.getElementById('configurator')?.scrollIntoView({ behavior: 'smooth' })}
          className="rounded-card bg-brand-600 px-4 py-4 text-center font-medium text-white shadow-card transition hover:bg-brand-500"
        >
          🎯 Iniciar Quiz
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'review' })}
          disabled={state.mistakeBank.length === 0}
          className="rounded-card bg-gray-800 px-4 py-4 text-center font-medium text-gray-200 shadow-card transition hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          🔄 Repaso ({state.mistakeBank.length})
        </button>
      </div>

      {/* Configurator */}
      <QuizConfigurator />
    </div>
  );
}
