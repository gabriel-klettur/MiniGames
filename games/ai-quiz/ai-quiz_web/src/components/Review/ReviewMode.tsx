import { useState } from 'react';
import { useQuiz } from '../../contexts/QuizContext';
import { generateReviewSession } from '../../data/questionGenerator';
import type { UserAnswer } from '../../data/types';
import ProgressBar from '../Quiz/ProgressBar';
import MultipleChoiceQuestion from '../Quiz/MultipleChoiceQuestion';
import QuestionFeedback from '../Quiz/QuestionFeedback';

export default function ReviewMode() {
  const { state, dispatch } = useQuiz();
  const [questions] = useState(() => generateReviewSession(state.mistakeBank, Math.min(10, state.mistakeBank.length)));
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  if (state.mistakeBank.length === 0 || questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 animate-slide-up text-center">
        <p className="text-4xl">🎉</p>
        <h2 className="text-xl font-bold text-gray-100">¡Sin errores pendientes!</h2>
        <p className="text-gray-400">Has dominado todos los conceptos.</p>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
          className="rounded-card bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-500"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const question = questions[index];
  if (!question) {
    return (
      <div className="flex flex-col items-center gap-4 animate-slide-up text-center">
        <p className="text-4xl">✅</p>
        <h2 className="text-xl font-bold text-gray-100">Repaso completado</h2>
        <p className="text-gray-400">Quedan {state.mistakeBank.length} conceptos en tu banco de errores.</p>
        <div className="flex gap-3">
          <button
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
            className="rounded-card bg-gray-800 px-6 py-3 font-medium text-gray-200 transition hover:bg-gray-700"
          >
            🏠 Inicio
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'review' })}
            className="rounded-card bg-brand-600 px-6 py-3 font-medium text-white transition hover:bg-brand-500"
          >
            🔄 Repetir
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
        <h2 className="text-lg font-bold text-gray-100">🔄 Modo Repaso</h2>
        <span className="text-xs text-gray-400">{state.mistakeBank.length} conceptos pendientes</span>
      </div>

      <ProgressBar current={index} total={questions.length} />

      <MultipleChoiceQuestion question={question} onAnswer={handleAnswer} />

      {answered && lastCorrect !== null && !lastCorrect && (
        <QuestionFeedback isCorrect={false} explanation="Este concepto permanece en tu banco de repaso." />
      )}

      {answered && (
        <button
          onClick={handleNext}
          className="rounded-card bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-500"
        >
          {index >= questions.length - 1 ? '📊 Finalizar Repaso' : 'Siguiente →'}
        </button>
      )}
    </div>
  );
}
