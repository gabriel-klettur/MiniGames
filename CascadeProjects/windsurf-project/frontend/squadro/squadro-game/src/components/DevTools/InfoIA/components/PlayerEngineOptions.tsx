import React, { useEffect, useState } from 'react';
import ToggleSwitch from '../../../ui/ToggleSwitch';

interface PlayerEngineOptionsProps {
  disabled?: boolean;
  enableTT?: boolean; onToggleEnableTT?: () => void;
  enableKillers?: boolean; onToggleEnableKillers?: () => void;
  enableHistory?: boolean; onToggleEnableHistory?: () => void;
  enablePVS?: boolean; onToggleEnablePVS?: () => void;
  enableLMR?: boolean; onToggleEnableLMR?: () => void;
  preferHashMove?: boolean; onTogglePreferHashMove?: () => void;
  lmrMinDepth?: number; onChangeLmrMinDepth?: (n: number) => void;
  lmrLateMoveIdx?: number; onChangeLmrLateMoveIdx?: (n: number) => void;
  lmrReduction?: number; onChangeLmrReduction?: (n: number) => void;
  // Ordering jitter
  orderingJitterEps?: number; onChangeOrderingJitterEps?: (n: number) => void;
  // Quiescence
  enableQuiescence?: boolean; onToggleEnableQuiescence?: () => void;
  quiescenceMaxPlies?: number; onChangeQuiescenceMaxPlies?: (n: number) => void;
  // Tablebase fast-path
  enableTablebase?: boolean; onToggleEnableTablebase?: () => void;
  // DF-PN
  enableDFPN?: boolean; onToggleEnableDFPN?: () => void;
  dfpnMaxActive?: number; onChangeDfpnMaxActive?: (n: number) => void;
  // Optional heuristic weights
  w_race?: number; onChangeWRace?: (n: number) => void;
  w_clash?: number; onChangeWClash?: (n: number) => void;
  w_sprint?: number; onChangeWSprint?: (n: number) => void;
  w_block?: number; onChangeWBlock?: (n: number) => void;
  done_bonus?: number; onChangeDoneBonus?: (n: number) => void;
  sprint_threshold?: number; onChangeSprintThreshold?: (n: number) => void;
  tempo?: number; onChangeTempo?: (n: number) => void;
}

const labelCls = 'text-xs text-neutral-300';
const inputCls = 'w-16 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100';

const JitterInput: React.FC<{ value?: number; disabled?: boolean; onChange?: (n: number) => void }> = ({ value, disabled, onChange }) => {
  const [val, setVal] = useState<string>(String(value ?? 0));
  useEffect(() => { setVal(String(value ?? 0)); }, [value]);
  const commit = (v: string) => {
    const raw = (v || '').replace(',', '.');
    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return;
    const num = Number(raw);
    if (Number.isFinite(num)) onChange?.(Math.max(0, num));
  };
  const parse = (): number => {
    const raw = (val || '').replace(',', '.');
    const num = Number(raw);
    return Number.isFinite(num) ? Math.max(0, num) : Math.max(0, Number(value ?? 0));
  };
  const step = (delta: number) => {
    const cur = parse();
    const next = Math.max(0, Math.round((cur + delta) * 10) / 10);
    setVal(String(next));
    onChange?.(next);
  };
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="text"
        inputMode="decimal"
        disabled={!!disabled}
        className={inputCls}
        value={val}
        onChange={(e) => { const v = e.target.value; setVal(v); commit(v); }}
        onBlur={() => { if (val === '' || val === '-' || val === '.' || val === '-.') setVal(String(value ?? 0)); }}
      />
      <button
        type="button"
        disabled={!!disabled}
        className="px-1 py-0.5 rounded border border-neutral-700 bg-neutral-800 text-neutral-200"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); step(-0.1); }}
      >−</button>
      <button
        type="button"
        disabled={!!disabled}
        className="px-1 py-0.5 rounded border border-neutral-700 bg-neutral-800 text-neutral-200"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); step(+0.1); }}
      >+</button>
    </span>
  );
};

