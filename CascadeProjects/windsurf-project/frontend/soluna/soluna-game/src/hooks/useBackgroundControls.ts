import { useEffect, useState } from 'react';

export interface UseBackgroundControls {
  bgHidden: boolean;
  woodHidden: boolean;
  fullBg: boolean;
  selectedBgUrl: string | null;
  applyBoardImage: (url: string | null) => void;
  toggleHideBoardBg: () => void;
  toggleHideWoodBoard: () => void;
  toggleFullBg: () => void;
}

/**
 * useBackgroundControls — gestiona atributos/variables CSS relacionados con el fondo del tablero.
 * Encapsula la lectura inicial del DOM y las funciones de aplicar/toggle para mantener el estado fuente en el DOM.
 */
export function useBackgroundControls(): UseBackgroundControls {
  const [bgHidden, setBgHidden] = useState<boolean>(false);
  const [woodHidden, setWoodHidden] = useState<boolean>(false);
  const [fullBg, setFullBg] = useState<boolean>(false);
  const [selectedBgUrl, setSelectedBgUrl] = useState<string | null>(null);

  // Inicializa desde el DOM al montar
  useEffect(() => {
    const root = document.documentElement;
    setBgHidden(root.hasAttribute('data-hide-board-bg'));
    setWoodHidden(root.hasAttribute('data-hide-wood-board'));
    setFullBg(root.hasAttribute('data-full-board-bg'));
    const cssVar = getComputedStyle(root).getPropertyValue('--board-bg-image').trim();
    if (cssVar && cssVar !== 'none') {
      setSelectedBgUrl(cssVar);
    }
  }, []);

  const applyBoardImage = (url: string | null) => {
    const root = document.documentElement;
    if (url) {
      root.style.setProperty('--board-bg-image', `url('${url}') center / cover no-repeat`);
      setSelectedBgUrl(url);
    } else {
      root.style.removeProperty('--board-bg-image');
      setSelectedBgUrl(null);
    }
  };

  const toggleHideBoardBg = () => {
    const root = document.documentElement;
    const next = !bgHidden;
    if (next) root.setAttribute('data-hide-board-bg', '1');
    else root.removeAttribute('data-hide-board-bg');
    setBgHidden(next);
  };

  const toggleHideWoodBoard = () => {
    const root = document.documentElement;
    const next = !woodHidden;
    if (next) root.setAttribute('data-hide-wood-board', '1');
    else root.removeAttribute('data-hide-wood-board');
    setWoodHidden(next);
  };

  const toggleFullBg = () => {
    const root = document.documentElement;
    const next = !fullBg;
    if (next) root.setAttribute('data-full-board-bg', '1');
    else root.removeAttribute('data-full-board-bg');
    setFullBg(next);
  };

  return {
    bgHidden,
    woodHidden,
    fullBg,
    selectedBgUrl,
    applyBoardImage,
    toggleHideBoardBg,
    toggleHideWoodBoard,
    toggleFullBg,
  };
}

export default useBackgroundControls;
