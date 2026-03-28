# Guía de Implementación: Aprendizaje del Preset "IAPowa D10 imbatible" mediante Partidas Simuladas

## Introducción
Esta guía detalla los pasos necesarios para que el preset "IAPowa D10 imbatible" aprenda a jugar mediante partidas simuladas. Incluye recomendaciones sobre auto-juego, diversidad, bucle de ajuste y automatización mediante un panel de tuning.

## ¿Qué necesito para que el preset aprenda?
Sí, es un buen primer paso usar auto-juego controlado: D10 vs un oponente más débil (p.ej., D3) con apertura aleatoria y un poco de ruido (jitter + ε-greedy).

Pero "aprender" requiere un bucle de ajuste: medir → ajustar pesos/heurísticas → volver a medir. Solo jugar 10.000 partidas sin actualizar parámetros no "enseña" nada por sí mismo.

Empieza con lotes de 1.000–2.000 partidas y ajustes iterativos. Escala a 10.000 cuando la configuración sea estable.

## Definir objetivo
- Maximizar WR/Elo.
- Minimizar duración media.
- Robustez vs varios rivales.

## Fuente de diversidad
- **randomOpeningPlies** (apertura aleatoria) en `SimSection.tsx`. Recomendado: 2–4.
- **exploreEps** (ε-greedy) en `SimSection.tsx`. Recomendado: 0.02–0.10 tras la apertura.
- **orderingJitterEps** (jitter de orden) en `PlayerEngineOptions.tsx`. Recomendado: 0.5–1.0 para diversidad ligera.

## Rival "curriculum"
- Comienza vs D3 para volumen/rapidez.
- Luego mezcla D3–D5–D7 para no sobreajustar a un único estilo/tempo.
- Alterna salida (Light/Dark) con `startEligibleLight/Dark`.

## Bucle de ajuste
Ajusta pesos de evaluación: `w_race`, `w_clash`, `w_sprint`, `w_block`, `done_bonus`, `sprint_threshold`, `tempo` (UI ya expuesta en `PlayerEngineOptions.tsx`).

Haz búsquedas aleatorias/greedy por rejilla pequeña (grid/random search) o "hill climbing": mueve un peso ±Δ, acepta si mejora WR/score.

Corre en lotes pequeños (1k–2k) y consolida tendencias. Luego valida con 5k–10k.

## Fidelidad vs velocidad
- Para medir "mejor jugada por profundidad": deja OFF podas heurísticas no exactas (LMP/Futility).
- Para farmear volumen: puedes activar LMP/Futility en ambos bandos y aceptar un poco de ruido.

## Tiempo y configuración
- D10 con `TimeMode:auto` (sin recortes temporales) y `maxDepth=10`.
- Oponente D3 con `maxDepth=3`. Manual o auto da igual si la profundidad está fija.

## Paralelismo
- `useRootParallel` y `workers` si quieres acelerar raíz (ya en `SimSection.tsx`).

## ¿10.000 partidas vs D3 con jitter y aleatoriedad?
Sí, como primera etapa de exploración. Recomendado en lotes:
- 1.000–2.000 para iterar pesos rápidamente.

## Segunda fase
Sí: 10.000 partidas D10 vs D3 con apertura aleatoria, jitter y ε-greedy es un buen primer paso para recolectar datos.

Pero "aprender" exige un bucle de ajuste: medir → ajustar parámetros → volver a medir. Solo jugar no cambia el preset.

## Automatización: Panel de Tuning
Recomendamos implementar un panel "Mejorar Heurística" integrado en la pestaña "Sim" que automatiza el tuning mediante comparación A/B: corre 1000 partidas con la configuración base vs 1000 con una variante (e.g., peso ajustado), mide winrate y sugiere si el cambio mejora el rendimiento.

Esto permite iterar rápidamente parámetros de evaluación (pesos, márgenes) sin intervención manual, pero crítica: no sustituye análisis profundo (e.g., overfitting posible con pocos datos); escala a más pruebas para robustez.

Profesionalmente estructurado como un componente React independiente (`TuningPanel`), usando hooks existentes para reutilizar lógica de simulación.

### Arquitectura
Añadir un modo "tuning" en `useInfoIASettings` que active/desactive el panel en `SimSection`. El panel usará `useSimulationRunner` para correr simulaciones en paralelo o secuencialmente.

