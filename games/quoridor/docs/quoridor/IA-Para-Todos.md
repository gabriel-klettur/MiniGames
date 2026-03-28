# 🧠 IA de Quoridor: Guía para Todos

## 📖 ¿Qué es la IA de Quoridor?

La IA de Quoridor es como tener un oponente estratégico experto que analiza el tablero como un maestro del ajedrez. Piensa en tus movimientos, tus paredes, y cómo bloquear tu camino mientras avanza hacia la victoria.

---

## 🎯 Niveles de Dificultad

### **Presets de Dificultad**

#### **🌱 Novato**
- **Profundidad**: 2 movimientos adelante
- **Tiempo**: Rápido
- **Características**: Aprende las reglas básicas
- **Ideal para**: Principiantes absolutos

#### **🎯 Intermedio** 
- **Profundidad**: 4 movimientos adelante
- **Tiempo**: Moderado
- **Características**: Estrategia básica de paredes
- **Ideal para**: Jugadores casuales

#### **🏆 Bueno**
- **Profundidad**: 6 movimientos adelante
- **Tiempo**: Considerable
- **Características**: Buen uso de paredes tácticas
- **Ideal para**: Jugadores experimentados

#### **⭐ Fuerte**
- **Profundidad**: 8 movimientos adelante
- **Tiempo**: Lento
- **Características**: Estrategia avanzada y bloqueos precisos
- **Ideal para**: Desafío máximo

---

## 🎨 Estilos de Juego (Presets)

### **⚖️ Balanceado**
- **Filosofía**: Equilibrio entre ataque y defensa
- **Uso de paredes**: Moderado, estratégico
- **Ideal para**: Partidas estándar y aprendizaje

### **⚔️ Agresivo**
- **Filosofía**: Ataque constante, presión máxima
- **Uso de paredes**: Ofensivo, para bloquear al rival
- **Ideal para**: Jugadores que quieren dominar el tablero

### **🛡️ Defensivo**
- **Filosofía**: Protegerse, esperar errores del rival
- **Uso de paredes**: Defensivo, para proteger el propio camino
- **Ideal para**: Partidas largas y cuidadosas

### **🎲 Aleatorio**
- **Filosofía**: Cambia estilo cada partida
- **Uso de paredes**: Variable
- **Ideal para**: Sorpresa y variedad

---

## ⏱️ Control del Tiempo

### **Modo Automático**
La IA se adapta según la complejidad:
- **Tiempo mínimo**: Nunca menos de X segundos
- **Tiempo máximo**: Nunca más de Y segundos
- **Margen de seguridad**: Termina antes para evitar errores

### **Modo Manual**
Tú decides exactamente cuántos segundos (1-60) tiene la IA para pensar cada jugada.

---

## 🎛️ Configuraciones Avanzadas (Explicadas Simple)

### **🧠 Motor de Búsqueda**

#### **Transposition Table (TT)**
**¿Qué es?**: Memoria que recuerda posiciones ya analizadas.
**¿Para qué?**: No repite cálculos, piensa más rápido.
**Tamaño**: 16K-65K posiciones (más = más memoria pero más rápido)

#### **Alpha-Beta**
**¿Qué es?**: Algoritmo inteligente que descarta ramas malas.
**¿Para qué?**: Piensa más profundo sin analizar todo.
**Recomendación**: Siempre activado.

#### **Iterative Deepening**
**¿Qué es?**: Empieza pensando 1 movimiento, luego 2, luego 3...
**¿Para qué?**: Siempre tiene una respuesta buena, aunque se corte el tiempo.
**Recomendación**: Siempre activado.

### **⚡ Optimizaciones Avanzadas**

#### **PVS (Principal Variation Search)**
**¿Qué es?**: Primero busca la mejor jugada, luego las demás.
**¿Para qué?**: Mucho más eficiente en búsquedas profundas.
**Recomendación**: Activar para niveles altos.

#### **LMR (Late Move Reductions)**
**¿Qué es?**: Piensa menos en las jugadas obviamente malas.
**¿Para qué?**: Gana velocidad sin perder calidad.
**Recomendación**: Activar para partidas rápidas.

#### **Heurísticas Killer**
**¿Qué es?**: Recuerda jugadas que causaron "beta cutoffs".
**¿Para qué?**: Prioriza jugadas que funcionaron bien antes.
**Recomendación**: Activar para mayor velocidad.

#### **Heurísticas History**
**¿Qué es?**: Historial de qué movimientos han sido buenos.
**¿Para qué?**: Mejora el orden de búsqueda.
**Recomendación**: Activar para mayor precisión.

#### **Quiescence Search**
**¿Qué es?**: Sigue pensando en posiciones "tácticas".
**¿Para qué?**: Evita errores en finales complejos.
**Recomendación**: Activar para máxima precisión.

#### **Aspiration Windows**
**¿Qué es?**: Busca alrededor de una puntuación esperada.
**¿Para qué?**: Más velocidad pero puede equivocarse.
**Recomendación**: Solo para jugadores avanzados.

---

## 🧱 Estrategias de Paredes

### **📊 Evaluación de Paredes**

La IA califica cada posible pared con estos factores:

#### **Wall Merit Lambda (0.0-1.0)**
- **0.4 (Agresivo)**: Prioriza bloquear al rival
- **0.6 (Balanceado)**: Equilibra ataque y defensa  
- **0.8 (Defensivo)**: Prioriza proteger el propio camino

