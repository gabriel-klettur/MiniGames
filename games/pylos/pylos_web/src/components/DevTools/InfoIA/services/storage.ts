import { dbGetAll, dbSave, dbDelete, dbClear } from '../../../../utils/infoiaDb';
import type { InfoIAGameRecord } from '../../../../utils/infoiaDb';

export async function getAllRecords(): Promise<InfoIAGameRecord[]> {
  const all = await dbGetAll();
  return all.sort((a: InfoIAGameRecord, b: InfoIAGameRecord) => b.createdAt - a.createdAt);
}

export async function saveRecord(rec: InfoIAGameRecord): Promise<void> {
  await dbSave(rec);
}

export async function deleteRecord(id: string): Promise<void> {
  await dbDelete(id);
}

export async function clearAllRecords(): Promise<void> {
  await dbClear();
}
