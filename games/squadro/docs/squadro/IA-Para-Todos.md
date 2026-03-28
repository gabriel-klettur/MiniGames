# 🧠 IA de Squadro: Guía para Todos

## 📖 ¿Qué es la IA de Squadro?

La IA de Squadro es como tener un estratega experto en carreras y colisiones. Piensa en cómo mover tus piezas, cuándo retirarlas, y cómo bloquear al rival mientras compites por ser el primero en retirar 4 piezas.

---

## 🎯 Niveles de Dificultad (1-20)

### **Niveles Principiantes (1-5)**
- **Nivel 1-2**: Aprende las reglas básicas
- **Nivel 3-4**: Estrategia simple de movimiento
- **Nivel 5**: Comienza a pensar en bloqueos

### **Niveles Intermedios (6-10)**
- **Nivel 6-7**: Entiende las colisiones
- **Nivel 8-9**: Planifica retiradas estratégicas
- **Nivel 10**: Balance entre ataque y defensa

### **Niveles Expertos (11-15)**
- **Nivel 11-12**: Estrategias avanzadas de bloqueo
- **Nivel 13-14**: Planificación a largo plazo
- **Nivel 15**: Juego posicional complejo

### **Niveles Maestros (16-20)**
- **Nivel 16-17**: Pensamiento profundo y táctico
- **Nivel 18-19**: Estrategias de fin de juego
- **Nivel 20**: Máxima precisión y velocidad

**Consejo**: Comienza en nivel 8-10 para un desafío equilibrado.

---

## ⏱️ Control del Tiempo

### **Modo Automático**
La IA se adapta según la complejidad:
- **Tiempo mínimo**: Nunca menos de X segundos
- **Tiempo máximo**: Nunca más de Y segundos
- **Tiempo base**: Tiempo estándar por jugada
- **Tiempo extra**: Más tiempo si el juego es complejo
- **Exponente**: Cómo crece el tiempo con la complejidad

### **Modo Manual**
Tú controlas exactamente cuántos segundos (1-60) tiene la IA para pensar.

---

## 🎛️ Configuraciones Avanzadas (Explicadas Simple)

### **🧠 Motor de Búsqueda**

#### **Transposition Table (TT)**
**¿Qué es?**: Memoria que recuerda posiciones ya analizadas.
**¿Para qué?**: Evita pensar lo mismo dos veces, más rápido.
**Recomendación**: Siempre activado.

#### **PVS (Principal Variation Search)**
**¿Qué es?**: Busca inteligentemente las mejores jugadas primero.
**¿Para qué?**: Encuentra la mejor jugada más rápido.
**Recomendación**: Siempre activado.

#### **Fail-Soft**
**¿Qué es?**: Si no encuentra una jugada perfecta, devuelve la mejor parcial.
**¿Para qué?**: Nunca se queda sin respuesta.
**Recomendación**: Siempre activado.

#### **Prefer Hash Move**
**¿Qué es?**: Confía en movimientos que ya ha analizado antes.
**¿Para qué?**: Más velocidad usando memoria cache.
**Recomendación**: Siempre activado.

### **⚡ Optimizaciones de Velocidad**

#### **LMR (Late Move Reductions)**
**¿Qué es?**: Piensa menos en las jugadas obviamente malas.
**¿Para qué?**: Gana velocidad sin perder calidad.
- **lmrMinDepth**: A partir de qué profundidad aplicar (3-4)
- **lmrLateMoveIdx**: Cuántas jugadas "malas" saltar (3-5)
- **lmrReduction**: Cuántos niveles menos pensar (1)

#### **Killer Heuristic**
**¿Qué es?**: Recuerda jugadas que causaron "beta cutoffs".
**¿Para qué?**: Prioriza jugadas que funcionaron bien antes.
**Recomendación**: Siempre activado.

#### **History Heuristic**
**¿Qué es?**: Historial de qué movimientos han sido buenos.
**¿Para qué?**: Mejora el orden de búsqueda.
**Recomendación**: Siempre activado.

### **🚀 Procesamiento Paralelo**

#### **Workers (Procesamiento Múltiple)**
**¿Qué es?**: Usa varios "cerebros" para pensar al mismo tiempo.
**¿Para qué?**: Mucho más rápido en computadoras modernas.
**Recomendación**: Siempre activado si tienes CPU múltiple.

#### **Root Parallel**
**¿Qué es?**: Cada worker analiza diferentes movimientos iniciales.
**¿Para qué?**: Explora más opciones en el mismo tiempo.

#### **2nd-Ply Split**
**¿Qué es?**: Divide el trabajo en el segundo nivel de búsqueda.
**¿Para qué?**: Mejor distribución del trabajo.

---

## 🔍 Búsqueda Extendida

