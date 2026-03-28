import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../game/store';
import useClickOutside from '../../hooks/useClickOutside';
import useBackgroundCatalog from '../../hooks/useBackgroundCatalog';
import useBackgroundControls from '../../hooks/useBackgroundControls';
import useBoardCatalog from '../../hooks/useBoardCatalog';
import VsAiPopover from './VsAiPopover/VsAiPopover';
import AssetsPopover from './AssetsPopover/AssetsPopover';
import NewGamePopover from './NewGamePopover/NewGamePopover';
import AnimationsPopover, { type AnimPreset } from './AnimationsPopover/AnimationsPopover';
import { applyCfg, readComputedCfg } from '../DevTools/UIUX/model/config';

export interface HeaderProps {
  showIA?: boolean;
  onToggleIA?: () => void;
  onStartVsAI?: (enemy: 1 | 2, depth: number) => void;
  // Nueva partida: permite inyectar lógica (limpieza de historial) antes del reset
  onNewGame?: () => void;
}

export default function HeaderPanel({ showIA = true, onToggleIA, onStartVsAI, onNewGame }: HeaderProps) {
  const { state, dispatch } = useGame();

  // Estado del popover Vs IA
  const [vsOpen, setVsOpen] = useState(false);
  const [selectedSide, setSelectedSide] = useState<1 | 2 | null>(null);
  const anchorRect: DOMRect | null = null;
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  // Estado del popover Nueva partida
  const [newOpen, setNewOpen] = useState(false);
  const [newAnchorRect, setNewAnchorRect] = useState<DOMRect | null>(null);
  const newBtnRef = useRef<HTMLButtonElement | null>(null);
  const newPopRef = useRef<HTMLDivElement | null>(null);

  // Estado del popover Animaciones (presets de aterrizaje y apilado)
  const [animOpen, setAnimOpen] = useState(false);
  const animAnchorRect: DOMRect | null = null;
  const animBtnRef = useRef<HTMLButtonElement | null>(null);
  const animPopRef = useRef<HTMLDivElement | null>(null);
  const [animSelectedId, setAnimSelectedId] = useState<string | null>(() => {
    try { return window.localStorage.getItem('soluna:ui:anim-selected'); } catch { return null; }
  });

  // Estado del popover Fondo
  const [bgOpen, setBgOpen] = useState(false);
  const [bgAnchorRect, setBgAnchorRect] = useState<DOMRect | null>(null);
  const bgBtnRef = useRef<HTMLButtonElement | null>(null);
  const bgPopRef = useRef<HTMLDivElement | null>(null);

  // Estado y acciones del fondo (DOM + CSS variables/atributos)
  const {
    bgHidden,
    woodHidden,
    fullBg,
    selectedBgUrl,
    selectedBoardUrl,
    applyBoardImage,
    applyBoardTexture,
    toggleHideBoardBg,
    toggleHideWoodBoard,
    toggleFullBg,
  } = useBackgroundControls();

  // Catálogo de fondos
  const bgCatalog = useBackgroundCatalog();
  // Catálogo de tableros
  const boardCatalog = useBoardCatalog();

  // Cierre por click fuera SOLO para VS IA (el de Fondo permanece abierto hasta pulsar el botón)
  useClickOutside([btnRef, popRef], vsOpen, () => setVsOpen(false));
  // Cierre por click fuera para el popover de Fondo
  useClickOutside([bgBtnRef, bgPopRef], bgOpen, () => setBgOpen(false));
  // Cierre por click fuera para Nueva partida
  useClickOutside([newBtnRef, newPopRef], newOpen, () => setNewOpen(false));
  // Cierre por click fuera para Animaciones
  useClickOutside([animBtnRef, animPopRef], animOpen, () => setAnimOpen(false));

  const toggleBgOpen = () => {
    if (bgBtnRef.current) setBgAnchorRect(bgBtnRef.current.getBoundingClientRect());
    setBgOpen((v) => !v);
  };

  const toggleNewOpen = () => {
    if (newBtnRef.current) setNewAnchorRect(newBtnRef.current.getBoundingClientRect());
    setNewOpen((v) => !v);
  };

  const onPickDifficulty = (d: number) => {
    if (!selectedSide) return;
    onStartVsAI?.(selectedSide, d);
    setVsOpen(false);
  };

  // Presets por defecto (coinciden con la propuesta)
  const DEFAULT_ANIM_PRESETS: AnimPreset[] = useMemo(() => ([
    { id: 'classic-curve', name: 'Clásico curvo', description: 'Curva equilibrada', overrides: { stackStep: 18, flightCurveEnabled: true, flightCurveBend: 0.22, flightDestOffsetY: 0, flightLingerMs: 250 } },
    { id: 'straight-fast', name: 'Recto rápido', description: 'Trayectoria directa sin curva y overlay mínimo', overrides: { stackStep: 16, flightCurveEnabled: false, flightCurveBend: 0.0, flightDestOffsetY: 0, flightLingerMs: 120 } },
    { id: 'high-arc', name: 'Arco alto', description: 'Curva pronunciada, sensación cinemática', overrides: { stackStep: 18, flightCurveEnabled: true, flightCurveBend: 0.45, flightDestOffsetY: -4, flightLingerMs: 320 } },
    { id: 'soft-arc', name: 'Arco suave', description: 'Curva ligera y limpia', overrides: { stackStep: 18, flightCurveEnabled: true, flightCurveBend: 0.12, flightDestOffsetY: 2, flightLingerMs: 220 } },
    { id: 'right-landing', name: 'Aterrizaje centrado', description: 'Aterrizaje centrado sin desplazamiento horizontal', overrides: { stackStep: 18, flightCurveEnabled: true, flightCurveBend: 0.22, flightDestOffsetY: 0, flightLingerMs: 240 } },
    { id: 'down-right', name: 'Abajo', description: 'Offset vertical para enfatizar el apilado', overrides: { stackStep: 20, flightCurveEnabled: true, flightCurveBend: 0.20, flightDestOffsetY: 10, flightLingerMs: 260 } },
    { id: 'stick-center', name: 'Pegado al centro', description: 'Sin desplazamiento y linger muy breve', overrides: { stackStep: 18, flightCurveEnabled: true, flightCurveBend: 0.18, flightDestOffsetY: 0, flightLingerMs: 100 } },
    { id: 'stack-compact', name: 'Stack compacto', description: 'Pilas apretadas; lectura de altura sutil', overrides: { stackStep: 12, flightCurveEnabled: true, flightCurveBend: 0.20, flightDestOffsetY: 0, flightLingerMs: 220 } },
    { id: 'stack-open', name: 'Stack desplegado', description: 'Pilas abiertas para enfatizar composición', overrides: { stackStep: 26, flightCurveEnabled: true, flightCurveBend: 0.22, flightDestOffsetY: 4, flightLingerMs: 280 } },
    { id: 'cinematic', name: 'Cinemático', description: 'Curva marcada y linger más largo', overrides: { stackStep: 20, flightCurveEnabled: true, flightCurveBend: 0.35, flightDestOffsetY: -2, flightLingerMs: 400 } },
  ]), []);

  // Permitir sobrescribir lista desde localStorage (futuro CRUD)
  const animPresets: AnimPreset[] = useMemo(() => {
    try {
      const raw = window.localStorage.getItem('soluna:ui:anim-presets');
      if (raw) return JSON.parse(raw) as AnimPreset[];
    } catch {}
    return DEFAULT_ANIM_PRESETS;
  }, [DEFAULT_ANIM_PRESETS]);

  // Derivar preset "Configuración actual" y selección por defecto del popover
  const currentCfg = readComputedCfg();
  const eq = (a: any, b: any) => a === b;
  const matches = (p: AnimPreset) => (
    (p.overrides.stackStep == null || eq(p.overrides.stackStep, currentCfg.stackStep)) &&
    (p.overrides.flightCurveEnabled == null || eq(p.overrides.flightCurveEnabled, currentCfg.flightCurveEnabled)) &&
    (p.overrides.flightCurveBend == null || eq(p.overrides.flightCurveBend, currentCfg.flightCurveBend)) &&
    (p.overrides.flightDestOffsetY == null || eq(p.overrides.flightDestOffsetY, currentCfg.flightDestOffsetY)) &&
    (p.overrides.flightLingerMs == null || eq(p.overrides.flightLingerMs, currentCfg.flightLingerMs))
  );
  const matched = animPresets.find(matches) || null;
  const currentPreset: AnimPreset = {
    id: 'current-config',
    name: 'Configuración actual',
    description: 'Valores actualmente activos en el tablero',
    overrides: {
      stackStep: currentCfg.stackStep,
      flightCurveEnabled: currentCfg.flightCurveEnabled,
      flightCurveBend: currentCfg.flightCurveBend,
      flightDestOffsetY: currentCfg.flightDestOffsetY,
      flightLingerMs: currentCfg.flightLingerMs,
    },
  };
  const presetsForPopover: AnimPreset[] = useMemo(() => [currentPreset, ...animPresets], [currentPreset, animPresets]);
  const selectedForPopover: string | null = matched ? matched.id : currentPreset.id;

  const onApplyAnimPreset = (p: AnimPreset) => {
    const current = readComputedCfg();
    const next = { ...current, ...p.overrides };
    applyCfg(next);
    try { window.localStorage.setItem('soluna:ui:anim-selected', p.id); } catch {}
    setAnimSelectedId(p.id);
    // Mantener abierto si se aplica el preset que ya es el seleccionado del popover (caso Default)
    if (p.id === 'current-config') return; // no cerrar al aplicar Default (Configuración actual)
    if (p.id !== selectedForPopover) setAnimOpen(false);
  };

  // Aplicar automáticamente el preset guardado si existe
  useEffect(() => {
    if (!animSelectedId) return;
    const p = animPresets.find(x => x.id === animSelectedId);
    if (!p) return;
    const current = readComputedCfg();
    const next = { ...current, ...p.overrides };
    applyCfg(next);
    // No cerramos popovers aquí; esto solo sincroniza estilos al cargar
  }, [animSelectedId, animPresets]);

  return (
    <section className="header-bar" aria-label="Encabezado">
      <div className="row header">
        <h2>Soluna</h2>
        <div className="header-actions">
          {/* Nueva partida (icono + chip) */}
          <button
            ref={newBtnRef}
            onClick={toggleNewOpen}
            aria-expanded={newOpen}
            aria-pressed={newOpen}
            aria-controls="newgame-popover"
            aria-label="Nueva partida"
            title="Nueva partida"
          >
            <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M11 11V5a1 1 0 1 1 2 0v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6z"/>
            </svg>
            <span className="sr-only"></span>
          </button>

          {/* Botón Fondo (mostrar/ocultar fondo tablero) */}
          <button
            ref={bgBtnRef}
            onClick={toggleBgOpen}
            aria-expanded={bgOpen}
            aria-pressed={bgOpen}
            aria-controls="bg-popover"
            aria-label="Mostrar/Ocultar fondo del tablero"
            title="Fondo"
          >
            <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M3 5h18v2H3zM3 17h18v2H3zM5 8h14v8H5z"/>
            </svg>            
          </button>

          {/* Alternar IAUserPanel (icono IA) */}
          <button
            onClick={onToggleIA}
            aria-pressed={showIA}
            aria-label="Alternar panel de IA"
            title="IA"
          >
            <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M11 2h2v3h-2z"/>
              <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
              <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
              <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
              <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
            </svg>
            <span className="header-btn__label">IA</span>
          </button>

          {/* Nueva ronda como acción primaria visible solo cuando aplica */}
          {state.roundOver && !state.gameOver && (
            <button className="primary" onClick={() => dispatch({ type: 'new-round' })}>Nueva ronda</button>
          )}
        </div>
      </div>

      {/* Popover Nueva partida */}
      {newOpen && (
        <NewGamePopover
          anchorRect={newAnchorRect}
          popRef={newPopRef}
          onPickRandom={() => {
            (onNewGame ? onNewGame() : dispatch({ type: 'reset-game' }));
            setNewOpen(false);
          }}
          onPickManual={() => {
            dispatch({ type: 'enter-custom-setup' });
            setNewOpen(false);
          }}
        />
      )}

      {/* Popover Animaciones */}
      {animOpen && (
        <AnimationsPopover
          anchorRect={animAnchorRect}
          popRef={animPopRef}
          presets={presetsForPopover}
          selectedId={selectedForPopover}
          onApply={onApplyAnimPreset}
          onClose={() => setAnimOpen(false)}
        />
      )}

      {/* Popover Fondo */}
      {bgOpen && (
        <AssetsPopover
          anchorRect={bgAnchorRect}
          popRef={bgPopRef}
          bgHidden={bgHidden}
          woodHidden={woodHidden}
          fullBg={fullBg}
          selectedBgUrl={selectedBgUrl}
          selectedBoardUrl={selectedBoardUrl}
          onToggleHideBoardBg={toggleHideBoardBg}
          onToggleFullBg={toggleFullBg}
          onToggleHideWoodBoard={toggleHideWoodBoard}
          onApplyBoardImage={applyBoardImage}
          onApplyBoardTexture={applyBoardTexture}
          bgCatalog={bgCatalog}
          boardCatalog={boardCatalog}
        />
      )}

      {/* Popover Vs IA */}
      {vsOpen && (
        <VsAiPopover
          anchorRect={anchorRect}
          popRef={popRef}
          selectedSide={selectedSide}
          onSelectSide={(side) => setSelectedSide(side)}
          onPickDifficulty={onPickDifficulty}
        />
      )}
    </section>
  );
}
