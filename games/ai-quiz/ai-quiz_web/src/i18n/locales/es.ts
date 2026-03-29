import type { TranslationDict } from '../types';

export const es: TranslationDict = {
  // Nav
  nav_brand: '🧠 AI Quiz',
  nav_home: 'Inicio',
  nav_study: 'Estudio',
  mini_correct_title: 'Respuestas correctas',
  mini_streak_title: 'Mejor racha',

  // Home
  hero_title: '🧠 AI Quiz',
  hero_subtitle: 'Aprende los conceptos de IA para videojuegos con tests interactivos',
  btn_study: '📖 Modo Estudio',
  btn_start_quiz: '🎯 Iniciar Quiz',
  btn_review: '🔄 Repaso',

  // Stats
  stat_answered: 'Respondidas',
  stat_accuracy: 'Acierto',
  stat_streak: 'Racha actual',
  stat_best_streak: 'Mejor racha',
  stat_by_category: 'Por categoría',

  // Configurator
  config_title: 'Configurar Quiz',
  config_categories: 'Categorías',
  config_difficulty: 'Dificultad',
  config_question_types: 'Tipos de pregunta',
  config_question_count: 'Preguntas:',
  config_start: '🚀 Comenzar Quiz',

  // Difficulties
  difficulty_1: '⭐ Básico',
  difficulty_2: '⭐⭐ Intermedio',
  difficulty_3: '⭐⭐⭐ Avanzado',

  // Question types
  qtype_definition_to_term: 'Definición → Término',
  qtype_term_to_definition: 'Término → Definición',
  qtype_true_false: 'Verdadero / Falso',
  qtype_match_columns: 'Relacionar columnas',

  // Categories
  cat_search_algorithms: 'Algoritmos de Búsqueda',
  cat_evaluation: 'Evaluación',
  cat_optimization: 'Optimización',
  cat_architecture: 'Arquitectura',
  cat_data_structures: 'Estructuras de Datos',
  cat_testing: 'Testing',
  cat_machine_learning: 'Machine Learning',
  cat_devops_tools: 'Herramientas DevOps',
  cat_agents: 'Agentes de IA',

  // Quiz mode
  quiz_no_active: 'No hay quiz activo.',
  quiz_back_home: 'Volver al inicio',
  quiz_streak: '🔥 Racha: {{count}}',
  quiz_results: '📊 Ver Resultados',
  quiz_next: 'Siguiente →',

  // Questions
  q_def_to_term: '¿Qué concepto describe esta definición?',
  q_term_to_def: '¿Cuál es la definición correcta?',
  q_true_false: '¿Verdadero o falso?',
  q_true: '✓ Verdadero',
  q_false: '✗ Falso',
  q_match_hint: 'Selecciona un término a la izquierda y luego su definición a la derecha',
  q_check: 'Comprobar',

  // Feedback
  feedback_correct: '✓ ¡Correcto!',
  feedback_incorrect: '✗ Incorrecto',

  // Results
  results_none: 'No hay resultados disponibles.',
  results_correct: '{{correct}} de {{total}} correctas',
  results_excellent: '¡Excelente dominio!',
  results_good: '¡Buen trabajo!',
  results_ok: 'Vas por buen camino',
  results_practice: 'Sigue practicando 💪',
  results_review: '🔄 Repasar errores',
  results_home: '🏠 Inicio',
  results_new_quiz: '🎯 Nuevo Quiz',
  results_breakdown: 'Desglose por categoría',
  results_mistakes: '✗ Conceptos a repasar',

  // Review
  review_empty_title: '¡Sin errores pendientes!',
  review_empty_msg: 'Has dominado todos los conceptos.',
  review_title: '🔄 Modo Repaso',
  review_pending: '{{count}} conceptos pendientes',
  review_done_title: '✅ Repaso completado',
  review_done_msg: 'Quedan {{count}} conceptos en tu banco de errores.',
  review_repeat: '🔄 Repetir',
  review_mistake_stays: 'Este concepto permanece en tu banco de repaso.',
  review_finish: '📊 Finalizar Repaso',

  // Study
  study_title: '📖 Modo Estudio',
  study_back: '← Volver',
  study_all: 'Todos',
  study_empty: 'No hay conceptos para este filtro.',
  study_studied: '✅ {{count}} estudiados',
  study_prev: '← Anterior',
  study_next: 'Siguiente →',
  study_flip_front: 'Click para ver definición →',
  study_flip_back: 'Click para volver ←',

  // Help & Diagram panels
  help_show: '💡 Ver ayuda',
  help_hide: '💡 Ocultar ayuda',
  diagram_show: '📊 Ver diagrama',
  diagram_hide: '📊 Ocultar diagrama',

  // Animation controls
  anim_no_desc: 'Sin descripción',
  anim_reset: 'Reiniciar',
  anim_prev: 'Paso anterior',
  anim_pause: '⏸ Pausar',
  anim_play: '▶ Play',
  anim_pause_tip: 'Pausar',
  anim_play_tip: 'Reproducir',
  anim_next: 'Siguiente paso',
  anim_step: 'Paso {{n}}',

  // Diagram errors
  diagram_error: 'Error en diagrama: {{msg}}',
  diagram_loading: 'Cargando diagrama...',
  diagram_render_error: 'Error renderizando diagrama',

  // Question generator
  gen_match_prompt: 'Relaciona cada término con su definición',
  gen_true_false_true: '"{{term}}" — {{point}}.',
  gen_true_false_false: '"{{term}}" — {{point}}.',
  gen_false_explain: 'Falso. "{{term}}" en realidad: {{point}}. La afirmación describe otro concepto.',
  gen_correct_explain: 'Correcto. {{term}}: {{definition}}',
};
