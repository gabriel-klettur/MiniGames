 

export interface DebugTabProps {
  debugHitTest: boolean;
  onToggleDebugHitTest: (v: boolean) => void;
  debugShowGrid: boolean;
  onToggleDebugShowGrid: (v: boolean) => void;
  debugShowOverlays: boolean;
  onToggleDebugShowOverlays: (v: boolean) => void;
  debugShowCellOutlines: boolean;
  onToggleDebugShowCellOutlines: (v: boolean) => void;
  debugShowDisabledCells: boolean;
  onToggleDebugShowDisabledCells: (v: boolean) => void;
  debugShowClickable: boolean;
  onToggleDebugShowClickable: (v: boolean) => void;
  // Sizes (px)
  dbgGridOutlineW: number;
  onChangeDbgGridOutlineW: (v: number) => void;
  dbgCellOutlineW: number;
  onChangeDbgCellOutlineW: (v: number) => void;
  dbgDisabledOutlineW: number;
  onChangeDbgDisabledOutlineW: (v: number) => void;
  dbgClickableOutlineW: number;
  onChangeDbgClickableOutlineW: (v: number) => void;
}

export default function DebugTab({
  debugHitTest,
  onToggleDebugHitTest,
  debugShowGrid,
  onToggleDebugShowGrid,
  debugShowOverlays,
  onToggleDebugShowOverlays,
  debugShowCellOutlines,
  onToggleDebugShowCellOutlines,
  debugShowDisabledCells,
  onToggleDebugShowDisabledCells,
  debugShowClickable,
  onToggleDebugShowClickable,
  dbgGridOutlineW,
  onChangeDbgGridOutlineW,
  dbgCellOutlineW,
  onChangeDbgCellOutlineW,
  dbgDisabledOutlineW,
  onChangeDbgDisabledOutlineW,
  dbgClickableOutlineW,
  onChangeDbgClickableOutlineW,
}: DebugTabProps) {
  return (
    <div role="tabpanel" id="panel-debug" aria-labelledby="tab-debug" className="tabs__panel">
      <div className="row">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={!!debugHitTest} onChange={(e) => onToggleDebugHitTest(e.target.checked)} />
          Mostrar áreas de impacto (hitboxes)
        </label>
      </div>
      <div className="row" style={{ opacity: debugHitTest ? 1 : 0.75 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 12px', alignItems: 'center' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={!!debugShowGrid} onChange={(e) => onToggleDebugShowGrid(e.target.checked)} />
            Rejilla niveles (grid)
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={!!debugShowOverlays} onChange={(e) => onToggleDebugShowOverlays(e.target.checked)} />
            Overlays de niveles
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={!!debugShowCellOutlines} onChange={(e) => onToggleDebugShowCellOutlines(e.target.checked)} />
            Contornos de celdas
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={!!debugShowDisabledCells} onChange={(e) => onToggleDebugShowDisabledCells(e.target.checked)} />
            Celdas deshabilitadas
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={!!debugShowClickable} onChange={(e) => onToggleDebugShowClickable(e.target.checked)} />
            Áreas clicables (rosa)
          </label>
        </div>
      </div>
      <div className="row" style={{ opacity: debugHitTest ? 1 : 0.75, marginTop: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 12px', alignItems: 'center' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Ancho rejilla (px)
            <input type="number" min={0} max={12} step={1} value={dbgGridOutlineW}
                   onChange={(e) => onChangeDbgGridOutlineW(Number(e.target.value))} style={{ width: 72 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Ancho contorno celda (px)
            <input type="number" min={0} max={12} step={1} value={dbgCellOutlineW}
                   onChange={(e) => onChangeDbgCellOutlineW(Number(e.target.value))} style={{ width: 72 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Ancho contorno deshabilitada (px)
            <input type="number" min={0} max={12} step={1} value={dbgDisabledOutlineW}
                   onChange={(e) => onChangeDbgDisabledOutlineW(Number(e.target.value))} style={{ width: 72 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Ancho clicable (px)
            <input type="number" min={0} max={12} step={1} value={dbgClickableOutlineW}
                   onChange={(e) => onChangeDbgClickableOutlineW(Number(e.target.value))} style={{ width: 72 }} />
          </label>
        </div>
      </div>
    </div>
  );
}
