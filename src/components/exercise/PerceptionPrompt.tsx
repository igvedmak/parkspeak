import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { colors, spacing } from '../../constants/theme';
import { useTranslation } from 'react-i18next';
import { type Perception } from '../../lib/database';
import React from 'react';

interface PerceptionPromptProps {
  onSelect: (perception: Perception) => void;
}

export function PerceptionPrompt({ onSelect }: PerceptionPromptProps) {
  const { t } = useTranslation();

  return (
    <Card style={styles.container}>
      <Typography variant="title" align="center">
        {t('exercise.howLoud')}
      </Typography>
      <View style={styles.buttons}>
        <Button
          title={t('exercise.perceptionQuiet')}
          onPress={() => onSelect('quiet')}
          variant="outline"
          style={styles.button}
        />
        <Button
          title={t('exercise.perceptionRight')}
          onPress={() => onSelect('right')}
          variant="primary"
          style={styles.button}
        />
        <Button
          title={t('exercise.perceptionLoud')}
          onPress={() => onSelect('loud')}
          variant="outline"
          style={styles.button}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  buttons: {
    gap: spacing.md,
  },
  button: {
    minHeight: 56,
  },
});
