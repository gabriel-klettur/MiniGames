import { useState, useRef } from 'react';
import type { Question, UserAnswer } from '../../data/types';
import QuestionFeedback from './QuestionFeedback';
import { DiagramPanel } from '../Diagram';

interface Props {
  question: Question;
  onAnswer: (answer: UserAnswer) => void;
}

export default function TrueFalseQuestion({ question, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const startRef = useRef(Date.now());

  const handleSelect = (value: string) => {
    if (answered) return;
    setSelected(value);
    setAnswered(true);

    const isCorrect = value === question.correctAnswer;
    onAnswer({
      questionId: question.id,
      selectedAnswer: value,
      isCorrect,
      timeSpent: Date.now() - startRef.current,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Statement */}
      <div className="rounded-card border border-gray-700 bg-gray-800/50 p-6 text-center">
        <p className="mb-1 text-xs font-medium uppercase text-gray-500">
          ¿Verdadero o falso?
        </p>
        <p className="text-lg leading-relaxed text-gray-100">{question.prompt}</p>
      </div>

      {/* Diagram */}
      <DiagramPanel conceptId={question.conceptId} />

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4">
        {(['true', 'false'] as const).map((value) => {
          const label = value === 'true' ? '✓ Verdadero' : '✗ Falso';
          const isCorrectOption = value === question.correctAnswer;
          const isSelected = value === selected;

          let style = value === 'true'
            ? 'border-gray-700 bg-gray-800/40 hover:bg-success-500/10 hover:border-success-500/30'
            : 'border-gray-700 bg-gray-800/40 hover:bg-error-500/10 hover:border-error-500/30';

          if (answered) {
            if (isCorrectOption) {
              style = 'border-success-500 bg-success-500/10 ring-1 ring-success-500/40 animate-pulse-success';
            } else if (isSelected) {
              style = 'border-error-500 bg-error-500/10 ring-1 ring-error-500/40 animate-shake';
            } else {
              style = 'border-gray-700/50 bg-gray-800/20 opacity-50';
            }
          }

          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              disabled={answered}
              className={`rounded-card border p-5 text-lg font-semibold transition ${style}`}
            >
              {label}
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
