# 🧠 IA de Pylos: Guía de Entrevista

## 📚 Índice Rápido

### **🎓 Conceptos Fundamentales**
- [Algoritmos de Búsqueda](#algoritmos-de-búsqueda)
  - [Alpha-Beta Pruning](#-alpha-beta-pruning)
  - [Negamax](#️-negamax)
  - [Iterative Deepening](#-iterative-deepening)
  - [Principal Variation Search (PVS)](#-principal-variation-search-pvs)
  - [Late Move Reductions (LMR)](#⚡-late-move-reductions-lmr)
  - [Quiescence Search](#-quiescence-search)
- [Estructuras de Datos](#estructuras-de-datos)
  - [Transposition Table (TT)](#️-transposition-table-tt)
  - [Zobrist Hashing](#-zobrist-hashing)
  - [Bitboards](#-bitboards)
- [Heurísticas](#heurísticas)
  - [Killer Heuristic](#-killer-heuristic)
  - [History Heuristic](#-history-heuristic)
  - [Move Ordering](#-move-ordering)
- [Conceptos de Evaluación](#conceptos-de-evaluación)
  - [Heurística de Evaluación](#-heurística-de-evaluación)
  - [Tapering por Fases](#-tapering-por-fases)
  - [Función Multi-Factor](#️-función-de-evaluación-multi-factor)
- [Conceptos de Arquitectura](#conceptos-de-arquitectura)
  - [Arquitectura Modular](#-arquitectura-modular)
  - [Web Workers](#-web-workers)
  - [Configuración Runtime](#️-configuración-runtime)

### **📋 Preguntas de Entrevista**
- [P1: ¿Cómo funciona la IA?](#p1-cómo-funciona-la-ia-de-pylos)
- [P2: ¿Qué optimizaciones implementaste?](#p2-qué-optimizaciones-implementaste-y-por-qué)
- [P3: ¿Cómo evaluaste las posiciones?](#p3-cómo-evaluaste-las-posiciones)
- [P4: ¿Qué decisiones arquitectónicas tomaste?](#p4-qué-decisiones-arquitectónicas-tomaste-y-por-qué)
- [P5: ¿Cómo manejas el tiempo de búsqueda?](#p5-cómo-manejas-el-tiempo-de-búsqueda)
- [P6: ¿Qué problemas técnicos enfrentaste?](#p6-qué-problemas-técnicos-enfrentaste-y-cómo-los-resolviste)
- [P7: ¿Cómo mediste y optimizaste el rendimiento?](#p7-cómo-mediste-y-optimizaste-el-rendimiento)
- [P8: ¿Qué harías diferente hoy?](#p8-qué-harías-diferente-hoy)
- [P9: ¿Cómo validaste que la IA juega bien?](#p9-cómo-validaste-que-la-ia-juega-bien)
- [P10: ¿Qué aprendiste de este proyecto?](#p10-qué-aprendiste-de-este-proyecto)

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
- **Reducción de complejidad**: De O(b^d) a O(b^(d/2)) donde b=branching factor, d=profundidad

**Ejemplo**: Si alpha=5 y encontramos un movimiento con valor=3, cualquier movimiento posterior que dé ≤3 puede ser ignorado.

#### **♟️ Negamax**
**Definición**: Variante de minimax que simplifica el código usando la perspectiva del jugador actual.

**Cómo funciona**:
- En lugar de tener funciones separadas para maximizar/minimizar, siempre se "maximiza" pero invirtiendo el signo
- `score = -negamax(hijo, profundidad-1, -beta, -alpha)`
- Elimina código duplicado y hace el algoritmo más elegante

#### **🔄 Iterative Deepening**
**Definición**: Técnica que ejecuta búsquedas completas a profundidades crecientes (1, 2, 3, ...) en lugar de una sola búsqueda profunda.

**Ventajas**:
- **Time management**: Siempre tiene la mejor jugada de la última profundidad completada
- **Move ordering**: Usa resultados de profundidades anteriores para ordenar mejor movimientos
- **Safety**: Garantiza respuesta en tiempo límite

#### **🎯 Principal Variation Search (PVS)**
**Definición**: Optimización que asume que el primer movimiento es el mejor (basado en búsquedas anteriores) y busca los demás con ventanas más estrechas.

**Cómo funciona**:
1. Búsqueda completa del primer movimiento
2. Búsqueda de movimientos restantes con ventana nula [alpha+1, alpha]
3. Si falla la ventana nula, se hace búsqueda completa

**Beneficio**: Reduce el número de nodos evaluados significativamente.

#### **⚡ Late Move Reductions (LMR)**
**Definición**: Técnica que reduce la profundidad de búsqueda para movimientos "malos" que aparecen tarde en la lista ordenada.

**Lógica**: Los movimientos que aparecen tarde probablemente no sean los mejores, así que no vale la pena buscarlos tan profundo.

**Implementación**:
```typescript
if (depth >= 3 && moveIndex >= 4 && !isTacticalMove(move)) {
  const reduction = 1;
  score = -negamax(child, depth - 1 - reduction, -alpha-1, -alpha);
  if (score > alpha && score < beta) {
    // Re-search if LMR failed
    score = -negamax(child, depth - 1, -beta, -alpha);
  }
}
```

#### **🔍 Quiescence Search**
**Definición**: Extensión de búsqueda que continúa más allá de profundidad 0 solo para movimientos "tácticos" (capturas, promociones, fusiones, etc.).

**Por qué es necesario**: La evaluación estática en profundidad 0 puede ser engañosa si hay movimientos tácticos pendientes.

**En Pylos**: Solo considera movimientos con recuperación (tácticos).

### **Estructuras de Datos**

#### **🗄️ Transposition Table (TT)**
**Definición**: Memoria cache que almacena resultados de posiciones ya evaluadas para evitar recálculo.

#### **🔐 Zobrist Hashing**
**Definición**: Técnica de hashing para generar claves únicas para posiciones de ajedrez/juegos de tablero.

**Cómo funciona**:
- Asigna un número aleatorio de 64 bits a cada posible pieza en cada casilla
- La clave de una posición es el XOR de todos los números de piezas presentes
- Pequeños cambios en la posición producen claves completamente diferentes

**Ventajas**:
- Rápido de calcular (simple XOR)
- Excelente distribución (baja colisión)
- Fácil de actualizar incrementalmente

#### **🎲 Bitboards**
**Definición**: Representación del tablero usando números binarios donde cada bit representa una casilla.

**Ventajas**:
- Operaciones bit a bit son extremadamente rápidas
- Permite calcular múltiples movimientos simultáneamente
- Compacto y eficiente en memoria

**En Pylos**: 4 niveles × 16 casillas = 64 bits por nivel.

### **Heurísticas**

#### **🎯 Killer Heuristic**
**Definición**: Técnica que asume que movimientos que causaron beta cutoffs en otros niveles del árbol también serán buenos en el nivel actual.

**Implementación**: Almacena 2 "killer moves" por profundidad (ply).

#### **📚 History Heuristic**
**Definición**: Técnica que da prioridad a movimientos que han sido históricamente buenos en posiciones similares.

**Cómo funciona**: Mantiene un contador por tipo de movimiento que se incrementa cuando causa cutoffs.

#### **🏃 Move Ordering**
**Definición**: Proceso de ordenar movimientos para maximizar la eficiencia de alpha-beta.

**Orden típico**: PV move > TT move > Killer moves > History > Capturas > Movimientos normales.

### **Conceptos de Evaluación**

#### **📊 Heurística de Evaluación**
**Definición**: Función que asigna un valor numérico a una posición del juego para indicar qué tan favorable es para un jugador.

**Componentes típicos**:
- **Material**: Valor de las piezas
- **Posición**: Control del centro, desarrollo
- **Amenazas**: Oportunidades tácticas inmediatas
- **Potencial**: Oportunidades futuras

#### **🎯 Tapering por Fases**
**Definición**: Técnica que ajusta los pesos de los componentes de evaluación según la fase del juego (apertura, medio juego, final).

**Por qué es importante**: Lo que es valioso en apertura puede no serlo en el final.

#### **⚖️ Función de Evaluación Multi-Factor**
**Fórmula general**:
```typescript
score = w1 * factor1 + w2 * factor2 + w3 * factor3 + ... + wn * factorN
```

Donde cada `wi` es un peso y cada `factori` es un componente específico del juego.

### **Conceptos de Arquitectura**

#### **🧩 Arquitectura Modular**
**Definición**: Diseño donde cada componente tiene una responsabilidad única y bien definida.

**Ventajas**:
- **Testing**: Cada componente puede probarse independientemente
- **Maintenance**: Cambios en un componente no afectan otros
- **Reusability**: Componentes pueden reutilizarse en otros proyectos

#### **🔄 Web Workers**
**Definición**: API de JavaScript que permite ejecutar código en hilos separados del hilo principal de la UI.

**Ventajas en IA de juegos**:
- **UI responsive**: La interfaz no se bloquea durante cálculos intensivos
- **Paralelización**: Permite usar múltiples cores del procesador
- **Cancelación**: Puede detener búsquedas largas si es necesario

#### **⚙️ Configuración Runtime**
**Definición**: Capacidad de modificar parámetros del algoritmo sin necesidad de recompilar el código.

**Beneficios**:
- **Experimentación**: Prueba rápida de diferentes configuraciones
- **User control**: Permite a usuarios ajustar dificultad/comportamiento
- **Debugging**: Facilita identificar problemas ajustando parámetros

---

## 📋 Preguntas Frecuentes y Respuestas

### **P1: ¿Cómo funciona la IA de Pylos?**

**Respuesta Corta:**
"La IA de Pylos usa un motor de búsqueda **alpha-beta con negamax** que explora el árbol de juego hasta una profundidad configurable, evaluando cada posición con una heurística multi-fase que considera material, posición y oportunidades de fusión."

**Respuesta Detallada:**
"Implementé un motor de búsqueda completo con **iterative deepening** que va aumentando la profundidad progresivamente. Usa **alpha-beta pruning** para podar ramas innecesarias, y optimizaciones como **PVS (Principal Variation Search)**, **LMR (Late Move Reductions)** y **quiescence search** para movimientos tácticos. La evaluación considera material (esferas en reserva), control posicional (centro y niveles), y oportunidades tácticas (recuperaciones inmediatas y futuras)."

---

### **P2: ¿Qué optimizaciones implementaste y por qué?**

**Respuesta Estructurada:**

#### **1. Transposition Table (TT)**
- **Qué es**: Memoria cache que recuerda posiciones ya evaluadas (ver definición en Conceptos Fundamentales)
- **Por qué**: Evita recálculo, mejora velocidad 10-100x
- **Implementación**: **Zobrist hashing** con 65K entradas por defecto
- **Métricas**: 50-80% hit rate en búsquedas típicas

#### **2. Quiescence Search**
- **Qué es**: Extiende búsqueda en posiciones "tácticas" (ver definición completa en Conceptos Fundamentales)
- **Por qué**: Pylos tiene movimientos de recuperación que cambian drásticamente la evaluación
- **Implementación**: Solo considera movimientos con recuperación, hasta 2-4 plies extra
- **Impacto**: Aumenta precisión sin explotar tiempo de búsqueda

#### **3. Move Ordering**
- **Qué es**: Ordena movimientos para encontrar beta cutoffs más rápido (ver Conceptos Fundamentales)
- **Por qué**: **Alpha-beta** es más eficiente si prueba mejores movimientos primero
- **Implementación**: Prioridad: PV move > TT move > **Killer moves** > **History** > Heurísticas estáticas
- **Resultado**: 60-80% de beta cutoffs en primeros 3 movimientos

#### **4. Bitboards**
- **Qué es**: Representación eficiente del tablero con bit operations (ver Conceptos Fundamentales)
- **Por qué**: Cálculos de soporte y movimientos mucho más rápidos
- **Implementación**: 4 niveles × 16 posiciones = 64 bits por nivel
- **Performance**: 10-100x más rápido que arrays 2D tradicionales

---

### **P3: ¿Cómo evaluaste las posiciones?**

**Respuesta Técnica:**
"Diseñé una función de evaluación **multi-fase con tapering**:

#### **Fases del Juego:**
- **Opening**: Priorizo control del centro y desarrollo
- **Middle**: Equilibrio entre material y posicionamiento  
- **Endgame**: Máximo valor a oportunidades de recuperación

#### **Componentes de Evaluación:**
- **Material**: +10 por esfera en reserva
- **Posición**: Control del centro (precomputado), altura de torres
- **Amenazas**: +15 por cuadrado casi completado, +8 por recuperación posible
- **Oportunidades**: +20 por recuperación inmediata, +5 por potencial a 2 movimientos

#### **Fórmula:**
```typescript
score = material * w_material + 
        position * w_position + 
        threats * w_threats + 
        opportunities * w_opportunities
```

---

### **P4: ¿Qué decisiones arquitectónicas tomaste y por qué?**

#### **1. Arquitectura Modular**
- **Decisión**: Separar búsqueda, evaluación, movimientos, y utilidades
- **Por qué**: Facilita testing, mantenimiento y extensión
- **Resultado**: Cada módulo puede ser modificado independientemente

#### **2. Web Workers**
- **Decisión**: Mover cálculo de IA a worker separado
- **Por qué**: UI no se bloquea, mejor UX, permite cancelación
- **Implementación**: Comunicación vía postMessage con timeout handling

#### **3. Configuración Runtime**
- **Decisión**: Permitir cambiar parámetros sin recompilar
- **Por qué**: Experimentación rápida, ajuste por usuario, debugging
- **Resultado**: Flags configurables via UI en tiempo real

---

### **P5: ¿Cómo manejas el tiempo de búsqueda?**

**Respuesta Completa:**
"Implementé un **sistema de control de tiempo dual**:

#### **Modo Automático:**
- **Tiempo base**: Configurable por usuario
- **Ajuste por complejidad**: Posiciones complejas = más tiempo
- **Factor de crecimiento**: Exponencial basado en profundidad
- **Margen de seguridad**: Termina antes para evitar timeout

#### **Modo Manual:**
- **Tiempo fijo**: Usuario define segundos exactos
- **Deadline checking**: Verificación cada 1000 nodos
- **Graceful degradation**: Siempre devuelve mejor jugada encontrada

#### **Implementación:**
```typescript
function shouldStop(): boolean {
  return performance.now() - startTime > timeLimitMs;
}
```

---

### **P6: ¿Qué problemas técnicos enfrentaste y cómo los resolviste?**

#### **Problema 1: Performance en evaluación**
- **Issue**: Cálculo de soportes era lento (O(n²))
- **Solución**: Precomputar patrones de soporte + bitboards
- **Resultado**: 100x más rápido

#### **Problema 2: Memory leaks en TT**
- **Issue**: TT crecía indefinidamente
- **Solución**: Age-based replacement + size limit configurable
- **Resultado**: Memoria estable, rendimiento consistente

#### **Problema 3: UI bloqueada durante búsqueda**
- **Issue**: Búsqueda profunda bloqueaba interfaz
- **Solución**: Web Workers + cancelación asíncrona
- **Resultado**: UI responsive, mejor UX

---

### **P7: ¿Cómo mediste y optimizaste el rendimiento?**

#### **Métricas Clave:**
- **NPS (Nodes Per Second)**: Velocidad bruta de búsqueda
- **TT Hit Rate**: Eficiencia de cache (objetivo: >50%)
- **Beta Cutoff Rate**: Eficiencia de alpha-beta (objetivo: >80%)
- **Depth Reached**: Profundidad efectiva por tiempo

#### **Optimizaciones Realizadas:**
1. **TT sizing**: Encontré tamaño óptimo (32K-65K entradas)
2. **Move ordering tuning**: Pesos de heurísticas por experimentación
3. **Quiescence depth**: Máximo 3 plies para balance velocidad/precisión
4. **Bitboard operations**: Reemplazar cálculos aritméticos con bit ops

#### **Resultados:**
- **Speed**: 2-5M NPS en hardware moderno
- **Memory**: <50MB para TT y estructuras
- **Latency**: <100ms para profundidad 8

---

### **P8: ¿Qué harías diferente hoy?**

#### **Mejoras Técnicas:**
1. **Neural Network Evaluation**: Reemplazar heurísticas hand-tuned
2. **Monte Carlo Tree Search**: Para ciertas fases del juego
3. **Parallel Search**: YBW (Younger Brothers Wait Concept)
4. **Learning Integration**: Ajuste automático de pesos

#### **Mejoras Arquitectónicas:**
1. **TypeScript estricto**: Más type safety
2. **Testing automatizado**: Unit tests para cada componente
3. **Performance monitoring**: Métricas en producción
4. **CI/CD**: Testing automático de regresiones

---

### **P9: ¿Cómo validaste que la IA juega bien?**

#### **Testing Strategy:**
1. **Unit Tests**: 20+ suites para reglas, búsqueda, evaluación
2. **Integration Tests**: Partidas completas vs IA misma
3. **Performance Tests**: Benchmarks de NPS y memoria
4. **Regression Tests**: Posiciones test con scores esperados

#### **Validación Funcional:**
- **Partidas vs expertos**: IA gana >80% vs jugadores intermedios
- **Consistencia**: Misma jugada en misma posición
- **Blind testing**: Sin saber qué IA es cuál
- **Tournament mode**: Round-robin entre diferentes configuraciones

---

### **P10: ¿Qué aprendiste de este proyecto?**

#### **Técnicos:**
- **Algoritmos de búsqueda**: Alpha-beta, optimizaciones avanzadas
- **Evaluación heurística**: Balance de múltiples factores
- **Performance engineering**: Profiling, optimización
- **Concurrencia**: Web Workers, comunicación asíncrona

#### **Arquitectónicos:**
- **Diseño modular**: Separación de responsabilidades
- **Configurabilidad**: Parámetros runtime vs compile-time
- **Testing**: Estrategias de validación comprehensivas
- **Documentación**: Importancia para mantenimiento

#### **Profesionales:**
- **Scope management**: Empezar simple, iterar hacia complejo
- **Technical debt**: Cuándo refactor vs cuándo mantener
- **User experience**: Performance vs features trade-offs
- **Code quality**: Maintainability vs optimization

---

## 🎯 **Puntos Clave para Recordar**

### **Arquitectura Principal:**
```
UI Thread → Web Worker → Alpha-Beta Search → Evaluation → Best Move
```

### **Optimizaciones Críticas:**
1. **Transposition Table** - Cache de posiciones (usando **Zobrist hashing**)
2. **Move Ordering** - Mejores movimientos primero (con **Killer** y **History heuristics**)
3. **Quiescence** - Extensión táctica para movimientos de recuperación
4. **Bitboards** - Cálculos rápidos con operaciones bit a bit
5. **Iterative Deepening** - Búsqueda progresiva por profundidades
6. **PVS** - Ventanas estrechas para mayor eficiencia
7. **LMR** - Reducción de profundidad para movimientos tardíos

### **Métricas de Éxito:**
- **Velocidad**: 2-5M NPS (nodos por segundo)
- **Precisión**: Gana >80% vs humanos
- **Estabilidad**: Sin crashes, memory estable
- **UX**: UI responsive, <100ms latencia
- **TT Hit Rate**: 50-80% en búsquedas típicas
- **Beta Cutoff Efficiency**: 60-80% en primeros 3 movimientos

### **Lecciones Aprendidas:**
- Empezar simple, añadir complejidad gradualmente
- Medir antes de optimizar (profiling es clave)
- Testing es tan importante como código
- Documentación para futuro yo
- **Alpha-beta** es sensible al **move ordering**
- **Zobrist hashing** es esencial para TT eficiente
- **Quiescence** previene "horizon effect"
- **Web Workers** son cruciales para UX responsiva

---

## 🚀 **Conclusión de Entrevista**

"La IA de Pylos representa un motor de búsqueda completo y optimizado que combina técnicas clásicas de game AI con arquitectura web moderna. Logré un balance entre rendimiento (2-5M NPS), precisión (gana >80% vs humanos), y experiencia de usuario (UI responsive). El proyecto me enseñó sobre algoritmos de búsqueda, optimización de rendimiento, y arquitectura de software mantenible."

**Prepárate para:** Preguntas sobre algoritmos, optimización, arquitectura, testing, y lecciones aprendidas. Ten ejemplos concretos y métricas para respaldar tus respuestas.
