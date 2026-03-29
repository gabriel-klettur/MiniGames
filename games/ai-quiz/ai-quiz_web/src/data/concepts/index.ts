import { searchAlgorithms } from './searchAlgorithms';
import { evaluationConcepts } from './evaluation';
import { optimizationConcepts } from './optimization';
import { architectureConcepts } from './architecture';
import { dataStructureConcepts } from './dataStructures';
import { testingConcepts } from './testing';
import { machineLearningConcepts } from './machineLearning';
import { devopsToolsConcepts } from './devopsTools';
import { agentsConcepts } from './agents';
import { enConceptsA } from './enA';
import { enConceptsB } from './enB';
import { enConceptsC } from './enC';
import type { Concept } from '../types';
import type { Locale } from '../../i18n/types';

export const ALL_CONCEPTS: Concept[] = [
  ...searchAlgorithms,
  ...evaluationConcepts,
  ...optimizationConcepts,
  ...architectureConcepts,
  ...dataStructureConcepts,
  ...testingConcepts,
  ...machineLearningConcepts,
  ...devopsToolsConcepts,
  ...agentsConcepts,
];

export const conceptById = new Map(ALL_CONCEPTS.map((c) => [c.id, c]));

const EN_OVERRIDES: Record<string, { definition: string; keyPoints: string[] }> = {
  ...enConceptsA,
  ...enConceptsB,
  ...enConceptsC,
};

/** Returns all concepts with definitions/keyPoints localized */
export function getLocalizedConcepts(locale: Locale): Concept[] {
  if (locale === 'es') return ALL_CONCEPTS;
  return ALL_CONCEPTS.map((c) => {
    const ov = EN_OVERRIDES[c.id];
    if (!ov) return c;
    return { ...c, definition: ov.definition, keyPoints: ov.keyPoints };
  });
}

/** Returns a single concept localized */
export function getLocalizedConcept(id: string, locale: Locale): Concept | undefined {
  const c = conceptById.get(id);
  if (!c || locale === 'es') return c;
  const ov = EN_OVERRIDES[c.id];
  if (!ov) return c;
  return { ...c, definition: ov.definition, keyPoints: ov.keyPoints };
}
