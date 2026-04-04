import { useEffect } from 'react';
import { useAppStore } from '../store';

export function useTimer() {
  const activeSession = useAppStore((s) => s.activeSession);
  const tickSession = useAppStore((s) => s.tickSession);

  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      tickSession();
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.taskId, tickSession]);
}
