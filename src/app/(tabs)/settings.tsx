import { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, spacing } from '../../constants/theme';
import { accessibility } from '../../constants/accessibility';
import { useSettingsStore } from '../../store/useSettingsStore';
import { setLanguage } from '../../i18n';
import React from 'react';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const language = useSettingsStore((s) => s.language);
  const setLang = useSettingsStore((s) => s.setLanguage);
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey);
  const setOpenaiApiKey = useSettingsStore((s) => s.setOpenaiApiKey);

  const [apiKeyInput, setApiKeyInput] = useState(openaiApiKey);
  const [showApiKey, setShowApiKey] = useState(false);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'he' : 'en';
    setLang(newLang);
    setLanguage(newLang);
  };

  const handleSaveApiKey = () => {
    setOpenaiApiKey(apiKeyInput.trim());
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      <SettingsRow
        label={t('settings.language')}
        value={language === 'en' ? 'English' : 'עברית'}
        onPress={toggleLanguage}
      />

      <SettingsRow
        label={t('settings.calibrate')}
        value={t('settings.calibrateDesc')}
        onPress={() => {}}
      />

      {/* OpenAI API Key */}
      <Card style={styles.apiKeyCard}>
        <Typography variant="body">OpenAI API Key</Typography>
        <Typography variant="caption" color={colors.textSecondary}>
          Required for speech recognition. Get a key at platform.openai.com
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
            <Typography variant="caption">
              {showApiKey ? 'Hide' : 'Show'}
            </Typography>
          </Pressable>
        </View>
        {apiKeyInput !== openaiApiKey && (
          <Button title="Save" onPress={handleSaveApiKey} variant="primary" />
        )}
        {openaiApiKey ? (
          <Typography variant="caption" color={colors.success}>
            API key saved
          </Typography>
        ) : (
          <Typography variant="caption" color={colors.warning}>
            No API key set — speech scoring disabled
          </Typography>
        )}
      </Card>

      <Card style={styles.aboutCard}>
        <Typography variant="caption" align="center">
          {t('settings.about')}
        </Typography>
        <Typography variant="caption" align="center">
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
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      unstable_pressDelay={accessibility.pressDelay}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card style={styles.row}>
        <Typography variant="body">{label}</Typography>
        <Typography variant="caption">{value}</Typography>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});
