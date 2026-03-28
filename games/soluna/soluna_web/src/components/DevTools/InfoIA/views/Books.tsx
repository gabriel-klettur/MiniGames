import React from 'react';

interface BooksProps {
  onExportBook?: () => void;
  onPublishBooks?: (minSupportPct: number) => void;
  onClearBooks?: () => void;
}

const Books: React.FC<BooksProps> = ({ onExportBook, onPublishBooks, onClearBooks }) => {
  return (
    <div className="books-view" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <button className="btn btn-secondary" onClick={onExportBook} disabled>Exportar Book</button>
      <button className="btn btn-secondary" onClick={() => onPublishBooks?.(50)} disabled>Publicar (dev)</button>
      <button className="btn btn-danger" onClick={onClearBooks} disabled>Vaciar</button>
      <span className="kpi kpi--muted">Books no soportado en Soluna (placeholder).</span>
    </div>
  );
};

export default Books;
