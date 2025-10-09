import React, { useRef } from 'react';
import Button from '../../../ui/Button';

interface HeaderActionsProps {
  running: boolean;
  onStart: () => void;
  onStop: () => void;
  onDefaults: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onExportCSVDetails: () => void;
  onImportFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAll: () => void;
}

export default function HeaderActions(props: HeaderActionsProps) {
  const { running, onStart, onStop, onDefaults, onExportJSON, onExportCSV, onExportCSVDetails, onImportFiles, onClearAll } = props;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="infoia__actions flex items-center flex-wrap gap-2">
      {!running ? (
        <Button size="sm" variant="primary" onClick={onStart} title="Iniciar simulación" aria-label="Iniciar simulación">
          <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
            <path d="M8 5v14l11-7-11-7Z" fill="currentColor"/>
          </svg>
          Start
        </Button>
      ) : (
        <Button size="sm" variant="danger" onClick={onStop} title="Detener simulación" aria-label="Detener simulación">
          <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
            <path d="M6 6h12v12H6z" fill="currentColor"/>
          </svg>
          Stop
        </Button>
      )}
      <Button size="sm" variant="neutral" onClick={onDefaults} title="Restaurar valores por defecto">
        <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
          <path d="M4 4v6h6M20 20a8 8 0 1 1-5.657-13.657L16 8" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
        Defaults
      </Button>
      <Button size="sm" variant="neutral" onClick={onExportJSON} title="Exportar resultados JSON">
        <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
          <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
        Export JSON
      </Button>
      <Button size="sm" variant="neutral" onClick={onExportCSV} title="Exportar CSV básico">
        <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
          <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M4 9h16M9 4v16" stroke="currentColor" strokeWidth="2"/>
        </svg>
        Export CSV
      </Button>
      <Button size="sm" variant="neutral" onClick={onExportCSVDetails} title="Exportar CSV con detalles">
        <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
          <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M4 9h16M9 4v16M13 13h5" stroke="currentColor" strokeWidth="2"/>
        </svg>
        Export CSV+
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        multiple
        onChange={onImportFiles}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />
      <Button
        size="sm"
        variant="neutral"
        onClick={() => { try { fileInputRef.current?.click(); } catch {} }}
        title="Importar datasets JSON para comparar"
        aria-label="Importar archivos JSON"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
          <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
        Importar
      </Button>
      <Button size="sm" variant="outline" onClick={onClearAll} title="Borrar resultados locales">
        <svg width="12" height="12" viewBox="0 0 24 24" className="mr-1" aria-hidden>
          <path d="M6 7h12M9 7v10m6-10v10M10 4h4l1 2H9l1-2Z" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
        Limpiar
      </Button>
    </div>
  );
}