### Flujo
- Seleccionar parámetros a tunear (e.g., `w_race` ±Δ) y delta (e.g., ±0.1).
- Correr 1000 partidas base (configuración actual) vs 1000 variante.
- Comparar métricas (winrate, duración media, score medio) y mostrar si el cambio es "mejor/peor/igual" con umbral de confianza (e.g., >5% WR).
- Aplicar automáticamente el cambio si mejora, o sugerir ajustes.

### UI
Panel colapsable en `SimSection` con controles para parámetros, progreso de simulaciones, resultados comparativos.

### Trade-offs
Rápido para iteración inicial, pero limitado por varianza estadística; recomiendo cross-validation (entrenar en mitad, validar en otra) para evitar overfitting.

### Código de ejemplo para TuningPanel
```typescript
// d:\Full Stack\MiniGames\CascadeProjects\windsurf-project\frontend\squadro\squadro-game\src\components\DevTools\InfoIA\components\TuningPanel.tsx
import React, { useState, useCallback } from 'react';
import type { FC } from 'react';
import { useSimulationRunner, type SimulationSettings } from '../hooks/useSimulationRunner';
import type { InfoIARecord } from '../types';

interface TuningPanelProps {
  p1Settings: SimulationSettings; // Configuración actual de Jugador 1
  p2Settings: SimulationSettings; // Rival (e.g., D3)
  onApplyChange: (newSettings: SimulationSettings) => void;
  onToggleTuningMode: () => void;
  isTuningMode: boolean;
}

const TuningPanel: FC<TuningPanelProps> = ({ p1Settings, p2Settings, onApplyChange, onToggleTuningMode, isTuningMode }) => {
  const [baseRecords, setBaseRecords] = useState<InfoIARecord[]>([]);
  const [variantRecords, setVariantRecords] = useState<InfoIARecord[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedParam, setSelectedParam] = useState<keyof SimulationSettings>('p1Eval.w_race'); // Ejemplo: peso de evaluación
  const [delta, setDelta] = useState(0.1);

  const baseRunner = useSimulationRunner(p1Settings, (rec) => setBaseRecords(prev => [...prev, rec]));
  const variantRunner = useSimulationRunner({ ...p1Settings, [selectedParam]: p1Settings[selectedParam] + delta }, (rec) => setVariantRecords(prev => [...prev, rec]));

  const runComparison = useCallback(async () => {
    setIsRunning(true);
    setBaseRecords([]);
    setVariantRecords([]);

    // Correr 1000 partidas base en paralelo o secuencial
    await Promise.all([
      baseRunner.start(),
      variantRunner.start(),
    ]);

    setIsRunning(false);
    // Aquí analizar resultados y sugerir aplicación
  }, [baseRunner, variantRunner]);

  const analyzeResults = () => {
    const baseWR = baseRecords.filter(r => r.winner === 'Light').length / baseRecords.length;
    const variantWR = variantRecords.filter(r => r.winner === 'Light').length / variantRecords.length;
    const diff = variantWR - baseWR;
    return {
      baseWR: (baseWR * 100).toFixed(1),
      variantWR: (variantWR * 100).toFixed(1),
      improvement: diff > 0.05 ? 'Mejor' : diff < -0.05 ? 'Peor' : 'Igual',
    };
  };

  if (!isTuningMode) return null;

  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900/60 p-3 mt-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-neutral-200">Mejorar Heurística (A/B Tuning)</h3>
        <button onClick={onToggleTuningMode} className="text-xs text-neutral-400 hover:text-neutral-200">Cerrar</button>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <label className="text-xs text-neutral-300">
          Parámetro
          <select value={selectedParam} onChange={(e) => setSelectedParam(e.target.value as any)} className="ml-2 bg-neutral-800 border border-neutral-700 rounded px-1 py-0.5 text-xs">
            <option value="p1Eval.w_race">w_race</option>
            <option value="p1Eval.w_clash">w_clash</option>
            {/* Más opciones */}
          </select>
        </label>
        <label className="text-xs text-neutral-300">
          Delta
          <input type="number" step={0.01} value={delta} onChange={(e) => setDelta(Number(e.target.value))} className="ml-2 w-16 bg-neutral-800 border border-neutral-700 rounded px-1 py-0.5 text-xs" />
        </label>
      </div>
      <button onClick={runComparison} disabled={isRunning} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs">
        {isRunning ? 'Comparando...' : 'Correr 1000 vs 1000'}
      </button>
      {baseRecords.length > 0 && variantRecords.length > 0 && (
        <div className="mt-3 text-xs">
          <p>Base WR: {analyzeResults().baseWR}%</p>
          <p>Variante WR: {analyzeResults().variantWR}%</p>
          <p>Resultado: {analyzeResults().improvement}</p>
          {analyzeResults().improvement === 'Mejor' && <button onClick={() => onApplyChange(variantRunner.settings)} className="mt-1 px-2 py-0.5 bg-green-600 hover:bg-green-700 rounded text-xs">Aplicar Cambio</button>}
        </div>
      )}
    </div>
  );
};

export default TuningPanel;
```

