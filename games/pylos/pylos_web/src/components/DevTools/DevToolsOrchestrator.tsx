import React from 'react';
import DevToolsPanel from './DevToolsPanel';

type Props = {
  showTools: boolean;
  // Toggles and flags
  toggleRules: () => void;
  showIATools: boolean;
  toggleIATools: () => void;
  showInfoIA: boolean;
  toggleInfoIA: () => void;
  showHistory: boolean;
  toggleHistory: () => void;
  showFases: boolean;
  toggleFases: () => void;
  showUX: boolean;
  toggleUX: () => void;
  // Panels
  iaPanel: React.ReactNode;
  infoIAPanel: React.ReactNode;
  uxPanel: React.ReactNode;
};

export default function DevToolsOrchestrator(props: Props) {
  const {
    showTools,
    toggleRules,
    showIATools, toggleIATools,
    showInfoIA, toggleInfoIA,
    showHistory, toggleHistory,
    showFases, toggleFases,
    showUX, toggleUX,
    iaPanel, infoIAPanel, uxPanel,
  } = props;

  if (!showTools) return null;

  return (
    <DevToolsPanel
      onToggleRules={toggleRules}
      showIA={showIATools}
      onToggleIA={toggleIATools}
      showInfoIA={showInfoIA}
      onToggleInfoIA={toggleInfoIA}
      showHistory={showHistory}
      onToggleHistory={toggleHistory}
      showFases={showFases}
      onToggleFases={toggleFases}
      showUX={showUX}
      onToggleUX={toggleUX}
      fullWidth
      iaPanel={iaPanel}
      infoIAPanel={infoIAPanel}
      uxPanel={uxPanel}
    />
  );
}
