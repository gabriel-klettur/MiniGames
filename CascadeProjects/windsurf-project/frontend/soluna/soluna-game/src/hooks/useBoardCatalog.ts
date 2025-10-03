import { useMemo } from 'react';

export interface BoardItem {
  path: string;
  url: string;
  name: string;
}

/**
 * useBoardCatalog — carga y ordena el catálogo de tableros (texturas/imagenes) desde assets/table.
 * Nota: la ruta del glob es relativa al archivo donde se importa este hook.
 */
export function useBoardCatalog(): BoardItem[] {
  const items = useMemo(() => {
    // Buscar imágenes comunes de tableros en assets/table
    const modules = import.meta.glob('../assets/table/*.{png,jpg,jpeg,webp,avif,gif}', { eager: true }) as Record<string, any>;
    const entries: BoardItem[] = Object.entries(modules)
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

export default useBoardCatalog;
