import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import InfoPanel from './InfoPanel';
import HeaderPanel from './HeaderPanel';
import FootPanel from './FootPanel';
import GameOverModal from './GameOverModal';
import RulesPanel from './DevTools/RulesPanel/RulesPanel';
import MoveLog from './MoveLog';
import DevToolsPanel from './DevTools/DevToolsPanel';
import UXPanel from './DevTools/UXPanel/UXPanel';
import IAUserPanel from './IAUserPanel';
import IAPanel from './DevTools/IAPanel/index';
import { initialState } from '../game/rules';

const noop = () => {};

describe('components – SSR smoke tests', () => {
  it('InfoPanel renders reserve counts and current player piece', () => {
    const s = initialState();
    const html = renderToString(
      <InfoPanel state={s} aiEnemy={null} aiLastMove={null} aiThinking={false} />
    );
    expect(html).toContain(String(s.reserves.L));
    expect(html).toContain(String(s.reserves.D));
  });

  it('HeaderPanel renders basic actions', () => {
    const html = renderToString(
      <HeaderPanel onNewGame={noop} showTools={false} onToggleDev={noop} showIA={false} showIAToggle={true} />
    );
    expect(html).toContain('Nueva partida');
  });

  it('FootPanel toggles active class when showTools', () => {
    const html1 = renderToString(<FootPanel showTools={false} onToggleDev={noop} />);
    const html2 = renderToString(<FootPanel showTools={true} onToggleDev={noop} />);
    expect(html1).not.toContain('is-active');
    expect(html2).toContain('is-active');
  });

  it('GameOverModal shows message and OK button', () => {
    const html = renderToString(<GameOverModal message="Ganador: Humano" onConfirm={noop} />);
    expect(html).toContain('Ganador: Humano');
    expect(html).toContain('OK');
  });

  it('RulesPanel renders rules list', () => {
    const html = renderToString(<RulesPanel />);
    expect(html).toContain('Reglas clave');
  });

  it('MoveLog groups duplicate moves', () => {
    const html = renderToString(
      <MoveLog moves={[
        { player: 'L', source: 'PLAYER', text: 'colocar 0-0-0' },
        { player: 'L', source: 'PLAYER', text: 'colocar 0-0-0' },
        { player: 'D', source: 'IA', text: 'colocar 0-0-1' },
      ]} />
    );
    // Expect a compacted count marker for duplicates: find the moves__count span and verify it's 2
    expect(html).toContain('moves__count');
    const m = html.match(/class=\"moves__count\"[^>]*>(.*?)<\/span>/);
    expect(m).toBeTruthy();
    const text = (m ? m[1] : '').replace(/[^0-9]/g, '');
    expect(text).toBe('2');
  });

  it('DevToolsPanel renders IA and UX sections when toggled', () => {
    const html = renderToString(
      <DevToolsPanel
        onToggleRules={noop}
        showIA={true}
        onToggleIA={noop}
        iaPanel={<div id="ia-panel-slot">IA SLOT</div>}
        showHistory={true}
        onToggleHistory={noop}
        fullWidth={true}
        showFases={true}
        onToggleFases={noop}
        showUX={true}
        onToggleUX={noop}
        uxPanel={<div id="ux-panel-slot">UX SLOT</div>}
      />
    );
    expect(html).toContain('IA SLOT');
    expect(html).toContain('UX SLOT');
  });

  it('UXPanel SSR renders tabs and controls', () => {
    const html = renderToString(
      <UXPanel
        noShadeL0={false}
        noShadeL1={false}
        noShadeL2={false}
        noShadeL3={false}
        onChangeNoShade={noop as any}
        shadeOnlyAvailable={true}
        onToggleShadeOnlyAvailable={noop as any}
        shadeOnlyHoles={false}
        onToggleShadeOnlyHoles={noop as any}
        holeBorders={false}
        onToggleHoleBorders={noop as any}
        pieceScale={1.55}
        onChangePieceScale={noop as any}
        appearMs={280}
        flashMs={900}
        flyMs={900}
        onChangeAppearMs={noop as any}
        onChangeFlashMs={noop as any}
        onChangeFlyMs={noop as any}
        autoFillDelayMs={250}
        onChangeAutoFillDelayMs={noop as any}
      />
    );
    expect(html).toContain('Opciones UI/UX');
  });

  it('IAUserPanel SSR renders controls', () => {
    const html = renderToString(
      <IAUserPanel depth={3} onChangeDepth={noop} onAIMove={noop} disabled={false} aiAutoplayActive={false} />
    );
    expect(html).toContain('Dificultad');
  });

  it('IAPanel SSR renders KPIs and controls', () => {
    const s = initialState();
    const html = renderToString(
      <IAPanel
        state={s}
        depth={3}
        onChangeDepth={noop}
        onAIMove={noop}
        disabled={false}
        timeMode={'manual'}
        timeSeconds={5}
        onChangeTimeMode={noop as any}
        onChangeTimeSeconds={noop as any}
        busy={false}
        progress={null}
        evalScore={0}
        depthReached={3}
        pv={[]}
        rootMoves={[]}
        nodes={0}
        elapsedMs={0}
        nps={0}
        iaConfig={{ quiescence: true, qDepthMax: 2, qNodeCap: 24, futilityMargin: 100, bookEnabled: true, bookUrl: '/aperturas_book.json' }}
        onChangeIaConfig={noop as any}
      />
    );
    expect(html).toContain('Inteligencia Artificial');
  });
});
