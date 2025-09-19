import { useCallback, useMemo, useReducer } from 'react';
import type { Cell } from '../game/types';
import { reducer } from '../game/state/reducer';
import { createInitialState } from '../game/state/types';
import * as selectors from '../game/state/selectors';

/**
 * Hook controlador para el estado del juego Pylos con reducer puro.
 * Expone acciones de alto nivel y datos derivados para la UI.
 */
export function usePylosGame(initialExpert: boolean = true) {
  const [state, dispatch] = useReducer(reducer, undefined, () => createInitialState(initialExpert));

  const place = useCallback((cell: Cell) => {
    dispatch({ type: 'PLACE', cell });
  }, []);

  const climb = useCallback((src: Cell, dst: Cell) => {
    dispatch({ type: 'CLIMB', src, dst });
  }, []);

  const remove = useCallback((cell: Cell) => {
    dispatch({ type: 'REMOVE', cell });
  }, []);

  const finishRemoval = useCallback(() => {
    dispatch({ type: 'FINISH_REMOVAL' });
  }, []);

  const reset = useCallback((expertMode?: boolean) => {
    dispatch({ type: 'RESET', expertMode });
  }, []);

  const setExpertMode = useCallback((on: boolean) => {
    dispatch({ type: 'SET_EXPERT_MODE', value: on });
  }, []);

  // Derivados útiles
  const statusText = useMemo(() => selectors.statusText(state), [state]);
  const canFinishRemoval = useMemo(() => selectors.canFinishRemoval(state), [state]);
  const reserves = useMemo(() => ({ p1: selectors.reserveRemaining(state, 1), p2: selectors.reserveRemaining(state, 2) }), [state]);

  return {
    state,
    dispatch, // expuesto por si se requiere, pero preferir acciones
    place,
    climb,
    remove,
    finishRemoval,
    reset,
    setExpertMode,
    statusText,
    canFinishRemoval,
    reserves,
  } as const;
}
