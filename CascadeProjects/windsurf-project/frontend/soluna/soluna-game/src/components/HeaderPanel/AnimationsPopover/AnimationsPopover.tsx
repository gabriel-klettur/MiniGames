import React, { useMemo, useState } from 'react';
import type { RefObject } from 'react';
import type { Cfg } from '../../DevTools/UIUX/model/config';

export type AnimPreset = {
  id: string;
  name: string;
  description: string;
  overrides: Partial<Cfg>;
};

export interface AnimationsPopoverProps {
  anchorRect: DOMRect | null;
  popRef: RefObject<HTMLDivElement | null>;
  presets: AnimPreset[];
  selectedId: string | null;
  onApply: (preset: AnimPreset) => void;
  onClose: () => void;
}

const listStyle: React.CSSProperties = { display: 'grid', gap: 8 };
const itemStyle: React.CSSProperties = { display: 'grid', gap: 2, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.35)' };

export const AnimationsPopover: React.FC<AnimationsPopoverProps> = ({
  anchorRect,
  popRef,
  presets,
  selectedId,
  onApply,
  onClose,
}) => {
  const [active, setActive] = useState<string | null>(selectedId);
  const byId = useMemo(() => new Map(presets.map(p => [p.id, p])), [presets]);

  // No reseteamos active cuando cambia selectedId desde el padre para permitir 'Default'

  // Estado de Debug (toggle): desactivado por defecto. Persistimos en localStorage para que sobreviva al cierre.
  const [debug, setDebug] = useState<boolean>(() => {
    try {
      const raw = window.localStorage.getItem('soluna:ui:anim-debug');
      return raw === '1';
    } catch { return false; }
  });
  const toggleDebug = () => {
    setDebug((d) => {
      const next = !d;
      try { window.localStorage.setItem('soluna:ui:anim-debug', next ? '1' : '0'); } catch {}
      return next;
    });
  };

  const apply = () => {
    if (!active) return;
    const p = byId.get(active);
    if (!p) return;
    onApply(p);
  };

  return (
    <div
      id="anim-popover"
      ref={popRef}
      className={["popover", "vsai-popover", "anim-popover"].join(' ')}
      role="dialog"
      aria-label="Presets de aterrizaje y apilado"
      style={{
        position: 'fixed',
        top: anchorRect ? anchorRect.bottom + 8 : 8,
        left: 8,
        right: 8,
        maxWidth: 560,
        margin: '0 auto',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Animaciones</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn"
            type="button"
            onClick={toggleDebug}
            aria-pressed={debug}
            aria-label={debug ? 'Desactivar Debug' : 'Activar Debug'}
            title="Debug"
            style={{
              background: debug ? '#2e7d32' : '#a33',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            Debug
          </button>
          <button
            className="btn"
            onClick={() => {
              const targetId = 'current-config';
              setActive(targetId);
              const p = byId.get(targetId);
              if (p) onApply(p);
            }}
            aria-label="Restaurar Configuración actual"
            title="Default"
          >
            Default
          </button>
          <button
            className="btn"
            onClick={() => {
              if (!active || active === selectedId || active === 'current-config') { onClose(); return; }
              const p = byId.get(active);
              if (!p) { onClose(); return; }
              const ok = window.confirm('¿Aplicar la animación seleccionada antes de cerrar?');
              if (ok) { onApply(p); } else { onClose(); }
            }}
            aria-label="Cerrar"
            title="Cerrar"
          >
            Cerrar
          </button>
        </div>
      </header>

      <div style={listStyle}>
        {presets.map((p) => (
          <label key={p.id} style={itemStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="radio"
                name="anim-preset"
                value={p.id}
                checked={active === p.id}
                onChange={() => setActive(p.id)}
                aria-label={`Seleccionar preset ${p.name}`}
              />
              <strong>{p.name}</strong>
            </div>
            <small style={{ opacity: 0.9 }}>{p.description}</small>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', opacity: 0.8 }}>
              {typeof p.overrides.stackStep === 'number' && (<code>stackStep={p.overrides.stackStep}</code>)}
              {typeof p.overrides.flightCurveEnabled === 'boolean' && (<code>curve={String(p.overrides.flightCurveEnabled)}</code>)}
              {typeof p.overrides.flightCurveBend === 'number' && (<code>bend={p.overrides.flightCurveBend}</code>)}
              {typeof p.overrides.flightDestOffsetX === 'number' && (<code>dx={p.overrides.flightDestOffsetX}</code>)}
              {typeof p.overrides.flightDestOffsetY === 'number' && (<code>dy={p.overrides.flightDestOffsetY}</code>)}
              {typeof p.overrides.flightLingerMs === 'number' && (<code>linger={p.overrides.flightLingerMs}ms</code>)}
            </div>
          </label>
        ))}
      </div>

      <footer style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={apply} aria-label="Aplicar preset" title="Aplicar">Aplicar</button>
      </footer>
    </div>
  );
};

export default AnimationsPopover;
