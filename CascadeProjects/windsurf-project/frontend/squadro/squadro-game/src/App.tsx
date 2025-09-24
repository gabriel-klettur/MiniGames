import Board from './components/Board';
import HeaderPanel from './components/HeaderPanel';
import InfoPanel from './components/InfoPanel';
import DevToolsPanel from './components/DevTools/DevToolsPanel';
import FootPanel from './components/FootPanel';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-x-hidden">
      <div className="w-full px-[10px]">
        <HeaderPanel />
      </div>
      {/* Full-width play area with exact 10px side margins (no horizontal overflow) */}
      <div className="w-full px-[10px] flex flex-col gap-4 overflow-x-hidden">
        {/* InfoPanel above the board */}
        <div className=" p-4">
          <InfoPanel />
        </div>
        <main className="w-full overflow-x-hidden">
          <Board />
        </main>
        {/* DevTools placed directly below the board */}
        <DevToolsPanel />
      </div>
      <footer className="w-full max-w-4xl">
        <FootPanel />
      </footer>
    </div>
  );
}

export default App;
