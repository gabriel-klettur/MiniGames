import React from 'react';
import type { InfoIAGameRecord } from '../../../../../../utils/infoiaDb';
import { useCopyJSON, type ToastFn } from '../hooks/useCopyJSON';

type Props = {
  record: InfoIAGameRecord;
  allowDelete?: boolean;
  onDelete?: (id: string) => void;
  onToast?: ToastFn;
};

export default function RecordActions({ record, allowDelete = true, onDelete, onToast }: Props) {
  const copyJSON = useCopyJSON(onToast);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyJSON(record);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pylos-infoia-${record.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(record.id);
  };

  return (
    <>
      <button className="chip-btn" onClick={handleCopy} title="Copiar JSON">Copiar</button>
      <button className="chip-btn" onClick={handleDownload} title="Descargar JSON">Descargar</button>
      {allowDelete && (
        <button className="chip-btn btn-danger" onClick={handleDelete} title="Eliminar">Eliminar</button>
      )}
    </>
  );
}
