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

export default function MultipleChoiceQuestion({ question, onAnswer }: Props) {
  const { t } = useI18n();
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
      <div className="glass rounded-card p-5">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-gray-500">
          {isDefToTerm ? t('q_def_to_term') : t('q_term_to_def')}
        </p>
        <p className={`leading-relaxed text-gray-100 ${isDefToTerm ? 'text-sm' : 'text-lg font-semibold'}`}>
          {question.prompt}
        </p>
      </div>

      {/* Help & Diagram */}
      <HelpPanel conceptId={question.conceptId} />
      <DiagramPanel conceptId={question.conceptId} />

      {/* Options */}
      <div className="grid gap-3">
        {question.options?.map((opt) => {
          const isCorrectOption = opt.id === question.correctAnswer;
          const isSelected = opt.id === selected;

          let style = 'border-white/[0.06] bg-surface-2/60 hover:bg-surface-3 hover:border-white/[0.1]';
          if (answered) {
            if (isCorrectOption) {
              style = 'border-success-500/30 bg-success-500/[0.08] ring-1 ring-success-500/30 shadow-glow-success';
            } else if (isSelected && !isCorrectOption) {
              style = 'border-error-500/30 bg-error-500/[0.08] ring-1 ring-error-500/30 shadow-glow-error animate-shake';
            } else {
              style = 'border-white/[0.03] bg-surface-1/40 opacity-40';
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={answered}
              className={`flex items-center gap-3 rounded-card border p-4 text-left transition-all duration-200 ${style} ${
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
