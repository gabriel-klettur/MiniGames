import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { MERMAID_CONFIG } from '../../utils/mermaidConfig';

interface Props {
  id: string;
  code: string;
  onSvgReady?: (svgEl: SVGSVGElement | null) => void;
}

type MermaidModule = typeof import('mermaid');
let mermaidPromise: Promise<MermaidModule> | null = null;
let mermaidInitialized = false;
const svgCache = new Map<string, string>();

function loadMermaid(): Promise<MermaidModule> {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid');
  }
  return mermaidPromise;
}

function MermaidRenderer({ id, code, onSvgReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const render = useCallback(async () => {
    const cacheKey = `${id}:${code}`;
    const cached = svgCache.get(cacheKey);
    if (cached && containerRef.current) {
      containerRef.current.innerHTML = cached;
      setLoading(false);
      const svg = containerRef.current.querySelector('svg');
      onSvgReady?.(svg);
      return;
    }

    try {
      const mermaidModule = await loadMermaid();
      const mermaid = mermaidModule.default;

      if (!mermaidInitialized) {
        mermaid.initialize(MERMAID_CONFIG);
        mermaidInitialized = true;
      }

      const rendererId = `mermaid-${id}-${Date.now()}`;
      const { svg } = await mermaid.render(rendererId, code);

      svgCache.set(cacheKey, svg);

      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
        const svgEl = containerRef.current.querySelector('svg');
        if (svgEl) {
          svgEl.style.maxWidth = '100%';
          svgEl.style.height = 'auto';
        }
        onSvgReady?.(svgEl);
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'render-error');
      setLoading(false);
    }
  }, [id, code, onSvgReady]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    render();
  }, [render]);

  if (error) {
    return (
      <div className="rounded-lg border border-error-500/30 bg-error-500/5 p-3 text-xs text-error-400">
        {error}
      </div>
    );
  }

  return (
    <div className="diagram-container relative">
      {loading && (
        <div className="flex items-center justify-center rounded-lg border border-gray-700 bg-gray-800/30 p-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span className="ml-3 text-sm text-gray-400">Loading...</span>
        </div>
      )}
      <div
        ref={containerRef}
        className={`diagram-svg overflow-x-auto ${loading ? 'hidden' : 'animate-slide-up'}`}
      />
    </div>
  );
}

export default memo(MermaidRenderer);
