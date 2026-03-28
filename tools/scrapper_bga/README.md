# Board Game Arena Scraper

Scraper para extraer estadísticas de juegos de [Board Game Arena](https://boardgamearena.com).

## Características

- ✅ Extrae estadísticas de juegos de un jugador específico
- ✅ Filtra por juego, oponente y estado
- ✅ Rate limiting para evitar sobrecarga del servidor
- ✅ Manejo robusto de errores
- ✅ Exporta datos a JSON
- ✅ Type hints completos y documentación

## Instalación

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

## Uso

### Uso básico

```python
from bga_scraper import BGAScraper

# Crear scraper
scraper = BGAScraper(delay=1.0)

# Scrapear estadísticas
games = scraper.scrape_player_stats(
    player_id="6870632",
    game_id="63",  # ID del juego específico (0 para todos)
    opponent_id="0",  # ID del oponente (0 para todos)
    finished="0"  # Estado (0 para todos)
)

# Guardar resultados
scraper.save_to_json(games, "stats.json")

# Mostrar resumen
scraper.print_summary(games)
```

### Ejecutar el script principal

```bash
python bga_scraper.py
```

## Estructura de Datos

Cada juego extraído contiene:

```python
@dataclass
class GameStats:
    game_id: str          # ID único del juego
    game_name: str        # Nombre del juego
    opponent: str         # Nombre del oponente
    result: str           # Resultado (Win/Loss/Draw)
    date: str             # Fecha del juego
    score: str            # Puntuación del jugador
    opponent_score: str   # Puntuación del oponente
    duration: str         # Duración del juego
    elo_change: str       # Cambio en ELO
    table_id: str         # ID de la mesa
```

## Arquitectura

### Componentes principales

1. **BGAScraper**: Clase principal que maneja el scraping
   - `fetch_page()`: Obtiene y parsea páginas HTML
   - `extract_game_stats()`: Extrae datos de la tabla de estadísticas
   - `scrape_player_stats()`: Coordina el proceso de scraping
   - `save_to_json()`: Guarda resultados en JSON

2. **GameStats**: Dataclass que representa un juego individual

### Principios de diseño

- **Separation of concerns**: Cada método tiene una responsabilidad única
- **Rate limiting**: Delay configurable entre requests (default 1s)
- **Error handling**: Try-catch en puntos críticos con logging
- **Type safety**: Type hints completos para mejor mantenibilidad
- **Idempotency**: Múltiples ejecuciones producen el mismo resultado

### Complejidad

- **Tiempo**: O(n) donde n = número de filas en la tabla
- **Espacio**: O(n) para almacenar los GameStats extraídos

### Trade-offs

✅ **Ventajas**:
- Simple y directo
- Fácil de modificar selectores
- Bajo acoplamiento entre componentes

⚠️ **Limitaciones**:
- Requiere ajustar selectores si BGA cambia su HTML
- No maneja paginación automáticamente
- No incluye autenticación (solo páginas públicas)

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Cambios en HTML de BGA | Selectores CSS flexibles, logging de errores |
| Rate limiting del servidor | Delay configurable entre requests |
| Datos faltantes | Uso de Optional types, valores por defecto |
| Timeout de requests | Timeout de 10s, manejo de excepciones |

## Testing

```python
# Test básico
def test_scraper():
    scraper = BGAScraper(delay=0.5)
    games = scraper.scrape_player_stats("6870632", game_id="63")
    assert len(games) > 0
    assert games[0].game_name is not None
    print(f"✅ Test passed: {len(games)} games found")

if __name__ == "__main__":
    test_scraper()
```

## Glosario Técnico

- **Web scraping**: Extracción automatizada de datos de sitios web mediante parsing de HTML
- **Rate limiting**: Técnica para limitar frecuencia de requests y evitar sobrecarga del servidor
- **BeautifulSoup**: Librería Python para parsing de HTML/XML — *soup.find('table')*
- **CSS selector**: Patrón para localizar elementos en HTML — *table.gamestats*
- **Dataclass**: Clase Python para almacenar datos con menos boilerplate — *@dataclass*
- **Type hints**: Anotaciones de tipos en Python para mejor IDE support — *def func(x: int) -> str*
- **Session**: Objeto requests que persiste cookies y headers entre requests
- **User-Agent**: Header HTTP que identifica el cliente (navegador/scraper)
- **Idempotency**: Propiedad donde múltiples ejecuciones producen el mismo resultado
- **Separation of concerns**: Principio de diseño que separa responsabilidades en módulos distintos

## Cómo Defender Este Código

### Goal & Acceptance Criteria
- ✅ Extraer estadísticas de juegos de BGA de forma confiable
- ✅ Manejar errores sin crashes
- ✅ Respetar rate limits del servidor
- ✅ Exportar datos en formato estructurado (JSON)

### Design Justification
- **BeautifulSoup vs Selenium**: BS4 es suficiente para contenido estático, más rápido y ligero
- **Dataclass vs Dict**: Type safety y autocompletado en IDE
- **Session vs requests directos**: Reutiliza conexiones TCP, más eficiente

### Performance/Memory
- **O(n) tiempo**: Lineal con número de juegos, óptimo para scraping
- **O(n) memoria**: Almacena todos los juegos en memoria, aceptable para datasets pequeños/medianos
- **Mejora futura**: Streaming a archivo para datasets muy grandes

### Extensibility
- **Variation points**:
  - Cambiar selectores CSS en `extract_game_stats()`
  - Añadir nuevos campos a `GameStats`
  - Implementar paginación en `scrape_player_stats()`
  - Añadir autenticación en `BGAScraper.__init__()`

### Known Risks & Next Steps
1. **HTML changes**: Monitorear cambios en estructura de BGA
2. **Paginación**: Implementar si hay más de una página de resultados
3. **Autenticación**: Añadir login si se necesitan datos privados
4. **Testing**: Añadir unit tests con mocks de HTML
5. **Logging**: Implementar logging estructurado (no solo prints)

## Checklist de Calidad

- ✅ Nombres descriptivos (GameStats, BGAScraper, extract_game_stats)
- ✅ Funciones pequeñas (<50 líneas cada una)
- ✅ Constantes definidas (BASE_URL, delay)
- ✅ Error handling con try-catch
- ✅ Separación update/render (fetch vs extract)
- ✅ Type hints completos
- ✅ Docstrings en Google style
- ✅ Rate limiting implementado
- ✅ Resource cleanup (session reutilizable)

## Licencia

MIT
