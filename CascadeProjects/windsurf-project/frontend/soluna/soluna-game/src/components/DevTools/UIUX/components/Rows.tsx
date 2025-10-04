import React from 'react';

export function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '4px 0' }} />
      <div style={{ fontWeight: 600 }}>{title}</div>
      {children}
    </>
  );
}

export function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

export function SliderRow({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} />
    </label>
  );
}
