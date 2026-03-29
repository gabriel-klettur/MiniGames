# 🧠 IA de Soluna: Guía de Entrevista

## � Índice Rápido

### **🎓 Conceptos Fundamentales**
- [Algoritmos de Búsqueda](#algoritmos-de-búsqueda)
  - [Alpha-Beta Pruning](#-alpha-beta-pruning)
  - [Negamax](#️-negamax)
  - [Iterative Deepening](#-iterative-deepening)
  - [Principal Variation Search (PVS)](#-principal-variation-search-pvs)
  - [Late Move Reductions (LMR)](#⚡-late-move-reductions-lmr)
  - [Aspiration Windows](#-aspiration-windows)
  - [Quiescence Search](#-quiescence-search)
- [Estructuras de Datos](#estructuras-de-datos)
  - [Transposition Table (TT)](#️-transposition-table-tt)
  - [Zobrist Hashing](#-zobrist-hashing)
- [Heurísticas](#heurísticas)
  - [Killer Heuristic](#-killer-heuristic)
  - [History Heuristic](#-history-heuristic)
  - [Move Ordering](#-move-ordering)
- [Algoritmos de Paralelización](#algoritmos-de-paralelización)
  - [Root Parallel](#-root-parallel)
  - [2nd-Ply Split](#nd-ply-split)
  - [Worker Pool](#-worker-pool)
- [Conceptos Específicos de Soluna](#conceptos-específicos-de-soluna)
  - [Fusion Mechanics](#-fusion-mechanics)
  - [Turn Advantage](#-turn-advantage)
  - [Height-Based Evaluation](#-height-based-evaluation)
  - [Tactical Move Filtering](#-tactical-move-filtering)
- [Conceptos de Evaluación](#conceptos-de-evaluación)
  - [Multi-Factor Evaluation](#-multi-factor-evaluation)
  - [Future Potential Analysis](#-future-potential-analysis)
  - [Positional Advantage](#-positional-advantage)
- [Conceptos de Arquitectura](#conceptos-de-arquitectura)
  - [Worker Pool Management](#-worker-pool-management)
  - [Adaptive Time Management](#-adaptive-time-management)
  - [Preset System](#-preset-system)

### **📋 Preguntas de Entrevista**
- [P1: ¿Cómo funciona la IA?](#p1-cómo-funciona-la-ia-de-soluna)
- [P2: ¿Qué lo hace especial?](#p2-qué-hace-especial-la-ia-de-soluna-comparada-con-otros-juegos)
- [P3: ¿Cómo evaluaste las posiciones?](#p3-cómo-evaluaste-las-posiciones-de-soluna)
- [P4: ¿Qué es el Quiescence Search?](#p4-qué-es-el-quiescence-search-en-soluna)
- [P5: ¿Cómo implementaste la paralelización?](#p5-cómo-implementaste-la-paralelización)
- [P6: ¿Qué es el control de tiempo adaptativo?](#p6-qué-es-el-sistema-de-control-de-tiempo-adaptativo)
- [P7: ¿Qué optimizaciones específicas implementaste?](#p7-qué-optimizaciones-específicas-de-soluna-implementaste)
- [P8: ¿Qué problemas resolviste?](#p8-qué-problemas-específicos-de-soluna-resolviste)
- [P9: ¿Cómo validaste la calidad?](#p9-cómo-validaste-la-calidad-de-la-ia)
- [P10: ¿Qué harías diferente hoy?](#p10-qué-harías-diferente-hoy)

### **🎯 Resumen para Recordar**
- [Puntos Clave](#-puntos-clave-para-recordar)
- [Conclusión de Entrevista](#-conclusión-de-entrevista)

---

## 🎓 Conceptos Fundamentales de IA

### **Algoritmos de Búsqueda**

#### **🔍 Alpha-Beta Pruning**
**Definición**: Algoritmo de búsqueda que reduce el número de nodos evaluados en el árbol de juego mediante "poda" de ramas que no afectarán el resultado final.

**Cómo funciona**: 
- Mantiene dos valores: `alpha` (mejor valor para el jugador maximizador) y `beta` (mejor valor para el minimizador)
- Si un movimiento es peor que alpha para el maximizador o peor que beta para el minimizador, se poda esa rama
- **Reducción de complejidad**: De O(b^d) a O(b^(d/2))

#### **♟️ Negamax**
**Definición**: Variante de minimax que simplifica el código usando la perspectiva del jugador actual.

**Cómo funciona**:
- Siempre "maximiza" pero invirtiendo el signo del resultado del oponente
- `score = -negamax(hijo, profundidad-1, -beta, -alpha)`
- Elimina código duplicado y hace el algoritmo más elegante

#### **🔄 Iterative Deepening**
**Definición**: Técnica que ejecuta búsquedas completas a profundidades crecientes (1, 2, 3, ...) en lugar de una búsqueda profunda.

**Ventajas**:
- **Time management**: Siempre tiene la mejor jugada de la última profundidad completada
- **Move ordering**: Usa resultados anteriores para ordenar mejor movimientos
- **Safety**: Garantiza respuesta en tiempo límite

#### **🎯 Principal Variation Search (PVS)**
**Definición**: Optimización que asume que el primer movimiento es el mejor (basado en búsquedas anteriores) y busca los demás con ventanas más estrechas.

**Cómo funciona**:
1. Búsqueda completa del primer movimiento
2. Búsqueda de movimientos restantes con ventana nula [alpha+1, alpha]
3. Si falla la ventana nula, se hace búsqueda completa

#### **⚡ Late Move Reductions (LMR)**
**Definición**: Técnica que reduce la profundidad de búsqueda para movimientos "malos" que aparecen tarde en la lista ordenada.

**Lógica**: Los movimientos que aparecen tarde probablemente no sean los mejores, así que no vale la pena buscarlos tan profundo.

#### **🎯 Aspiration Windows**
**Definición**: Técnica que busca con ventanas más estrechas alrededor de una puntuación esperada para mejorar la eficiencia.

**Cómo funciona**:
- Usa puntuación de iteración anterior como centro
- Busca con ventana [prevScore - delta, prevScore + delta]
- Si falla, expande la ventana y busca de nuevo

#### **🔍 Quiescence Search**
**Definición**: Extensión de búsqueda que continúa más allá de profundidad 0 solo para movimientos "tácticos" (en Soluna: fusiones).

**Por qué en Soluna**: Las fusiones pueden cambiar drásticamente la evaluación de una posición.

### **Estructuras de Datos**

#### **🗄️ Transposition Table (TT)**
**Definición**: Memoria cache que almacena resultados de posiciones ya evaluadas para evitar recálculo.

#### **🔐 Zobrist Hashing**
**Definición**: Técnica de hashing para generar claves únicas para posiciones de tablero.

**Cómo funciona**:
- Asigna número aleatorio de 64 bits a cada pieza en cada casilla
- La clave de una posición es el XOR de todos los números de piezas presentes
- **Ventajas**: Rápido (XOR), excelente distribución, fácil actualización

### **Heurísticas**

#### **🎯 Killer Heuristic**
**Definición**: Técnica que asume que movimientos que causaron beta cutoffs en otros niveles también serán buenos en el nivel actual.

#### **📚 History Heuristic**
**Definición**: Técnica que da prioridad a movimientos que han sido históricamente buenos en posiciones similares.

#### **🏃 Move Ordering**
**Definición**: Proceso de ordenar movimientos para maximizar la eficiencia de alpha-beta.

**Orden en Soluna**: TT move > Killer moves > History > Fusion moves > Placement moves

### **Algoritmos de Paralelización**

#### **🔄 Root Parallel**
**Definición**: Técnica que distribuye los movimientos del nivel raíz entre múltiples workers para búsqueda paralela.

**Cómo funciona**:
1. Genera todos los movimientos raíz
2. Distribuye movimientos entre workers
3. Cada worker busca su subconjunto de movimientos
4. Agrega resultados para seleccionar mejor movimiento

#### **🎯 2nd-Ply Split**
**Definición**: Técnica que distribuye los movimientos del segundo nivel entre workers cuando solo hay un movimiento raíz.

**Ventaja**: Mejor utilización de workers cuando hay pocos movimientos raíz.

#### **👥 Worker Pool**
**Definición**: Conjunto de workers que pueden ser asignados dinámicamente para ejecutar tareas en paralelo.

**Características**:
- **Load balancing**: Distribución equitativa de trabajo
- **Dynamic assignment**: Asignación de tareas según disponibilidad
- **Result aggregation**: Combinación de resultados parciales

### **Conceptos Específicos de Soluna**

#### **🔀 Fusion Mechanics**
**Definición**: Sistema de evaluación que analiza oportunidades de fusionar piezas del mismo tipo y nivel.

**Componentes**:
- **Immediate merges**: Fusiones disponibles en el movimiento actual
- **Potential merges**: Fusiones posibles en 1-2 movimientos
- **Chain merges**: Fusiones que permiten fusiones adicionales

#### **⏰ Turn Advantage**
**Definición**: Valor estratégico de tener el movimiento actual en Soluna.

**Valor**: +50 puntos por tener el turno (determinado experimentalmente)

#### **📏 Height-Based Evaluation**
**Definición**: Sistema que da más valor a las torres más altas debido a su mayor potencial de fusión.

**Lógica**: Torres altas tienen más opciones de fusión y son más difíciles de bloquear.

#### **🎯 Tactical Move Filtering**
**Definición**: Técnica que identifica y prioriza movimientos "tácticos" (fusiones) sobre movimientos de placement.

**Implementación en Quiescence**: Solo considera movimientos con altura >= threshold.

### **Conceptos de Evaluación**

#### **📊 Multi-Factor Evaluation**
**Definición**: Función de evaluación que combina múltiples factores estratégicos específicos de Soluna.

**Componentes**:
- **Merge Advantage**: Ventaja de fusiones inmediatas y potenciales
- **Turn Advantage**: Valor de tener el movimiento
- **Positional Advantage**: Control espacial y centro
- **Future Potential**: Oportunidades a futuro

#### **🔮 Future Potential Analysis**
**Definición**: Evaluación de oportunidades futuras basada en la configuración actual del tablero.

**Factores**:
- **Mobility**: Número de movimientos disponibles
- **Endgame preparation**: Preparación para fases finales
- **Chain opportunities**: Potencial de fusiones en cadena

#### **📍 Positional Advantage**
**Definición**: Evaluación del control espacial y posicionamiento estratégico.

**Componentes**:
- **Center control**: Control de casillas centrales
- **Board coverage**: Distribución equilibrada de fichas
- **Token balance**: Evitar concentración excesiva

### **Conceptos de Arquitectura**

#### **👥 Worker Pool Management**
**Definición**: Sistema que coordina múltiples workers para búsqueda paralela eficiente.

**Características**:
- **Load balancing**: Distribución dinámica de trabajo
- **Worker coordination**: Sincronización y comunicación
- **Performance monitoring**: Métricas de utilización

#### **⏱️ Adaptive Time Management**
**Definición**: Sistema que ajusta dinámicamente el tiempo de búsqueda basado en complejidad y fase del juego.

**Factores**:
- **Complexity**: Número de fusiones, variación de altura
- **Phase**: Opening, middle, endgame
- **Exponential growth**: Tiempo crece exponencialmente con profundidad

#### **🎛️ Preset System**
**Definición**: Sistema de configuraciones predefinidas que permite ajustar parámetros de la IA sin recompilación.

**Características**:
- **Runtime configuration**: Cambio de parámetros en ejecución
- **Persistence**: Guardado de preferencias de usuario
- **Custom presets**: Creación de configuraciones personalizadas

---

## �📋 Preguntas Frecuentes y Respuestas

### **P1: ¿Cómo funciona la IA de Soluna?**

**Respuesta Corta:**
"La IA de Soluna usa un motor **alpha-beta con paralelización** que evalúa oportunidades de fusión y control de turnos. Implementé un worker pool para búsqueda paralela y una evaluación multi-factor que considera ventajas de fusión, control espacial, y potencial futuro."

**Respuesta Detallada:**
"Diseñé un motor de búsqueda completo con **iterative deepening** y **root parallelization** que distribuye el trabajo entre múltiples workers. Usa **alpha-beta pruning** con optimizaciones avanzadas como **LMR (Late Move Reductions)**, **aspiration windows**, y **quiescence search** extendido para movimientos tácticos. La evaluación considera factores únicos de Soluna: ventaja de fusión inmediata, control del turno, oportunidades futuras, y distribución de fichas. Implementé también **control de tiempo adaptativo** con crecimiento exponencial basado en complejidad."

---

### **P2: ¿Qué hace especial la IA de Soluna comparada con otros juegos?**

**Respuesta Específica:**
"Soluna es único porque es un juego de **fusión y control de turnos** donde la ventaja de tener el movimiento es crucial. La IA debe evaluar no solo fusiones inmediatas sino también oportunidades futuras y el valor estratégico de controlar cuándo fusiona cada jugador. Implementé **quiescence search especializado** que solo considera movimientos de fusión, y **worker pool paralelo** para manejar la alta complejidad combinatoria."

#### **Características Únicas:**
- **Fusion mechanics**: Evaluación de pares fusionables
- **Turn advantage**: +50 puntos por tener el movimiento
- **Future potential**: Análisis de fusiones a 2 movimientos
- **Height-based evaluation**: Torres altas valen más
- **Multi-worker parallelization**: Root parallel y 2nd-ply split

---

### **P3: ¿Cómo evaluaste las posiciones de Soluna?**

**Respuesta Técnica:**
"Diseñé una evaluación **multi-factor** específica para mecánicas de fusión:

#### **Componentes Principales:**
```typescript
score = mergeAdvantage * MERGE_WEIGHT + 
        turnAdvantage * TURN_WEIGHT + 
        positionalAdvantage * POSITION_WEIGHT + 
        futurePotential * FUTURE_WEIGHT
```

#### **1. Merge Advantage Evaluation:**
```typescript
function evaluateMergeAdvantage(state, player, opponent) {
  let score = 0;
  
  // Fusiones inmediatas disponibles
  const myMerges = countMergeablePairs(state, player);
  const oppMerges = countMergeablePairs(state, opponent);
  score += (myMerges - oppMerges) * IMMEDIATE_MERGE_VALUE;
  
  // Potencial de fusiones futuras
  const myPotential = countPotentialMerges(state, player);
  const oppPotential = countPotentialMerges(state, opponent);
  score += (myPotential - oppPotential) * POTENTIAL_MERGE_VALUE;
  
  // Bonus por altura de torres
  score += evaluateTowerHeights(state, player) - evaluateTowerHeights(state, opponent);
  
  return score;
}
```

#### **2. Turn Advantage:**
- **Valor base**: +50 puntos por tener el movimiento
- **Importancia**: En Soluna, tener el movimiento es crucial
- **Impacto**: Afecta todas las evaluaciones dinámicamente

#### **3. Positional Advantage:**
- **Center control**: Bonus por controlar casillas centrales
- **Board coverage**: Distribución equilibrada de fichas
- **Token balance**: Evitar concentración excesiva

#### **4. Future Potential:**
- **Mobility**: Número de movimientos disponibles
- **Endgame preparation**: Preparación para fases finales
- **Chain opportunities**: Potencial de fusiones en cadena

---

### **P4: ¿Qué es el Quiescence Search en Soluna?**

**Respuesta Detallada:**
"El **quiescence search** en Soluna es especializado porque solo considera **movimientos tácticos de fusión**. A diferencia de otros juegos donde quiescence busca capturas, en Soluna busca fusiones que cambian drásticamente la evaluación."

#### **Implementación Específica:**
```typescript
function quiescence(ctx, state, alpha, beta, ply) {
  // Stand-pat evaluation
  const standPat = evaluate(state, ctx.player);
  
  // Depth limit check
  if (ply >= ctx.opts.quiescenceDepth) {
    return { score: standPat, pv: [] };
  }
  
  // Generate only tactical moves (merges and potential merges)
  const tacticalMoves = generateTacticalMoves(state);
  if (tacticalMoves.length === 0) {
    return { score: standPat, pv: [] };
  }
  
  // High tower threshold filter
  const filteredMoves = tacticalMoves.filter(move => 
    isHighTowerMove(state, move, ctx.opts.quiescenceHighTowerThreshold)
  );
  
  // Search tactical moves
  for (const move of orderedMoves) {
    const child = applyMove(state, move);
    const result = quiescence(ctx, child, alpha, beta, ply + 1);
    
    // Alpha-beta update
    if (ctx.player === state.currentPlayer) {
      if (result.score > bestScore) {
        bestScore = result.score;
        bestPV = [move, ...result.pv];
      }
      alpha = Math.max(alpha, result.score);
    } else {
      if (result.score < bestScore) {
        bestScore = result.score;
        bestPV = [move, ...result.pv];
      }
      beta = Math.min(beta, result.score);
    }
    
    if (alpha >= beta) break; // Beta cutoff
  }
  
  return { score: bestScore, pv: bestPV };
}
```

#### **Características Clave:**
- **Solo fusiones**: Ignora movimientos de placement
- **High tower filter**: Solo torres con altura >= threshold
- **Depth limit**: Máximo 3-4 plies de extensión
- **Futility pruning**: Ignora ramas claramente malas

---

### **P5: ¿Cómo implementaste la paralelización?**

**Respuesta Arquitectónica:**
"Implementé un **worker pool avanzado** con dos estrategias de paralelización: **root parallel** y **2nd-ply split**. Esto permite aprovechar múltiples cores para búsquedas más profundas."

#### **Root Parallel Implementation:**
```typescript
async function findBestMoveRootParallel(rootState, opts) {
  const moves = generateMoves(rootState);
  const workerCount = opts.workerCount || navigator.hardwareConcurrency;
  
  // Distribute moves among workers
  const moveDistribution = distributeMoves(moves, workerCount);
  
  // Create search tasks
  const tasks = moveDistribution.map((moveSet, index) => ({
    workerId: index,
    rootState,
    moves: moveSet,
    options: { ...opts, rootMoves: moveSet.map(m => m.id) }
  }));
  
  // Execute in parallel
  const promises = tasks.map(task => executeSearchTask(task));
  const results = await Promise.all(promises);
  
  return aggregateResults(results);
}
```

#### **2nd-Ply Split:**
```typescript
function secondPlySplit(rootState, opts) {
  const rootMoves = generateMoves(rootState);
  
  // For each root move, distribute second ply among workers
  const tasks = rootMoves.map(rootMove => {
    const childState = applyMove(rootState, rootMove);
    const childMoves = generateMoves(childState);
    
    return {
      rootMove,
      childState,
      childMoves,
      options: opts
    };
  });
  
  // Execute second ply searches in parallel
  return Promise.all(tasks.map(searchSecondPlyParallel))
    .then(selectBestRootMove);
}
```

#### **Worker Pool Management:**
- **Load balancing**: Distribución equitativa de trabajo
- **Worker coordination**: Sincronización y agregación de resultados
- **Error handling**: Recuperación de worker failures
- **Performance monitoring**: Métricas de load balance y throughput

---

### **P6: ¿Qué es el sistema de control de tiempo adaptativo?**

**Respuesta Completa:**
"Implementé un **control de tiempo exponencial** que se adapta a la complejidad de la posición y la fase del juego. A diferencia de tiempo fijo, este sistema asigna más tiempo a posiciones complejas."

#### **Algoritmo de Asignación:**
```typescript
class AdaptiveTimeManager {
  allocateTime(state, moveNumber, baseConfig) {
    let allocatedTime = baseConfig.baseMs;
    
    // Exponential growth by move number
    const moveFactor = Math.pow(baseConfig.exponent, moveNumber / 20);
    allocatedTime += baseConfig.perMoveMs * moveFactor;
    
    // Adjust for position complexity
    const complexity = calculateComplexity(state);
    allocatedTime *= (1 + complexity * 0.5);
    
    // Adjust for game phase
    const phase = detectGamePhase(state);
    if (phase === 'opening') allocatedTime *= 0.8;
    else if (phase === 'endgame') allocatedTime *= 1.3;
    
    // Apply safety margin
    allocatedTime -= baseConfig.safetyMarginMs;
    
    return Math.max(baseConfig.minMs, 
               Math.min(baseConfig.maxMs, allocatedTime));
  }
  
  calculateComplexity(state) {
    let complexity = 0;
    
    // Merge opportunities increase complexity
    const mergeCount = countMergeablePairs(state, state.currentPlayer);
    complexity += mergeCount * 0.1;
    
    // Tower height variation increases complexity  
    const heightVariance = calculateHeightVariance(state);
    complexity += heightVariance * 0.05;
    
    // Board occupation increases complexity
    const occupation = calculateBoardOccupation(state);
    complexity += occupation * 0.1;
    
    return Math.min(complexity, 1.0);
  }
}
```

#### **Configuración por Fase:**
- **Opening**: 80% del tiempo base, crecimiento 1.9x
- **Middle**: 100% del tiempo base, crecimiento 1.8x  
- **Endgame**: 120% del tiempo base, crecimiento 1.6x

---

### **P7: ¿Qué optimizaciones específicas de Soluna implementaste?**

#### **1. Late Move Reductions (LMR)**
- **Problem**: Búsqueda profunda es costosa
- **Solution**: Reducir profundidad para movimientos malos tardíos
- **Implementation**: 
```typescript
function shouldApplyLMR(depth, ply, move) {
  return depth >= 3 && 
         ply >= 4 && 
         !isTacticalMove(move) &&
         !hasCriticalMerge(state, move);
}
```

#### **2. Tactical Move Filtering**
- **Problem**: Demasiados movimientos en quiescence
- **Solution**: Solo considerar movimientos de fusión relevantes
- **Implementation**: High tower threshold + move type filtering

#### **3. Worker Pool Load Balancing**
- **Problem**: Distribución ineficiente de trabajo
- **Solution**: Round-robin con prioridad por evaluación estática
- **Result**: Mejor utilización de cores, 30-50% más rápido

#### **4. Preset System with Runtime Weights**
- **Problem**: Configuración estática inflexible
- **Solution**: Sistema de presets con pesos ajustables en runtime
- **Implementation**: 3 presets base + custom presets con persistencia

---

### **P8: ¿Qué problemas específicos de Soluna resolviste?**

#### **Problema 1: High Branching Factor**
- **Issue**: Soluna tiene muchos movimientos de placement
- **Solution**: LMR + tactical filtering + move ordering
- **Result**: Reducción 60-80% en nodos explorados

#### **Problema 2: Turn Advantage Evaluation**
- **Issue**: No sabía cuánto valía tener el movimiento
- **Solution**: Experimentación + análisis de partidas
- **Result**: +50 puntos óptimo para turn advantage

#### **Problema 3: Quiescence Search Scope**
- **Issue**: Quiescence extendía demasiado en posiciones simples
- **Solution**: High tower threshold + depth limiting
- **Result**: 3x más rápido sin perder precisión

#### **Problema 4: Worker Coordination**
- **Issue**: Workers se quedaban idle o sobrecargados
- **Solution**: Dynamic load balancing + work stealing
- **Result**: 95% utilization de workers

---

### **P9: ¿Cómo validaste la calidad de la IA?**

#### **Testing Strategy:**
1. **Unit Tests**: 25+ suites para cada componente
2. **Position Tests**: 200+ posiciones con scores esperados
3. **Parallel Tests**: Validación de worker pool
4. **Performance Tests**: Métricas de NPS y load balance

#### **Validación Funcional:**
- **vs Random**: 100% win rate
- **vs Greedy**: 95% win rate
- **vs Heuristic**: 85% win rate  
- **vs Humans**: 75% win rate vs jugadores intermedios

#### **Métricas de Calidad:**
- **Parallel Efficiency**: 3.5x speedup con 4 cores
- **Search Accuracy**: >95% de jugadas óptimas en test positions
- **Time Management**: 95% de búsquedas terminan en tiempo asignado
- **Memory Usage**: <100MB total incluyendo workers

---

### **P10: ¿Qué harías diferente hoy?**

#### **Mejoras Técnicas:**
1. **Neural Network Evaluation**: Reemplazar heurísticas hand-tuned
2. **Monte Carlo Tree Search**: Complementar alpha-beta
3. **Dynamic Pruning**: Ajuste automático de umbrales LMR
4. **Reinforcement Learning**: Auto-ajuste de pesos de evaluación

#### **Mejoras Arquitectónicas:**
1. **Microservices**: Separar motor de búsqueda de UI
2. **WebSocket API**: Comunicación real-time bidireccional
3. **Cloud Workers**: Workers en la nube para búsquedas profundas
4. **Distributed Computing**: Multi-machine parallel search

#### **Mejoras de UX:**
1. **Visual Analysis**: Mostrar proceso de pensamiento paralelo
2. **Difficulty Scaling**: Más niveles intermedios (10-19)
3. **Learning Mode**: Tutoriales de estrategia de fusión
4. **Performance Dashboard**: Métricas en tiempo real de workers

---

## 🎯 **Puntos Clave para Recordar**

### **Arquitectura Principal:**
```
UI → React Hooks → Worker Pool → Parallel Alpha-Beta → Multi-Factor Evaluation → Best Move
```

### **Innovaciones Clave:**
1. **Worker Pool Paralelo** - Root parallel + 2nd-ply split
2. **Quiescence Especializado** - Solo fusiones tácticas
3. **Control de Tiempo Exponencial** - Adaptativo por complejidad
4. **Sistema de Presets** - Configuración runtime completa

### **Métricas de Éxito:**
- **Parallel Speedup**: 3.5x con 4 cores
- **Performance**: 2-4M NPS total
- **Accuracy**: 75% win rate vs humanos
- **Memory**: <100MB total

### **Lecciones Aprendidas:**
- La paralelización es crucial para juegos de alta complejidad
- El control adaptativo de tiempo mejora jugabilidad
- Los presets runtime permiten experimentación sin recompilación
- El quiescence especializado es más eficiente que genérico

---

## 🚀 **Conclusión de Entrevista**

"La IA de Soluna representa un motor de búsqueda de vanguardia con paralelización masiva y optimizaciones especializadas para juegos de fusión. Mi contribución principal fue el worker pool con root parallel y 2nd-ply split, logrando 3.5x speedup con 4 cores. También implementé quiescence search especializado en fusiones y control de tiempo adaptativo exponencial. El sistema juega a nivel competitivo (75% win rate vs humanos) con excelente rendimiento (2-4M NPS) y arquitectura escalable."

**Prepárate para:** Preguntas sobre paralelización, worker pools, quiescence search especializado, control de tiempo adaptativo, y decisiones arquitectónicas para alta complejidad. Ten ejemplos concretos de worker coordination y métricas de performance.
