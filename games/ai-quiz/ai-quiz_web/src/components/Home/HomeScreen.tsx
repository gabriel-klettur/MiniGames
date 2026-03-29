import { useQuiz } from '../../contexts/QuizContext';
import { useI18n } from '../../i18n';
import StatsOverview from './StatsOverview';
import QuizConfigurator from './QuizConfigurator';

export default function HomeScreen() {
  const { state, dispatch } = useQuiz();
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-10 animate-slide-up">
      {/* Hero */}
      <section className="pt-4 text-center">
        <h1 className="text-gradient text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t('hero_title')}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-gray-500">
          {t('hero_subtitle')}
        </p>
      </section>

      {/* Stats */}
      <StatsOverview stats={state.stats} />

      {/* Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'study' })}
          className="glass group rounded-card px-4 py-4 text-center font-medium text-gray-300 transition-all duration-200 hover:bg-white/[0.06] hover:shadow-glow-sm"
        >
          <span className="text-sm">{t('btn_study')}</span>
        </button>
        <button
          onClick={() => document.getElementById('configurator')?.scrollIntoView({ behavior: 'smooth' })}
          className="border-glow rounded-card bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-4 text-center font-semibold text-white shadow-glow-sm transition-all duration-200 hover:shadow-glow-md hover:brightness-110"
        >
          <span className="text-sm">{t('btn_start_quiz')}</span>
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'review' })}
          disabled={state.mistakeBank.length === 0}
          className="glass group rounded-card px-4 py-4 text-center font-medium text-gray-300 transition-all duration-200 hover:bg-white/[0.06] hover:shadow-glow-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          <span className="text-sm">{t('btn_review')} ({state.mistakeBank.length})</span>
        </button>
      </div>

      {/* Configurator */}
      <QuizConfigurator />
    </div>
  );
}
