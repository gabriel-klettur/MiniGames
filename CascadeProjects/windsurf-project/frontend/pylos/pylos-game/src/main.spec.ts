import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react-dom/client createRoot
const renderSpy = vi.fn();
const createRootSpy = vi.fn(() => ({ render: renderSpy }));
vi.mock('react-dom/client', async () => {
  const actual = await vi.importActual<any>('react-dom/client');
  return { ...actual, createRoot: createRootSpy };
});

describe('main.tsx bootstrap', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    renderSpy.mockClear();
    createRootSpy.mockClear();
  });

  it('mounts App into #root using createRoot', async () => {
    await import('./main');
    const container = document.getElementById('root');
    expect(createRootSpy).toHaveBeenCalledTimes(1);
    expect(createRootSpy).toHaveBeenCalledWith(container);
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });
});
