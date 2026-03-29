import { searchAlgorithms } from './searchAlgorithms';
import { evaluationConcepts } from './evaluation';
import { optimizationConcepts } from './optimization';
import { architectureConcepts } from './architecture';
import { dataStructureConcepts } from './dataStructures';
import { testingConcepts } from './testing';
import { machineLearningConcepts } from './machineLearning';
import type { Concept } from '../types';

export const ALL_CONCEPTS: Concept[] = [
  ...searchAlgorithms,
  ...evaluationConcepts,
  ...optimizationConcepts,
  ...architectureConcepts,
  ...dataStructureConcepts,
  ...testingConcepts,
  ...machineLearningConcepts,
];

export const conceptById = new Map(ALL_CONCEPTS.map((c) => [c.id, c]));
