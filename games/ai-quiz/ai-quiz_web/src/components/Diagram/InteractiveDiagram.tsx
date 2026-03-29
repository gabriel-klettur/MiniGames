import { useState, useCallback, useEffect, useRef } from 'react';
import type { DiagramSpec } from '../../data/diagrams/types';
import MermaidRenderer from './MermaidRenderer';
import AnimationControls from './AnimationControls';

interface Props {
  diagram: DiagramSpec;
}

const PLAY_INTERVAL = 2500;

export default function InteractiveDiagram({ diagram }: Props) {
  const [svgEl, setSvgEl] = useState<SVGSVGElement | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSvgReady = useCallback((el: SVGSVGElement | null) => {
    setSvgEl(el);
  }, []);

  // Apply highlights when step changes
  useEffect(() => {
    if (!svgEl) return;
    const step = diagram.steps[currentStep];
    if (!step) return;

    // Clear all highlights
    svgEl.querySelectorAll('.diagram-highlight').forEach((el) => {
      el.classList.remove('diagram-highlight');
    });
    svgEl.querySelectorAll('.diagram-highlight-edge').forEach((el) => {
      el.classList.remove('diagram-highlight-edge');
    });

    // Apply node highlights
    for (const nodeId of step.highlightNodes) {
      const node = svgEl.querySelector(`[id*="flowchart-${nodeId}-"]`)
        ?? svgEl.querySelector(`[id*="${nodeId}"]`);
      if (node) node.classList.add('diagram-highlight');
    }

    // Apply edge highlights
    if (step.highlightEdges) {
      for (const edgeId of step.highlightEdges) {
        const edge = svgEl.querySelector(`[id*="${edgeId}"]`);
        if (edge) edge.classList.add('diagram-highlight-edge');
      }
    }
  }, [svgEl, currentStep, diagram.steps]);

  // Attach click handlers for tooltips
  useEffect(() => {
    if (!svgEl || !diagram.nodeTooltips) return;
    const tooltips = diagram.nodeTooltips;

    const handleClick = (e: Event) => {
      const target = (e.currentTarget as Element);
      const nodeId = Object.keys(tooltips).find((id) => {
        return target.id.includes(`flowchart-${id}-`) || target.id.includes(id);
      });

      if (nodeId && tooltips[nodeId] && containerRef.current) {
        const rect = (target as Element).getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        setTooltip({
          text: tooltips[nodeId],
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 8,
        });
      }
    };

    const nodes = svgEl.querySelectorAll('.node') as NodeListOf<SVGGElement>;
    nodes.forEach((node) => {
      (node as unknown as HTMLElement).style.cursor = 'pointer';
      node.addEventListener('click', handleClick);
    });

    return () => {
      nodes.forEach((node) => {
        node.removeEventListener('click', handleClick);
      });
    };
  }, [svgEl, diagram.nodeTooltips]);

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      playRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= diagram.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, PLAY_INTERVAL);
    }
    return () => {
      if (playRef.current) clearInterval(playRef.current);
    };
  }, [isPlaying, diagram.steps.length]);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      if (!prev && currentStep >= diagram.steps.length - 1) {
        setCurrentStep(0);
      }
      return !prev;
    });
  }, [currentStep, diagram.steps.length]);

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
    setIsPlaying(false);
  }, []);

  const dismissTooltip = useCallback(() => setTooltip(null), []);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-3" onClick={dismissTooltip}>
      <MermaidRenderer
        id={diagram.id}
        code={diagram.mermaidCode}
        onSvgReady={handleSvgReady}
      />

      {diagram.steps.length > 0 && (
        <AnimationControls
          steps={diagram.steps}
          currentStep={currentStep}
          isPlaying={isPlaying}
          onStepChange={handleStepChange}
          onTogglePlay={handleTogglePlay}
        />
      )}

      {/* Tooltip popup */}
      {tooltip && (
        <div
          className="diagram-tooltip absolute z-50 max-w-[250px] rounded-lg border border-brand-500/40 bg-gray-900 px-3 py-2 text-xs text-gray-200 shadow-elevated"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {tooltip.text}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
