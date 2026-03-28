export type ToastFn = (message: string, kind?: 'success' | 'error' | 'info') => void;

/**
 * Provides a robust JSON copy utility with fallbacks.
 * Keeps UI concerns outside by using an optional onToast.
 */
export function useCopyJSON(onToast?: ToastFn) {
  const copyJSON = (data: unknown) => {
    try {
      const text = JSON.stringify(data, null, 2);
      const done = () => onToast?.('Copiado al portapapeles', 'success');

      // Prefer navigator.clipboard when available
      if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
        (navigator as any).clipboard.writeText(text).then(done).catch(() => {
          // Fallback: temporary textarea
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          done();
        });
        return;
      }

      // Legacy fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    } catch (e) {
      console.error('copyJSON failed', e);
      onToast?.('No se pudo copiar al portapapeles', 'error');
    }
  };

  return copyJSON;
}
