import React from 'react';

const RecordActions: React.FC<{ onView?: () => void; onCopy?: () => void; onDownload?: () => void; onDelete?: () => void }>
= ({ onView = () => {}, onCopy = () => {}, onDownload = () => {}, onDelete = () => {} }) => (
  <div className="row" style={{ gap: 6 }}>
    <button className="btn btn-secondary btn-sm" onClick={onView}>Ver</button>
    <button className="btn btn-secondary btn-sm" onClick={onCopy}>Copiar</button>
    <button className="btn btn-secondary btn-sm" onClick={onDownload}>Descargar</button>
    <button className="btn btn-danger btn-sm" onClick={onDelete}>Borrar</button>
  </div>
);

export default RecordActions;
