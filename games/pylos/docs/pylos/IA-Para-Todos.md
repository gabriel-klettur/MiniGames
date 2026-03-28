# 🧠 IA de Pylos: Guía para Todos

## 📖 ¿Qué es la IA de Pylos?

La IA de Pylos es como tener un oponente experto que piensa como un humano pero mucho más rápido. Analiza todas las posibles jugadas y elige la mejor usando estrategias avanzadas.

---

## 🎯 Niveles de Dificultad

### **Profundidad (1-10)**
- **Nivel 1-2**: Principiante - Piensa solo 1-2 movimientos adelante
- **Nivel 3-4**: Casual - Piensa 3-4 movimientos adelante  
- **Nivel 5-7**: Experto - Piensa 5-7 movimientos adelante
- **Nivel 8-10**: Maestro - Piensa 8-10 movimientos adelante

**Consejo**: Comienza en nivel 3-4 para un desafío equilibrado.

---

## ⏱️ Control del Tiempo

### **Modo Automático**
La IA se adapta automáticamente:
- **Tiempo mínimo**: Nunca piensa menos de esto
- **Tiempo máximo**: Nunca piensa más de esto  
- **Tiempo base**: Tiempo por defecto por jugada
- **Tiempo extra**: Más tiempo si el juego es complejo

### **Modo Manual**
Tú controlas exactamente cuántos segundos tiene la IA para pensar (1-60 segundos).

---

## 🎛️ Configuraciones Avanzadas (Explicadas Simple)

### **🧠 Motor de Búsqueda**

#### **Transposition Table (TT)**
**¿Qué es?**: Una memoria que recuerda posiciones ya analizadas.
**¿Para qué?**: Evita pensar lo mismo dos veces, haciendo la IA más rápida.
**Recomendación**: Siempre activado.

#### **PVS (Principal Variation Search)**
**¿Qué es?**: Busca inteligentemente las mejores jugadas primero.
**¿Para qué?**: Encuentra la mejor jugada más rápido.
**Recomendación**: Siempre activado.

#### **Aspiration Windows**
**¿Qué es?**: Busca alrededor de una jugada esperada.
**¿Para qué?**: Más velocidad, pero a veces puede equivocarse.
**Recomendación**: Activar para partidas rápidas, desactivar para máxima precisión.

#### **Quiescence Search**
**¿Qué es?**: Sigue pensando en posiciones "calientes" (capturas, amenazas).
**¿Para qué?**: Evita errores en jugadas tácticas.
**Recomendación**: Siempre activado, profundidad 3-4.

### **⚡ Optimizaciones de Velocidad**

#### **LMR (Late Move Reductions)**
**¿Qué es?**: Piensa menos en las jugadas obviamente malas.
**¿Para qué?**: Gana velocidad sin perder calidad.
**Recomendación**: Activar para partidas rápidas.

#### **Killer Heuristic**
**¿Qué es?**: Recuerda jugadas que causaron "beta cutoffs" (jugadas muy buenas).
**¿Para qué?**: Prioriza jugadas que funcionaron bien antes.
**Recomendación**: Siempre activado.

#### **History Heuristic**
**¿Qué es?**: Lleva un registro de qué jugadas han sido buenas históricamente.
**¿Para qué?**: Mejora el orden de búsqueda.
**Recomendación**: Siempre activado.

### **📚 Libro de Aperturas**
**¿Qué es?**: Jugadas precalculadas para el inicio del juego.
**¿Para qué?**: Ahorra tiempo y asegura buenos inicios.
**Recomendación**: Siempre activado.

### **🔢 Bitboards**
**¿Qué es?**: Representación eficiente del tablero.
**¿Para qué?**: Calcula jugadas mucho más rápido.
**Recomendación**: Siempre activado.

---

## 🎨 Estilos de Juego (Presets)

### **📚 IAPowa (Balanceado)**
- **Ideal para**: Partidas estándar
- **Características**: Equilibrio perfecta entre velocidad y fuerza
- **Recomendado para**: La mayoría de jugadores

