export function saveJson(filenameBase: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.href = URL.createObjectURL(blob);
  a.download = `${filenameBase}-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function loadJsonFromFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '');
        resolve(JSON.parse(text));
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}
