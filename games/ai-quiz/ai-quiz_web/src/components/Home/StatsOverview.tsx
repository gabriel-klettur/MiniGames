import type { QuizStats } from '../../data/types';
import { CATEGORIES } from '../../data/categories';
import { useI18n } from '../../i18n';

interface Props {
  stats: QuizStats;
}

export default function StatsOverview({ stats }: Props) {
  const { t } = useI18n();
  const pct = stats.totalAnswered > 0
    ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
    : 0;

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label={t('stat_answered')} value={stats.totalAnswered} />
      <StatCard label={t('stat_accuracy')} value={`${pct}%`} color={pct >= 80 ? 'text-success-400' : pct >= 50 ? 'text-amber-400' : 'text-error-400'} />
      <StatCard label={t('stat_streak')} value={stats.streak} />
      <StatCard label={t('stat_best_streak')} value={stats.bestStreak} />

      {/* Category breakdown (compact) */}
      <div className="col-span-full mt-3">
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-600">{t('stat_by_category')}</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CATEGORIES.map(({ id, emoji, labelKey }) => {
            const cat = stats.byCategory[id];
            const catPct = cat.total > 0 ? Math.round((cat.correct / cat.total) * 100) : 0;
            return (
              <div key={id} className="glass-subtle rounded-xl px-3 py-2.5 text-xs">
                <span className="font-medium text-gray-400">{emoji} {t(labelKey)}</span>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 rounded-full bg-white/[0.06]">
                    <div
                      className="h-1 rounded-full progress-gradient transition-all duration-500"
                      style={{ width: `${catPct}%` }}
                    />
                  </div>
                  <span className="text-gray-500 tabular-nums">{catPct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="glass rounded-card px-4 py-3.5 text-center transition-all duration-200 hover:shadow-glow-sm">
      <p className={`text-2xl font-bold tracking-tight ${color ?? 'text-gray-100'}`}>{value}</p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-gray-500">{label}</p>
    </div>
  );
}
