import { useQuiz } from '../../contexts/QuizContext';
import { useI18n } from '../../i18n';
import { CATEGORIES } from '../../data/categories';
import { generateQuizSession } from '../../data/questionGenerator';
import type { Category, Difficulty, QuestionType } from '../../data/types';

export default function QuizConfigurator() {
  const { state, dispatch } = useQuiz();
  const { t, locale } = useI18n();
  const { quizConfig } = state;

  const QUESTION_TYPES: { id: QuestionType; labelKey: string }[] = [
    { id: 'definition-to-term', labelKey: 'qtype_definition_to_term' },
    { id: 'term-to-definition', labelKey: 'qtype_term_to_definition' },
    { id: 'true-false', labelKey: 'qtype_true_false' },
    { id: 'match-columns', labelKey: 'qtype_match_columns' },
  ];

  const DIFFICULTIES: { id: Difficulty; labelKey: string }[] = [
    { id: 1, labelKey: 'difficulty_1' },
    { id: 2, labelKey: 'difficulty_2' },
    { id: 3, labelKey: 'difficulty_3' },
  ];

  const toggleCategory = (id: Category) => {
    const next = quizConfig.categories.includes(id)
      ? quizConfig.categories.filter((c) => c !== id)
      : [...quizConfig.categories, id];
    if (next.length > 0) dispatch({ type: 'SET_CONFIG', config: { categories: next } });
  };

  const toggleDifficulty = (id: Difficulty) => {
    const next = quizConfig.difficulties.includes(id)
      ? quizConfig.difficulties.filter((d) => d !== id)
      : [...quizConfig.difficulties, id];
    if (next.length > 0) dispatch({ type: 'SET_CONFIG', config: { difficulties: next } });
  };

  const toggleType = (id: QuestionType) => {
    const next = quizConfig.questionTypes.includes(id)
      ? quizConfig.questionTypes.filter((qt) => qt !== id)
      : [...quizConfig.questionTypes, id];
    if (next.length > 0) dispatch({ type: 'SET_CONFIG', config: { questionTypes: next } });
  };

  const start = () => {
    const questions = generateQuizSession(quizConfig, locale);
    if (questions.length === 0) return;
    dispatch({
      type: 'START_QUIZ',
      quiz: { questions, currentIndex: 0, answers: [], startTime: Date.now() },
    });
  };

  return (
    <section id="configurator" className="rounded-card border border-gray-800 bg-gray-900/60 p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-200">{t('config_title')}</h2>

      {/* Categories */}
      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-medium text-gray-400">{t('config_categories')}</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ id, emoji, labelKey }) => (
            <ToggleChip key={id} active={quizConfig.categories.includes(id)} onClick={() => toggleCategory(id)}>
              {emoji} {t(labelKey)}
            </ToggleChip>
          ))}
        </div>
      </fieldset>

      {/* Difficulty */}
      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-medium text-gray-400">{t('config_difficulty')}</legend>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map(({ id, labelKey }) => (
            <ToggleChip key={id} active={quizConfig.difficulties.includes(id)} onClick={() => toggleDifficulty(id)}>
              {t(labelKey)}
            </ToggleChip>
          ))}
        </div>
      </fieldset>

      {/* Question types */}
      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-medium text-gray-400">{t('config_question_types')}</legend>
        <div className="flex flex-wrap gap-2">
          {QUESTION_TYPES.map(({ id, labelKey }) => (
            <ToggleChip key={id} active={quizConfig.questionTypes.includes(id)} onClick={() => toggleType(id)}>
              {t(labelKey)}
            </ToggleChip>
          ))}
        </div>
      </fieldset>

      {/* Count */}
      <div className="mb-5 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-400">{t('config_question_count')}</label>
        <input
          type="range" min={5} max={30} step={5}
          value={quizConfig.questionCount}
          onChange={(e) => dispatch({ type: 'SET_CONFIG', config: { questionCount: +e.target.value } })}
          className="flex-1 accent-brand-500"
        />
        <span className="w-8 text-center text-sm font-semibold text-gray-200">{quizConfig.questionCount}</span>
      </div>

      <button onClick={start} className="w-full rounded-card bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-500">
        {t('config_start')}
      </button>
    </section>
  );
}

function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
