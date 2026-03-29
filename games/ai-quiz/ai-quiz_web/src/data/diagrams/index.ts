import type { DiagramSpec } from './types';
import { searchAlgorithmDiagrams } from './searchAlgorithms';
import { evaluationDiagrams } from './evaluation';
import { optimizationDiagrams } from './optimization';
import { architectureDiagrams } from './architecture';
import { dataStructureDiagrams } from './dataStructures';
import { testingDiagrams } from './testing';
import { machineLearningDiagrams } from './machineLearning';

const ALL_DIAGRAMS: DiagramSpec[] = [
  ...searchAlgorithmDiagrams,
  ...evaluationDiagrams,
  ...optimizationDiagrams,
  ...architectureDiagrams,
  ...dataStructureDiagrams,
  ...testingDiagrams,
  ...machineLearningDiagrams,
];

export const DIAGRAM_MAP = new Map<string, DiagramSpec>(
  ALL_DIAGRAMS.map((d) => [d.id, d]),
);

export function getDiagramById(conceptId: string): DiagramSpec | undefined {
  return DIAGRAM_MAP.get(conceptId);
}