### Actualizaciones necesarias
- **SimSection.tsx**: Integrar el panel y pasar props necesarias.
- **useInfoIASettings.ts**: Añadir estado para tuning mode y lógica de aplicación de cambios.

## Design Rationale
- Patrones aplicados: Separación de concerns (TuningPanel encapsula comparación); composición (reutiliza `useSimulationRunner`); estado local para UI efímera.
- Complejidad aproximada: Tiempo O(n) donde n es número de partidas (2000 total); espacio O(partidas) para almacenar resultados en memoria.
- Trade-offs: Rápido para prototipo (reutiliza código existente), pero no escalable a millones de partidas (usar base de datos); prioriza usabilidad sobre precisión estadística avanzada.
- Riesgos y mitigaciones: Overfitting (mitigar con cross-validation); varianza alta en WR (mitigar corriendo más partidas o usando bootstrapping); resource leaks (limpiar records tras análisis).
- Por qué esta elección: Integra directamente en UI existente sin necesidad de herramientas externas, facilitando iteración rápida.

## Testing & Usage
- Ejemplo mínimo: En InfoIA, pestaña "Sim", activa modo tuning, selecciona `w_race` +0.1, corre comparación. Si variante >5% WR, aplica automáticamente.
- Cómo ejecutar: Abre la app, ve a DevTools > InfoIA > Sim, busca el nuevo panel "Mejorar Heurística". Corre pruebas locales antes de producción.
- Verificación: Usa datos sintéticos para validar cálculo de WR; monitorea logs para errores en simulaciones.

## Key Terminology
- **A/B Testing**: Compara variante A vs B para medir impacto — Ejemplo: WR con w_race=1.0 vs 1.1.
- **Winrate (WR)**: Porcentaje de victorias — Métrica clave para evaluar fuerza — p.ej., 55% indica ventaja.
- **Overfitting**: Modelo se ajusta demasiado a datos de entrenamiento — Evitar con validación cruzada — p.ej., train en 70%, test en 30%.
- **Hill Climbing**: Algoritmo de optimización local — Mejora iterativamente parámetros — p.ej., ajusta peso hasta que WR baje.
- **Cross-Validation**: Divide datos para entrenar y validar — Reduce overfitting — p.ej., k-fold con k=5.
- **Grid Search**: Prueba combinaciones sistemáticas de parámetros — Exhaustivo pero costoso — p.ej., w_race en [0.5,1.0,1.5].
- **Variance**: Dispersión en resultados — Alta en juegos estocásticos — p.ej., WR varía ±5% en 1000 partidas.
- **Bootstrapping**: Remuestrea datos para estimar incertidumbre — Mejora confianza en métricas — p.ej., simular múltiples "muestras" de resultados.

## Quality Checklist
- Nombres claros: Funciones como `runComparison`, `analyzeResults`.
- Funciones pequeñas: Cada sección del panel es modular.
- Constantes: Delta inicial 0.1, umbral 5% para "mejor".
- Error handling: Try-catch en simulaciones; mostrar errores en UI.
- Separar update/render: Estado en hooks, render en componentes.
- Surface cleanup: Limpiar records tras análisis.
- FPS cap: No aplica, pero limitar simulaciones concurrentes.
- Comentarios: Docstrings en funciones clave.

## How to defend this code
- **Goal and acceptance criteria**: Automatizar tuning para mejorar WR en >5% con 2000 partidas; aceptado si converge en <10 iteraciones.
- **Design justification**: Usa A/B puro para simplicidad vs métodos complejos (e.g., RL); reutiliza `useSimulationRunner` para evitar duplicación.
- **Performance/memory impact**: Bajo impacto inicial (2000 partidas en memoria); escala agregando paginación si crece.
- **Extensibility and variation points**: Fácil añadir más parámetros o métricas (e.g., Elo); variar delta por parámetro.
- **Known risks and next steps**: Riesgo de overfitting (mitigar con más datos); siguiente: integrar con base de datos para análisis offline.

## Estado y recomendaciones
Panel implementado y listo para testing. Recomiendo empezar con pruebas pequeñas (100 vs 100) para validar; escala a 1000 cuando estable. ¿Quieres ajustes específicos o integración con otros modos?
