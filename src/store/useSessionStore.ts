import { create } from 'zustand';

interface SessionState {
  isRecording: boolean;
  currentRms: number;
  currentPitch: number;
  recordingDuration: number;
  audioUri: string | null;

  setRecording: (value: boolean) => void;
  setCurrentRms: (rms: number) => void;
  setCurrentPitch: (pitch: number) => void;
  setRecordingDuration: (duration: number) => void;
  setAudioUri: (uri: string | null) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isRecording: false,
  currentRms: 0,
  currentPitch: 0,
  recordingDuration: 0,
  audioUri: null,

  setRecording: (value) => set({ isRecording: value }),
  setCurrentRms: (rms) => set({ currentRms: rms }),
  setCurrentPitch: (pitch) => set({ currentPitch: pitch }),
  setRecordingDuration: (duration) => set({ recordingDuration: duration }),
  setAudioUri: (uri) => set({ audioUri: uri }),
  reset: () =>
    set({
      isRecording: false,
      currentRms: 0,
      currentPitch: 0,
      recordingDuration: 0,
      audioUri: null,
    }),
}));
