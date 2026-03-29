import { useState } from 'react';
import { useQuiz } from '../../contexts/QuizContext';
import type { UserAnswer } from '../../data/types';
import ProgressBar from './ProgressBar';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import TrueFalseQuestion from './TrueFalseQuestion';
import MatchColumnsQuestion from './MatchColumnsQuestion';

export default function QuizMode() {
  const { state, dispatch } = useQuiz();
  const { currentQuiz } = state;
  const [answered, setAnswered] = useState(false);

  if (!currentQuiz) {
    return (
      <div className="text-center text-gray-400">
        <p>No hay quiz activo.</p>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
          className="mt-4 text-brand-400 hover:underline"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const question = currentQuiz.questions[currentQuiz.currentIndex];
  if (!question) {
    dispatch({ type: 'FINISH_QUIZ' });
    return null;
  }

  const handleAnswer = (answer: UserAnswer) => {
    dispatch({ type: 'ANSWER_QUESTION', answer });
    setAnswered(true);
  };

  const handleNext = () => {
    setAnswered(false);
    dispatch({ type: 'NEXT_QUESTION' });
  };

  const isLast = currentQuiz.currentIndex >= currentQuiz.questions.length - 1;

  return (
    <div className="flex flex-col gap-5 animate-slide-up" key={question.id}>
      <ProgressBar current={currentQuiz.currentIndex} total={currentQuiz.questions.length} />

      {/* Streak */}
      {state.stats.streak > 1 && (
        <p className="text-center text-sm text-amber-400">🔥 Racha: {state.stats.streak}</p>
      )}

      {/* Question component by type */}
      {(question.type === 'definition-to-term' || question.type === 'term-to-definition') && (
        <MultipleChoiceQuestion question={question} onAnswer={handleAnswer} />
      )}
      {question.type === 'true-false' && (
        <TrueFalseQuestion question={question} onAnswer={handleAnswer} />
      )}
      {question.type === 'match-columns' && (
        <MatchColumnsQuestion question={question} onAnswer={handleAnswer} />
      )}

      {/* Next button */}
      {answered && (
        <button
          onClick={handleNext}
          className="rounded-card bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-500"
        >
          {isLast ? '📊 Ver Resultados' : 'Siguiente →'}
        </button>
      )}
    </div>
  );
}
