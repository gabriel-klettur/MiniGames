import { useState } from 'react';

export interface UXPanelProps {
  // Shading toggles per level
  noShadeL0: boolean;
  noShadeL1: boolean;
  noShadeL2: boolean;
  noShadeL3: boolean;
  onChangeNoShade: (level: 0 | 1 | 2 | 3, value: boolean) => void;
  // Auto mode: only shade available levels
  shadeOnlyAvailable: boolean;
  onToggleShadeOnlyAvailable: (v: boolean) => void;
  // Shade only supported (available) holes per cell
  shadeOnlyHoles: boolean;
  onToggleShadeOnlyHoles: (v: boolean) => void;
  // Piece scale (only ball size, not board scale)
  pieceScale: number; // e.g., 1.55
  onChangePieceScale: (v: number) => void;
  // Animation durations in ms
  appearMs: number; // piece appear
  flashMs: number;  // cell flash
  flyMs: number;    // flying piece
  onChangeAppearMs: (ms: number) => void;
  onChangeFlashMs: (ms: number) => void;
  onChangeFlyMs: (ms: number) => void;
  // Delay between auto-placement steps (ms)
  autoFillDelayMs: number;
  onChangeAutoFillDelayMs: (ms: number) => void;
}

/**
 * UXPanel: ajustes visuales de UI/UX
 * - Sombreado por nivel (L0..L3)
 * - Tamaño de la bola (escala)
 * - Duraciones de animación (input numérico en ms)
 */
