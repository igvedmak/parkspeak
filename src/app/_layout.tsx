import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { colors } from '../constants/theme';
import { useSettingsStore } from '../store/useSettingsStore';
import { setLanguage } from '../i18n';
import { scheduleDailyReminder } from '../lib/notifications';
import { getSmartReminderMessage } from '../lib/reminderMessages';
import { useTranslation } from 'react-i18next';
import React from 'react';

function useOnboardingGuard() {
  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait one tick for the navigation tree to mount
    const timeout = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const isOnboarding = segments[0] === 'onboarding';

    if (!hasOnboarded && !isOnboarding) {
      router.replace('/onboarding');
    } else if (hasOnboarded && isOnboarding) {
      router.replace('/');
    }
  }, [hasOnboarded, segments, router, isReady]);
}

export default function RootLayout() {
  useOnboardingGuard();

  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const remindersEnabled = useSettingsStore((s) => s.remindersEnabled);
  const reminderTime = useSettingsStore((s) => s.reminderTime);

  useEffect(() => {
    setLanguage(language);
  }, [language]);

  // Refresh notification with latest smart message on launch
  useEffect(() => {
    if (!remindersEnabled) return;
    getSmartReminderMessage(t).then((message) => {
      scheduleDailyReminder(reminderTime, message);
    });
  }, [remindersEnabled, reminderTime]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={colors.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
