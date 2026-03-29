import type { HelpSpec } from './types';
import type { Locale } from '../../i18n/types';
import { searchAlgorithmHints } from './searchAlgorithms';
import { evaluationHints } from './evaluation';
import { optimizationHints } from './optimization';
import { architectureHints } from './architecture';
import { dataStructureHints, testingHints, machineLearningHints } from './dataStructuresTestingML';
import { enHintsA } from './enA';
import { enHintsB } from './enB';

const ALL_HINTS: HelpSpec[] = [
  ...searchAlgorithmHints,
  ...evaluationHints,
  ...optimizationHints,
  ...architectureHints,
  ...dataStructureHints,
  ...testingHints,
  ...machineLearningHints,
];

export const HINT_MAP = new Map<string, HelpSpec>(
  ALL_HINTS.map((h) => [h.id, h]),
);

const EN_HINTS: HelpSpec[] = [...enHintsA, ...enHintsB];
const EN_HINT_MAP = new Map<string, HelpSpec>(
  EN_HINTS.map((h) => [h.id, h]),
);

export function getHintById(conceptId: string, locale: Locale = 'es'): HelpSpec | undefined {
  if (locale === 'en') return EN_HINT_MAP.get(conceptId) ?? HINT_MAP.get(conceptId);
  return HINT_MAP.get(conceptId);
}
