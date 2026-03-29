import { useState, useMemo } from 'react';
import { getLocalizedConcepts } from '../../data/concepts';
import { CATEGORIES } from '../../data/categories';
import { useQuiz } from '../../contexts/QuizContext';
import { useI18n } from '../../i18n';
import Flashcard from './Flashcard';
import type { Category } from '../../data/types';

export default function StudyMode() {
  const { dispatch } = useQuiz();
  const { t, locale } = useI18n();
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [index, setIndex] = useState(0);
  const [studied, setStudied] = useState<Set<string>>(new Set());

  const concepts = useMemo(() => getLocalizedConcepts(locale), [locale]);
  const filtered = useMemo(
    () => categoryFilter === 'all' ? concepts : concepts.filter((c) => c.category === categoryFilter),
    [categoryFilter, concepts],
  );

  const concept = filtered[index];
  if (!concept) return <p className="text-gray-400">{t('study_empty')}</p>;

  const prev = () => setIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
  const next = () => {
    setStudied((s) => new Set(s).add(concept.id));
    setIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
  };

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-100">{t('study_title')}</h2>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          {t('study_back')}
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <FilterChip active={categoryFilter === 'all'} onClick={() => { setCategoryFilter('all'); setIndex(0); }}>
          {t('study_all')}
        </FilterChip>
        {CATEGORIES.map(({ id, emoji, labelKey }) => (
          <FilterChip key={id} active={categoryFilter === id} onClick={() => { setCategoryFilter(id); setIndex(0); }}>
            {emoji} {t(labelKey)}
          </FilterChip>
        ))}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 text-sm text-gray-400">
        <span>{index + 1} / {filtered.length}</span>
        <div className="h-1.5 flex-1 rounded-full bg-gray-800">
          <div
            className="h-1.5 rounded-full bg-brand-500 transition-all"
            style={{ width: `${((index + 1) / filtered.length) * 100}%` }}
          />
        </div>
        <span>{t('study_studied', { count: studied.size })}</span>
      </div>

      {/* Card */}
      <Flashcard concept={concept} isStudied={studied.has(concept.id)} />

      {/* Navigation */}
      <div className="flex justify-center gap-4">
        <button onClick={prev} className="rounded-lg bg-gray-800 px-6 py-2 font-medium text-gray-300 transition hover:bg-gray-700">
          {t('study_prev')}
        </button>
        <button onClick={next} className="rounded-lg bg-brand-600 px-6 py-2 font-medium text-white transition hover:bg-brand-500">
          {t('study_next')}
        </button>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active ? 'bg-brand-600/30 text-brand-300 ring-1 ring-brand-500/50' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  );
}
