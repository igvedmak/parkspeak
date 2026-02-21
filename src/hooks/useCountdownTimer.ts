import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCountdownTimerOptions {
  durationSeconds: number;
  onComplete?: () => void;
}

export function useCountdownTimer({ durationSeconds, onComplete }: UseCountdownTimerOptions) {
  const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

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
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          cleanup();
          setIsRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [cleanup]);

  const pause = useCallback(() => {
    cleanup();
    setIsRunning(false);
  }, [cleanup]);

  const resetTimer = useCallback(() => {
    cleanup();
    setIsRunning(false);
    setSecondsRemaining(durationSeconds);
  }, [cleanup, durationSeconds]);

  useEffect(() => cleanup, [cleanup]);

  const progress = durationSeconds > 0 ? 1 - secondsRemaining / durationSeconds : 0;

  return { secondsRemaining, isRunning, start, pause, reset: resetTimer, progress };
}
