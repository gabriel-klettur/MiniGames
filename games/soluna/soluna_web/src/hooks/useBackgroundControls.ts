import { useEffect } from 'react';
import { useLocalStorageBoolean, useLocalStorageState } from './useLocalStorage';

export interface UseBackgroundControls {
  bgHidden: boolean;
  woodHidden: boolean;
  fullBg: boolean;
  selectedBgUrl: string | null;
  selectedBoardUrl: string | null;
  applyBoardImage: (url: string | null) => void;
  applyBoardTexture: (url: string | null) => void;
  toggleHideBoardBg: () => void;
  toggleHideWoodBoard: () => void;
  toggleFullBg: () => void;
}

/**
 * useBackgroundControls — gestiona atributos/variables CSS relacionados con el fondo del tablero.
 * Encapsula la lectura inicial del DOM y las funciones de aplicar/toggle para mantener el estado fuente en el DOM.
 */
export function useBackgroundControls(): UseBackgroundControls {
  // Estado persistente en localStorage
  const [bgHidden, setBgHidden] = useLocalStorageBoolean('soluna:bg:hidden', false);
  const [woodHidden, setWoodHidden] = useLocalStorageBoolean('soluna:bg:woodHidden', false);
  const [fullBg, setFullBg] = useLocalStorageBoolean('soluna:bg:full', false);
  const [selectedBgUrl, setSelectedBgUrl] = useLocalStorageState<string | null>('soluna:bg:image', null);
  const [selectedBoardUrl, setSelectedBoardUrl] = useLocalStorageState<string | null>('soluna:board:image', null);

  // Sincroniza atributos/variables CSS con el DOM cuando cambian los estados persistidos
  useEffect(() => {
    const root = document.documentElement;
    if (bgHidden) root.setAttribute('data-hide-board-bg', '1');
    else root.removeAttribute('data-hide-board-bg');
  }, [bgHidden]);

  useEffect(() => {
    const root = document.documentElement;
    if (woodHidden) root.setAttribute('data-hide-wood-board', '1');
    else root.removeAttribute('data-hide-wood-board');
  }, [woodHidden]);

  useEffect(() => {
    const root = document.documentElement;
    if (fullBg) root.setAttribute('data-full-board-bg', '1');
    else root.removeAttribute('data-full-board-bg');
  }, [fullBg]);

  useEffect(() => {
    const root = document.documentElement;
    if (selectedBgUrl) {
      root.style.setProperty('--board-bg-image', `url('${selectedBgUrl}') center / cover no-repeat`);
    } else {
      root.style.removeProperty('--board-bg-image');
    }
  }, [selectedBgUrl]);

  // Imagen/textura del tablero de madera (play-area)
  useEffect(() => {
    const root = document.documentElement;
    if (selectedBoardUrl) {
      root.style.setProperty('--board-wood-image', `url('${selectedBoardUrl}') center / cover no-repeat`);
    } else {
      root.style.removeProperty('--board-wood-image');
    }
  }, [selectedBoardUrl]);

  const applyBoardImage = (url: string | null) => {
    // Actualiza estado persistido; el efecto sincroniza con el DOM
    setSelectedBgUrl(url);
  };

  const applyBoardTexture = (url: string | null) => {
    // Actualiza estado persistido de la textura del tablero
    setSelectedBoardUrl(url);
  };

  const toggleHideBoardBg = () => {
    setBgHidden((prev) => !prev);
  };

  const toggleHideWoodBoard = () => {
    setWoodHidden((prev) => !prev);
  };

  const toggleFullBg = () => {
    setFullBg((prev) => !prev);
  };

  return {
    bgHidden,
    woodHidden,
    fullBg,
    selectedBgUrl,
    selectedBoardUrl,
    applyBoardImage,
    applyBoardTexture,
    toggleHideBoardBg,
    toggleHideWoodBoard,
    toggleFullBg,
  };
}

export default useBackgroundControls;
