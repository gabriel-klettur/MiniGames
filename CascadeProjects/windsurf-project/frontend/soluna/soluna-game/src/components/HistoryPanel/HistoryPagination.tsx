import React from 'react';

export interface HistoryPaginationProps {
  total: number;
  pageSize: number;
  page: number; // 1-based
  onChange: (page: number) => void;
}

/**
 * HistoryPagination — minimal pager for the history list.
 * Matches Pylos aesthetics (compact, dark, Prev/Next + "Página X de Y").
 */
const HistoryPagination: React.FC<HistoryPaginationProps> = ({ total, pageSize, page, onChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const btnStyle = (enabled: boolean): React.CSSProperties => ({
    width: 28,
    height: 28,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    border: '1px solid #555',
    background: enabled ? '#222' : '#333',
    color: '#fff',
    cursor: enabled ? 'pointer' : 'not-allowed',
    padding: 0,
  });

  const iconStyle: React.CSSProperties = { display: 'block' };

  return (
    <nav aria-label="Paginación historial" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
      <button
        type="button"
        onClick={() => canPrev && onChange(page - 1)}
        disabled={!canPrev}
        style={btnStyle(canPrev)}
        aria-label="Página anterior"
        title="Anterior"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={iconStyle} aria-hidden="true">
          <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <span style={{ fontSize: 12, opacity: 0.9, background: '#1a1a1a', padding: '2px 8px', borderRadius: 6, border: '1px solid #333' }}>
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        onClick={() => canNext && onChange(page + 1)}
        disabled={!canNext}
        style={btnStyle(canNext)}
        aria-label="Página siguiente"
        title="Siguiente"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={iconStyle} aria-hidden="true">
          <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </nav>
  );
};

export default HistoryPagination;
