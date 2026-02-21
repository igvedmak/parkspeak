import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  hasOnboarded: boolean;
  language: 'en' | 'he';
  baselineRms: number | null;
  targetMultiplier: number;
  textSizeScale: number;
  remindersEnabled: boolean;
  reminderTime: string;
  openaiApiKey: string;

  setOnboarded: (value: boolean) => void;
  setLanguage: (lang: 'en' | 'he') => void;
  setBaselineRms: (rms: number) => void;
  setTargetMultiplier: (multiplier: number) => void;
  setTextSizeScale: (scale: number) => void;
  setRemindersEnabled: (enabled: boolean) => void;
  setReminderTime: (time: string) => void;
  setOpenaiApiKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      language: 'en',
      baselineRms: null,
      targetMultiplier: 2.0,
      textSizeScale: 1.0,
      remindersEnabled: false,
      reminderTime: '09:00',
      openaiApiKey: '',

      setOnboarded: (value) => set({ hasOnboarded: value }),
      setLanguage: (lang) => set({ language: lang }),
      setBaselineRms: (rms) => set({ baselineRms: rms }),
      setTargetMultiplier: (multiplier) => set({ targetMultiplier: multiplier }),
      setTextSizeScale: (scale) => set({ textSizeScale: scale }),
      setRemindersEnabled: (enabled) => set({ remindersEnabled: enabled }),
      setReminderTime: (time) => set({ reminderTime: time }),
      setOpenaiApiKey: (key) => set({ openaiApiKey: key }),
    }),
    {
      name: 'parkspeak-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
