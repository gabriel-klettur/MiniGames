import type { Category } from './types';

interface CategoryMeta {
  id: Category;
  label: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'search-algorithms', label: 'Algoritmos de Búsqueda', emoji: '🔍', color: 'text-blue-400' },
  { id: 'evaluation', label: 'Evaluación', emoji: '⚖️', color: 'text-amber-400' },
  { id: 'optimization', label: 'Optimización', emoji: '⚡', color: 'text-yellow-400' },
  { id: 'architecture', label: 'Arquitectura', emoji: '🏗️', color: 'text-purple-400' },
  { id: 'data-structures', label: 'Estructuras de Datos', emoji: '📦', color: 'text-green-400' },
  { id: 'testing', label: 'Testing', emoji: '🧪', color: 'text-teal-400' },
  { id: 'machine-learning', label: 'Machine Learning', emoji: '🧠', color: 'text-rose-400' },
];

export const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategoryLabel(id: Category): string {
  return categoryMap.get(id)?.label ?? id;
}

export function getCategoryEmoji(id: Category): string {
  return categoryMap.get(id)?.emoji ?? '📌';
}
