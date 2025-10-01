import { useRef } from 'react';

export interface UXPanelHeaderProps {
  title?: string;
  onRequestSave: () => void;
  onFileSelected: (file: File) => void;
}

export default function UXPanelHeader({ title = 'Opciones UI/UX', onRequestSave, onFileSelected }: UXPanelHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleLoadClick = () => fileInputRef.current?.click();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFileSelected(f);
    // allow re-selecting the same file
    e.target.value = '';
  };

  return (
    <div className="row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
      <div style={{ display: 'inline-flex', gap: 8 }}>
        <button className="devtools-btn" onClick={onRequestSave} title="Guardar configuración UI/UX en JSON" aria-label="Guardar configuración UI/UX en JSON">
          <svg className="devtools-btn__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 20h14v-2H5v2zm7-18L5.33 9h3.84v6h4.66V9h3.84L12 2z"/></svg>
          <span className="devtools-btn__label">Save JSON config</span>
        </button>
        <button className="devtools-btn" onClick={handleLoadClick} title="Cargar configuración UI/UX desde JSON" aria-label="Cargar configuración UI/UX desde JSON">
          <svg className="devtools-btn__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          <span className="devtools-btn__label">Load JSON config</span>
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleChange} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
