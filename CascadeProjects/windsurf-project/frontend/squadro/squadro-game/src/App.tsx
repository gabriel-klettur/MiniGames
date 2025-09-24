import Board from './components/Board';
import HeaderPanel from './components/HeaderPanel';
import InfoPanel from './components/InfoPanel';
import DevToolsPanel from './components/DevTools/DevToolsPanel';
import FootPanel from './components/FootPanel';
import './App.css';

function App() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start gap-6 p-6 bg-[#111827] text-neutral-100">
      <div className="w-full max-w-4xl">
        <HeaderPanel />
      </div>
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-neutral-700 bg-neutral-900/60 p-4">
            <InfoPanel />
          </div>
          <DevToolsPanel />
        </aside>
        <main className="rounded-xl border border-neutral-700 bg-neutral-900/60 p-4 overflow-auto">
          <Board />
        </main>
      </div>
      <footer className="w-full max-w-4xl">
        <FootPanel />
      </footer>
    </div>
  );
}

export default App;
