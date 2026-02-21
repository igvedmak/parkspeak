/**
 * Convert RMS amplitude (0..1) to decibels relative to full scale (dBFS).
 * Returns a value between -100 (silence) and 0 (max).
 */
export function rmsToDbfs(rms: number): number {
  if (rms <= 0) return -100;
  return 20 * Math.log10(rms);
}

/**
 * Calculate a loudness ratio relative to a baseline RMS value.
 * Returns how many times louder the current signal is vs baseline.
 * A value of 2.0 means "twice as loud as baseline".
 */
export function loudnessRatio(currentRms: number, baselineRms: number): number {
  if (baselineRms <= 0) return 0;
  return currentRms / baselineRms;
}

/**
 * Map a loudness ratio to a 0..1 range for visual display.
 * The target zone is typically 1.5x-3x the baseline.
 * Clamps at 4x for the visual max.
 */
export function loudnessToVisual(ratio: number, maxRatio: number = 4): number {
  return Math.min(ratio / maxRatio, 1);
}

/**
 * Determine the volume zone for color feedback.
 */
export type VolumeZone = 'quiet' | 'good' | 'loud';

export function getVolumeZone(
  ratio: number,
  targetMin: number = 1.5,
  targetMax: number = 3.0
): VolumeZone {
  if (ratio < targetMin) return 'quiet';
  if (ratio > targetMax) return 'loud';
  return 'good';
}

/**
 * Format seconds into M:SS display.
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
