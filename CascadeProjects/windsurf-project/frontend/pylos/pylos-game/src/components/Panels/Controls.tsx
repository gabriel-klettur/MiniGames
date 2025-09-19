import React from 'react';

export interface ControlsProps {
  expertMode: boolean;
  showInfo: boolean;
  showHoles: boolean;
  showIndices: boolean;
  showConfig: boolean;
  onReset: () => void;
  onToggleMode: () => void;
  onToggleInfo: () => void;
  onToggleHoles: () => void;
  onToggleIndices: () => void;
  onToggleConfig: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  expertMode,
  showInfo,
  showHoles,
  showIndices,
  showConfig,
  onReset,
  onToggleMode,
  onToggleInfo,
  onToggleHoles,
  onToggleIndices,
  onToggleConfig,
}) => {
  return (
    <div className="controls">
      <button onClick={onReset}>Reset</button>
      <button onClick={onToggleMode}>
        Modo: {expertMode ? 'Experto (con retirada por cuadrados/líneas)' : 'Niño (sin retirada)'}
      </button>
      <button onClick={onToggleInfo}>{showInfo ? 'Ocultar info' : 'Mostrar info'}</button>
      <button onClick={onToggleHoles}>{showHoles ? 'Ocultar huecos' : 'Mostrar huecos'}</button>
      <button onClick={onToggleIndices}>{showIndices ? 'Ocultar índices' : 'Mostrar índices'}</button>
      <button onClick={onToggleConfig}>{showConfig ? 'Cerrar configuración' : 'Configuración'}</button>
    </div>
  );
};

export default React.memo(Controls);
