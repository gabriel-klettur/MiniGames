import { useEffect, useState } from 'react';
import { clearAdvancedCfg, clearAdvancedCfgByPlayer } from '../../../../../utils/iaAdvancedStorage.ts';
import { DatasetTabs } from './DatasetTabs.tsx';
import { SimulationLimits } from './SimulationLimits.tsx';
import { MirrorAndBook } from './Mirror.tsx';
import { ActionsBar } from './ActionsBar.tsx';
import PlayerIAControls from './PlayerIAControls.tsx';
import bolaA from '../../../../../assets/bola_a.webp';
import bolaB from '../../../../../assets/bola_b.webp';

export type ControlsProps = {
  depth: number;
  onDepthChange: (d: number) => void;

  timeMode: 'auto' | 'manual';
  onTimeModeChange: (m: 'auto' | 'manual') => void;
  timeSeconds: number;
  onTimeSecondsChange: (v: number) => void;

  pliesLimit: number;
  onPliesLimitChange: (v: number) => void;
  gamesCount: number;
  onGamesCountChange: (v: number) => void;

  mirrorBoard: boolean;
  onMirrorChange: (v: boolean) => void;

  // Book toggle used by simulations (InfoIA)
  useBook: boolean;
  onUseBookChange: (v: boolean) => void;

  running: boolean;
  loading: boolean;
  onStart: () => void;
  onStop: () => void;

  onExportJSON: () => void;
  onExportCSV: () => void;
  onAddCompare: () => void;
  onClearAll: () => void;
  onResetDefaults: () => void;

  activeTableSourceId: string;
  compareSets: Array<{ id: string; name: string; color: string }>;
  onSelectTableSource: (id: string) => void;
  canClearLocal: boolean;
};

export default function Controls(props: ControlsProps) {
  // Layout and spacing handled via CSS classes in styles/infoia.css
  const [resetTick, setResetTick] = useState(0);

  // Collapsible group state (persisted locally)
  const GROUP_STORE_KEY = 'pylos.infoia.controls.group.collapsed';
  const [collapsed, setCollapsed] = useState<boolean>(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GROUP_STORE_KEY);
      if (raw != null) setCollapsed(raw === '1' || raw === 'true');
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(GROUP_STORE_KEY, next ? '1' : '0'); } catch {}
      return next;
    });
  };

  // Shared collapsible state for PlayerIAControls cards (synced between L/D)
  type CardId = 'difficulty' | 'start' | 'book' | 'repetition' | 'persistence' | 'antiStall' | 'heuristic';
  const CARDS_STORE_KEY = 'pylos.infoia.player.cards.collapsed.v1';
  const defaultCards: Record<CardId, boolean> = {
    difficulty: false,
    start: false,
    book: false,
    repetition: false,
    persistence: false,
    antiStall: false,
    heuristic: false,
  };
  const [cardCollapsed, setCardCollapsed] = useState<Record<CardId, boolean>>(defaultCards);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CARDS_STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, boolean>;
        setCardCollapsed((prev) => ({ ...prev, ...parsed } as any));
      }
    } catch {}
  }, []);
  const toggleCard = (id: CardId) => {
    setCardCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] } as Record<CardId, boolean>;
      try { localStorage.setItem(CARDS_STORE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <>
      <div className="infoia__group">
        <div className="infoia__group-header">
          {/* ActionsBar alineada a la izquierda del header */}
          <ActionsBar
            running={props.running}
            loading={props.loading}
            onStart={props.onStart}
            onStop={props.onStop}
            onDefault={() => {
              clearAdvancedCfg();
              clearAdvancedCfgByPlayer('L');
              clearAdvancedCfgByPlayer('D');
              setResetTick((x) => x + 1);
              props.onResetDefaults();
            }}
            onExportJSON={props.onExportJSON}
            onExportCSV={props.onExportCSV}
            onAddCompare={props.onAddCompare}
            onClearAll={props.onClearAll}
            canClearLocal={props.canClearLocal}
            activeTableSourceId={props.activeTableSourceId}
          />
          {/* Botón de toggle alineado a la derecha con el título */}
          <button
            type="button"
            className="infoia__group-toggle"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-controls="infoia-controls-grid"
            id="infoia-controls-header"
          >
            <span>Configuracion Simulacion y Metricas</span>
            <span className="chev" aria-hidden="true">▾</span>
          </button>
        </div>
        {!collapsed && (
          <div className="infoia__controls" id="infoia-controls-grid" role="region" aria-labelledby="infoia-controls-header">
            {/* Global: Visualización y books + Dataset */}
            <div className="infoia__card-stack">
              <div className="infoia__card">
                <div className="infoia__card-title">Visualización y books</div>
                <MirrorAndBook
                  mirrorBoard={props.mirrorBoard}
                  onMirrorChange={props.onMirrorChange}
                  useBook={props.useBook}
                  onUseBookChange={props.onUseBookChange}
                />
              </div>
              <div className="infoia__card">
                <div className="infoia__card-title">Tabla (dataset)</div>
                <DatasetTabs
                  activeId={props.activeTableSourceId}
                  sets={props.compareSets}
                  onSelect={props.onSelectTableSource}
                />
              </div>
            </div>
            {/* Global: Límites de simulación */}
            <div className="infoia__card">
              <div className="infoia__card-title">Límites de simulación</div>
              <SimulationLimits
                pliesLimit={props.pliesLimit}
                onPliesLimitChange={props.onPliesLimitChange}
                gamesCount={props.gamesCount}
                onGamesCountChange={props.onGamesCountChange}
              />
            </div>

            <PlayerIAControls
              key={`player-L-${resetTick}`}
              player={'L'}
              title={'Jugador L (Bola clara)'}
              themeClass={'infoia__player--light'}
              ballIconSrc={bolaB}
              ballAlt={'Bola clara'}
              cardCollapsed={cardCollapsed}
              onToggleCard={toggleCard}
            />          
            
            <PlayerIAControls
              key={`player-D-${resetTick}`}
              player={'D'}
              title={'Jugador D (Bola oscura)'}
              themeClass={'infoia__player--dark'}
              ballIconSrc={bolaA}
              ballAlt={'Bola oscura'}
              cardCollapsed={cardCollapsed}
              onToggleCard={toggleCard}
            />                

          </div>
        )}
      </div>
      {/* Acciones trasladadas al header */}
    </>
  );
}
