import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { GameProvider } from './game/store'
import { TokenSetProvider } from './contexts/TokenSetContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider>
      <TokenSetProvider>
        <App />
      </TokenSetProvider>
    </GameProvider>
  </StrictMode>,
)
