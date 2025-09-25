import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import FlyingPiece from './FlyingPiece';

const rect = (l=10, t=10, w=20, h=20) => ({ left: l, top: t, width: w, height: h });

// Ensure requestAnimationFrame exists
if (!(globalThis as any).requestAnimationFrame) {
  (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 0) as unknown as number;
}

describe('components/FlyingPiece', () => {
  it('renders portal and calls onDone after transitionend', async () => {
    const rootEl = document.createElement('div');
    document.body.appendChild(rootEl);
    const root = createRoot(rootEl);

    const onDone = vi.fn();
    root.render(<FlyingPiece from={rect()} to={rect(50, 50)} imgSrc="/x.png" durationMs={0} onDone={onDone} />);

    // The element should be portaled into document.body
    const el = await new Promise<HTMLElement>((resolve) => {
      const tryFind = () => {
        const found = document.querySelector('.flying-piece') as HTMLElement | null;
        if (found) return resolve(found);
        setTimeout(tryFind, 0);
      };
      tryFind();
    });

    // Fire transitionend to complete animation
    el.dispatchEvent(new Event('transitionend', { bubbles: true }));

    // Let React process the event
    await new Promise((r) => setTimeout(r, 0));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
