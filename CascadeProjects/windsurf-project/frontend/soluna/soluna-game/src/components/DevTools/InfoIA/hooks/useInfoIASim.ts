import { useState } from 'react';

export function useInfoIASim(_opts: any) {
  const [running, setRunning] = useState(false);
  const start = async (_args?: any) => { setRunning(true); };
  const stop = () => setRunning(false);
  return { running, start, stop, moveIndex: 0, moveElapsedMs: 0, moveTargetMs: 0 };
}
