export function getTargetDifficulty(avgAccuracy: number | null): number {
  if (avgAccuracy === null) return 1;
  if (avgAccuracy >= 90) return 3;
  if (avgAccuracy >= 70) return 2;
  return 1;
}
