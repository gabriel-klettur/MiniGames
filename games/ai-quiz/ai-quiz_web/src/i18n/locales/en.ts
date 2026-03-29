import type { TranslationDict } from '../types';

export const en: TranslationDict = {
  // Nav
  nav_brand: '🧠 AI Quiz',
  nav_home: 'Home',
  nav_study: 'Study',
  mini_correct_title: 'Correct answers',
  mini_streak_title: 'Best streak',

  // Home
  hero_title: '🧠 AI Quiz',
  hero_subtitle: 'Learn AI concepts for video games with interactive quizzes',
  btn_study: '📖 Study Mode',
  btn_start_quiz: '🎯 Start Quiz',
  btn_review: '🔄 Review',

  // Stats
  stat_answered: 'Answered',
  stat_accuracy: 'Accuracy',
  stat_streak: 'Current streak',
  stat_best_streak: 'Best streak',
  stat_by_category: 'By category',

  // Configurator
  config_title: 'Configure Quiz',
  config_categories: 'Categories',
  config_difficulty: 'Difficulty',
  config_question_types: 'Question types',
  config_question_count: 'Questions:',
  config_start: '🚀 Start Quiz',

  // Difficulties
  difficulty_1: '⭐ Basic',
  difficulty_2: '⭐⭐ Intermediate',
  difficulty_3: '⭐⭐⭐ Advanced',

  // Question types
  qtype_definition_to_term: 'Definition → Term',
  qtype_term_to_definition: 'Term → Definition',
  qtype_true_false: 'True / False',
  qtype_match_columns: 'Match columns',

  // Categories
  cat_search_algorithms: 'Search Algorithms',
  cat_evaluation: 'Evaluation',
  cat_optimization: 'Optimization',
  cat_architecture: 'Architecture',
  cat_data_structures: 'Data Structures',
  cat_testing: 'Testing',
  cat_machine_learning: 'Machine Learning',

  // Quiz mode
  quiz_no_active: 'No active quiz.',
  quiz_back_home: 'Back to home',
  quiz_streak: '🔥 Streak: {{count}}',
  quiz_results: '📊 View Results',
  quiz_next: 'Next →',

  // Questions
  q_def_to_term: 'Which concept matches this definition?',
  q_term_to_def: 'Which is the correct definition?',
  q_true_false: 'True or false?',
  q_true: '✓ True',
  q_false: '✗ False',
  q_match_hint: 'Select a term on the left and then its definition on the right',
  q_check: 'Check',

  // Feedback
  feedback_correct: '✓ Correct!',
  feedback_incorrect: '✗ Incorrect',

  // Results
  results_none: 'No results available.',
  results_correct: '{{correct}} of {{total}} correct',
  results_excellent: 'Excellent mastery!',
  results_good: 'Good job!',
  results_ok: 'You\'re on the right track',
  results_practice: 'Keep practicing 💪',
  results_review: '🔄 Review mistakes',
  results_home: '🏠 Home',
  results_new_quiz: '🎯 New Quiz',
  results_breakdown: 'Breakdown by category',
  results_mistakes: '✗ Concepts to review',

  // Review
  review_empty_title: 'No pending mistakes!',
  review_empty_msg: 'You\'ve mastered all concepts.',
  review_title: '🔄 Review Mode',
  review_pending: '{{count}} pending concepts',
  review_done_title: '✅ Review complete',
  review_done_msg: '{{count}} concepts remain in your mistake bank.',
  review_repeat: '🔄 Repeat',
  review_mistake_stays: 'This concept stays in your review bank.',
  review_finish: '📊 Finish Review',

  // Study
  study_title: '📖 Study Mode',
  study_back: '← Back',
  study_all: 'All',
  study_empty: 'No concepts for this filter.',
  study_studied: '✅ {{count}} studied',
  study_prev: '← Previous',
  study_next: 'Next →',
  study_flip_front: 'Click to see definition →',
  study_flip_back: 'Click to go back ←',

  // Help & Diagram panels
  help_show: '💡 Show help',
  help_hide: '💡 Hide help',
  diagram_show: '📊 Show diagram',
  diagram_hide: '📊 Hide diagram',

  // Animation controls
  anim_no_desc: 'No description',
  anim_reset: 'Reset',
  anim_prev: 'Previous step',
  anim_pause: '⏸ Pause',
  anim_play: '▶ Play',
  anim_pause_tip: 'Pause',
  anim_play_tip: 'Play',
  anim_next: 'Next step',
  anim_step: 'Step {{n}}',

  // Diagram errors
  diagram_error: 'Diagram error: {{msg}}',
  diagram_loading: 'Loading diagram...',
  diagram_render_error: 'Error rendering diagram',

  // Question generator
  gen_match_prompt: 'Match each term with its definition',
  gen_true_false_true: '"{{term}}" — {{point}}.',
  gen_true_false_false: '"{{term}}" — {{point}}.',
  gen_false_explain: 'False. "{{term}}" actually: {{point}}. The statement describes another concept.',
  gen_correct_explain: 'Correct. {{term}}: {{definition}}',
};
