import { useEffect, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from './store/hooks.ts'
import { toggleDevTools, toggleRules, toggleFases, toggleHistory, toggleIA, toggleUX } from './store/uiSlice.ts'
import type { RootState } from './store/index.ts'
import { movePawn, newGame, placeWall } from './store/gameSlice.ts'
import HeaderPanel from './components/HeaderPanel.tsx'
import DevToolsPanel from './components/DevTools/DevToolsPanel.tsx'
import FootPanel from './components/FootPanel.tsx'
import Board from './components/Board.tsx'
import RulesPanel from './components/DevTools/RulesPanel.tsx'
import UIUX from './components/DevTools/UIUX.tsx'
import InfoPanel from './components/InfoPanel.tsx'
import { legalPawnMoves, goalRow } from './game/rules.ts'
import GameOverModal from './components/GameOverModal.tsx'
import IAUserPanel from './components/IA/IAUserPanel.tsx'
import IAPanel from './components/IA/IAPanel.tsx'

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

  // Detección de puntero "coarse" (móvil/tablet)
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const update = () => setIsCoarsePointer(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])

  // Modo de interacción para móvil/tablet: 'move' | 'wall'
  const [inputMode, setInputMode] = useState<'move' | 'wall'>('move')
  const toggleInputMode = () => setInputMode((m) => (m === 'move' ? 'wall' : 'move'))

  // Visibilidad del panel de IA para el usuario (por defecto oculto)
  const [showIAUserPanel, setShowIAUserPanel] = useState<boolean>(false)

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

  // ¿Hay ganador? Un jugador gana al alcanzar su fila objetivo
  const winner = useMemo(() => {
    const size = game.size
    if (game.pawns.L.row === goalRow(size, 'L')) return 'L' as const
    if (game.pawns.D.row === goalRow(size, 'D')) return 'D' as const
    return null
  }, [game])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-x-hidden">
      <HeaderPanel
        title="Quoridor"
        onNewGame={onNewGame}
        onToggleIAUser={() => setShowIAUserPanel((v) => !v)}
        showIAUser={showIAUserPanel}
      />

      <main className="mx-auto max-w-6xl w-full px-4 py-6 grid grid-cols-1 gap-4 md:grid-cols-12">
        <section className="col-span-1 md:col-span-12 w-full">          
          {showIAUserPanel && <IAUserPanel />}          
          <InfoPanel current={game.current} wallsLeft={game.wallsLeft} className="mb-3" />          
          <Board
            className="w-full max-w-[48rem] mx-auto mt-3"
            onCellClick={onCellClick}
            onWallClick={onWallClick}
            highlightCells={highlightCells}
            inputMode={inputMode}
            onToggleInputMode={toggleInputMode}
            isCoarsePointer={isCoarsePointer}
            wallGap={ui.wallGap}
            warp={ui.boardWarp}
            pawns={{
              L: [game.pawns.L.row, game.pawns.L.col],
              D: [game.pawns.D.row, game.pawns.D.col],
            }}
            walls={game.walls}
          />
          {/* Área de paneles debajo del tablero */}
          <div className="mt-4 space-y-4">
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
            {showFases && (
              <section className="rounded-lg border border-white/10 bg-gray-900/50 p-4">
                <h3 className="text-sm font-semibold mb-2">Fases (vista de desarrollo)</h3>
                <p className="text-xs text-gray-300">Placeholder de panel de fases. Integra visualizaciones y ayudas de depuración aquí.</p>
              </section>
            )}
            {showHistory && (
              <section className="rounded-lg border border-white/10 bg-gray-900/50 p-4">
                <h3 className="text-sm font-semibold mb-2">Historial (vista de desarrollo)</h3>
                <p className="text-xs text-gray-300">Placeholder de historial de movimientos/acciones.</p>
              </section>
            )}
            {showIA && <IAPanel />}
            {showUX && <UIUX />}
          </div>
        </section>
      </main>

      <FootPanel showTools={showDevTools} onToggleDev={() => dispatch(toggleDevTools())} />

      {/* Modal de fin de partida */}
      {winner && (
        <GameOverModal
          message={`¡Ganador: ${winner === 'L' ? 'Claras' : 'Oscuras'} (${winner}) — alcanzó la meta!`}
          onConfirm={onNewGame}
        />
      )}

      {/* Footer eliminado según solicitud: sin texto ni botón de tema */}
    </div>
  )
}

export default App
