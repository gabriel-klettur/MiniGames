import { useMemo } from 'react';

export interface BgItem {
  path: string;
  url: string;
  name: string;
}

/**
 * useBackgroundCatalog — carga y ordena el catálogo de fondos desde assets.
 * Nota: la ruta del glob es relativa al archivo donde se importa este hook.
 * Si lo usas desde componentes en `src/components/HeaderPanel/`, la ruta a assets es `../../assets/...`.
 */
export function useBackgroundCatalog(): BgItem[] {
  const items = useMemo(() => {
    // Importante: mantener la ruta relativa correcta desde los consumidores típicos (componentes bajo HeaderPanel)
    const modules = import.meta.glob('../assets/backgrounds/*.{png,jpg,jpeg,webp,avif,gif}', { eager: true }) as Record<string, any>;
    const entries: BgItem[] = Object.entries(modules)
      .map(([path, mod]) => ({
        path,
        url: (mod as any).default as string,
        name: path.split('/').pop() || path,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return entries;
  }, []);

  return items;
}

export default useBackgroundCatalog;
