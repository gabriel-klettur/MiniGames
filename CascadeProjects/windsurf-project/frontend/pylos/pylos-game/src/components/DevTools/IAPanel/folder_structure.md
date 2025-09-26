frontend/pylos/pylos-game/src/components/DevTools/
└─ IAPanel/
   ├─ index.ts                     # Barrel: exporta IAPanel y subcomponentes necesarios
   ├─ IAPanel.tsx                  # Composición del panel (container/presentational composer)
   ├─ IAPanel.spec.tsx             # Smoke test del panel
   ├─ README.md                    # Documentación breve del módulo (props, arquitectura)
   ├─ types.ts                     # Tipos del panel (IAPanelProps), reutiliza tipos de dominio
   ├─ constants.ts                 # Constantes: límites, defaults (p. ej., tiempo por defecto 8s)
   ├─ hooks/
   │  ├─ useTimeBudget.ts          # Calcula limitMs a partir de modo/segundos (clamp, memo)
   │  ├─ useElapsedTimer.ts        # Timer local animado mientras busy (interval, cleanup)
   │  └─ useSortedRootMoves.ts     # Memoiza y normaliza top jugadas (ratio, maxAbs)
   ├─ utils/
   │  ├─ format.ts                 # fmtPos, fmtMove y helpers de etiquetado/tooltip
   │  ├─ math.ts                   # normEval, clamp, toRatio y pequeños helpers puros
   │  └─ aria.ts                   # Strings/props ARIA y title para accesibilidad
   ├─ components/
   │  ├─ Header.tsx                # Encabezado: estado (Moviendo/Pensando/En espera)
   │  ├─ DepthSelector.tsx         # Selector de profundidad (1..10)
   │  ├─ TimeControls.tsx          # Auto/Manual + slider segundos
   │  ├─ TimeBar.tsx               # Barra de tiempo (ratio, isOver, tooltip)
   │  ├─ Actions.tsx               # Botones: Mover IA y Autoplay (play/stop)
   │  ├─ EvaluationBar.tsx         # Barra de evaluación (normEval -> ancho)
   │  ├─ PVLine.tsx                # Línea PV (d=depthReached y fmtMove)
   │  ├─ KPIs.tsx                  # Nodos, Tiempo, NPS, Turno
   │  ├─ RootMovesList.tsx         # Top jugadas raíz (mini-bars, ratio normalizado)
   │  └─ Advanced/
   │     ├─ index.ts               # Barrel interno de Advanced
   │     ├─ SearchSettings.tsx     # PVS, Aspiración, TT
   │     ├─ RepetitionSettings.tsx # Evitar repeticiones, repeatMax, avoidPenalty
   │     ├─ BookSettings.tsx       # Libro y URL
   │     ├─ QuiescenceSettings.tsx # Quiescence, qDepthMax, qNodeCap, futilityMargin
   │     └─ PerformanceSettings.tsx# Precomputed supports/center
   ├─ styles/
   │  ├─ IAPanel.module.css        # Estilos scoped para el layout principal (mantiene clases actuales)
   │  └─ components.module.css     # Estilos compartidos de subcomponentes (mini-bar, eval, etc.)
   └─ __fixtures__/
      └─ iaPanel.sample.ts         # Datos de ejemplo para tests (pv, rootMoves, stats)