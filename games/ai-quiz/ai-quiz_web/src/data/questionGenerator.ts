import type { Concept, Question, QuizConfig, QuestionType, MatchPair } from './types';
import type { Locale } from '../i18n/types';
import { getLocalizedConcepts } from './concepts';
import { shuffle, pickDistractors, filterConcepts, nextId } from './questionUtils';
import { getTranslations } from '../i18n/locales';

type T = (k: string, p?: Record<string, string | number>) => string;

function makeT(locale: Locale): T {
  const dict = getTranslations(locale);
  return (key, params) => {
    let text = dict[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) text = text.replaceAll(`{{${k}}}`, String(v));
    }
    return text;
  };
}

function generateDefinitionToTerm(concepts: Concept[], _t: T): Question | null {
  if (concepts.length < 4) return null;
  const target = concepts[Math.floor(Math.random() * concepts.length)];
  const distractors = pickDistractors(concepts, target.id, 3);
  const options = shuffle([target, ...distractors]).map((c) => ({ id: c.id, text: c.term }));

  return {
    id: nextId('dt'), type: 'definition-to-term', category: target.category,
    difficulty: target.difficulty, conceptId: target.id, prompt: target.definition, options,
    correctAnswer: target.id,
    explanation: `${target.term} (${target.termEs}): ${target.keyPoints[0]}.`,
  };
}

function generateTermToDefinition(concepts: Concept[], _t: T): Question | null {
  if (concepts.length < 4) return null;
  const target = concepts[Math.floor(Math.random() * concepts.length)];
  const distractors = pickDistractors(concepts, target.id, 3);
  const options = shuffle([target, ...distractors]).map((c) => ({
    id: c.id, text: c.definition.length > 120 ? c.definition.slice(0, 117) + '...' : c.definition,
  }));

  return {
    id: nextId('td'), type: 'term-to-definition', category: target.category,
    difficulty: target.difficulty, conceptId: target.id, prompt: target.term, options,
    correctAnswer: target.id, explanation: target.definition,
  };
}

function generateTrueFalse(concepts: Concept[], t: T): Question | null {
  if (concepts.length < 2) return null;
  const isTrue = Math.random() > 0.5;
  const target = concepts[Math.floor(Math.random() * concepts.length)];

  let statement: string;
  if (isTrue) {
    statement = `"${target.term}" — ${target.keyPoints[0]}.`;
  } else {
    const other = pickDistractors(concepts, target.id, 1)[0];
    if (!other) return null;
    statement = `"${target.term}" — ${other.keyPoints[0]}.`;
  }

  return {
    id: nextId('tf'), type: 'true-false', category: target.category,
    difficulty: target.difficulty, conceptId: target.id, prompt: statement,
    options: [
      { id: 'true', text: t('q_true') },
      { id: 'false', text: t('q_false') },
    ],
    correctAnswer: isTrue ? 'true' : 'false',
    explanation: isTrue
      ? t('gen_correct_explain', { term: target.term, definition: target.definition })
      : t('gen_false_explain', { term: target.term, point: target.keyPoints[0] }),
  };
}

function generateMatchColumns(concepts: Concept[], t: T): Question | null {
  if (concepts.length < 4) return null;
  const selected = shuffle(concepts).slice(0, Math.min(5, concepts.length));
  const pairs: MatchPair[] = selected.map((c) => ({
    termId: c.id, term: c.term,
    definition: c.definition.length > 80 ? c.definition.slice(0, 77) + '...' : c.definition,
  }));

  return {
    id: nextId('mc'), type: 'match-columns', category: selected[0].category,
    difficulty: selected[0].difficulty, conceptId: selected[0].id,
    prompt: t('gen_match_prompt'), pairs,
    correctAnswer: selected.map((c) => c.id),
    explanation: selected.map((c) => `${c.term}: ${c.keyPoints[0]}`).join(' | '),
  };
}

type Gen = (c: Concept[], t: T) => Question | null;
const GENERATORS: Record<QuestionType, Gen> = {
  'definition-to-term': generateDefinitionToTerm,
  'term-to-definition': generateTermToDefinition,
  'true-false': generateTrueFalse,
  'match-columns': generateMatchColumns,
};

export function generateQuizSession(config: QuizConfig, locale: Locale = 'es'): Question[] {
  const all = getLocalizedConcepts(locale);
  const pool = filterConcepts(all, config.categories, config.difficulties);
  if (pool.length < 4) return [];

  const t = makeT(locale);
  const types = config.questionTypes.length > 0 ? config.questionTypes : (['definition-to-term'] as QuestionType[]);
  const questions: Question[] = [];
  let attempts = 0;
  const maxAttempts = config.questionCount * 5;

  while (questions.length < config.questionCount && attempts < maxAttempts) {
    const type = types[Math.floor(Math.random() * types.length)];
    const q = GENERATORS[type](pool, t);
    if (q) questions.push(q);
    attempts++;
  }
  return shuffle(questions);
}

export function generateReviewSession(mistakeIds: string[], count: number, locale: Locale = 'es'): Question[] {
  const all = getLocalizedConcepts(locale);
  const pool = all.filter((c) => mistakeIds.includes(c.id));
  if (pool.length < 2) return [];

  const questions: Question[] = [];
  const targets = shuffle(pool).slice(0, count);

  for (const target of targets) {
    const distractors = pickDistractors(all, target.id, 3);
    const options = shuffle([target, ...distractors]).map((c) => ({ id: c.id, text: c.term }));
    questions.push({
      id: nextId('rv'), type: 'definition-to-term', category: target.category,
      difficulty: target.difficulty, conceptId: target.id, prompt: target.definition, options,
      correctAnswer: target.id, explanation: `${target.term}: ${target.keyPoints[0]}.`,
    });
  }
  return shuffle(questions);
}
