import type { InfoIARecord } from '../types';
import { dbGetAll, dbSave, dbDelete, dbClear } from '../../../../utils/squadroInfoiaDb';

export async function getAllRecords(): Promise<InfoIARecord[]> {
  const all = await dbGetAll<InfoIARecord>();
  return all.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
}

export async function saveRecord(r: InfoIARecord): Promise<void> { await dbSave(r); }
export async function deleteRecord(id: string): Promise<void> { await dbDelete(id); }
export async function clearAllRecords(): Promise<void> { await dbClear(); }
