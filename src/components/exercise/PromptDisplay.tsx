import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { colors, spacing } from '../../constants/theme';
import { useTranslation } from 'react-i18next';
import React from 'react';

interface PromptDisplayProps {
  instruction: string;
  promptText: string;
  highlightWord?: string;
  emotion?: string;
}

export function PromptDisplay({
  instruction,
  promptText,
  highlightWord,
  emotion,
}: PromptDisplayProps) {
  const { t } = useTranslation();
  const renderPrompt = () => {
    if (!highlightWord) {
      return (
        <Typography variant="bodyLarge" align="center">
          {promptText}
        </Typography>
      );
    }

    const escaped = highlightWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = promptText.split(new RegExp(`(${escaped})`, 'gi'));
    return (
      <Typography variant="bodyLarge" align="center">
        {parts.map((part, i) =>
          part.toLowerCase() === highlightWord.toLowerCase() ? (
            <Typography
              key={i}
              variant="bodyLarge"
              color={colors.accent}
              style={{ fontWeight: '700' }}
            >
              {part}
            </Typography>
          ) : (
            part
          )
        )}
      </Typography>
    );
  };

  return (
    <Card style={styles.container}>
      {emotion && (
        <View style={styles.emotionBadge}>
          <Typography variant="body" color={colors.accent} style={{ fontWeight: '700' }}>
            {t(`emotions.${emotion}`)}
          </Typography>
        </View>
      )}
      <Typography variant="caption" align="center" style={styles.instruction}>
        {instruction}
      </Typography>
      <View style={styles.promptArea}>{renderPrompt()}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  instruction: {
    marginBottom: spacing.md,
  },
  promptArea: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  emotionBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    marginBottom: spacing.sm,
  },
});
