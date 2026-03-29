import type { QuizStats } from '../../data/types';
import { CATEGORIES } from '../../data/categories';

interface Props {
  stats: QuizStats;
}

export default function StatsOverview({ stats }: Props) {
  const pct = stats.totalAnswered > 0
    ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
    : 0;

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Respondidas" value={stats.totalAnswered} />
      <StatCard label="Acierto" value={`${pct}%`} color={pct >= 80 ? 'text-success-400' : pct >= 50 ? 'text-amber-400' : 'text-error-400'} />
      <StatCard label="Racha actual" value={stats.streak} />
      <StatCard label="Mejor racha" value={stats.bestStreak} />

      {/* Category breakdown (compact) */}
      <div className="col-span-full mt-2">
        <h3 className="mb-2 text-sm font-medium text-gray-400">Por categoría</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CATEGORIES.map(({ id, emoji, label }) => {
            const cat = stats.byCategory[id];
            const catPct = cat.total > 0 ? Math.round((cat.correct / cat.total) * 100) : 0;
            return (
              <div key={id} className="rounded-lg bg-gray-800/60 px-3 py-2 text-xs">
                <span className="font-medium text-gray-300">{emoji} {label}</span>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-gray-700">
                    <div
                      className="h-1.5 rounded-full bg-brand-500 transition-all"
                      style={{ width: `${catPct}%` }}
                    />
                  </div>
                  <span className="text-gray-400">{catPct}%</span>
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
    <div className="rounded-card bg-gray-800/60 px-4 py-3 text-center">
      <p className={`text-2xl font-bold ${color ?? 'text-gray-100'}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