const PlayerEngineOptions: React.FC<PlayerEngineOptionsProps> = (p) => {
  const dis = !!p.disabled;
  return (
    <div className="engine-opts mt-2 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-4">
        <div className="inline-flex items-center gap-2" title="Tabla de transposiciones (TT) — Cachea evaluaciones por hash de posición para reutilizarlas en nodos repetidos. Útil cuando distintas secuencias alcanzan el mismo tablero. Ejemplo: si A→B→C y D→E→C producen la misma posición C, TT puede devolver una cota (EXACT/LOWER/UPPER) en O(1) y evitar recalcular la rama completa.">
          <span className={labelCls}>TT</span>
          <ToggleSwitch checked={!!p.enableTT} onChange={() => p.onToggleEnableTT?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className={labelCls + ' inline-flex items-center gap-2'} title="orderingJitterEps — Ruido leve en la prioridad del orden para romper empates deterministas. 0 desactiva; valores típicos 0.5–2.0.">
          jitter
          <JitterInput value={p.orderingJitterEps} disabled={dis} onChange={(n) => p.onChangeOrderingJitterEps?.(n)} />
        </label>
      </div>
        <div className="inline-flex items-center gap-2" title="Principal Variation Search (PVS) — Busca el primer hijo con ventana completa para establecer α; los siguientes con ventana nula [-α-1, -α]. Si alguno mejora α, se re-busca a ventana completa. Ejemplo: si el primer hijo da 15, el segundo se prueba con [-16,-15]; si devuelve 17, se re-busca a [-∞,+∞].">
          <span className={labelCls}>PVS</span>
          <ToggleSwitch checked={!!p.enablePVS} onChange={() => p.onToggleEnablePVS?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className="inline-flex items-center gap-2" title="Killer moves — Jugadas que causaron cortes β en el mismo nivel (ply) se prueban antes en ramas hermanas. Ejemplo: si mover P3 en este ply produjo un cutoff en otra rama, aquí también lo intentaremos temprano para forzar nuevas podas.">
          <span className={labelCls}>Killers</span>
          <ToggleSwitch checked={!!p.enableKillers} onChange={() => p.onToggleEnableKillers?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className="inline-flex items-center gap-2" title="History heuristic — Puntúa jugadas por su éxito histórico elevando su prioridad en el orden. Ejemplo: si la jugada 'P2' frecuentemente mejora α, su puntuación de historia crece y se probará antes incluso sin ser táctica.">
          <span className={labelCls}>History</span>
          <ToggleSwitch checked={!!p.enableHistory} onChange={() => p.onToggleEnableHistory?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className="inline-flex items-center gap-2" title="Hash move (desde TT) — Si la TT sugiere una bestMove para la posición, se intenta primero para maximizar cortes β tempranos. Ejemplo: si TT recomienda mover 'P5', se eleva al frente del ordering para explorarla antes.">
          <span className={labelCls}>Hash move</span>
          <ToggleSwitch checked={!!p.preferHashMove} onChange={() => p.onTogglePreferHashMove?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className="inline-flex items-center gap-2" title="Quiescence — Extiende hojas tácticas (p. ej., capturas o swings) unos plies adicionales para estabilizar la evaluación y mitigar el 'horizon effect'. Recomendada ON con límite de qPlies moderado (3–5).">
          <span className={labelCls}>Quiescence</span>
          <ToggleSwitch checked={!!p.enableQuiescence} onChange={() => p.onToggleEnableQuiescence?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className="inline-flex items-center gap-2" title="Tablebase — Atajo O(1) para posiciones conocidas (win/loss/draw) con mejor jugada. Si hay hit, devuelve inmediatamente sin buscar.">
          <span className={labelCls}>Tablebase</span>
          <ToggleSwitch checked={!!p.enableTablebase} onChange={() => p.onToggleEnableTablebase?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className="inline-flex items-center gap-2" title="DF-PN — Activar búsqueda Proof-Number en finales pequeños. Útil para resolver subárboles con pocas piezas activas. Trigger por nº de piezas activas.">
          <span className={labelCls}>DF‑PN</span>
          <ToggleSwitch checked={!!p.enableDFPN} onChange={() => p.onToggleEnableDFPN?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
        <div className="inline-flex items-center gap-2" title="Late Move Reductions (LMR) — Reduce la profundidad efectiva de jugadas tardías (no tácticas) y re-busca a profundidad completa si superan α. Ejemplo: en movimientos con índice ≥ lateIdx, buscar a d-1 o d-2 con ventana nula; si el score supera α, repetir búsqueda completa.">
          <span className={labelCls}>LMR</span>
          <ToggleSwitch checked={!!p.enableLMR} onChange={() => p.onToggleEnableLMR?.()} onLabel="On" offLabel="Off" className={dis ? 'opacity-60 pointer-events-none' : ''} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className={labelCls + ' inline-flex items-center gap-2'} title="LMR:minDepth — Profundidad mínima a partir de la cual considerar reducciones. Ejemplo: con minDepth=3, sólo se aplican reducciones cuando depth≥3.">
          minDepth
          <input type="number" disabled={dis} className={inputCls} value={p.lmrMinDepth ?? 3} onChange={(e) => p.onChangeLmrMinDepth?.(Number(e.target.value))} />
        </label>
        <label className={labelCls + ' inline-flex items-center gap-2'} title="LMR:lateIdx — Considera 'jugada tardía' a partir de este índice en el orden. Ejemplo: lateIdx=3 ⇒ sólo desde el 4º movimiento (0,1,2 son tempranos).">
          lateIdx
          <input type="number" disabled={dis} className={inputCls} value={p.lmrLateMoveIdx ?? 3} onChange={(e) => p.onChangeLmrLateMoveIdx?.(Number(e.target.value))} />
        </label>
        <label className={labelCls + ' inline-flex items-center gap-2'} title="LMR:reduction — Plies a reducir para jugadas tardías no tácticas. Ejemplo: reduction=1 ⇒ profundidad efectiva d-1 (con salvaguarda de re-búsqueda si falla alto).">
          reduction
          <input type="number" disabled={dis} className={inputCls} value={p.lmrReduction ?? 1} onChange={(e) => p.onChangeLmrReduction?.(Number(e.target.value))} />
        </label>
        <label className={labelCls + ' inline-flex items-center gap-2'} title="Quiescence:qPlies — Límite de extensiones de búsqueda táctica en hojas. Controla coste. Ejemplo: 4 ⇒ hasta 4 plies adicionales sólo en posiciones ruidosas.">
          qPlies
          <input type="number" disabled={dis} className={inputCls} value={p.quiescenceMaxPlies ?? 4} onChange={(e) => p.onChangeQuiescenceMaxPlies?.(Number(e.target.value))} />
        </label>
        <label className={labelCls + ' inline-flex items-center gap-2'} title="DF‑PN:maxActive — Activa DF‑PN cuando las piezas activas (no retiradas) sean ≤ este valor. Conservador: 2 por defecto.">
          dfpnActive
          <input type="number" disabled={dis} className={inputCls} value={p.dfpnMaxActive ?? 2} onChange={(e) => p.onChangeDfpnMaxActive?.(Number(e.target.value))} />
        </label>
      </div>
      {(typeof p.w_race === 'number' || typeof p.w_clash === 'number' || typeof p.w_sprint === 'number' || typeof p.w_block === 'number') && (
        <div className="mt-2">
          <div className="text-xs font-semibold text-neutral-300 mb-1">Heurística (pesos)</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <label className={labelCls + ' inline-flex items-center gap-2'} title="w_race — Peso de carrera: recompensa tener menos turnos restantes. Ejemplo: si tú tienes 6 turnos totales y rival 8, un w_race alto favorece tu posición por ventaja de carrera.">
              w_race
              <input type="number" step={0.1} disabled={dis} className={inputCls} value={p.w_race ?? 1.0} onChange={(e) => p.onChangeWRace?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2'} title="w_clash — Choques inminentes: pondera el swing de turnos por saltos previstos en 1–2 plies. Ejemplo: si puedes enviar atrás 1 pieza rival en tu turno y no quedas expuesto al siguiente, el score aumenta.">
              w_clash
              <input type="number" step={0.1} disabled={dis} className={inputCls} value={p.w_clash ?? 0.8} onChange={(e) => p.onChangeWClash?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2'} title="w_sprint — Sprint final: incentiva cerrar cuando alguna pieza está a pocos turnos de retirarse. Ejemplo: si una pieza está a ≤ sprint_thr, se suma un bonus proporcional.">
              w_sprint
              <input type="number" step={0.1} disabled={dis} className={inputCls} value={p.w_sprint ?? 0.6} onChange={(e) => p.onChangeWSprint?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2'} title="w_block — Bloqueo útil vs. exposición: favorece tapar rutas rivales en ≤2 pasos y penaliza quedar al alcance inmediato del rival. Ejemplo: si tras tu mejor avance de prueba el rival te alcanza fácil, se resta puntuación.">
              w_block
              <input type="number" step={0.1} disabled={dis} className={inputCls} value={p.w_block ?? 0.3} onChange={(e) => p.onChangeWBlock?.(Number(e.target.value))} />
            </label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            <label className={labelCls + ' inline-flex items-center gap-2'} title="done_bonus — Bonus por piezas retiradas. Ejemplo: cada pieza en 'retirada' suma este bonus (además del progreso de carrera acumulado).">
              done_bonus
              <input type="number" step={0.5} disabled={dis} className={inputCls} value={p.done_bonus ?? 5.0} onChange={(e) => p.onChangeDoneBonus?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2'} title="sprint_thr — Umbral de turnos que activa el bonus de sprint. Ejemplo: con sprint_thr=2, piezas a 1–2 turnos de retirarse disparan el término de sprint (positivo para ti, negativo si es del rival).">
              sprint_thr
              <input type="number" step={1} disabled={dis} className={inputCls} value={p.sprint_threshold ?? 2} onChange={(e) => p.onChangeSprintThreshold?.(Number(e.target.value))} />
            </label>
            <label className={labelCls + ' inline-flex items-center gap-2'} title="tempo — Iniciativa: bonus suave cuando es tu turno para preferir líneas que conservan la presión. Ejemplo: en posiciones similares, la que te deja mover de nuevo con ventaja obtiene +tempo.">
              tempo
              <input type="number" step={1} disabled={dis} className={inputCls} value={p.tempo ?? 5} onChange={(e) => p.onChangeTempo?.(Number(e.target.value))} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
;

export default PlayerEngineOptions;
