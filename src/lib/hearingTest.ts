export interface TripleTrial {
  digits: [number, number, number];
  snrDb: number;
  response: [number, number, number] | null;
  correct: boolean | null;
}

export type HearingResult = 'normal' | 'borderline' | 'refer';

export interface HearingTestState {
  trials: TripleTrial[];
  currentSNR: number;
  stepSize: number;
  reversalCount: number;
  lastDirection: 1 | -1 | null;
  phase: 'instructions' | 'ambient_check' | 'running' | 'complete';
  result: HearingResult | null;
  srtDb: number | null;
}

export const TOTAL_TRIPLETS = 23;
const WARMUP_TRIPLETS = 4;
const INITIAL_SNR = 4;
const INITIAL_STEP = 4;
const FINAL_STEP = 2;

export function createInitialState(): HearingTestState {
  return {
    trials: [],
    currentSNR: INITIAL_SNR,
    stepSize: INITIAL_STEP,
    reversalCount: 0,
    lastDirection: null,
    phase: 'instructions',
    result: null,
    srtDb: null,
  };
}

export function generateTriplet(exclude?: [number, number, number]): [number, number, number] {
  const digits: number[] = [];
  while (digits.length < 3) {
    const d = Math.floor(Math.random() * 10);
    if (!digits.includes(d)) {
      if (exclude && digits.length === 0 && d === exclude[0]) continue;
      digits.push(d);
    }
  }
  return digits as [number, number, number];
}

export function scoreTrial(
  state: HearingTestState,
  response: [number, number, number],
): HearingTestState {
  const currentTrial = state.trials[state.trials.length - 1];
  if (!currentTrial || currentTrial.response !== null) return state;

  const allCorrect =
    response[0] === currentTrial.digits[0] &&
    response[1] === currentTrial.digits[1] &&
    response[2] === currentTrial.digits[2];

  const direction: 1 | -1 = allCorrect ? -1 : 1;
  const isReversal = state.lastDirection !== null && direction !== state.lastDirection;
  const newReversalCount = state.reversalCount + (isReversal ? 1 : 0);
  const newStepSize = newReversalCount >= 1 ? FINAL_STEP : state.stepSize;

  const updatedTrial: TripleTrial = {
    ...currentTrial,
    response,
    correct: allCorrect,
  };

  const updatedTrials = [...state.trials.slice(0, -1), updatedTrial];
  const nextSNR = state.currentSNR + direction * newStepSize;

  const isComplete = updatedTrials.length >= TOTAL_TRIPLETS;

  if (isComplete) {
    const srt = calculateSRT(updatedTrials);
    return {
      ...state,
      trials: updatedTrials,
      currentSNR: nextSNR,
      stepSize: newStepSize,
      reversalCount: newReversalCount,
      lastDirection: direction,
      phase: 'complete',
      srtDb: srt,
      result: classifyResult(srt),
    };
  }

  return {
    ...state,
    trials: updatedTrials,
    currentSNR: nextSNR,
    stepSize: newStepSize,
    reversalCount: newReversalCount,
    lastDirection: direction,
  };
}

export function addNextTrial(state: HearingTestState): HearingTestState {
  const triplet = generateTriplet(
    state.trials.length > 0
      ? state.trials[state.trials.length - 1].digits
      : undefined,
  );
  return {
    ...state,
    trials: [
      ...state.trials,
      {
        digits: triplet,
        snrDb: state.currentSNR,
        response: null,
        correct: null,
      },
    ],
  };
}

function calculateSRT(trials: TripleTrial[]): number {
  const scored = trials.slice(WARMUP_TRIPLETS);
  if (scored.length === 0) return 0;
  const sum = scored.reduce((acc, t) => acc + t.snrDb, 0);
  return sum / scored.length;
}

function classifyResult(srt: number): HearingResult {
  if (srt <= -5.5) return 'normal';
  if (srt <= -2.8) return 'borderline';
  return 'refer';
}
