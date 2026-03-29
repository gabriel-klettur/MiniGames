import type { ViewId } from '../../data/types';
import { useQuiz } from '../../contexts/QuizContext';
import { useI18n } from '../../i18n';

export default function Header() {
  const { state, dispatch } = useQuiz();
  const { t, locale, setLocale } = useI18n();
  const { stats } = state;
  const pct = stats.totalAnswered > 0
    ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
    : 0;

  const NAV_ITEMS: { view: ViewId; labelKey: string }[] = [
    { view: 'home', labelKey: 'nav_home' },
    { view: 'study', labelKey: 'nav_study' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-surface-0/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3 sm:px-6">
        {/* Brand */}
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
          className="text-base font-bold tracking-tight text-gradient transition-opacity hover:opacity-80"
        >
          {t('nav_brand')}
        </button>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          {NAV_ITEMS.map(({ view, labelKey }) => (
            <button
              key={view}
              onClick={() => dispatch({ type: 'SET_VIEW', view })}
              className={`relative rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                state.currentView === view
                  ? 'text-brand-300 bg-brand-500/[0.12]'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
              }`}
            >
              {t(labelKey)}
            </button>
          ))}

          <div className="mx-2 h-4 w-px bg-white/[0.08]" />

          {/* Language switcher */}
          <button
            onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
            className="rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-gray-500 transition-all duration-200 hover:text-gray-300 hover:bg-white/[0.04]"
            title={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          >
            {locale === 'es' ? 'EN' : 'ES'}
          </button>
        </nav>

        {/* Mini Stats */}
        <div className="hidden items-center gap-3 text-[11px] font-medium tracking-wide text-gray-500 sm:flex">
          <span title={t('mini_correct_title')} className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success-500/60" />
            {stats.totalCorrect}/{stats.totalAnswered}
            <span className="text-gray-600">({pct}%)</span>
          </span>
          <span title={t('mini_streak_title')} className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500/60" />
            {stats.bestStreak}
          </span>
        </div>
      </div>
    </header>
  );
}
