import { useState } from 'react';
import type { Concept } from '../../data/types';
import { getCategoryLabel, getCategoryEmoji } from '../../data/categories';
import { DiagramPanel } from '../Diagram';

interface Props {
  concept: Concept;
  isStudied: boolean;
}

const DIFFICULTY_LABELS: Record<number, string> = { 1: '⭐ Básico', 2: '⭐⭐ Intermedio', 3: '⭐⭐⭐ Avanzado' };

export default function Flashcard({ concept, isStudied }: Props) {
  const [flipped, setFlipped] = useState(false);

  // Reset flip when concept changes
  const [prevId, setPrevId] = useState(concept.id);
  if (concept.id !== prevId) {
    setPrevId(concept.id);
    setFlipped(false);
  }

  return (
    <div
      className="perspective-1000 cursor-pointer"
      onClick={() => setFlipped(!flipped)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setFlipped(!flipped)}
    >
      <div className={`relative min-h-[280px] preserve-3d transition-transform duration-500 ${flipped ? 'rotate-y-180' : ''}`}>
        {/* Front */}
        <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-card border border-gray-700 bg-gray-900 p-6 shadow-card">
          {isStudied && <span className="absolute right-3 top-3 text-success-400">✓</span>}
          <span className="mb-2 text-xs text-gray-500">{getCategoryEmoji(concept.category)} {getCategoryLabel(concept.category)}</span>
          <h3 className="text-2xl font-bold text-brand-300">{concept.term}</h3>
          {concept.termEs !== concept.term && (
            <p className="mt-1 text-sm text-gray-400">{concept.termEs}</p>
          )}
          <p className="mt-2 text-xs text-gray-500">{DIFFICULTY_LABELS[concept.difficulty]}</p>
          <p className="mt-4 text-xs text-gray-500">Click para ver definición →</p>
        </div>

        {/* Back */}
        <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col rounded-card border border-brand-700/30 bg-gray-900 p-6 shadow-card overflow-y-auto">
          <h4 className="mb-2 text-sm font-semibold text-brand-400">{concept.term}</h4>
          <p className="text-sm leading-relaxed text-gray-200">{concept.definition}</p>
          <ul className="mt-4 space-y-1">
            {concept.keyPoints.map((kp, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                <span className="mt-0.5 text-brand-500">•</span>
                {kp}
              </li>
            ))}
          </ul>
          <div className="mt-4" onClick={(e) => e.stopPropagation()}>
            <DiagramPanel conceptId={concept.id} />
          </div>
          <p className="mt-auto pt-4 text-xs text-gray-500">Click para volver ←</p>
        </div>
      </div>
    </div>
  );
}
