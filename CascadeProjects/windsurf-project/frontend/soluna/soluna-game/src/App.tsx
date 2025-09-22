import './App.css';
import HeaderPanel from './components/HeaderPanel';
import Board from './components/Board';
import FootPanel from './components/FootPanel';
import DevToolsPanel from './components/DevTools/DevToolsPanel';

function App() {
  return (
    <div className="app-layout">
      <HeaderPanel />
      <main className="main-area">
        <Board />
        <DevToolsPanel />
      </main>
      <FootPanel />
    </div>
  );
}

export default App
