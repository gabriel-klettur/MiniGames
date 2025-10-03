import React, { createContext, useContext } from 'react';
import useTokenSetControls, { type UseTokenSetControls } from '../hooks/useTokenSetControls';

const TokenSetContext = createContext<UseTokenSetControls | null>(null);

export function TokenSetProvider({ children }: { children: React.ReactNode }) {
  const controls = useTokenSetControls();
  return <TokenSetContext.Provider value={controls}>{children}</TokenSetContext.Provider>;
}

export function useTokenSet(): UseTokenSetControls {
  const ctx = useContext(TokenSetContext);
  if (!ctx) throw new Error('useTokenSet must be used within a TokenSetProvider');
  return ctx;
}
