import type { CurrentQuiz } from '../../data/types';
import { CATEGORIES } from '../../data/categories';
import { conceptById } from '../../data/concepts';
import { useI18n } from '../../i18n';

interface Props {
  quiz: CurrentQuiz;
}

export default function ScoreBreakdown({ quiz }: Props) {
  const { t } = useI18n();

  // Group answers by category
  const byCat = new Map<string, { correct: number; total: number }>();
  for (const [i, q] of quiz.questions.entries()) {
    const a = quiz.answers[i];
    const entry = byCat.get(q.category) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (a?.isCorrect) entry.correct += 1;
    byCat.set(q.category, entry);
  }

  // Mistakes list
  const mistakes = quiz.questions
    .filter((_, i) => quiz.answers[i] && !quiz.answers[i].isCorrect)
    .map((q) => ({
      term: typeof q.correctAnswer === 'string' ? conceptById.get(q.correctAnswer)?.term ?? q.correctAnswer : q.prompt,
      explanation: q.explanation,
    }));

  return (
    <div className="flex flex-col gap-4">
      {/* Category bars */}
      <section>
        <h3 className="mb-2 text-sm font-medium text-gray-400">{t('results_breakdown')}</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CATEGORIES.map(({ id, emoji, labelKey }) => {
            const data = byCat.get(id);
            if (!data) return null;
            const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
            return (
              <div key={id} className="flex items-center gap-3 rounded-lg bg-gray-800/50 px-3 py-2">
                <span className="text-sm">{emoji}</span>
                <span className="flex-1 text-xs text-gray-300">{t(labelKey)}</span>
                <div className="h-1.5 w-16 rounded-full bg-gray-700">
                  <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-10 text-right text-xs text-gray-400">{data.correct}/{data.total}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mistakes */}
      {mistakes.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-medium text-error-400">
            {t('results_mistakes')} ({mistakes.length})
          </h3>
          <div className="space-y-2">
            {mistakes.map((m, i) => (
              <div key={i} className="rounded-lg border border-error-500/20 bg-error-500/5 px-4 py-2">
                <p className="text-sm font-medium text-gray-200">{m.term}</p>
                <p className="mt-1 text-xs text-gray-400">{m.explanation}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
