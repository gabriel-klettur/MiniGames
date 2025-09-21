import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { GameState, Coord, Wall, Player } from '../game/types.ts'
import { initialState, applyMovePawn, applyPlaceWall } from '../game/pieces.ts'

const initial: GameState = initialState(9)

const gameSlice = createSlice({
  name: 'game',
  initialState: initial as GameState,
  reducers: {
    newGame: (_state, action: PayloadAction<{ size?: number } | undefined>) => {
      const size = action.payload?.size ?? 9
      return initialState(size)
    },
    movePawn: (state, action: PayloadAction<Coord>) => {
      return applyMovePawn(state, state.current, action.payload)
    },
    placeWall: (state, action: PayloadAction<Wall>) => {
      return applyPlaceWall(state, state.current, action.payload)
    },
    // Utilidad opcional: forzar turno (debug)
    setCurrentPlayer: (state, action: PayloadAction<Player>) => {
      state.current = action.payload
    },
  },
})

export const { newGame, movePawn, placeWall, setCurrentPlayer } = gameSlice.actions
export default gameSlice.reducer
