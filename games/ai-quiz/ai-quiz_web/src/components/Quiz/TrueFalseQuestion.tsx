import { useState, useRef } from 'react';
import type { Question, UserAnswer } from '../../data/types';
import { useI18n } from '../../i18n';
import QuestionFeedback from './QuestionFeedback';
import { DiagramPanel } from '../Diagram';
import { HelpPanel } from '../Help';

interface Props {
  question: Question;
  onAnswer: (answer: UserAnswer) => void;
}

export default function TrueFalseQuestion({ question, onAnswer }: Props) {
  const { t } = useI18n();
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
      <div className="glass rounded-card p-6 text-center">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-gray-500">
          {t('q_true_false')}
        </p>
        <p className="text-lg leading-relaxed text-gray-100">{question.prompt}</p>
      </div>

      {/* Help & Diagram */}
      <HelpPanel conceptId={question.conceptId} />
      <DiagramPanel conceptId={question.conceptId} />

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4">
        {(['true', 'false'] as const).map((value) => {
          const label = value === 'true' ? t('q_true') : t('q_false');
          const isCorrectOption = value === question.correctAnswer;
          const isSelected = value === selected;

          let style = value === 'true'
            ? 'border-white/[0.06] bg-surface-2/60 hover:bg-success-500/[0.08] hover:border-success-500/20'
            : 'border-white/[0.06] bg-surface-2/60 hover:bg-error-500/[0.08] hover:border-error-500/20';

          if (answered) {
            if (isCorrectOption) {
              style = 'border-success-500/30 bg-success-500/[0.08] ring-1 ring-success-500/30 shadow-glow-success animate-pulse-success';
            } else if (isSelected) {
              style = 'border-error-500/30 bg-error-500/[0.08] ring-1 ring-error-500/30 shadow-glow-error animate-shake';
            } else {
              style = 'border-white/[0.03] bg-surface-1/40 opacity-40';
            }
          }

          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              disabled={answered}
              className={`rounded-card border p-5 text-lg font-semibold transition-all duration-200 ${style}`}
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
