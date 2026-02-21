import { useState, useCallback, useRef } from 'react';
import { calculateMouthMetrics, getEmptyMetrics, type MouthMetrics } from '../lib/mouthMetrics';

let mediapipeModule: typeof import('react-native-mediapipe') | null = null;

async function getMediapipe() {
  if (!mediapipeModule) {
    try {
      mediapipeModule = await import('react-native-mediapipe');
    } catch {
      console.warn('[FaceTracking] react-native-mediapipe not available');
      return null;
    }
  }
  return mediapipeModule;
}

// Model asset — bundled with the app
const FACE_LANDMARKER_MODEL = 'face_landmarker.task';

export function useFaceTracking() {
  const [metrics, setMetrics] = useState<MouthMetrics>(getEmptyMetrics());
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const metricsAccumRef = useRef({ sum: 0, count: 0 });

  // Check availability on first call
  const checkAvailability = useCallback(async () => {
    const mp = await getMediapipe();
    setIsAvailable(mp !== null);
    return mp !== null;
  }, []);

  const handleResults = useCallback(
    (result: any) => {
      if (
        !result.results ||
        result.results.length === 0 ||
        result.results[0].faceLandmarks.length === 0
      ) {
        setMetrics(getEmptyMetrics());
        return;
      }

      const landmarks = result.results[0].faceLandmarks[0];
      const m = calculateMouthMetrics(landmarks);
      setMetrics(m);

      if (m.isTracking) {
        metricsAccumRef.current.sum += m.mouthOpening;
        metricsAccumRef.current.count += 1;
      }
    },
    [],
  );

  const handleError = useCallback((error: any) => {
    console.warn('[FaceTracking] Detection error:', error.message);
  }, []);

  const getAverageMouthOpening = useCallback((): number | null => {
    const { sum, count } = metricsAccumRef.current;
    return count > 0 ? sum / count : null;
  }, []);

  const resetAccumulator = useCallback(() => {
    metricsAccumRef.current = { sum: 0, count: 0 };
  }, []);

  return {
    metrics,
    isAvailable,
    checkAvailability,
    handleResults,
    handleError,
    getAverageMouthOpening,
    resetAccumulator,
    modelName: FACE_LANDMARKER_MODEL,
  };
}
