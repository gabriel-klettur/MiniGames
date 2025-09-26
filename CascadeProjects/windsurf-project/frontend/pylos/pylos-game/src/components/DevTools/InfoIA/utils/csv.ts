export function toCsv(rows: Array<Record<string, string | number | null | undefined>>): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
}

/** Split a CSV line respecting quotes. Delimiter may be "," or ";". */
export function splitCsvLine(line: string, DELIM: string): string[] {
  const cols: string[] = [];
  let buf = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') { buf += '"'; i++; } else { q = !q; }
    } else if (c === DELIM && !q) {
      cols.push(buf); buf = '';
    } else {
      buf += c;
    }
  }
  cols.push(buf);
  // Unquote and trim
  for (let i = 0; i < cols.length; i++) {
    let v = cols[i];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/""/g, '"');
    cols[i] = v.trim();
  }
  return cols;
}
