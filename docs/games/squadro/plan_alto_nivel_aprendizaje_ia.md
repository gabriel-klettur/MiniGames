# Plan de Alto Nivel: Implementación de Aprendizaje para IAPowa D10

## Introducción
Este plan sintetiza la guía de implementación detallada en `guia_aprendizaje_ia.md`. Enfocado en fases clave para hacer que el preset "IAPowa D10 imbatible" aprenda mediante auto-juego, diversidad y tuning automatizado.

## Fase 1: Preparación y Configuración Inicial
- **Definir objetivos claros**: Elegir métricas como WR, Elo o duración media para medir mejoras.
- **Configurar entorno de simulación**:
  - Usar D10 vs D3 como baseline (profundidad fija).
  - Activar diversidad: `randomOpeningPlies` (2–4), `exploreEps` (0.02–0.10), `orderingJitterEps` (0.5–1.0).
  - Paralelismo: Habilitar `useRootParallel` y `workers` en `SimSection.tsx` para acelerar pruebas.
- **Generar datos iniciales**: Correr lotes pequeños (1k–2k partidas) para establecer baseline de rendimiento.

## Fase 2: Bucle de Ajuste Iterativo
- **Seleccionar parámetros clave**: Enfocarse en pesos de evaluación (`w_race`, `w_clash`, etc.) y márgenes (`tempo`, `sprint_threshold`).
- **Implementar métodos de búsqueda**:
  - Hill climbing o grid search para ajustes incrementales (±Δ).
  - Aceptar cambios solo si mejoran métricas (e.g., >5% WR).
- **Escalar pruebas**: Pasar de 1k–2k a 5k–10k partidas para validación estable.
- **Curriculum de rivales**: Mezclar D3, D5, D7 y alternar inicios (Light/Dark) para robustez.

## Fase 3: Automatización con Panel de Tuning
- **Desarrollar componente TuningPanel**:
  - Integrar en pestaña "Sim" de InfoIA.
  - Implementar comparación A/B: 1000 partidas base vs variante.
  - Calcular métricas (WR, duración) y sugerir/aplicar cambios automáticamente.
- **UI y flujo**:
  - Controles para seleccionar parámetros y delta.
  - Progreso en tiempo real y resultados con umbral de confianza.
- **Mitigaciones**: Usar cross-validation para evitar overfitting; limpiar recursos post-análisis.

## Fase 4: Validación y Optimización
- **Pruebas exhaustivas**: Escalar a 10k+ partidas contra múltiples oponentes.
- **Análisis de riesgos**: Monitorear varianza, overfitting y leaks de memoria.
- **Iteración continua**: Ajustar basado en resultados; integrar con bases de datos si crece el volumen.
- **Métricas de éxito**: Converger en <10 iteraciones con mejora >5% en WR.

## Consideraciones Generales
- **Trade-offs**: Priorizar velocidad inicial vs precisión estadística.
- **Recursos**: Bajo impacto inicial; escalar con paginación si necesario.
- **Próximos pasos**: Expandir a métodos avanzados (e.g., RL) si el tuning básico no basta.
- **Timeline sugerido**: 1–2 semanas para prototipo; 1 mes para versión estable.

Este plan es ejecutable directamente desde la guía detallada y asegura una implementación estructurada.
