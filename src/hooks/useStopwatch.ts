import { useState, useRef, useCallback, useEffect } from 'react';

export function useStopwatch() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    cleanup();
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [cleanup]);

  const stop = useCallback((): number => {
    cleanup();
    setIsRunning(false);
    let final = 0;
    setElapsedSeconds((prev) => { final = prev; return prev; });
    return final;
  }, [cleanup]);

  const resetStopwatch = useCallback(() => {
    cleanup();
    setIsRunning(false);
    setElapsedSeconds(0);
  }, [cleanup]);

  useEffect(() => cleanup, [cleanup]);

  return { elapsedSeconds, isRunning, start, stop, reset: resetStopwatch };
}
