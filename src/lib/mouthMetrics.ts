import type { Landmark } from 'react-native-mediapipe';

export interface MouthMetrics {
  mouthOpening: number;      // 0-1 normalized
  lipCompression: number;    // 0-1 normalized
  jawDisplacement: number;   // 0-1 normalized
  isTracking: boolean;
}

export type MouthZone = 'closed' | 'good' | 'wide';

const EMPTY_METRICS: MouthMetrics = {
  mouthOpening: 0,
  lipCompression: 0,
  jawDisplacement: 0,
  isTracking: false,
};

function distance(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// MediaPipe Face Mesh landmark indices for mouth region
const UPPER_LIP_CENTER = 13;
const LOWER_LIP_CENTER = 14;
const LEFT_LIP_CORNER = 61;
const RIGHT_LIP_CORNER = 291;
const FOREHEAD = 10;
const CHIN = 152;
const LEFT_JAW = 172;
const RIGHT_JAW = 397;

export function calculateMouthMetrics(landmarks: Landmark[]): MouthMetrics {
  if (landmarks.length < 468) return EMPTY_METRICS;

  const faceHeight = distance(landmarks[FOREHEAD], landmarks[CHIN]);
  if (faceHeight <= 0) return EMPTY_METRICS;

  const mouthOpening = distance(
    landmarks[UPPER_LIP_CENTER],
    landmarks[LOWER_LIP_CENTER],
  ) / faceHeight;

  const lipCompression = distance(
    landmarks[LEFT_LIP_CORNER],
    landmarks[RIGHT_LIP_CORNER],
  ) / faceHeight;

  const jawLeft = distance(landmarks[LEFT_JAW], landmarks[FOREHEAD]);
  const jawRight = distance(landmarks[RIGHT_JAW], landmarks[FOREHEAD]);
  const jawDisplacement = ((jawLeft + jawRight) / 2) / faceHeight;

  return { mouthOpening, lipCompression, jawDisplacement, isTracking: true };
}

// Thresholds for articulation quality
const MOUTH_OPEN_MIN = 0.04;   // minimum mouth opening for "good"
const MOUTH_OPEN_GREAT = 0.08; // mouth opening for "great"

export function getMouthZone(metrics: MouthMetrics): MouthZone {
  if (metrics.mouthOpening < MOUTH_OPEN_MIN) return 'closed';
  if (metrics.mouthOpening >= MOUTH_OPEN_GREAT) return 'wide';
  return 'good';
}

export function getEmptyMetrics(): MouthMetrics {
  return { ...EMPTY_METRICS };
}
