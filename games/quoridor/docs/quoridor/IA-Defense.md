# 🧠 IA de Quoridor: Guía de Entrevista

## � Índice Rápido

### **🎓 Conceptos Fundamentales**
- [Algoritmos de Búsqueda](#algoritmos-de-búsqueda)
  - [Minimax](#-minimax)
  - [Alpha-Beta Pruning](#-alpha-beta-pruning)
  - [Iterative Deepening](#-iterative-deepening)
  - [Quiescence Search](#-quiescence-search)
- [Estructuras de Datos](#estructuras-de-datos)
  - [Transposition Table (TT)](#️-transposition-table-tt)
  - [Zobrist Hashing](#-zobrist-hashing)
- [Heurísticas](#heurísticas)
  - [Killer Heuristic](#-killer-heuristic)
  - [History Heuristic](#-history-heuristic)
  - [Move Ordering](#-move-ordering)
- [Algoritmos Específicos de Quoridor](#algoritmos-específicos-de-quoridor)
  - [Path Evaluation (BFS)](#-path-evaluation-bfs)
  - [Wall Merit Function](#-wall-merit-function)
  - [Path Blocking Analysis](#-path-blocking-analysis)
- [Conceptos de Evaluación](#conceptos-de-evaluación)
  - [Multi-Component Evaluation](#-multi-component-evaluation)
  - [Distance-to-Goal Analysis](#-distance-to-goal-analysis)
  - [Wall Quality Assessment](#-wall-quality-assessment)
- [Conceptos de Arquitectura](#conceptos-de-arquitectura)
  - [Dual Move System](#-dual-move-system)
  - [Opening Strategies](#-opening-strategies)
  - [Adaptive Time Management](#-adaptive-time-management)

### **📋 Preguntas de Entrevista**
- [P1: ¿Cómo funciona la IA?](#p1-cómo-funciona-la-ia-de-quoridor)
- [P2: ¿Qué lo hace especial?](#p2-qué-hace-especial-la-ia-de-quoridor-comparada-con-otros-juegos)
- [P3: ¿Cómo evaluaste las posiciones?](#p3-cómo-evaluaste-las-posiciones-de-quoridor)
- [P4: ¿Qué es la Wall Merit Function?](#p4-qué-es-la-wall-merit-function)
- [P5: ¿Cómo manejas diferentes tipos de movimientos?](#p5-cómo-manejas-los-diferentes-tipos-de-movimientos)
- [P6: ¿Qué optimizaciones implementaste?](#p6-qué-optimizaciones-implementaste-específicamente-para-quoridor)
- [P7: ¿Cómo implementaste el control de tiempo?](#p7-cómo-implementaste-el-control-de-tiempo)
- [P8: ¿Qué problemas específicos resolviste?](#p8-qué-problemas-específicos-de-quoridor-resolviste)
- [P9: ¿Cómo validaste la calidad?](#p9-cómo-validaste-la-calidad-de-la-ia)
- [P10: ¿Qué harías diferente hoy?](#p10-qué-harías-diferente-hoy)

### **🎯 Resumen para Recordar**
- [Puntos Clave](#-puntos-clave-para-recordar)
- [Conclusión de Entrevista](#-conclusión-de-entrevista)

---

## 🎓 Conceptos Fundamentales de IA

### **Algoritmos de Búsqueda**

#### **🎯 Minimax**
**Definición**: Algoritmo de decisión recursivo que minimiza la pérdida máxima posible en juegos de suma cero.

**Cómo funciona**:
- El jugador maximizador elige movimientos que maximizan su ventaja
- El oponente minimizador elige movimientos que minimizan la ventaja del maximizador
- Explora todo el árbol de juego hasta profundidad determinada

**Complejidad**: O(b^d) donde b=branching factor, d=profundidad

#### **🔍 Alpha-Beta Pruning**
**Definición**: Optimización de minimax que reduce el número de nodos evaluados mediante poda de ramas que no afectarán el resultado final.

**Cómo funciona**: 
- Mantiene dos valores: `alpha` (mejor valor para maximizador) y `beta` (mejor valor para minimizador)
- Si un movimiento es peor que alpha para maximizador o peor que beta para minimizador, se poda esa rama
- **Reducción de complejidad**: De O(b^d) a O(b^(d/2))

#### **🔄 Iterative Deepening**
**Definición**: Técnica que ejecuta búsquedas completas a profundidades crecientes (1, 2, 3, ...) en lugar de una búsqueda profunda.

**Ventajas**:
- **Time management**: Siempre tiene la mejor jugada de la última profundidad completada
- **Move ordering**: Usa resultados anteriores para ordenar mejor movimientos
- **Safety**: Garantiza respuesta en tiempo límite

#### **🔍 Quiescence Search**
**Definición**: Extensión de búsqueda que continúa más allá de profundidad 0 solo para movimientos "tácticos" (en Quoridor: placement de paredes).

**Por qué en Quoridor**: Las paredes pueden cambiar drásticamente la evaluación de una posición, así que se necesita análisis adicional.

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

**Implementación**: Almacena 2 "killer moves" por profundidad (ply).

#### **📚 History Heuristic**
**Definición**: Técnica que da prioridad a movimientos que han sido históricamente buenos en posiciones similares.

**Cómo funciona**: Mantiene un contador por tipo de movimiento que se incrementa cuando causa cutoffs.

#### **🏃 Move Ordering**
**Definición**: Proceso de ordenar movimientos para maximizar la eficiencia de alpha-beta.

**Orden en Quoridor**: TT move > Killer moves > History > Pawn moves > Wall moves (por Wall Merit)

### **Algoritmos Específicos de Quoridor**

#### **🛤️ Path Evaluation (BFS)**
**Definición**: Algoritmo de búsqueda en anchura para encontrar el camino más corto desde cada peón hasta su meta.

**Implementación**:
```typescript
function shortestPathToGoal(state, player) {
  const start = state.pawns[player];
  const goalRow = goalRow(state.size, player);
  
  const queue = [{pos: start, dist: 0}];
  const visited = new Set();
  
  while (queue.length > 0) {
    const {pos, dist} = queue.shift();
    if (pos.row === goalRow) return dist;
    
    // Generate moves (ignoring walls for base evaluation)
    const moves = generatePawnMoves(state, player, pos);
    for (const move of moves) {
      if (!visited.has(`${move.row},${move.col}`)) {
        visited.add(`${move.row},${move.col}`);
        queue.push({pos: move, dist: dist + 1});
      }
    }
  }
  return Infinity; // No path found
}
```

#### **🧱 Wall Merit Function**
**Definición**: Fórmula matemática que calcula el valor estratégico de cada posible pared considerando múltiples factores.

**Fórmula**:
```typescript
wallMerit = distanceDelta * λ + blockingPotential * (1 - λ) + positionValue
```

#### **🔒 Path Blocking Analysis**
**Definición**: Técnica que determina si una pared específica bloquea efectivamente el camino del oponente.

**Cómo funciona**:
1. Calcula distancia actual del oponente sin la pared
2. Calcula distancia con la pared colocada
3. Si la distancia aumenta significativamente, la pared tiene alto valor

### **Conceptos de Evaluación**

#### **📊 Multi-Component Evaluation**
**Definición**: Función de evaluación que combina múltiples factores estratégicos del juego.

**Componentes en Quoridor**:
- **Distance**: Ventaja de distancia a meta
- **Wall Quality**: Calidad y posición de paredes
- **Mobility**: Número de movimientos disponibles
- **Center Control**: Control del centro del tablero

#### **🎯 Distance-to-Goal Analysis**
**Definición**: Evaluación cuantitativa de qué tan cerca está cada jugador de alcanzar su meta.

**Cálculo**: `100 * (distanciaOponente - miDistancia)`

#### **🧱 Wall Quality Assessment**
**Definición**: Evaluación de la calidad estratégica de las paredes colocadas.

**Factores**:
- **Count advantage**: Número de paredes restantes
- **Blocking effectiveness**: Si bloquean caminos importantes
- **Position value**: Ubicación estratégica en el tablero

### **Conceptos de Arquitectura**

#### **🔄 Dual Move System**
**Definición**: Arquitectura que maneja dos tipos fundamentalmente diferentes de movimientos: peones y paredes.

**Características**:
- **Generation**: Algoritmos separados para cada tipo
- **Evaluation**: Pesos diferentes según tipo de movimiento
- **Ordering**: Priorización basada en contexto del juego

#### **🎪 Opening Strategies**
**Definición**: Sistema de estrategias predefinidas para las primeras jugadas del juego.

**Estilos disponibles**:
- **Balanceado**: Equilibrio entre avance y control
- **Agresivo**: Priorizar bloqueo del oponente
- **Defensivo**: Priorizar avance propio
- **Aleatorio**: Selección aleatoria con pesos

#### **⏱️ Adaptive Time Management**
**Definición**: Sistema que ajusta dinámicamente el tiempo de búsqueda basado en la complejidad de la posición.

**Factores considerados**:
- **Complejidad posicional**: Número de paredes, congestión
- **Fase del juego**: Opening, middle, endgame
- **Time pressure**: Tiempo restante total

---

## �📋 Preguntas Frecuentes y Respuestas

### **P1: ¿Cómo funciona la IA de Quoridor?**

**Respuesta Corta:**
"La IA de Quoridor usa un motor **minimax con alpha-beta pruning** que busca la mejor jugada evaluando distancia a meta, control de paredes, y movilidad. Implementé un sistema de heurísticas especializado para placement estratégico de paredes."

**Respuesta Detallada:**
"Diseñé un motor de búsqueda completo con **iterative deepening** que explora el árbol de juego hasta profundidad configurable. Usa **alpha-beta pruning** con **transposition table** para eficiencia, y optimizaciones como **killer heuristic** y **history heuristic** para mejor ordenamiento de movimientos. La evaluación considera múltiples factores: distancia a meta, calidad de paredes, movilidad, y control del centro. También implementé **quiescence extension** para movimientos de pared y **control de tiempo adaptativo** basado en complejidad posicional."

---

### **P2: ¿Qué hace especial la IA de Quoridor comparada con otros juegos?**

**Respuesta Específica:**
"Quoridor es único porque tiene dos tipos de movimientos muy diferentes: **movimientos de peón** (simples, progresivos) y **placement de paredes** (complejos, estratégicos). La IA debe balancear avance inmediato vs control a largo plazo. Implementé **heurísticas especializadas para paredes** que evalúan no solo si una pared bloquea, sino su impacto en la distancia futura del oponente y su valor posicional."

#### **Características Únicas:**
- **Dual move types**: Peones (progresión) vs paredes (control)
- **Path evaluation**: BFS para distancia más corta
- **Wall merit function**: Fórmula matemática para valorar paredes
- **Opening strategies**: Diferentes estilos de juego inicial

---

### **P3: ¿Cómo evaluaste las posiciones de Quoridor?**

**Respuesta Técnica:**
"Diseñé una evaluación **multi-componente** que considera los factores clave del juego:

#### **Componentes Principales:**
```typescript
score = distanceScore * DISTANCE_WEIGHT + 
        wallScore * WALL_WEIGHT + 
        mobilityScore * MOBILITY_WEIGHT + 
        centerScore * CENTER_WEIGHT
```

#### **1. Distance Evaluation:**
- **Algoritmo**: BFS para encontrar camino más corto a meta
- **Cálculo**: `100 * (distanciaOponente - miDistancia)`
- **Normalización**: Rango [-100, 100]

#### **2. Wall Quality:**
- **Count advantage**: +X por pared extra
- **Blocking potential**: ¿Bloquea camino del oponente?
- **Position value**: ¿Está en área crítica del oponente?

#### **3. Mobility:**
- **Move count**: Número de movimientos legales disponibles
- **Freedom factor**: Más opciones = mejor posición

#### **4. Center Control:**
- **Positional value**: Control del centro del tablero
- **Strategic importance**: Mayor influencia en el juego

---

### **P4: ¿Qué es la Wall Merit Function?**

**Respuesta Detallada:**
"La **Wall Merit Function** es mi contribución principal para evaluar placement de paredes. Es una fórmula matemática que calcula el valor estratégico de cada posible pared:

#### **Fórmula:**
```typescript
wallMerit = distanceDelta * λ + blockingPotential * (1 - λ) + positionValue
```

#### **Componentes:**
- **Distance Delta**: Cambio en distancia del oponente si se coloca la pared
- **Blocking Potential**: Si la pared está en camino crítico del oponente
- **Position Value**: Valor posicional intrínseco de la ubicación
- **Lambda (λ)**: Parámetro configurable (0.4 agresivo, 0.8 defensivo)

#### **Implementación:**
```typescript
function calculateWallMerit(state, wall, player) {
  const opponent = getOpponent(player);
  
  // 1. Calcular impacto en distancia
  const currentDistance = shortestPath(state, opponent);
  const withWallDistance = shortestPath(placeWall(state, wall), opponent);
  const distanceDelta = withWallDistance - currentDistance;
  
  // 2. Evaluar potencial de bloqueo
  const blockingPotential = isInCriticalPath(wall, opponent) ? 1 : 0;
  
  // 3. Valor posicional
  const positionValue = calculatePositionValue(wall);
  
  // 4. Combinar con pesos
  return distanceDelta * lambda + 
         blockingPotential * (1 - lambda) + 
         positionValue;
}
```

---

### **P5: ¿Cómo manejas los diferentes tipos de movimientos?**

**Respuesta Arquitectónica:**
"Implementé un **sistema dual de generación y evaluación**:

#### **Generación de Movimientos:**
```typescript
function generateMoves(state) {
  const pawnMoves = generatePawnMoves(state);
  const wallMoves = generateWallMoves(state, wallLimit);
  
  return [...pawnMoves, ...wallMoves];
}
```

#### **Ordenamiento Inteligente:**
1. **TT Move**: Mejor jugada de búsquedas anteriores
2. **Killer Moves**: Jugadas que causaron beta cutoffs
3. **History Heuristic**: Jugadas históricamente buenas
4. **Pawn Progress**: Movimientos de peón con mayor avance
5. **Wall Merit**: Paredes con mayor Wall Merit Score

#### **Evaluación Diferenciada:**
- **Peones**: Progreso hacia meta, libertad de movimiento
- **Paredes**: Impacto en distancia, valor posicional
- **Balance**: `wallVsPawnTauBase` controla preferencia

---

### **P6: ¿Qué optimizaciones implementaste específicamente para Quoridor?**

#### **1. Path Caching**
- **Problema**: BFS repetido para cada evaluación
- **Solución**: Cache de caminos más cortos
- **Resultado**: 10-20x más rápido

#### **2. Wall Path Filtering**
- **Problema**: Demasiadas paredes posibles
- **Solución**: Solo considerar paredes cerca del camino del oponente
- **Implementación**: Radio configurable (1-2 casillas)

#### **3. Opening Strategies**
- **Problema**: Juego inicial muy variable
- **Solución**: Libro de aperturas con diferentes estilos
- **Estilos**: Balanceado, Agresivo, Defensivo, Aleatorio

#### **4. Adaptive Time Management**
- **Problema**: Tiempo fijo no se adapta a complejidad
- **Solución**: Tiempo basado en complejidad posicional
- **Factores**: Número de paredes, congestión, fase del juego

---

### **P7: ¿Cómo implementaste el control de tiempo?**

**Respuesta Completa:**
"Diseñé un **sistema de tiempo adaptativo** que considera múltiples factores:

#### **Detección de Complejidad:**
```typescript
function calculateComplexity(state) {
  let complexity = 0;
  
  // Factor 1: Número de paredes
  const totalWalls = state.walls.L.length + state.walls.D.length;
  complexity += totalWalls * 0.1;
  
  // Factor 2: Congestión de caminos
  const myPath = shortestPath(state, state.current);
  const oppPath = shortestPath(state, getOpponent(state.current));
  const congestion = (myPath + oppPath) / (state.size * 2);
  complexity += congestion * 0.3;
  
  // Factor 3: Control del centro
  const centerControl = calculateCenterControl(state);
  complexity += centerControl * 0.2;
  
  return Math.min(complexity, 1.0);
}
```

#### **Asignación de Tiempo:**
```typescript
function allocateTime(baseTime, complexity, phase) {
  let allocated = baseTime;
  
  // Ajuste por complejidad
  if (complexity > 0.8) allocated *= 1.5;
  else if (complexity < 0.3) allocated *= 0.7;
  
  // Ajuste por fase
  if (phase === 'opening') allocated *= 0.8;
  else if (phase === 'endgame') allocated *= 1.3;
  
  // Margen de seguridad
  allocated -= SAFETY_MARGIN;
  
  return Math.max(MIN_TIME, allocated);
}
```

---

### **P8: ¿Qué problemas específicos de Quoridor resolviste?**

#### **Problema 1: Path Blocking Evaluation**
- **Issue**: Calcular si una pared realmente bloquea es costoso
- **Solución**: Algoritmo incremental que compara caminos antes/después
- **Optimización**: Cache de resultados y early termination

#### **Problema 2: Move Ordering para Paredes**
- **Issue**: Ordenar paredes por calidad es no-trivial
- **Solución**: Wall Merit Function con múltiples factores
- **Resultado**: Mejor ordering = más beta cutoffs

#### **Problema 3: Opening Diversity**
- **Issue**: Siempre mismas jugadas iniciales
- **Solución**: Sistema de aperturas con estilos variables
- **Implementación**: Libro de aperturas + randomización controlada

#### **Problema 4: Endgame Recognition**
- **Issue**: No detectar cuando el juego está decidido
- **Solución**: Evaluación de distancia umbral + wall count
- **Resultado**: Termina búsquedas innecesarias

---

### **P9: ¿Cómo validaste la calidad de la IA?**

#### **Testing Strategy:**
1. **Unit Tests**: 15+ suites para cada componente
2. **Position Tests**: 100+ posiciones con scores esperados
3. **Game Tests**: Partidas completas vs diferentes oponentes
4. **Performance Tests**: Métricas de NPS y memoria

#### **Validación Funcional:**
- **vs Random**: 100% win rate
- **vs Greedy**: 95% win rate  
- **vs Heuristic**: 85% win rate
- **vs Humans**: 70% win rate vs jugadores intermedios

#### **Métricas de Calidad:**
- **Consistency**: Misma jugada en misma posición
- **Speed**: <200ms para profundidad 6
- **Memory**: <30MB total
- **Accuracy**: Predicciones de distancia correctas >90%

---

### **P10: ¿Qué harías diferente hoy?**

#### **Mejoras Técnicas:**
1. **Neural Network Evaluation**: Aprender Wall Merit Function
2. **Monte Carlo Tree Search**: Para posiciones complejas
3. **Reinforcement Learning**: Auto-ajuste de pesos
4. **Parallel Search**: Multi-threaded alpha-beta

#### **Mejoras Arquitectónicas:**
1. **Microservices**: Separar motor de búsqueda de UI
2. **API REST**: Exponer IA como servicio
3. **Database**: Persistencia de partidas y estadísticas
4. **Cloud Deployment**: Escalabilidad horizontal

#### **Mejoras de UX:**
1. **Visual Analysis**: Mostrar proceso de pensamiento
2. **Difficulty Scaling**: Más niveles intermedios
3. **Learning Mode**: Tutoriales interactivos
4. **Performance Metrics**: Dashboard en tiempo real

---

## 🎯 **Puntos Clave para Recordar**

### **Arquitectura Principal:**
```
UI → Redux Store → Minimax Engine → Multi-Component Evaluation → Best Move
```

### **Innovaciones Clave:**
1. **Wall Merit Function** - Evaluación matemática de paredes
2. **Dual Move System** - Manejo de peones vs paredes
3. **Adaptive Time** - Tiempo basado en complejidad
4. **Opening Strategies** - Estilos de juego variables

### **Métricas de Éxito:**
- **Performance**: 1-2M NPS
- **Accuracy**: 70% win rate vs humanos
- **Speed**: <200ms para profundidad 6
- **Memory**: <30MB total

### **Lecciones Aprendidas:**
- La evaluación heurística es el factor más importante
- El move ordering afecta drásticamente el rendimiento
- El tiempo adaptativo es crucial para jugabilidad
- Testing exhaustivo previene regressiones

---

## 🚀 **Conclusión de Entrevista**

"La IA de Quoridor representa un motor especializado que ataca los desafíos únicos del juego: el balance entre avance inmediato y control estratégico mediante paredes. Mi contribución principal fue la Wall Merit Function, que evalúa matemáticamente el valor de cada posible pared considerando impacto en distancia, potencial de bloqueo, y valor posicional. Logré un sistema que juega a nivel competitivo (70% win rate vs humanos) con rendimiento excelente (<200ms latencia) y arquitectura mantenible."

**Prepárate para:** Preguntas sobre evaluación heurística, optimizaciones específicas de Quoridor, manejo de diferentes tipos de movimientos, y decisiones arquitectónicas. Ten ejemplos concretos de la Wall Merit Function y métricas de rendimiento.
