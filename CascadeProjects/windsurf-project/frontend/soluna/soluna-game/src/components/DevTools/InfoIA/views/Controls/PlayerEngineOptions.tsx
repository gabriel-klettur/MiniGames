import type { FC, ChangeEvent } from 'react';

export interface PlayerEngineOptionsProps {
  disabled?: boolean;
  // Core engine flags
  enableTT?: boolean; onToggleEnableTT?: () => void;
  failSoft?: boolean; onToggleFailSoft?: () => void;
  preferHashMove?: boolean; onTogglePreferHashMove?: () => void;
  enableKillers?: boolean; onToggleEnableKillers?: () => void;
  enableHistory?: boolean; onToggleEnableHistory?: () => void;
  enablePVS?: boolean; onToggleEnablePVS?: () => void;
  enableAspiration?: boolean; onToggleEnableAspiration?: () => void;
  aspirationDelta?: number; onChangeAspirationDelta?: (n: number) => void;
  // Quiescence
  enableQuiescence?: boolean; onToggleEnableQuiescence?: () => void;
  quiescenceDepth?: number; onChangeQuiescenceDepth?: (n: number) => void;
  quiescenceHighTowerThreshold?: number; onChangeQuiescenceHighTowerThreshold?: (n: number) => void;
  // LMR
  enableLMR?: boolean; onToggleEnableLMR?: () => void;
  lmrMinDepth?: number; onChangeLmrMinDepth?: (n: number) => void;
  lmrLateMoveIdx?: number; onChangeLmrLateMoveIdx?: (n: number) => void;
  lmrReduction?: number; onChangeLmrReduction?: (n: number) => void;
  // Futility
  enableFutility?: boolean; onToggleEnableFutility?: () => void;
  futilityMargin?: number; onChangeFutilityMargin?: (n: number) => void;
  // LMP
  enableLMP?: boolean; onToggleEnableLMP?: () => void;
  lmpDepthThreshold?: number; onChangeLmpDepthThreshold?: (n: number) => void;
  lmpLateMoveIdx?: number; onChangeLmpLateMoveIdx?: (n: number) => void;
  // Null-move
  enableNullMove?: boolean; onToggleEnableNullMove?: () => void;
  nullMoveReduction?: number; onChangeNullMoveReduction?: (n: number) => void;
  nullMoveMinDepth?: number; onChangeNullMoveMinDepth?: (n: number) => void;
}

const num = (e: ChangeEvent<HTMLInputElement>, min: number, def: number) => {
  const v = Number(e.target.value);
  if (Number.isFinite(v)) return Math.max(min, Math.floor(v));
  return def;
};

