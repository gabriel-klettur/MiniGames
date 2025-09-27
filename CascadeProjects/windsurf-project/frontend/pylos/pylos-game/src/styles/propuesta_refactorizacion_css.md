Aquí tienes una propuesta profesional, robusta y escalable para modularizar tu CSS sin perder ninguna definición, basada en lo que hoy está en [src/App.css](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/App.css:0:0-0:0) e [src/index.css](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/index.css:0:0-0:0). No haré cambios aún; solo te presento la estructura y el mapeo 1:1 para que confirmes.

Estructura de carpetas y archivos propuesta
- `src/styles/`
  - `tokens.css` → Variables globales `:root` (colores, sombras, radios, tiempos, medidas, escala, offsets…).
  - `base.css` → Reset mínimo, tipografías, fondo global (contenido actual de [src/index.css](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/index.css:0:0-0:0), incluyendo `#root::before` y `#root::after`).
  - `utilities.css` → Utilidades globales: `.sr-only`, `.text-right`, `.text-center`, `.mono`, `.ellipsis`, etc.
  - `layout.css` → Layout general de la App: `.app`, `.content`, media queries base (desktop/tablet, espaciado entre secciones).
  - `header.css` → Toolbar/encabezado compacto: `.panel--header`, `.header-bar`, `.header-actions`, `.btn-img`, iconos del header.
  - `panels.css` → Paneles genéricos: `.panel`, `.panel.small`, filas `.row`, botones chip dentro de paneles, `.panel .row.actions` y variantes.
  - `popovers.css` → Popover Vs IA: `.popover.vsai-popover`, `.vsai-section`, `.vsai-title`, `.vsai-options`, `.vsai-diffs`, `.vsai-hint`, `.vsai-speeds`.
  - `board.css` → Tablero y niveles: `.board`, `.board--pyramid`, `.board--stacked`, `::before` del tablero (madera), `.level`, `.level--board`, overlays por nivel, `.cell`, `.piece`, drag & drop, imágenes de piezas, escalado, estados, highlights, depuración.
  - `board-holes.css` → Sistema unificado “holes/slots”: variables de anillo/interior, estilos por nivel, `shade-only-holes`, `hole-borders`, selectores `:has`, overrides por highlight/disabled/supported.
  - `animations.css` → Animaciones globales: `@keyframes pieceAppear`, `cellFlash`, `spin`, `timebarIndeterminate` y clases activadoras (`.piece--appear`, `.cell--flash`, `.spinner`).
  - `banners-modals.css` → Banner de fin de partida bajo el tablero (`.gameover-banner`) y modales (`.modal-backdrop`, `.modal`, `.winner-backdrop`, `.winner-modal`).
  - `board-actions.css` → Panel de acciones bajo el tablero: `.board-actions` y botones específicos (`.undo-btn`, `.finish-recovery`, focus/hover/disabled states).
  - `foot-panel.css` → Botón flotante de DevTools: `.foot-panel`, `.foot-panel__btn`, icono y estados.
  - `devtools.css` → Refinamientos de DevTools: `.devtools-panel`, `.devtools-actions`, `.devtools-btn`, secciones, etc.
  - `tabs.css` → Pestañas genéricas (UXPanel, InfoIA): `.tabs`, `.tabs__list`, `.tabs__tab`, `.tabs__panel`, estados seleccionados/enfocados.
  - `controls-segmented.css` → Control segmentado unificado (evita duplicados de `.segmented`).
  - `form-controls.css` → Entradas y sliders: `input[type="range"]`, `select` usos genéricos de UI.
  - `bars.css` → Barras de evaluación y mini-barras (`.eval-bar`, `.mini-bar`, sus `__fill`).
  - `ia-user.css` → Panel rápido del usuario IA: `.iauser-panel`, filas, select de dificultad, icon buttons.
  - `ia-panel.css` → IAPanel de DevTools: grid del panel, KPIs (`.kpi`), timebar de IA, evaluación, secciones.
  - `infoia.css` → InfoIA (Simulaciones y Métricas): header/status/controls, `segmented` integrado, tabla profesional sticky, contenedor de gráfico.
  - [index.css](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/index.css:0:0-0:0) → Archivo agregador que importa TODO lo anterior en orden estable.

Árbol de imports en `src/styles/index.css` (orden y precedencia)
1) `@import './tokens.css';`
2) `@import './base.css';`
3) `@import './utilities.css';`
4) `@import './layout.css';`
5) `@import './header.css';`
6) `@import './panels.css';`
7) `@import './popovers.css';`
8) `@import './board.css';`
9) `@import './board-holes.css';`
10) `@import './animations.css';`
11) `@import './banners-modals.css';`
12) `@import './board-actions.css';`
13) `@import './foot-panel.css';`
14) `@import './devtools.css';`
15) `@import './tabs.css';`
16) `@import './controls-segmented.css';`
17) `@import './form-controls.css';`
18) `@import './bars.css';`
19) `@import './ia-user.css';`
20) `@import './ia-panel.css';`
21) `@import './infoia.css';`

