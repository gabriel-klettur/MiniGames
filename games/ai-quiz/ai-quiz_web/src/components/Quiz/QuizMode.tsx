import { useState } from 'react';
import { useQuiz } from '../../contexts/QuizContext';
import { useI18n } from '../../i18n';
import type { UserAnswer } from '../../data/types';
import ProgressBar from './ProgressBar';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import TrueFalseQuestion from './TrueFalseQuestion';
import MatchColumnsQuestion from './MatchColumnsQuestion';

export default function QuizMode() {
  const { state, dispatch } = useQuiz();
  const { t } = useI18n();
  const { currentQuiz } = state;
  const [answered, setAnswered] = useState(false);

  if (!currentQuiz) {
    return (
      <div className="text-center text-gray-400">
        <p>{t('quiz_no_active')}</p>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
          className="mt-4 text-brand-400 hover:underline"
        >
          {t('quiz_back_home')}
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
        <p className="text-center text-xs font-medium uppercase tracking-wider text-amber-400/80">{t('quiz_streak', { count: state.stats.streak })}</p>
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
          className="rounded-card bg-gradient-to-r from-brand-600 to-brand-500 py-3 font-semibold text-white shadow-glow-sm transition-all duration-200 hover:shadow-glow-md hover:brightness-110"
        >
          {isLast ? t('quiz_results') : t('quiz_next')}
        </button>
      )}
    </div>
  );
}