const PlayerEngineOptions: FC<PlayerEngineOptionsProps> = (p) => {
  const bool = (v: boolean | undefined, def = false) => !!(typeof v === 'boolean' ? v : def);
  const numOr = (v: number | undefined, def: number) => (typeof v === 'number' ? v : def);
  return (
    <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Grupo: Búsqueda base */}
      <div className="row" style={{ gap: 6, flexDirection: 'column', alignItems: 'flex-start' }}>
        <div className="section-title" style={{ fontSize: 12, opacity: 0.9 }}>Búsqueda base</div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          title={'TT — Tabla de Transposiciones: cachea evaluaciones por hash del estado.\nBeneficio: evita recomputar subárboles y prioriza “hash move”.\nEjemplo: dos líneas que llegan al mismo tablero reusan score; típicamente -30% a -45% nodos.'}>
          <input type="checkbox" checked={bool(p.enableTT)} disabled={!p.onToggleEnableTT} onChange={() => p.onToggleEnableTT?.()} />
          Tabla de Transposiciones (TT)
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          title={'Fail-soft — Devuelve el valor real del hijo en cortes α/β.\nBeneficio: mejora ventanas y ranking en iteraciones siguientes.\nEjemplo: si hijo=+37 supera β=+30, se guarda +37 (no +30).'}>
          <input type="checkbox" checked={bool(p.failSoft, true)} disabled={!p.onToggleFailSoft} onChange={() => p.onToggleFailSoft?.()} />
          Fail-soft αβ
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          title={'Hash move — Prioriza primero la jugada almacenada en TT.\nBeneficio: acelera PVS al provocar cortes con ventana nula.\nEjemplo: ordenar A+B primero reduce 10–25% nodos.'}>
          <input type="checkbox" checked={bool(p.preferHashMove, true)} disabled={!p.onTogglePreferHashMove} onChange={() => p.onTogglePreferHashMove?.()} />
          Priorizar "hash move"
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          title={'PVS — Principal Variation Search: primer hijo ventana completa, resto [α,α+1].\nBeneficio: mantiene exactitud reduciendo nodos.\nEjemplo: con buen ordering, los hijos no-principales fallan rápido.'}>
          <input type="checkbox" checked={bool(p.enablePVS)} disabled={!p.onToggleEnablePVS} onChange={() => p.onToggleEnablePVS?.()} />
          PVS (Principal Variation Search)
        </label>
      </div>

      {/* Grupo: Ventanas y Quiescence */}
      <div className="row" style={{ gap: 6, flexDirection: 'column', alignItems: 'flex-start' }}>
        <div className="section-title" style={{ fontSize: 12, opacity: 0.9 }}>Ventanas y Quiescence</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title={'Aspiration Windows — Busca alrededor del score previo y reintenta si cae fuera.\nBeneficio: ventanas más estrechas → más podas.\nEjemplo: score previo +40 y Δ=25 → ventana [+15,+65].'}>
            <input type="checkbox" checked={bool(p.enableAspiration)} disabled={!p.onToggleEnableAspiration} onChange={() => p.onToggleEnableAspiration?.()} />
            Aspiration Windows
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Δ
            <input type="number" min={1} step={1} value={p.aspirationDelta}
              disabled={!p.onChangeAspirationDelta}
              onChange={(e) => p.onChangeAspirationDelta?.(num(e, 1, numOr(p.aspirationDelta, 35)))}
              title={'Δ (margen de aspiración). Menor Δ acelera si el score real cae dentro; demasiado pequeño puede forzar re-búsquedas.'}
              style={{ width: 72 }} />
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title={'Quiescence — Extiende la búsqueda en hojas tácticas.\nBeneficio: mitiga el efecto horizonte.\nEjemplo: si una fusión de torre alta decide la ronda, profundiza q plies más.'}>
            <input type="checkbox" checked={bool(p.enableQuiescence, true)} disabled={!p.onToggleEnableQuiescence} onChange={() => p.onToggleEnableQuiescence?.()} />
            Quiescence (tácticas)
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            profundidad
            <input type="number" min={1} step={1} value={p.quiescenceDepth}
              disabled={!p.onChangeQuiescenceDepth}
              onChange={(e) => p.onChangeQuiescenceDepth?.(num(e, 1, numOr(p.quiescenceDepth, 3)))}
              title={'qDepth — Plies adicionales en quiescence (sólo tácticas). Regla guía: 2–3. Mayor qDepth = más precisión y más nodos.'}
              style={{ width: 72 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            torre≥
            <input type="number" min={1} step={1} value={p.quiescenceHighTowerThreshold}
              disabled={!p.onChangeQuiescenceHighTowerThreshold}
              onChange={(e) => p.onChangeQuiescenceHighTowerThreshold?.(num(e, 1, numOr(p.quiescenceHighTowerThreshold, 5)))}
              title={'Umbral de “torre alta” para considerar una fusión como táctica y extender (quiescence). Ejemplo: ≥5.'}
              style={{ width: 72 }} />
          </label>
        </div>
      </div>

      {/* Grupo: Reducciones y Pruning */}
      <div className="row" style={{ gap: 6, flexDirection: 'column', alignItems: 'flex-start' }}>
        <div className="section-title" style={{ fontSize: 12, opacity: 0.9 }}>Reducciones y pruning</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title={'LMR — Late Move Reductions: reduce profundidad en hijos tardíos no tácticos.\nBeneficio: acelera y prioriza PV.\nEjemplo: del 5.º hijo en adelante, -1 ply si no es táctico.'}>
            <input type="checkbox" checked={bool(p.enableLMR, true)} disabled={!p.onToggleEnableLMR} onChange={() => p.onToggleEnableLMR?.()} />
            LMR
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            minDepth
            <input type="number" min={0} step={1} value={p.lmrMinDepth}
              disabled={!p.onChangeLmrMinDepth}
              onChange={(e) => p.onChangeLmrMinDepth?.(num(e, 0, numOr(p.lmrMinDepth, 3)))}
              title={'Aplicar LMR a partir de esta profundidad (plies). Recomendado: ≥3.'}
              style={{ width: 72 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            lateIdx
            <input type="number" min={0} step={1} value={p.lmrLateMoveIdx}
              disabled={!p.onChangeLmrLateMoveIdx}
              onChange={(e) => p.onChangeLmrLateMoveIdx?.(num(e, 0, numOr(p.lmrLateMoveIdx, 4)))}
              title={'A partir de qué índice (0-based) considerar “movimiento tardío” para LMR. Ej.: 4 → del 5.º en adelante.'}
              style={{ width: 72 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            reduction
            <input type="number" min={0} step={1} value={p.lmrReduction}
              disabled={!p.onChangeLmrReduction}
              onChange={(e) => p.onChangeLmrReduction?.(num(e, 0, numOr(p.lmrReduction, 1)))}
              title={'Plies a reducir para LMR (típicamente 1). Mayor reducción = más rápido pero menos exacto.'}
              style={{ width: 72 }} />
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title={'Futility pruning — En baja profundidad, poda si score estático+margin no supera α.\nBeneficio: elimina ramas sin potencial.\nEjemplo: margin=50 en d=1 poda jugadas incapaces de mejorar α.'}>
            <input type="checkbox" checked={bool(p.enableFutility, true)} disabled={!p.onToggleEnableFutility} onChange={() => p.onToggleEnableFutility?.()} />
            Futility pruning
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            margin
            <input type="number" min={0} step={1} value={p.futilityMargin}
              disabled={!p.onChangeFutilityMargin}
              onChange={(e) => p.onChangeFutilityMargin?.(num(e, 0, numOr(p.futilityMargin, 50)))}
              title={'Margen de futilidad. Más alto = poda más agresiva pero riesgo de perder táctica marginal.'}
              style={{ width: 72 }} />
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title={'LMP — Late Move Pruning: poda hijos muy tardíos a poca profundidad.\nBeneficio: acelera al descartar opciones de baja probabilidad.\nEjemplo: depth≤2 e índice≥6 → poda (si no tácticos/killers).'}>
            <input type="checkbox" checked={bool(p.enableLMP, true)} disabled={!p.onToggleEnableLMP} onChange={() => p.onToggleEnableLMP?.()} />
            LMP
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            depth≤
            <input type="number" min={0} step={1} value={p.lmpDepthThreshold}
              disabled={!p.onChangeLmpDepthThreshold}
              onChange={(e) => p.onChangeLmpDepthThreshold?.(num(e, 0, numOr(p.lmpDepthThreshold, 2)))}
              title={'Máxima profundidad a la que aplicar LMP. Típico ≤2.'}
              style={{ width: 72 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            lateIdx
            <input type="number" min={0} step={1} value={p.lmpLateMoveIdx}
              disabled={!p.onChangeLmpLateMoveIdx}
              onChange={(e) => p.onChangeLmpLateMoveIdx?.(num(e, 0, numOr(p.lmpLateMoveIdx, 6)))}
              title={'A partir de qué índice (0-based) considerar tardío para LMP. Ej.: 6 → desde el 7.º se considera tardío.'}
              style={{ width: 72 }} />
          </label>
        </div>
      </div>

      {/* Grupo: Null-move */}
      <div className="row" style={{ gap: 6, flexDirection: 'column', alignItems: 'flex-start' }}>
        <div className="section-title" style={{ fontSize: 12, opacity: 0.9 }}>Null-move</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title={'Null-move — Pase virtual para test de fail-high rápido.\nBeneficio: poda agresiva cuando el rival aún supera α.\nEjemplo: R=2 y minDepth=3: si tras pasar el rival supera α en d-2, se poda.'}>
            <input type="checkbox" checked={bool(p.enableNullMove, true)} disabled={!p.onToggleEnableNullMove} onChange={() => p.onToggleEnableNullMove?.()} />
            Null-move
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            reduction
            <input type="number" min={0} step={1} value={p.nullMoveReduction}
              disabled={!p.onChangeNullMoveReduction}
              onChange={(e) => p.onChangeNullMoveReduction?.(num(e, 0, numOr(p.nullMoveReduction, 2)))}
              title={'Reducción (plies) aplicada al hacer null-move. Típico: 2.'}
              style={{ width: 72 }} />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            minDepth
            <input type="number" min={0} step={1} value={p.nullMoveMinDepth}
              disabled={!p.onChangeNullMoveMinDepth}
              onChange={(e) => p.onChangeNullMoveMinDepth?.(num(e, 0, numOr(p.nullMoveMinDepth, 3)))}
              title={'Profundidad mínima para aplicar null-move. Recomendado: ≥3.'}
              style={{ width: 72 }} />
          </label>
        </div>
      </div>
      <div className="kpi kpi--muted">Estos parámetros se aplican solo a este jugador.</div>
    </div>
  );
};

export default PlayerEngineOptions;
