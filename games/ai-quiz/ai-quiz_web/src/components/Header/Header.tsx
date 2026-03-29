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

  const NAV_ITEMS: { view: ViewId; labelKey: string; emoji: string }[] = [
    { view: 'home', labelKey: 'nav_home', emoji: '🏠' },
    { view: 'study', labelKey: 'nav_study', emoji: '📖' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
          className="flex items-center gap-2 text-lg font-bold text-brand-400 hover:text-brand-300 transition-colors"
        >
          {t('nav_brand')}
        </button>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ view, labelKey, emoji }) => (
            <button
              key={view}
              onClick={() => dispatch({ type: 'SET_VIEW', view })}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                state.currentView === view
                  ? 'bg-brand-600/20 text-brand-300'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              {emoji} {t(labelKey)}
            </button>
          ))}

          {/* Language switcher */}
          <button
            onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
            className="ml-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
            title={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          >
            {locale === 'es' ? '🇬🇧 EN' : '🇪🇸 ES'}
          </button>
        </nav>

        {/* Mini Stats */}
        <div className="hidden items-center gap-3 text-xs text-gray-400 sm:flex">
          <span title={t('mini_correct_title')}>
            ✅ {stats.totalCorrect}/{stats.totalAnswered} ({pct}%)
          </span>
          <span title={t('mini_streak_title')}>🔥 {stats.bestStreak}</span>
        </div>
      </div>
    </header>
  );
}
