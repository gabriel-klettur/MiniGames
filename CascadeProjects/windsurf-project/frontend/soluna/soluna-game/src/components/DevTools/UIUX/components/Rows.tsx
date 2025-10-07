import React from 'react';

export function Section({ title, children, tooltip }: { title: string; children?: React.ReactNode; tooltip?: string }) {
  return (
    <>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '4px 0' }} />
      <div style={{ fontWeight: 600 }} title={tooltip}>{title}</div>
      {children}
    </>
  );
}

export function CheckboxRow({ label, checked, onChange, tooltip }: { label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; tooltip?: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }} title={tooltip}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

export function SliderRow({ label, value, min, max, step, onChange, tooltip }: { label: string; value: number; min: number; max: number; step: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; tooltip?: string }) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const toStep = (n: number) => {
    // Ajuste ligero a múltiplos de step respecto a min
    const k = Math.round((n - min) / step);
    const snapped = min + k * step;
    // Evitar problemas de coma flotante
    const fixed = Number(snapped.toFixed(6));
    return clamp(fixed);
  };
  const emit = (next: number) => {
    const ev = { target: { value: String(next), type: 'range' } } as unknown as React.ChangeEvent<HTMLInputElement>;
    onChange(ev);
  };
  const dec = () => emit(toStep(value - step));
  const inc = () => emit(toStep(value + step));
  const atMin = value <= min;
  const atMax = value >= max;
  return (
    <div style={{ display: 'grid', gap: 4 }} title={tooltip}>
      <span>{label}</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={dec}
          disabled={atMin}
          aria-label={`Decrementar (${step})`}
          title={`- ${step}`}
          style={{ minWidth: 28 }}
        >
          −
        </button>
        <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={inc}
          disabled={atMax}
          aria-label={`Incrementar (${step})`}
          title={`+ ${step}`}
          style={{ minWidth: 28 }}
        >
          +
        </button>
      </div>
    </div>
  );
}

