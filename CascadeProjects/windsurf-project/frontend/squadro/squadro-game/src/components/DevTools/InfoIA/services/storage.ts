import type { InfoIARecord } from '../types';
import { dbGetAll, dbSave, dbDelete, dbClear } from '../../../../utils/squadroInfoiaDb';

export async function getAllRecords(): Promise<InfoIARecord[]> {
  const all = await dbGetAll<InfoIARecord>();
  return all.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
}

export async function saveRecord(r: InfoIARecord): Promise<void> { await dbSave(r); }
export async function deleteRecord(id: string): Promise<void> { await dbDelete(id); }
export async function clearAllRecords(): Promise<void> { await dbClear(); }

const SUITE_KEY = 'squadro:regression:last';

export function loadLastSuite(): any | null {
  try {
    const raw = localStorage.getItem(SUITE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLastSuite(result: any): void {
  try {
    localStorage.setItem(SUITE_KEY, JSON.stringify(result));
  } catch {}
}
