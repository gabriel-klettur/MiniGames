/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import IAUserPanel from '../src/components/IAUserPanel/IAUserPanel';

function renderIntoContainer(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

async function flushAll() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe('IAUserPanel difficulty visibility and default behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('when hidden, forces depth to defaultDifficulty on mount and hides selector', async () => {
    localStorage.setItem('soluna:ui:cfg', JSON.stringify({
      showDifficultyInPopovers: false,
      defaultDifficulty: 17,
    }));

    const onChangeDepth = vi.fn();

    const { container, root } = renderIntoContainer(
      <IAUserPanel
        depth={10}
        onChangeDepth={onChangeDepth}
        onAIMove={() => {}}
      />
    );

    await flushAll();
    await flushAll();

    // Depth should be forced to defaultDifficulty (17)
    expect(onChangeDepth).toHaveBeenCalledWith(17);

    // Selector should be hidden
    const select = container.querySelector('#iauser-depth') as HTMLSelectElement | null;
    expect(select).toBeNull();

    root.unmount();
  });

  it('when visible, does not change depth on mount and shows selector', async () => {
    localStorage.setItem('soluna:ui:cfg', JSON.stringify({
      showDifficultyInPopovers: true,
      defaultDifficulty: 19,
    }));

    const onChangeDepth = vi.fn();

    const { container, root } = renderIntoContainer(
      <IAUserPanel
        depth={12}
        onChangeDepth={onChangeDepth}
        onAIMove={() => {}}
      />
    );

    await flushAll();

    // No forced change when visible
    expect(onChangeDepth).not.toHaveBeenCalled();

    // Selector should be visible
    const select = container.querySelector('#iauser-depth') as HTMLSelectElement | null;
    expect(select).not.toBeNull();

    root.unmount();
  });

  it('toggling visibility via cfg-updated event hides selector and applies defaultDifficulty', async () => {
    // Start visible
    localStorage.setItem('soluna:ui:cfg', JSON.stringify({
      showDifficultyInPopovers: true,
      defaultDifficulty: 14,
    }));

    const onChangeDepth = vi.fn();

    const { container, root } = renderIntoContainer(
      <IAUserPanel
        depth={13}
        onChangeDepth={onChangeDepth}
        onAIMove={() => {}}
      />
    );

    await flushAll();

    // Initially selector is visible
    expect(container.querySelector('#iauser-depth')).not.toBeNull();

    // Dispatch config update to hide difficulty and set default to 18
    const ev = new CustomEvent('soluna:ui:cfg-updated', {
      detail: { showDifficultyInPopovers: false, defaultDifficulty: 18 },
    });
    await act(async () => {
      window.dispatchEvent(ev);
    });

    await flushAll();
    await flushAll();

    // Should have applied default and hidden selector
    expect(onChangeDepth).toHaveBeenCalledWith(18);
    expect(container.querySelector('#iauser-depth')).toBeNull();

    root.unmount();
  });
});