### **⚡ IAPowa+Rendimiento**
- **Ideal para**: Partidas rápidas
- **Características**: Máxima velocidad, pensamiento más superficial
- **Recomendado para**: Partidas con límite de tiempo estricto

### **🛡️ IAPowa+Defensa**
- **Ideal para**: Partidas largas y cuidadosas
- **Características**: Máxima precisión, piensa más profundamente
- **Recomendado para**: Cuando quieres el máximo desafío

---

## 🔍 Cómo "Piensa" la IA

### **1. Generación de Jugadas**
La IA mira todas las jugadas posibles:
- Colocar esferas en niveles válidos
- Mover esferas existentes
- Recuperar esferas (cuando forma un cuadrado)
- Completar niveles

### **2. Evaluación de Posiciones**
La IA asigna una "puntuación" a cada posición:
- **Material**: Cuántas esferas tienes en reserva
- **Posición**: Control del centro y niveles altos
- **Amenazas**: Cuadrados casi formados
- **Oportunidades**: Jugadas de recuperación posibles

### **3. Búsqueda Alpha-Beta**
Explora las consecuencias de cada jugada, asumiendo que ambos jugadores jugarán óptimamente.

### **4. Selección Final**
Elige la jugada con la mejor puntuación final.

---

## 🎮 Consejos Prácticos

### **Para Principiantes**
- Comienza con **profundidad 3-4**
- Usa **modo automático** de tiempo
- Elige el preset **IAPowa (balanceado)**

### **Para Intermedios**
- Prueba **profundidad 5-7**
- Experimenta con **tiempo manual** (10-15 segundos)
- Prueba diferentes presets según tu estilo

### **Para Expertos**
- Usa **profundidad 8-10**
- Configura **tiempo manual** (20-30 segundos)
- Experimenta con configuraciones avanzadas

---

## ⚠️ Mitos Comunes

### **Mito**: "La IA hace trampa"
**Realidad**: La IA solo usa las mismas reglas que tú, pero piensa más movimientos adelante.

### **Mito**: "La IA siempre gana"
**Realidad**: Con buena estrategia y práctica, puedes ganarle a cualquier nivel.

### **Mito**: "Más profundidad siempre es mejor"
**Realidad**: Demasiada profundidad puede hacer la IA lenta y predecible.

---

## 🎯 Configuración Recomendada por Tipo de Jugador

### **🏠 Casual**
```
Profundidad: 3-4
Tiempo: Automático
Preset: IAPowa (Balanceado)
```

### **🎯 Competitivo**
```
Profundidad: 6-8
Tiempo: Manual (15-20 segundos)
Preset: IAPowa+Defensa
```

### **⚡ Rápido**
```
Profundidad: 4-5
Tiempo: Manual (5-8 segundos)
Preset: IAPowa+Rendimiento
```

---

## 🔄 Experimenta Divertido

Prueba estas combinaciones interesantes:
- **Profundidad 10 + Tiempo 2 segundos**: IA rápida pero superficial
- **Profundidad 3 + Tiempo 30 segundos**: IA lenta pero cuidadosa
- **Desactiva TT + Profundidad alta**: Verás cómo piensa más lentamente

---

## 📈 Métricas que Verás

### **📊 Panel de IA**
- **Evaluación**: Puntuación de la posición (+ buena para IA, - mala)
- **PV (Principal Variation)**: La secuencia de jugadas que la IA espera
- **Nodos**: Cuántas posiciones ha analizado
- **NPS**: Nodos por segundo (velocidad de pensamiento)
- **Profundidad alcanzada**: Cuántos movimientos adelante pensó

---

## 🎉 Disfruta Jugando

Recuerda: la IA es una herramienta para aprender y divertirte. No hay una configuración "perfecta" - la mejor es la que te divierte más y te desafía apropiadamente.

¡Buena suerte y disfruta de Pylos! 🎮
