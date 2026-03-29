import { useQuiz } from '../../contexts/QuizContext';
import { CATEGORIES } from '../../data/categories';
import { generateQuizSession } from '../../data/questionGenerator';
import type { Category, Difficulty, QuestionType } from '../../data/types';

const QUESTION_TYPES: { id: QuestionType; label: string }[] = [
  { id: 'definition-to-term', label: 'Definición → Término' },
  { id: 'term-to-definition', label: 'Término → Definición' },
  { id: 'true-false', label: 'Verdadero / Falso' },
  { id: 'match-columns', label: 'Relacionar columnas' },
];

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 1, label: '⭐ Básico' },
  { id: 2, label: '⭐⭐ Intermedio' },
  { id: 3, label: '⭐⭐⭐ Avanzado' },
];

export default function QuizConfigurator() {
  const { state, dispatch } = useQuiz();
  const { quizConfig } = state;

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
      ? quizConfig.questionTypes.filter((t) => t !== id)
      : [...quizConfig.questionTypes, id];
    if (next.length > 0) dispatch({ type: 'SET_CONFIG', config: { questionTypes: next } });
  };

  const start = () => {
    const questions = generateQuizSession(quizConfig);
    if (questions.length === 0) return;
    dispatch({
      type: 'START_QUIZ',
      quiz: { questions, currentIndex: 0, answers: [], startTime: Date.now() },
    });
  };

  return (
    <section id="configurator" className="rounded-card border border-gray-800 bg-gray-900/60 p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-200">Configurar Quiz</h2>

      {/* Categories */}
      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-medium text-gray-400">Categorías</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ id, emoji, label }) => (
            <ToggleChip key={id} active={quizConfig.categories.includes(id)} onClick={() => toggleCategory(id)}>
              {emoji} {label}
            </ToggleChip>
          ))}
        </div>
      </fieldset>

      {/* Difficulty */}
      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-medium text-gray-400">Dificultad</legend>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map(({ id, label }) => (
            <ToggleChip key={id} active={quizConfig.difficulties.includes(id)} onClick={() => toggleDifficulty(id)}>
              {label}
            </ToggleChip>
          ))}
        </div>
      </fieldset>

      {/* Question types */}
      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-medium text-gray-400">Tipos de pregunta</legend>
        <div className="flex flex-wrap gap-2">
          {QUESTION_TYPES.map(({ id, label }) => (
            <ToggleChip key={id} active={quizConfig.questionTypes.includes(id)} onClick={() => toggleType(id)}>
              {label}
            </ToggleChip>
          ))}
        </div>
      </fieldset>

      {/* Count */}
      <div className="mb-5 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-400">Preguntas:</label>
        <input
          type="range" min={5} max={30} step={5}
          value={quizConfig.questionCount}
          onChange={(e) => dispatch({ type: 'SET_CONFIG', config: { questionCount: +e.target.value } })}
          className="flex-1 accent-brand-500"
        />
        <span className="w-8 text-center text-sm font-semibold text-gray-200">{quizConfig.questionCount}</span>
      </div>

      <button onClick={start} className="w-full rounded-card bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-500">
        🚀 Comenzar Quiz
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