export default function UXPanel(props: UXPanelProps) {
  const {
    noShadeL0, noShadeL1, noShadeL2, noShadeL3,
    onChangeNoShade,
    shadeOnlyAvailable, onToggleShadeOnlyAvailable,
    shadeOnlyHoles, onToggleShadeOnlyHoles,
    pieceScale, onChangePieceScale,
    appearMs, flashMs, flyMs,
    onChangeAppearMs, onChangeFlashMs, onChangeFlyMs,
    autoFillDelayMs, onChangeAutoFillDelayMs,
  } = props;

  const [tab, setTab] = useState<'shade' | 'size' | 'anim'>('shade');

  const onKeyNav = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const order: Array<typeof tab> = ['shade', 'size', 'anim'];
    const idx = order.indexOf(tab);
    const next = e.key === 'ArrowRight' ? (idx + 1) % order.length : (idx - 1 + order.length) % order.length;
    setTab(order[next]);
  };

  return (
    <div className="ux-panel">
      <div className="row">
        <h3 style={{ margin: 0, fontSize: 16 }}>Opciones UI/UX</h3>
      </div>

      {/* Tabs header */}
      <div className="tabs" onKeyDown={onKeyNav}>
        <div className="tabs__list" role="tablist" aria-label="Configuración UI/UX">
          <button
            role="tab"
            id="tab-shade"
            aria-controls="panel-shade"
            aria-selected={tab === 'shade'}
            tabIndex={tab === 'shade' ? 0 : -1}
            className="tabs__tab"
            onClick={() => setTab('shade')}
          >Sombreado</button>
          <button
            role="tab"
            id="tab-size"
            aria-controls="panel-size"
            aria-selected={tab === 'size'}
            tabIndex={tab === 'size' ? 0 : -1}
            className="tabs__tab"
            onClick={() => setTab('size')}
          >Tamaño</button>
          <button
            role="tab"
            id="tab-anim"
            aria-controls="panel-anim"
            aria-selected={tab === 'anim'}
            tabIndex={tab === 'anim' ? 0 : -1}
            className="tabs__tab"
            onClick={() => setTab('anim')}
          >Animaciones</button>
        </div>
      </div>

      {/* Tab panels */}
      {tab === 'shade' && (
        <div role="tabpanel" id="panel-shade" aria-labelledby="tab-shade" className="tabs__panel">
          <div className="row">
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={shadeOnlyAvailable}
                onChange={(e) => onToggleShadeOnlyAvailable(e.target.checked)}
              />
              Sombreado solo niveles disponibles
            </label>
          </div>
          <div className="row">
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={shadeOnlyHoles}
                onChange={(e) => onToggleShadeOnlyHoles(e.target.checked)}
              />
              Sombreado solo huecos disponibles
            </label>
          </div>
          <div className="row" aria-disabled={shadeOnlyAvailable}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 10, alignItems: 'center' }}>
              <label><input type="checkbox" disabled={shadeOnlyAvailable} checked={noShadeL0} onChange={(e) => onChangeNoShade(0, e.target.checked)} /> Ocultar sombreado L0</label>
              <label><input type="checkbox" disabled={shadeOnlyAvailable} checked={noShadeL1} onChange={(e) => onChangeNoShade(1, e.target.checked)} /> Ocultar sombreado L1</label>
              <label><input type="checkbox" disabled={shadeOnlyAvailable} checked={noShadeL2} onChange={(e) => onChangeNoShade(2, e.target.checked)} /> Ocultar sombreado L2</label>
              <label><input type="checkbox" disabled={shadeOnlyAvailable} checked={noShadeL3} onChange={(e) => onChangeNoShade(3, e.target.checked)} /> Ocultar sombreado L3</label>
            </div>
          </div>
        </div>
      )}

      {tab === 'size' && (
        <div role="tabpanel" id="panel-size" aria-labelledby="tab-size" className="tabs__panel">
          <div className="row">
            <label className="label">Tamaño bola (escala)</label>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                min={0.8}
                max={2.5}
                step={0.05}
                value={Number.isFinite(pieceScale) ? pieceScale : 1}
                onChange={(e) => onChangePieceScale(parseFloat(e.target.value))}
                style={{ width: 90 }}
                aria-label="Escala de la bola"
              />
              <span style={{ color: 'var(--muted)' }}>(1.0–2.5)</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'anim' && (
        <div role="tabpanel" id="panel-anim" aria-labelledby="tab-anim" className="tabs__panel">
          <div className="row">
            <h4 style={{ margin: '4px 0' }}>Velocidad de animaciones (ms)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 12px', alignItems: 'center' }}>
              <label className="label">Aparición pieza</label>
              <input
                type="number"
                min={50}
                max={4000}
                step={10}
                value={Number.isFinite(appearMs) ? appearMs : 280}
                onChange={(e) => onChangeAppearMs(parseInt(e.target.value, 10) || 0)}
                style={{ width: 100 }}
                aria-label="Duración aparición pieza (ms)"
              />
              <label className="label">Flash celda</label>
              <input
                type="number"
                min={50}
                max={5000}
                step={10}
                value={Number.isFinite(flashMs) ? flashMs : 900}
                onChange={(e) => onChangeFlashMs(parseInt(e.target.value, 10) || 0)}
                style={{ width: 100 }}
                aria-label="Duración flash celda (ms)"
              />
              <label className="label">Vuelo pieza</label>
              <input
                type="number"
                min={50}
                max={6000}
                step={10}
                value={Number.isFinite(flyMs) ? flyMs : 1500}
                onChange={(e) => onChangeFlyMs(parseInt(e.target.value, 10) || 0)}
                style={{ width: 100 }}
                aria-label="Duración vuelo pieza (ms)"
              />
              <label className="label">Pausa auto-colocación final</label>
              <input
                type="number"
                min={0}
                max={5000}
                step={10}
                value={Number.isFinite(autoFillDelayMs) ? autoFillDelayMs : 250}
                onChange={(e) => onChangeAutoFillDelayMs(parseInt(e.target.value, 10) || 0)}
                style={{ width: 100 }}
                aria-label="Pausa entre auto-colocaciones (ms)"
                title="Retraso entre pasos de autocolocación cuando un jugador se queda sin bolas"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
