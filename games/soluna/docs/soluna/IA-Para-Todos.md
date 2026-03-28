# 🧠 IA de Soluna: Guía para Todos

## 📖 ¿Qué es la IA de Soluna?

La IA de Soluna es como tener un estratega experto en juegos de fusión. Piensa en cómo combinar tus fichas, cuándo fusionar, y cómo maximizar tus puntos en cada ronda mientras bloquea tus oportunidades.

---

## 🎯 Niveles de Dificultad

### **Profundidad (10-19)**
**Nota**: Soluna usa niveles 10-19 para mayor precisión.

- **Nivel 10-12**: Principiante - Piensa 10-12 movimientos adelante
- **Nivel 13-15**: Intermedio - Piensa 13-15 movimientos adelante
- **Nivel 16-17**: Experto - Piensa 16-17 movimientos adelante  
- **Nivel 18-19**: Maestro - Piensa 18-19 movimientos adelante

**Consejo**: Comienza en nivel 13 para un desafío equilibrado.

---

## ⏱️ Control del Tiempo

### **Modo Automático (Adaptativo)**
La IA se ajusta según la complejidad:
- **Tiempo mínimo**: Nunca menos de X segundos
- **Tiempo máximo**: Nunca más de Y segundos
- **Tiempo base**: Tiempo estándar por jugada
- **Tiempo extra**: Más tiempo si el tablero es complejo
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
- **lmrLateMoveIdx**: Cuántas jugadas "malas" saltar (4-5)
- **lmrReduction**: Cuántos niveles menos pensar (1)

#### **Killer Heuristic**
**¿Qué es?**: Recuerda jugadas que causaron "beta cutoffs".
**¿Para qué?**: Prioriza jugadas que funcionaron bien antes.
**Recomendación**: Siempre activado.

#### **History Heuristic**
**¿Qué es?**: Historial de qué movimientos han sido buenos.
**¿Para qué?**: Mejora el orden de búsqueda.
**Recomendación**: Siempre activado.

### **🔍 Búsqueda Extendida**

#### **Quiescence Search**
**¿Qué es?**: Sigue pensando en posiciones "tácticas" (fusiones posibles).
**¿Para qué?**: Evita errores en finales de ronda.
- **quiescenceDepth**: Cuántos niveles extra pensar (3-4)
- **quiescenceHighTowerThreshold**: A partir de qué altura considerar (4)

#### **Aspiration Windows**
**¿Qué es?**: Busca alrededor de una puntuación esperada.
**¿Para qué?**: Más velocidad pero puede equivocarse.
- **aspirationDelta**: Margen de búsqueda (20-25)
- **prevScore**: Puntuación de la búsqueda anterior

**Recomendación**: Activar para partidas rápidas, desactivar para máxima precisión.

### **🚫 Poda Selectiva (Avanzado)**

#### **Futility Pruning**
**¿Qué es?**: Ignora ramas que claramente no mejorarán la posición.
**¿Para qué?**: Gana velocidad pero puede perder jugadas sutiles.
- **futilityMargin**: Margen de seguridad (10-30)
**Recomendación**: Desactivado por defecto, activar solo para velocidad.

#### **LMP (Late Move Pruning)**
**¿Qué es?**: Ignora completamente las últimas jugadas malas.
**¿Para qué?**: Máxima velocidad pero riesgo de error.
- **lmpDepthThreshold**: A partir de qué profundidad (2)
- **lmpLateMoveIdx**: Cuántas últimas ignorar (6)
**Recomendación**: Desactivado por defecto, usar con cuidado.

#### **Null-Move Pruning**
**¿Qué es?**: Prueba qué pasa si "pasas" turno.
**¿Para qué?**: Detecta zugzwang (posiciones donde mover es malo).
**Recomendación**: Desactivado por defecto (Soluna tiene zugzwang).

---

## 🎨 Estilos de Juego (Presets)

### **📚 IAPowa (Balanceado)**
- **Filosofía**: Equilibrio perfecto entre velocidad y fuerza
- **Características**: Motor robusto y estable
- **Ideal para**: La mayoría de situaciones
- **Configuración**: Todo activado, LMR conservador

### **⚡ IAPowa+Rendimiento**
- **Filosofía**: Máxima velocidad, pensamiento superficial
- **Características**: Heurísticas agresivas activadas
- **Ideal para**: Partidas rápidas con límite de tiempo
- **Configuración**: Aspiration, Futility, LMP, Null-Move activados

### **🛡️ IAPowa+Defensa**
- **Filosofía**: Máxima precisión, sin riesgos
- **Características**: Desactiva todas las podas agresivas
- **Ideal para**: Partidas largas y críticas
- **Configuración**: Solo motor básico + quiescence profunda

---

## 🔍 Cómo "Piensa" la IA de Soluna

