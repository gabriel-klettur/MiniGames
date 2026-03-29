import { useState, useRef } from 'react';
import type { Question, UserAnswer } from '../../data/types';
import QuestionFeedback from './QuestionFeedback';
import { DiagramPanel } from '../Diagram';

interface Props {
  question: Question;
  onAnswer: (answer: UserAnswer) => void;
}

export default function MultipleChoiceQuestion({ question, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const startRef = useRef(Date.now());

  const handleSelect = (optionId: string) => {
    if (answered) return;
    setSelected(optionId);
    setAnswered(true);

    const isCorrect = optionId === question.correctAnswer;
    onAnswer({
      questionId: question.id,
      selectedAnswer: optionId,
      isCorrect,
      timeSpent: Date.now() - startRef.current,
    });
  };

  const isDefToTerm = question.type === 'definition-to-term';

  return (
    <div className="flex flex-col gap-4">
      {/* Prompt */}
      <div className="rounded-card border border-gray-700 bg-gray-800/50 p-5">
        <p className="mb-1 text-xs font-medium uppercase text-gray-500">
          {isDefToTerm ? '¿Qué concepto describe esta definición?' : '¿Cuál es la definición correcta?'}
        </p>
        <p className={`leading-relaxed text-gray-100 ${isDefToTerm ? 'text-sm' : 'text-lg font-semibold'}`}>
          {question.prompt}
        </p>
      </div>

      {/* Diagram */}
      <DiagramPanel conceptId={question.conceptId} />

      {/* Options */}
      <div className="grid gap-3">
        {question.options?.map((opt) => {
          const isCorrectOption = opt.id === question.correctAnswer;
          const isSelected = opt.id === selected;

          let style = 'border-gray-700 bg-gray-800/40 hover:bg-gray-800 hover:border-gray-600';
          if (answered) {
            if (isCorrectOption) {
              style = 'border-success-500 bg-success-500/10 ring-1 ring-success-500/40';
            } else if (isSelected && !isCorrectOption) {
              style = 'border-error-500 bg-error-500/10 ring-1 ring-error-500/40 animate-shake';
            } else {
              style = 'border-gray-700/50 bg-gray-800/20 opacity-50';
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={answered}
              className={`flex items-center gap-3 rounded-card border p-4 text-left transition ${style} ${
                answered && isCorrectOption ? 'animate-pulse-success' : ''
              }`}
            >
              {answered && isCorrectOption && <span className="text-success-400">✓</span>}
              {answered && isSelected && !isCorrectOption && <span className="text-error-400">✗</span>}
              <span className="text-sm text-gray-200">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <QuestionFeedback
          isCorrect={selected === question.correctAnswer}
          explanation={question.explanation}
        />
      )}
    </div>
  );
}
