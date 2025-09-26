export function fmtDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Build timestamp for filenames as: day_month_year__hora_minuto_segundo
 */
export function buildExportTimestampName(date: Date = new Date()): string {
  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  const second = pad2(date.getSeconds());
  return `${day}_${month}_${year}__${hour}_${minute}_${second}`;
}
