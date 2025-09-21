import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './store/hooks.ts'
import { toggleDarkMode, toggleDevTools, toggleRules, toggleFases, toggleHistory, toggleIA, toggleUX } from './store/uiSlice.ts'
import type { RootState } from './store/index.ts'
import HeaderPanel from './components/HeaderPanel.tsx'
import DevToolsPanel from './components/DevToolsPanel.tsx'
import FootPanel from './components/FootPanel.tsx'
import Board from './components/Board.tsx'
import RulesPanel from './components/RulesPanel.tsx'

function App() {
  const dispatch = useAppDispatch()
  const ui = useAppSelector((s: RootState) => s.ui)
  const { darkMode, showDevTools, showRules, showFases, showHistory, showIA, showUX } = ui

  // Sincroniza la clase `dark` en <html> con el estado global
  useEffect(() => {
    const el = document.documentElement
    el.classList.toggle('dark', darkMode)
  }, [darkMode])

  const onNewGame = () => {
    // TODO: reiniciar estado del juego cuando implementemos el motor
    console.info('Nueva partida (placeholder)')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <HeaderPanel
        title="Quoridor"
        onNewGame={onNewGame}
        onToggleRules={() => dispatch(toggleRules())}
        onToggleDev={() => dispatch(toggleDevTools())}
        showTools={showDevTools}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 grid gap-4 md:grid-cols-12">
        <section className="md:col-span-8 lg:col-span-9 rounded-lg border border-white/10 bg-gray-900/40 p-4">
          <h2 className="text-lg font-medium mb-3">Tablero</h2>
          <Board className="w-full" />
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

      <footer className="border-t border-white/10 bg-gray-900/60">
        <div className="mx-auto max-w-6xl px-4 py-3 text-xs text-gray-400 flex items-center gap-3">
          <span>© {new Date().getFullYear()} Quoridor — Vite + React + TypeScript + Tailwind + Redux</span>
          <button
            className="ml-auto px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-xs"
            onClick={() => dispatch(toggleDarkMode())}
          >
            Tema: {darkMode ? 'Oscuro' : 'Claro'}
          </button>
        </div>
      </footer>
    </div>
  )
}

export default App