Asignación 1:1 de selectores existentes
- `:root` y todas las CSS custom properties → `tokens.css`.
- Reset global (`* { box-sizing }`, `html, body, #root`) + fondo y viñeta (`#root::before`, `#root::after`) actualmente en [src/index.css](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/index.css:0:0-0:0) → `base.css`.
- `.app`, `.content`, breakpoints desktop/tablet → `layout.css`.
- `.panel`, `.panel.small`, `.panel .row`, `.panel .row.actions` y botones chip (no primarios) → `panels.css`.
- `.panel--header`, `.row.header`, `.header-actions`, `.btn-img`, tamaños del header y variantes “flat” → `header.css`.
- Popover Vs IA: `.popover.vsai-popover`, `.vsai-section`, `.vsai-options`, `.vsai-diffs`, `.vsai-speeds`, hints, activos/deshabilitados → `popovers.css`.
- Tablero y niveles: `.board*`, `.level*`, `.cell*`, `.piece*`, `.piece__img`, estados `--highlight`, `--supported`, `--selected`, drag, escala, depuración → `board.css`.
- Sistema de “holes/slots” (rings/inner shading, per-level toggles, shade-only-holes, hole-borders, overrides con highlight/disabled/supported) → `board-holes.css`.
- Animaciones y sus clases disparadoras (`.piece--appear`, `.cell--flash`, `.spinner`) → `animations.css`.
- Banner inline de fin de partida y modales (incluye winner modal) → `banners-modals.css`.
- Acciones bajo el tablero (`.board-actions`, `.undo-btn`, `.finish-recovery`, focus-visible, hover/active, iOS tweaks) → `board-actions.css`.
- Pie flotante (Dev button) → `foot-panel.css`.
- Refinos DevTools panel (`.devtools-*`) → `devtools.css`.
- Pestañas compartidas → `tabs.css`.
- Control segmentado unificado (hay dos definiciones duplicadas en [App.css](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/App.css:0:0-0:0), se consolida una versión) → `controls-segmented.css`.
- Sliders y selects genéricos → `form-controls.css`.
- Barras de evaluación y mini-barras → `bars.css`.
- Panel IA usuario (rápido bajo header) → `ia-user.css`.
- IAPanel (contenido de DevTools) → `ia-panel.css`.
- InfoIA (simulaciones/métricas y tabla) → `infoia.css`.

Notas de compatibilidad y rutas de assets
- En `board.css`, la imagen `url('./assets/board.webp')` al mover a `src/styles/` debe actualizarse a `url('../assets/board.webp')`.
- En `base.css`, la imagen `url('./assets/background_b.png')` al mover a `src/styles/` debe actualizarse a `url('../assets/background_b.png')`.
- Los CSS Modules existentes (p. ej. `components/DevTools/IAPanel/styles/*.module.css`) no se tocan; permanecen encapsulados.

Actualizaciones de imports
- En [src/App.tsx](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/App.tsx:0:0-0:0): reemplazar `import './App.css';` por `import './styles/index.css';`.
- Donde se importe [src/index.css](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/index.css:0:0-0:0) (probablemente `main.tsx`/`index.tsx`): eliminarlo o apuntarlo a `./styles/index.css` si actuaba como base global. La base/fondo pasan a `base.css` dentro del agregador.

Limpieza y eliminación segura
- Consolidar las dos definiciones de `.segmented` en un único `controls-segmented.css`.
- Tras migrar, ejecutar un análisis de uso de clases en TS/TSX para detectar selectores no utilizados y eliminarlos con seguridad en una segunda pasada.
- Borrar [src/App.css](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/App.css:0:0-0:0) y [src/index.css](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/index.css:0:0-0:0) una vez verificada la equivalencia visual.

Plan de migración (sincrónico y sin pérdida)
- Copiar y pegar reglas en nuevos archivos manteniendo el orden relativo.
- Ajustar rutas de `url(...)` de assets al nuevo nivel de carpeta.
- Cambiar imports en [App.tsx](cci:7://file:///d:/Full%20Stack/MiniGames/CascadeProjects/windsurf-project/frontend/pylos/pylos-game/src/App.tsx:0:0-0:0) y en el entry para usar `styles/index.css`.
- Validar en local UI/UX y estados (hover, focus-visible, disabled, toggles, media queries).
- Segunda pasada: eliminar estilos obsoletos/duplicados.