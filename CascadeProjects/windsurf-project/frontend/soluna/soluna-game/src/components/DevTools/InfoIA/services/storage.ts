export type InfoIARecord = { id: string };

export async function getAllRecords(): Promise<InfoIARecord[]> { return []; }
export async function saveRecord(_r: InfoIARecord): Promise<void> { /* noop */ }
export async function deleteRecord(_id: string): Promise<void> { /* noop */ }
export async function clearAllRecords(): Promise<void> { /* noop */ }
