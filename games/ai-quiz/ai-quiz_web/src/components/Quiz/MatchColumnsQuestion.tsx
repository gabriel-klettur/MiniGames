import { useState, useRef, useMemo } from 'react';
import type { Question, UserAnswer } from '../../data/types';
import { useI18n } from '../../i18n';
import { shuffle } from '../../data/questionUtils';
import QuestionFeedback from './QuestionFeedback';
import { DiagramPanel } from '../Diagram';
import { HelpPanel } from '../Help';

interface Props {
  question: Question;
  onAnswer: (answer: UserAnswer) => void;
}

export default function MatchColumnsQuestion({ question, onAnswer }: Props) {
  const { t } = useI18n();
  const pairs = question.pairs ?? [];
  const shuffledDefs = useMemo(() => shuffle(pairs), [question.id]);

  const [connections, setConnections] = useState<Map<string, string>>(new Map());
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const startRef = useRef(Date.now());

  const handleTermClick = (termId: string) => {
    if (submitted) return;
    setActiveTerm(activeTerm === termId ? null : termId);
  };

  const handleDefClick = (defTermId: string) => {
    if (submitted || !activeTerm) return;
    const next = new Map(connections);
    // Remove any existing connection to this def
    for (const [k, v] of next) if (v === defTermId) next.delete(k);
    next.set(activeTerm, defTermId);
    setConnections(next);
    setActiveTerm(null);
  };

  const allConnected = connections.size === pairs.length;

  const handleSubmit = () => {
    if (!allConnected || submitted) return;
    setSubmitted(true);

    const correctCount = pairs.filter((p) => connections.get(p.termId) === p.termId).length;
    const isCorrect = correctCount === pairs.length;

    onAnswer({
      questionId: question.id,
      selectedAnswer: Array.from(connections.entries()).map(([k, v]) => `${k}:${v}`),
      isCorrect,
      timeSpent: Date.now() - startRef.current,
    });
  };

  const getTermStatus = (termId: string) => {
    if (!submitted) return connections.has(termId) ? 'connected' : activeTerm === termId ? 'active' : 'idle';
    return connections.get(termId) === termId ? 'correct' : 'incorrect';
  };

  const getDefStatus = (defTermId: string) => {
    if (!submitted) {
      const connectedBy = [...connections.entries()].find(([, v]) => v === defTermId);
      return connectedBy ? 'connected' : 'idle';
    }
    const connectedBy = [...connections.entries()].find(([, v]) => v === defTermId);
    return connectedBy && connectedBy[0] === defTermId ? 'correct' : 'incorrect';
  };

  const statusStyles = {
    idle: 'border-gray-700 bg-gray-800/40',
    active: 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/40',
    connected: 'border-brand-400/50 bg-brand-500/5',
    correct: 'border-success-500 bg-success-500/10',
    incorrect: 'border-error-500 bg-error-500/10',
  };

  const correctCount = submitted ? pairs.filter((p) => connections.get(p.termId) === p.termId).length : 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm text-gray-400">
        {t('q_match_hint')}
      </p>

      {/* Help & Diagram */}
      <HelpPanel conceptId={question.conceptId} />
      <DiagramPanel conceptId={question.conceptId} />

      <div className="grid grid-cols-2 gap-4">
        {/* Terms */}
        <div className="flex flex-col gap-2">
          {pairs.map((p) => (
            <button
              key={p.termId}
              onClick={() => handleTermClick(p.termId)}
              disabled={submitted}
              className={`rounded-lg border p-3 text-left text-sm font-medium transition ${statusStyles[getTermStatus(p.termId)]}`}
            >
              {submitted && getTermStatus(p.termId) === 'correct' && <span className="mr-1 text-success-400">✓</span>}
              {submitted && getTermStatus(p.termId) === 'incorrect' && <span className="mr-1 text-error-400">✗</span>}
              {p.term}
            </button>
          ))}
        </div>

        {/* Definitions */}
        <div className="flex flex-col gap-2">
          {shuffledDefs.map((p) => (
            <button
              key={`def-${p.termId}`}
              onClick={() => handleDefClick(p.termId)}
              disabled={submitted || !activeTerm}
              className={`rounded-lg border p-3 text-left text-xs leading-relaxed transition ${statusStyles[getDefStatus(p.termId)]}`}
            >
              {p.definition}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!allConnected}
          className="rounded-card bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('q_check')} ({connections.size}/{pairs.length})
        </button>
      )}

      {submitted && (
        <QuestionFeedback
          isCorrect={correctCount === pairs.length}
          explanation={`${correctCount}/${pairs.length} correctos. ${question.explanation}`}
        />
      )}
    </div>
  );
}