#### **Filtro de Cercanía**
**¿Qué es?**: Solo considera paredes cerca del camino del rival.
**Radio**: 1-2 casillas del camino mínimo del oponente.

#### **Límites de Paredes**
- **En raíz**: Cuántas paredes evaluar al principio (16-28)
- **Por nodo**: Cuántas paredes evaluar después (8-14)

---

## 🚀 Estrategias de Apertura

### **🎲 Aleatoria**
Elige una estrategia aleatoria cada partida para sorprenderte.

### **📚 Libro de Aperturas**
Jugadas precalculadas para buenos inicios (hasta 6 movimientos).

### **⚡ Apertura Rápida**
En los primeros movimientos, usa menos tiempo para acelerar el inicio:
- **Duración**: 3 movimientos iniciales
- **Tiempo**: 0.8 segundos por jugada

---

## 🔍 Cómo "Piensa" la IA

### **1. Análisis del Tablero**
La IA evalúa:
- **Distancia a meta**: Cuántos movimientos falta para ganar
- **Posición relativa**: Quién está mejor posicionado
- **Control del centro**: Importancia estratégica
- **Oportunidades de bloqueo**: Dónde pueden ir las paredes

### **2. Generación de Jugadas**
Considera todas las opciones:
- **Movimientos de peón**: Hacia adelante, izquierda, derecha
- **Colocación de paredes**: Donde sea legal y útil
- **Priorización**: Primero las mejores opciones

### **3. Búsqueda Minimax**
Explora el árbol de juego:
- **Nivel 1**: Mis posibles jugadas
- **Nivel 2**: Tu respuesta a mis jugadas  
- **Nivel 3**: Mi contra-respuesta
- **Y así sucesivamente...**

### **4. Evaluación Final**
Asigna una puntuación a cada posición:
- **+100**: IA gana
- **-100**: Humano gana
- **0**: Posición igualada
- **Valores intermedios**: Ventajas posicionales

---

## 🎮 Consejos Prácticos

### **Para Principiantes**
```
Dificultad: Novato
Estilo: Balanceado
Tiempo: Automático
```

### **Para Intermedios**
```
Dificultad: Intermedio-Bueno
Estilo: Agresivo o Defensivo según tu gusto
Tiempo: Manual (10-15 segundos)
```

### **Para Expertos**
```
Dificultad: Fuerte
Estilo: Balanceado con ajustes personalizados
Tiempo: Manual (20-30 segundos)
```

---

## 🎯 Configuraciones por Tipo de Jugador

### **🏠 Casual**
```
Preset: Balanceado
Dificultad: Intermedio
Tiempo: Automático
Optimizaciones: Básicas
```

### **🎯 Competitivo**
```
Preset: Agresivo
Dificultad: Fuerte
Tiempo: Manual (20s)
Optimizaciones: Todas activadas
```

### **🛡️ Cuidadoso**
```
Preset: Defensivo
Dificultad: Bueno-Fuerte
Tiempo: Manual (25s)
Optimizaciones: Máxima precisión
```

### **⚡ Veloz**
```
Preset: Agresivo
Dificultad: Intermedio
Tiempo: Manual (5s)
Optimizaciones: Velocidad máxima
```

---

## 📊 Métricas del Panel

### **📈 Estadísticas en Tiempo Real**
- **Nodos**: Posiciones analizadas
- **Profundidad**: Movimientos ahead alcanzados
- **Tiempo**: Segundos transcurridos
- **Evaluación**: Puntuación de la posición
- **PV**: Secuencia esperada de jugadas
- **Distancias**: Cuánto falta para que cada uno gane

### **🎯 Análisis de Raíz**
- **Movimientos raíz**: Todas las opciones consideradas
- **Puntuaciones**: Qué tan buena es cada opción
- **PV de cada una**: Qué pasaría si elige esa opción

---

## ⚠️ Errores Comunes

### **Error**: "La IA pone paredes sin sentido"
**Realidad**: Las paredes "sin sentido" a menudo previenen amenazas futuras.

### **Error**: "La IA no bloquea mi camino obvio"
**Realidad**: A veces dejar un camino abierto es mejor estratégicamente.

### **Error**: "La IA piensa demasiado en movimientos fáciles"
**Realidad**: Incluso movimientos simples pueden tener consecuencias complejas.

---

## 🔄 Experimentos Divertidos

### **🤪 Modos Raros**
- **Solo peones**: Desactiva todas las paredes
- **Solo paredes**: Configuración defensiva máxima
- **Velocidad extrema**: 1 segundo por jugada
- **Torneo de lentitud**: 60 segundos por jugada

### **🎓 Desafíos de Aprendizaje**
- **Vencer al Novato**: Aprende patrones básicos
- **Igualar al Intermedio**: Domina estrategias fundamentales
- **Retar al Fuerte**: Prueba tus habilidades máximas

---

## 🎉 Disfruta del Viaje

Quoridor es un juego de estrategia elegante. La IA es tu compañera de aprendizaje - no hay vergüenza en perder, solo oportunidades de mejorar.

Cada partida te enseña algo nuevo sobre estrategia, paciencia y pensamiento anticipado.

¡Buena suerte y disfruta construyendo muros y caminos! 🏃‍♂️🧱