### **Quiescence Search**
**¿Qué es?**: Sigue pensando en posiciones "tácticas" (colisiones, retiradas).
**¿Para qué?**: Evita errores en finales complejos.
- **quiescenceMaxPlies**: Cuántos niveles extra pensar (4-6)
- **quiescenceStandPatMargin**: Margen para detenerse (0)
- **quiescenceSeeMargin**: Margen para capturas (0)
- **quiescenceExtendOnRetire**: Extender si alguien puede retirar
- **quiescenceExtendOnJump**: Extender si hay saltos posibles

### **IID (Internal Iterative Deepening)**
**¿Qué es?**: Búsqueda rápida para encontrar buenas jugadas antes de la búsqueda profunda.
**¿Para qué?**: Mejora el orden de búsqueda.
- **iidMinDepth**: A partir de qué profundidad (3)

---

## 🚫 Poda Selectiva

### **LMP (Late Move Pruning)**
**¿Qué es?**: Ignora completamente las últimas jugadas malas.
**¿Para qué?**: Máxima velocidad pero riesgo de error.
- **lmpMaxDepth**: A partir de qué profundidad (2)
- **lmpBase**: Cuántas últimas ignorar (6)

### **Futility Pruning**
**¿Qué es?**: Ignora ramas que claramente no mejorarán la posición.
**¿Para qué?**: Gana velocidad pero puede perder jugadas sutiles.
- **futilityMargin**: Margen de seguridad (150)

---

## 🎨 Estilos de Juego (Presets)

### **🔬 IAPowa-Proof**
- **Filosofía**: Máximo rigor y determinismo
- **Características**: Sin aleatoriedad, análisis exhaustivo
- **Ideal para**: Partidas serias y análisis
- **Configuración**: Todo activado, sin optimizaciones agresivas

### **📚 IAPowa (Balanceado)**
- **Filosofía**: Equilibrio perfecto entre fuerza y estabilidad
- **Características**: Motor robusto y confiable
- **Ideal para**: La mayoría de situaciones
- **Configuración**: Motor completo con LMR conservador

### **⚡ IAPowa D10 Imbatible**
- **Filosofía**: Máxima fuerza a profundidad 10
- **Características**: Sin LMR, análisis completo
- **Ideal para**: Desafío máximo sin tiempo límite
- **Configuración**: Motor puro, sin podas

### **🚀 IAPowa+Rendimiento**
- **Filosofía**: Máxima velocidad para partidas rápidas
- **Características**: Configuración optimizada para velocidad
- **Ideal para**: Partidas con límite de tiempo estricto
- **Configuración**: Simplificada pero efectiva

### **🛡️ IAPowa+Defensa**
- **Filosofía**: Máxima estabilidad y precisión
- **Características**: Tiempo generous, análisis cuidadoso
- **Ideal para**: Partidas largas y críticas
- **Configuración**: Tiempo extendido, análisis profundo

---

## 🎯 Sistema de Evaluación (12 Señales)

La IA evalúa cada posición usando 12 factores diferentes:

### **Señales Principales**
1. **Race (Carrera)**: Qué tan cerca está cada pieza de retirar
2. **Clash (Colisión)**: Potencial de colisiones con piezas rivales
3. **Sprint (Velocidad)**: Piezas que pueden moverse rápido
4. **Block (Bloqueo)**: Capacidad de bloquear piezas rivales

### **Señales Extendidas**
5. **Chain (Cadena)**: Secuencias de movimientos coordinados
6. **Parity (Paridad)**: Control de turnos y posiciones clave
7. **Struct (Estructura)**: Organización general de las piezas
8. **Ones (Unidades)**: Piezas individuales estratégicas
9. **Return (Retorno)**: Eficiencia de movimientos de regreso
10. **Waste (Desperdicio)**: Movimientos ineficientes
11. **Mob (Movilidad)**: Cuántas opciones tiene cada pieza
12. **Done Bonus**: Bonus por piezas retiradas

### **Pesos Personalizables**
Cada señal tiene un peso que puedes ajustar:
- **Pesos estándar**: Balanceados para juego general
- **Pesos personalizados**: Para estrategias específicas

---

## 🔍 Cómo "Piensa" la IA de Squadro

### **1. Análisis de Posición**
La IA evalúa:
- **Estado de cada pieza**: Posición, dirección, si puede retirar
- **Colisiones posibles**: Dónde pueden chocar las piezas
- **Control de carriles**: Quién domina cada carril
- **Oportunidades de bloqueo**: Dónde puede obstaculizar al rival

### **2. Generación de Jugadas**
Considera todas las opciones:
- **Movimientos hacia adelante**: Según la dirección de cada pieza
- **Movimientos de regreso**: Si la pieza está en el extremo
- **Retiradas**: Cuando una pieza alcanza su meta
- **Colisiones**: Resultados de posibles choques

