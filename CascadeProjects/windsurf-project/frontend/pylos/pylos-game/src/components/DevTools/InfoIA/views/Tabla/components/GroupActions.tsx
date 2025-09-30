import React from 'react';
import type { InfoIAGameRecord } from '../../../../../../utils/infoiaDb';
import { useCopyJSON, type ToastFn } from '../hooks/useCopyJSON';

type Props = {
  depthL: number;
  depthD: number;
  stats: any; // keeping loose to avoid tight coupling with aggregates type
  records: InfoIAGameRecord[];
  allowDelete?: boolean;
  onDelete?: (id: string) => void;
  onToast?: ToastFn;
};

export default function GroupActions({ depthL, depthD, stats, records, allowDelete = true, onDelete, onToast }: Props) {
  const copyJSON = useCopyJSON(onToast);

  const payload = React.useMemo(() => ({ depthL, depthD, stats, count: records.length, records }), [depthL, depthD, stats, records]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyJSON(payload);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pylos-infoia-group-dL${depthL}-dD${depthD}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteGroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    const ok = window.confirm(`¿Eliminar ${records.length} partidas del grupo dL=${depthL}, dD=${depthD}? Esta acción no se puede deshacer.`);
    if (!ok) return;
    for (const rec of records) onDelete(rec.id);
  };

  return (
    <>
      <button className="chip-btn" onClick={handleCopy} title="Copiar JSON del grupo al portapapeles">Copiar</button>
      <button className="chip-btn" onClick={handleDownload} title="Descargar JSON del grupo">Descargar</button>
      {allowDelete && (
        <button className="chip-btn btn-danger" onClick={handleDeleteGroup} title="Eliminar todas las partidas del grupo">Eliminar</button>
      )}
    </>
  );
}
