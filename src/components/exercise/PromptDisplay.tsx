import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { colors, spacing } from '../../constants/theme';
import React from 'react';

interface PromptDisplayProps {
  instruction: string;
  promptText: string;
  highlightWord?: string;
}

export function PromptDisplay({
  instruction,
  promptText,
  highlightWord,
}: PromptDisplayProps) {
  const renderPrompt = () => {
    if (!highlightWord) {
      return (
        <Typography variant="bodyLarge" align="center">
          {promptText}
        </Typography>
      );
    }

    const parts = promptText.split(new RegExp(`(${highlightWord})`, 'gi'));
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
});
