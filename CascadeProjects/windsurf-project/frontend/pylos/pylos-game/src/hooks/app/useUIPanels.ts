import { useState, useCallback } from 'react';

export type UIPanels = {
  showTools: boolean;
  toggleTools: () => void;
  showIATools: boolean;
  toggleIATools: () => void;
  showHistory: boolean;
  toggleHistory: () => void;
  showFases: boolean;
  toggleFases: () => void;
  showRules: boolean;
  toggleRules: () => void;
  showInfoIA: boolean;
  toggleInfoIA: () => void;
  showUX: boolean;
  toggleUX: () => void;
};

export function useUIPanels(): UIPanels {
  const [showTools, setShowTools] = useState(false);
  const [showIATools, setShowIATools] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showFases, setShowFases] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showInfoIA, setShowInfoIA] = useState(false);
  const [showUX, setShowUX] = useState(false);

  const toggleTools = useCallback(() => setShowTools((v) => !v), []);
  const toggleIATools = useCallback(() => setShowIATools((v) => !v), []);
  const toggleHistory = useCallback(() => setShowHistory((v) => !v), []);
  const toggleFases = useCallback(() => setShowFases((v) => !v), []);
  const toggleRules = useCallback(() => setShowRules((v) => !v), []);
  const toggleInfoIA = useCallback(() => setShowInfoIA((v) => !v), []);
  const toggleUX = useCallback(() => setShowUX((v) => !v), []);

  return {
    showTools,
    toggleTools,
    showIATools,
    toggleIATools,
    showHistory,
    toggleHistory,
    showFases,
    toggleFases,
    showRules,
    toggleRules,
    showInfoIA,
    toggleInfoIA,
    showUX,
    toggleUX,
  };
}