### **3. Evaluación Compleja**
Usa las 12 señales para calcular una puntuación:
- **Ventaja material**: Piezas retiradas vs rivales
- **Posición relativa**: Quién está mejor posicionado
- **Potencial táctico**: Colisiones y bloqueos futuros
- **Control del tempo**: Quién dicta el ritmo del juego

### **4. Búsqueda Alpha-Beta**
Explora consecuencias asumiendo juego óptimo de ambos jugadores.

---

## 🎮 Consejos Prácticos

### **Para Principiantes**
```
Dificultad: 8
Tiempo: Automático
Preset: IAPowa+Rendimiento
Workers: Activados
```

### **Para Intermedios**
```
Dificultad: 12-14
Tiempo: Manual (10-15 segundos)
Preset: IAPowa (Balanceado)
Workers: Activados
```

### **Para Expertos**
```
Dificultad: 16-18
Tiempo: Manual (20-30 segundos)
Preset: IAPowa-Proof
Workers: Activados
```

---

## 🎯 Configuraciones por Tipo de Jugador

### **🏠 Casual**
```
Dificultad: 10
Tiempo: Automático
Preset: IAPowa+Rendimiento
Optimizaciones: Velocidad
```

### **🎯 Competitivo**
```
Dificultad: 15
Tiempo: Manual (15s)
Preset: IAPowa (Balanceado)
Optimizaciones: Balanceadas
```

### **🛡️ Cuidadoso**
```
Dificultad: 18
Tiempo: Manual (25s)
Preset: IAPowa-Proof
Optimizaciones: Máxima precisión
```

### **⚡ Veloz**
```
Dificultad: 12
Tiempo: Manual (5s)
Preset: IAPowa+Rendimiento
Optimizaciones: Máxima velocidad
```

---

## 📊 Métricas del Panel

### **📈 Estadísticas en Tiempo Real**
- **Evaluación**: Puntuación de la posición (+ buena para IA, - mala)
- **PV (Principal Variation)**: Secuencia esperada de jugadas
- **Nodos**: Posiciones analizadas por todos los workers
- **NPS**: Nodos por segundo total
- **Profundidad alcanzada**: Cuántos movimientos ahead pensó
- **Tiempo transcurrido**: Segundos de cálculo

### **🎯 Análisis por Worker**
- **Worker 1, 2, 3...**: Estadísticas individuales
- **Carga de trabajo**: Qué tan balanceado está el trabajo
- **Eficiencia**: Qué tan bien colaboran los workers

---

## 🌟 Estrategias Específicas de Squadro

### **🏃‍♂️ Control de Carreras**
La IA prefiere:
- **Liderar carreras clave**: Dominar los carriles más importantes
- **Bloquear estratégicamente**: Obstaculizar sin sobreextenderse
- **Retirar en el momento óptimo**: Ni muy pronto ni muy tarde

### **💥 Gestión de Colisiones**
- **Colisiones favorables**: Buscar choques que beneficien a la IA
- **Evitar colisiones malas**: Prevenir choques perjudiciales
- **Forzar colisiones**: Obligar al rival a chocar

### **🎯 Fin de Juego**
- **Carrera de retiradas**: Priorizar retirar las 4 piezas primero
- **Bloqueos finales**: Impedir las últimas retiradas rivales
- **Tempo control**: Controlar quién hace el último movimiento

---

## ⚠️ Errores Comunes

### **Error**: "La IA no bloquea cuando puede"
**Realidad**: A veces bloquear debilita más la posición de la IA.

### **Error**: "La IA retira piezas muy pronto"
**Realidad**: Retirar temprano puede ser mejor que arriesgar la pieza.

### **Error**: "La IA evita colisiones obvias"
**Realidad**: Está calculando si la colisión realmente beneficia su posición.

---

## 🔄 Experimentos Divertidos

### **🤪 Modos Extremos**
- **Sin colisiones**: Desactiva todas las colisiones
- **Solo bloqueos**: Prioriza bloquear sobre avanzar
- **Velocidad máxima**: 1 segundo por jugada
- **Modo análisis**: 60 segundos por jugada

### **🎓 Desafíos de Aprendizaje**
- **Vencer nivel 10**: Aprende estrategias básicas
- **Igualar nivel 15**: Domina el juego posicional
- **Retar nivel 20**: Prueba tus habilidades máximas

### **⚖️ Experimentos con Pesos**
- **Carrera pesada**: Aumenta peso de "race"
- **Bloqueo pesado**: Aumenta peso de "block" y "clash"
- **Movilidad pesada**: Aumenta peso de "mob"

---

## 🎉 Disfruta de la Carrera

Squadro es un juego de ritmo, estrategia y cálculo. La IA te enseña a pensar en secuencias, a valorar el tempo, y a entender que a veces la mejor jugada es esperar el momento perfecto.

Cada partida te enseña algo nuevo sobre timing, posicionamiento y pensamiento anticipado.

¡Buena suerte y disfruta de la carrera hacia la victoria! 🏁🚀
