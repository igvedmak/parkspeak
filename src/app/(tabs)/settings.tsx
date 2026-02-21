import { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, TextInput, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, spacing } from '../../constants/theme';
import { accessibility } from '../../constants/accessibility';
import { useSettingsStore } from '../../store/useSettingsStore';
import { setLanguage } from '../../i18n';
import { LANGUAGES, nextLanguage } from '../../constants/languages';
import { requestNotificationPermission, scheduleDailyReminder, cancelReminders } from '../../lib/notifications';
import { getSmartReminderMessage } from '../../lib/reminderMessages';
import React from 'react';

const TIME_OPTIONS = ['07:00', '08:00', '09:00', '10:00', '12:00', '18:00', '20:00'];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const language = useSettingsStore((s) => s.language);
  const setLang = useSettingsStore((s) => s.setLanguage);
  const hearingResult = useSettingsStore((s) => s.hearingResult);
  const hearingTestedAt = useSettingsStore((s) => s.hearingTestedAt);
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey);
  const setOpenaiApiKey = useSettingsStore((s) => s.setOpenaiApiKey);
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const remindersEnabled = useSettingsStore((s) => s.remindersEnabled);
  const setRemindersEnabled = useSettingsStore((s) => s.setRemindersEnabled);
  const reminderTime = useSettingsStore((s) => s.reminderTime);
  const setReminderTime = useSettingsStore((s) => s.setReminderTime);

  const [apiKeyInput, setApiKeyInput] = useState(openaiApiKey);
  const [showApiKey, setShowApiKey] = useState(false);

  const toggleLanguage = () => {
    const next = nextLanguage(language);
    setLang(next);
    setLanguage(next);
  };

  const handleRecalibrate = () => {
    setOnboarded(false);
  };

  const handleSaveApiKey = () => {
    setOpenaiApiKey(apiKeyInput.trim());
  };

  const handleToggleReminders = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      setRemindersEnabled(true);
      const message = await getSmartReminderMessage(t);
      await scheduleDailyReminder(reminderTime, message);
    } else {
      setRemindersEnabled(false);
      await cancelReminders();
    }
  };

  const handleChangeTime = async (time: string) => {
    setReminderTime(time);
    if (remindersEnabled) {
      const message = await getSmartReminderMessage(t);
      await scheduleDailyReminder(time, message);
    }
  };

  const apiKeyStatus = openaiApiKey ? 'connected' : 'missing';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      {/* General section */}
      <Typography variant="overline" color={colors.textSecondary}>
        {t('settings.general')}
      </Typography>

      <SettingsRow
        label={t('settings.language')}
        value={LANGUAGES[language].label}
        onPress={toggleLanguage}
        icon="language-outline"
      />

      <SettingsRow
        label={t('settings.calibrate')}
        value={t('settings.calibrateDesc')}
        onPress={handleRecalibrate}
        icon="mic-outline"
      />

      {/* Reminders */}
      <Typography variant="overline" color={colors.textSecondary} style={styles.sectionHeader}>
        {t('settings.reminders')}
      </Typography>

      <Card style={styles.reminderCard}>
        <View style={styles.reminderRow}>
          <View style={styles.reminderLabel}>
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            <Typography variant="body">{t('settings.reminders')}</Typography>
          </View>
          <Switch
            value={remindersEnabled}
            onValueChange={handleToggleReminders}
            trackColor={{ false: colors.border, true: colors.accent }}
          />
        </View>
        {remindersEnabled && (
          <View style={styles.timeOptions}>
            <Typography variant="caption" color={colors.textSecondary}>
              {t('settings.reminderTime')}
            </Typography>
            <View style={styles.timeRow}>
              {TIME_OPTIONS.map((time) => (
                <Pressable
                  key={time}
                  onPress={() => handleChangeTime(time)}
                  style={[
                    styles.timeChip,
                    time === reminderTime && styles.timeChipActive,
                  ]}
                >
                  <Typography
                    variant="caption"
                    color={time === reminderTime ? colors.surface : colors.textPrimary}
                  >
                    {time}
                  </Typography>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </Card>

      {/* Integration section */}
      <Typography variant="overline" color={colors.textSecondary} style={styles.sectionHeader}>
        {t('settings.integrations')}
      </Typography>

      <Card style={styles.apiKeyCard}>
        <View style={styles.apiKeyHeader}>
          <Ionicons name="key-outline" size={20} color={colors.textPrimary} />
          <Typography variant="body" style={{ flex: 1 }}>{t('settings.apiKey')}</Typography>
          <View style={[styles.statusDot, { backgroundColor: apiKeyStatus === 'connected' ? colors.success : colors.warning }]} />
        </View>
        <Typography variant="caption" color={colors.textSecondary}>
          {t('settings.apiKeyDesc')}
        </Typography>
        <View style={styles.apiKeyRow}>
          <TextInput
            style={styles.apiKeyInput}
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            placeholder="sk-..."
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={!showApiKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable onPress={() => setShowApiKey(!showApiKey)} style={styles.toggleBtn}>
            <Ionicons name={showApiKey ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        {apiKeyInput !== openaiApiKey && (
          <Button title={t('common.save')} onPress={handleSaveApiKey} variant="primary" />
        )}
      </Card>

      <Pressable
        onPress={() => router.push('/hearing-test' as any)}
        unstable_pressDelay={accessibility.pressDelay}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Card style={styles.hearingCard}>
          <View style={styles.hearingRow}>
            <Ionicons name="headset-outline" size={20} color={colors.textPrimary} />
            <View style={styles.hearingInfo}>
              <Typography variant="body">{t('hearing.title')}</Typography>
              <Typography variant="caption" color={colors.textSecondary}>
                {t('hearing.description')}
              </Typography>
              {hearingResult && hearingTestedAt && (
                <Typography
                  variant="caption"
                  color={hearingResult === 'normal' ? colors.success : hearingResult === 'borderline' ? colors.warning : colors.error}
                >
                  {t(`hearing.${hearingResult}`)} — {t('hearing.lastTested', { date: new Date(hearingTestedAt).toLocaleDateString() })}
                </Typography>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </View>
        </Card>
      </Pressable>

      <Card style={styles.aboutCard} variant="flat">
        <Typography variant="caption" align="center" color={colors.textSecondary}>
          {t('settings.about')}
        </Typography>
        <Typography variant="caption" align="center" color={colors.textSecondary}>
          {t('settings.version')} 1.0.0
        </Typography>
      </Card>
    </ScrollView>
  );
}

function SettingsRow({
  label,
  value,
  onPress,
  icon,
}: {
  label: string;
  value: string;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      onPress={onPress}
      unstable_pressDelay={accessibility.pressDelay}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card style={styles.row}>
        <Ionicons name={icon} size={20} color={colors.textPrimary} />
        <View style={styles.rowContent}>
          <Typography variant="body">{label}</Typography>
          <Typography variant="caption" color={colors.textSecondary}>{value}</Typography>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.border} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHeader: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.8,
  },
  aboutCard: {
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  apiKeyCard: {
    gap: spacing.sm,
  },
  apiKeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  apiKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  apiKeyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  toggleBtn: {
    padding: spacing.sm,
  },
  reminderCard: {
    gap: spacing.sm,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timeOptions: {
    gap: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  timeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  hearingCard: {
    gap: spacing.sm,
  },
  hearingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hearingInfo: {
    flex: 1,
    gap: spacing.xs,
  },
});
