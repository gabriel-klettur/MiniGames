import type { Category } from './types';
import type { Locale } from '../i18n/types';

interface CategoryMeta {
  id: Category;
  labelKey: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'search-algorithms', labelKey: 'cat_search_algorithms', emoji: '🔍', color: 'text-blue-400' },
  { id: 'evaluation', labelKey: 'cat_evaluation', emoji: '⚖️', color: 'text-amber-400' },
  { id: 'optimization', labelKey: 'cat_optimization', emoji: '⚡', color: 'text-yellow-400' },
  { id: 'architecture', labelKey: 'cat_architecture', emoji: '🏗️', color: 'text-purple-400' },
  { id: 'data-structures', labelKey: 'cat_data_structures', emoji: '📦', color: 'text-green-400' },
  { id: 'testing', labelKey: 'cat_testing', emoji: '🧪', color: 'text-teal-400' },
  { id: 'machine-learning', labelKey: 'cat_machine_learning', emoji: '🧠', color: 'text-rose-400' },
  { id: 'devops-tools', labelKey: 'cat_devops_tools', emoji: '🐳', color: 'text-cyan-400' },
  { id: 'agents', labelKey: 'cat_agents', emoji: '🤖', color: 'text-indigo-400' },
];

const LABELS_ES: Record<Category, string> = {
  'search-algorithms': 'Algoritmos de Búsqueda',
  evaluation: 'Evaluación',
  optimization: 'Optimización',
  architecture: 'Arquitectura',
  'data-structures': 'Estructuras de Datos',
  testing: 'Testing',
  'machine-learning': 'Machine Learning',
  'devops-tools': 'Herramientas DevOps',
  agents: 'Agentes de IA',
};

const LABELS_EN: Record<Category, string> = {
  'search-algorithms': 'Search Algorithms',
  evaluation: 'Evaluation',
  optimization: 'Optimization',
  architecture: 'Architecture',
  'data-structures': 'Data Structures',
  testing: 'Testing',
  'machine-learning': 'Machine Learning',
  'devops-tools': 'DevOps Tools',
  agents: 'AI Agents',
};

const LABELS: Record<Locale, Record<Category, string>> = { es: LABELS_ES, en: LABELS_EN };

export const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategoryLabel(id: Category, locale: Locale = 'es'): string {
  return LABELS[locale][id] ?? id;
}

export function getCategoryEmoji(id: Category): string {
  return categoryMap.get(id)?.emoji ?? '📌';
}
