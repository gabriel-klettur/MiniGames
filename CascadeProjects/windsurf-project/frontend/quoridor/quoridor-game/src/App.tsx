import { useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from './store/hooks.ts'
import { toggleDevTools, toggleRules, toggleFases, toggleHistory, toggleIA, toggleUX } from './store/uiSlice.ts'
import type { RootState } from './store/index.ts'
import { movePawn, newGame, placeWall } from './store/gameSlice.ts'
import HeaderPanel from './components/HeaderPanel.tsx'
import DevToolsPanel from './components/DevToolsPanel.tsx'
import FootPanel from './components/FootPanel.tsx'
import Board from './components/Board.tsx'
import RulesPanel from './components/RulesPanel.tsx'
import InfoPanel from './components/InfoPanel.tsx'
import { legalPawnMoves } from './game/rules.ts'

function App() {
  const dispatch = useAppDispatch()
  const ui = useAppSelector((s: RootState) => s.ui)
  const game = useAppSelector((s: RootState) => s.game)
  const { darkMode, showDevTools, showRules, showFases, showHistory, showIA, showUX } = ui

  // Sincroniza la clase `dark` en <html> con el estado global
  useEffect(() => {
    const el = document.documentElement
    el.classList.toggle('dark', darkMode)
  }, [darkMode])

  const onNewGame = () => {
    dispatch(newGame({ size: 9 }))
  }

  const onCellClick = (row: number, col: number) => {
    dispatch(movePawn({ row, col }))
  }

  const onWallClick = (o: 'H' | 'V', r: number, c: number) => {
    dispatch(placeWall({ o, r, c }))
  }

  const highlightCells = useMemo(() => {
    return legalPawnMoves(game).map((c) => [c.row, c.col] as [number, number])
  }, [game])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <HeaderPanel
        title="Quoridor"
        onNewGame={onNewGame}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 grid gap-4 md:grid-cols-12">
        <section className="md:col-span-8 lg:col-span-9 rounded-lg border border-white/10 bg-gray-900/40 p-4">
          <InfoPanel current={game.current} wallsLeft={game.wallsLeft} className="mb-3" />
          <h2 className="text-lg font-medium mb-3">Tablero</h2>
          <Board
            className="w-full"
            onCellClick={onCellClick}
            onWallClick={onWallClick}
            highlightCells={highlightCells}
            pawns={{
              L: [game.pawns.L.row, game.pawns.L.col],
              D: [game.pawns.D.row, game.pawns.D.col],
            }}
            walls={game.walls}
          />
        </section>

        <aside className="md:col-span-4 lg:col-span-3 space-y-4">
          {showRules && <RulesPanel />}
          {showDevTools && (
            <DevToolsPanel
              onToggleRules={() => dispatch(toggleRules())}
              showFases={showFases}
              onToggleFases={() => dispatch(toggleFases())}
              showHistory={showHistory}
              onToggleHistory={() => dispatch(toggleHistory())}
              showIA={showIA}
              onToggleIA={() => dispatch(toggleIA())}
              showUX={showUX}
              onToggleUX={() => dispatch(toggleUX())}
            />
          )}
        </aside>
      </main>

      <FootPanel showTools={showDevTools} onToggleDev={() => dispatch(toggleDevTools())} />

      {/* Footer eliminado según solicitud: sin texto ni botón de tema */}
    </div>
  )
}

export default App
