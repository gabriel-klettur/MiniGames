import { useEffect, useMemo, useState } from 'react';

type Cfg = {
  showBase: boolean;
  ovalScale: number; // 0.6..1
  iconScaleY: number; // 0.8..1.4
  stackStep: number; // px
  maxDiscs: number; // 0..12
  discBorderWidth: number; // px
  dropHighlight: boolean;
  freeMove: boolean;
  mergeThreshold: number; // 0.3..0.9
};

const LS_PREFIX = 'soluna:ui:';
const LOG_LS_KEY = 'soluna:log:merges';

function getPlayEllipse(): HTMLElement | null {
  return document.querySelector('.play-ellipse') as HTMLElement | null;
}

function readComputedCfg(): Cfg {
  const el = getPlayEllipse();
  const cs = el ? getComputedStyle(el) : ({} as CSSStyleDeclaration);
  const num = (v: string, def: number) => {
    const x = parseFloat((v || '').trim());
    return Number.isFinite(x) ? x : def;
  };
  return {
    showBase: num(cs.getPropertyValue('--show-base') || '1', 1) > 0,
    ovalScale: num(cs.getPropertyValue('--oval-scale') || '0.78', 0.78),
    iconScaleY: num(cs.getPropertyValue('--icon-scaleY') || '1', 1),
    stackStep: num(cs.getPropertyValue('--stack-step') || '18px', 18),
    maxDiscs: Math.max(0, Math.min(12, Math.round(num(cs.getPropertyValue('--max-discs') || '10', 10)))),
    discBorderWidth: num(cs.getPropertyValue('--disc-border-width') || '2px', 2),
    dropHighlight: num(cs.getPropertyValue('--drop-highlight') || '1', 1) > 0,
    freeMove: num(cs.getPropertyValue('--free-move') || '1', 1) > 0,
    mergeThreshold: num(cs.getPropertyValue('--merge-threshold-factor') || '0.6', 0.6),
  };
}

function applyCfg(cfg: Cfg) {
  const el = getPlayEllipse();
  if (!el) return;
  el.style.setProperty('--show-base', cfg.showBase ? '1' : '0');
  el.style.setProperty('--oval-scale', String(cfg.ovalScale));
  el.style.setProperty('--icon-scaleY', String(cfg.iconScaleY));
  el.style.setProperty('--stack-step', `${cfg.stackStep}px`);
  el.style.setProperty('--max-discs', String(cfg.maxDiscs));
  el.style.setProperty('--disc-border-width', `${cfg.discBorderWidth}px`);
  el.style.setProperty('--drop-highlight', cfg.dropHighlight ? '1' : '0');
  el.style.setProperty('--free-move', cfg.freeMove ? '1' : '0');
  el.style.setProperty('--merge-threshold-factor', String(cfg.mergeThreshold));
}

function loadFromLocalStorage(): Partial<Cfg> {
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + 'cfg');
    return raw ? (JSON.parse(raw) as Partial<Cfg>) : {};
  } catch {
    return {};
  }
}

function saveToLocalStorage(cfg: Cfg) {
  try {
    window.localStorage.setItem(LS_PREFIX + 'cfg', JSON.stringify(cfg));
  } catch {}
}

export default function UIUX() {
  const initial = useMemo(() => ({ ...readComputedCfg(), ...loadFromLocalStorage() }), []);
  const [cfg, setCfg] = useState<Cfg>(initial);
  const [logMerges, setLogMerges] = useState<boolean>(() => {
    try {
      const raw = window.localStorage.getItem(LOG_LS_KEY);
      return raw == null ? true : raw !== '0';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    applyCfg(cfg);
    saveToLocalStorage(cfg);
  }, [cfg]);

  // Sync merge logging preference to localStorage and optional global helper
  useEffect(() => {
    try { (window as any).solunaLogMerges?.(logMerges); } catch {}
    try { window.localStorage.setItem(LOG_LS_KEY, logMerges ? '1' : '0'); } catch {}
  }, [logMerges]);

  const onNum = (k: keyof Cfg) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : parseFloat(e.target.value);
    setCfg((c) => ({ ...c, [k]: v } as Cfg));
  };

  const reset = () => {
    const defaults = readComputedCfg(); // reads stylesheet defaults
    setCfg(defaults);
    // remove inline overrides
    const el = getPlayEllipse();
    if (el) {
      el.style.removeProperty('--show-base');
      el.style.removeProperty('--oval-scale');
      el.style.removeProperty('--icon-scaleY');
      el.style.removeProperty('--stack-step');
      el.style.removeProperty('--max-discs');
      el.style.removeProperty('--disc-border-width');
      el.style.removeProperty('--drop-highlight');
      el.style.removeProperty('--free-move');
      el.style.removeProperty('--merge-threshold-factor');
    }
    try { window.localStorage.removeItem(LS_PREFIX + 'cfg'); } catch {}
  };

  return (
    <section style={{ display: 'grid', gap: 8 }}>
      <div style={{ fontWeight: 600 }}>UI/UX de fichas</div>
      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={cfg.showBase} onChange={onNum('showBase')} /> Mostrar base cilíndrica
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Ovalado (alto): {cfg.ovalScale.toFixed(2)}</span>
          <input type="range" min={0.6} max={1} step={0.01} value={cfg.ovalScale} onChange={onNum('ovalScale')} />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Compensación vertical del icono: {cfg.iconScaleY.toFixed(2)}x</span>
          <input type="range" min={0.8} max={1.4} step={0.01} value={cfg.iconScaleY} onChange={onNum('iconScaleY')} />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Separación entre discos: {Math.round(cfg.stackStep)}px</span>
          <input type="range" min={6} max={30} step={1} value={cfg.stackStep} onChange={onNum('stackStep')} />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Máx. discos visibles: {cfg.maxDiscs}</span>
          <input type="range" min={0} max={12} step={1} value={cfg.maxDiscs} onChange={onNum('maxDiscs')} />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Ancho de borde de cada disco: {cfg.discBorderWidth}px</span>
          <input type="range" min={0} max={4} step={1} value={cfg.discBorderWidth} onChange={onNum('discBorderWidth')} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={cfg.dropHighlight} onChange={onNum('dropHighlight')} />
          Resaltar destino con borde amarillo al arrastrar
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={cfg.freeMove} onChange={onNum('freeMove')} />
          Permitir mover libremente si no hay fusión
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={logMerges} onChange={(e) => setLogMerges(e.target.checked)} />
          Registrar fusiones en consola
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Umbral de colisión para apilar: {cfg.mergeThreshold.toFixed(2)}× diámetro</span>
          <input type="range" min={0.3} max={0.9} step={0.01} value={cfg.mergeThreshold} onChange={onNum('mergeThreshold')} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={reset}>Restablecer</button>
      </div>
    </section>
  );
}