### **1. Análisis de Posición**
La IA evalúa cada estado del tablero:
- **Pares fusionables**: Cuántos pares puedes fusionar
- **Altura de torres**: Torres altas valen más
- **Control del centro**: Posiciones centrales son estratégicas
- **Turno actual**: Es diferente si es tu turno o del rival

### **2. Generación de Jugadas**
Considera todas las opciones:
- **Colocar fichas**: En cualquier casilla vacía
- **Fusionar pares**: Cuando hay dos fichas iguales adyacentes
- **Priorización**: Primero las fusiones, luego las colocaciones estratégicas

### **3. Evaluación de Posiciones**
Asigna puntuación basada en:
- **Ventaja material**: Diferencia en pares fusionables
- **Potencial de fusión**: Futuras fusiones posibles
- **Control espacial**: Dominio del tablero
- **Oportunidades de bloqueo**: Impedir fusiones rivales

### **4. Búsqueda Alpha-Beta**
Explora consecuencias asumiendo juego óptimo de ambos jugadores.

---

## 🎮 Consejos Prácticos

### **Para Principiantes**
```
Profundidad: 13
Tiempo: Automático
Preset: IAPowa (Balanceado)
```

### **Para Intermedios**
```
Profundidad: 15-16
Tiempo: Manual (10-15 segundos)
Preset: IAPowa+Rendimiento
```

### **Para Expertos**
```
Profundidad: 18-19
Tiempo: Manual (20-30 segundos)
Preset: IAPowa+Defensa
```

---

## 🎯 Configuraciones por Tipo de Jugador

### **🏠 Casual**
```
Profundidad: 13
Tiempo: Automático
Preset: IAPowa
Optimizaciones: Estándar
```

### **🎯 Competitivo**
```
Profundidad: 17
Tiempo: Manual (15s)
Preset: IAPowa+Rendimiento
Optimizaciones: Velocidad
```

### **🛡️ Cuidadoso**
```
Profundidad: 19
Tiempo: Manual (25s)
Preset: IAPowa+Defensa
Optimizaciones: Máxima precisión
```

### **⚡ Veloz**
```
Profundidad: 14
Tiempo: Manual (5s)
Preset: IAPowa+Rendimiento
Optimizaciones: Máxima velocidad
```

---

## 📊 Métricas del Panel

### **📈 Estadísticas en Tiempo Real**
- **Evaluación**: Puntuación de la posición (+ buena para IA, - mala)
- **PV (Principal Variation)**: Secuencia esperada de jugadas
- **Nodos**: Posiciones analizadas
- **NPS**: Nodos por segundo (velocidad)
- **Profundidad alcanzada**: Cuántos movimientos ahead pensó
- **Tiempo transcurrido**: Segundos de cálculo

### **🎯 Análisis de Raíz**
- **Movimientos raíz**: Todas las opciones consideradas
- **Puntuaciones**: Qué tan buena es cada opción
- **Ventajas**: Por qué prefiere una sobre otra

---

## 🌟 Estrategias Específicas de Soluna

### **🔄 Control de Turnos**
La IA prefiere:
- **Su turno**: Maximizar fusiones inmediatas
- **Turno rival**: Bloquear fusiones futuras

### **📊 Gestión de Altura**
- **Torres bajas (1-2)**: Fáciles de fusionar, valor moderado
- **Torres medias (3-4)**: Buen balance de riesgo/recompensa
- **Torres altas (5+)**: Alto valor pero difíciles de fusionar

### **🎯 Control del Centro**
Las casillas centrales son más valiosas porque:
- Permiten más fusiones potenciales
- Controlan más del tablero
- Dificultan el juego rival

---

## ⚠️ Errores Comunes

### **Error**: "La IA no fusiona cuando puede"
**Realidad**: A veces es mejor esperar una fusión más grande.

### **Error**: "La IA pone fichas en lugares raros"
**Realidad**: Está preparando fusiones futuras o bloqueando tuyas.

### **Error**: "La IA piensa demasiado en jugadas obvias"
**Realidad**: Incluso fusiones simples pueden tener consecuencias complejas.

---

## 🔄 Experimentos Divertidos

### **🤪 Modos Extremos**
- **Sin fusión**: Desactiva todas las fusiones (solo colocar)
- **Solo fusión**: Prioriza fusiones sobre colocación
- **Velocidad máxima**: 1 segundo por jugada
- **Modo tortuga**: 60 segundos por jugada

### **🎓 Desafíos de Aprendizaje**
- **Vencer nivel 13**: Aprende patrones básicos
- **Igualar nivel 16**: Domina estrategias intermedias
- **Retar nivel 19**: Prueba tus habilidades máximas

---

## 🎉 Disfruta del Juego

Soluna es un juego de equilibrio entre inmediateo y futuro. La IA te enseña a pensar en cadena, a valorar oportunidades futuras, y a entender que a veces la mejor jugada es esperar.

Cada partida te enseña algo nuevo sobre paciencia, estrategia y visión a largo plazo.

¡Buena suerte y disfruta fusionando estrellas y lunas! 🌙⭐
