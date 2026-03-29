import { useState } from 'react';
import { useQuiz } from '../../contexts/QuizContext';
import { useI18n } from '../../i18n';
import { generateReviewSession } from '../../data/questionGenerator';
import type { UserAnswer } from '../../data/types';
import ProgressBar from '../Quiz/ProgressBar';
import MultipleChoiceQuestion from '../Quiz/MultipleChoiceQuestion';
import QuestionFeedback from '../Quiz/QuestionFeedback';

export default function ReviewMode() {
  const { state, dispatch } = useQuiz();
  const { t, locale } = useI18n();
  const [questions] = useState(() => generateReviewSession(state.mistakeBank, Math.min(10, state.mistakeBank.length), locale));
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  if (state.mistakeBank.length === 0 || questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 animate-slide-up text-center">
        <p className="text-4xl">🎉</p>
        <h2 className="text-gradient text-xl font-bold">{t('review_empty_title')}</h2>
        <p className="text-gray-500">{t('review_empty_msg')}</p>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
          className="rounded-card bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-3 font-semibold text-white shadow-glow-sm transition-all duration-200 hover:shadow-glow-md hover:brightness-110"
        >
          {t('quiz_back_home')}
        </button>
      </div>
    );
  }

  const question = questions[index];
  if (!question) {
    return (
      <div className="flex flex-col items-center gap-4 animate-slide-up text-center">
        <p className="text-4xl">✅</p>
        <h2 className="text-gradient text-xl font-bold">{t('review_done_title')}</h2>
        <p className="text-gray-500">{t('review_done_msg', { count: state.mistakeBank.length })}</p>
        <div className="flex gap-3">
          <button
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
            className="glass rounded-card px-6 py-3 font-medium text-gray-200 transition-all duration-200 hover:shadow-glow-sm"
          >
            {t('results_home')}
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'review' })}
            className="rounded-card bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-3 font-medium text-white shadow-glow-sm transition-all duration-200 hover:shadow-glow-md hover:brightness-110"
          >
            {t('review_repeat')}
          </button>
        </div>
      </div>
    );
  }

  const handleAnswer = (answer: UserAnswer) => {
    setAnswered(true);
    setLastCorrect(answer.isCorrect);
    dispatch({ type: 'ANSWER_QUESTION', answer });
    if (answer.isCorrect && typeof question.correctAnswer === 'string') {
      dispatch({ type: 'CLEAR_MISTAKE', conceptId: question.correctAnswer });
    }
  };

  const handleNext = () => {
    setAnswered(false);
    setLastCorrect(null);
    setIndex((i) => i + 1);
  };

  return (
    <div className="flex flex-col gap-5 animate-slide-up" key={question.id}>
      <div className="flex items-center justify-between">
        <h2 className="text-gradient text-lg font-bold">{t('review_title')}</h2>
        <span className="text-[11px] uppercase tracking-wider text-gray-500">{t('review_pending', { count: state.mistakeBank.length })}</span>
      </div>

      <ProgressBar current={index} total={questions.length} />

      <MultipleChoiceQuestion question={question} onAnswer={handleAnswer} />

      {answered && lastCorrect !== null && !lastCorrect && (
        <QuestionFeedback isCorrect={false} explanation={t('review_mistake_stays')} />
      )}

      {answered && (
        <button
          onClick={handleNext}
          className="rounded-card bg-gradient-to-r from-brand-600 to-brand-500 py-3 font-semibold text-white shadow-glow-sm transition-all duration-200 hover:shadow-glow-md hover:brightness-110"
        >
          {index >= questions.length - 1 ? t('review_finish') : t('quiz_next')}
        </button>
      )}
    </div>
  );
}
