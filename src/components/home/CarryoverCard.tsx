import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { getTodayChallenge } from '../../data/carryover-challenges';
import { getTodayCarryover, saveCarryoverCompletion } from '../../lib/database';
import { colors, spacing } from '../../constants/theme';
import React from 'react';

export function CarryoverCard() {
  const { t } = useTranslation();
  const [completed, setCompleted] = useState(false);

  const challenge = getTodayChallenge();

  useEffect(() => {
    getTodayCarryover().then((record) => {
      if (record?.completed) setCompleted(true);
    });
  }, []);

  const handleMarkDone = () => {
    setCompleted(true);
    saveCarryoverCompletion(challenge.id).catch((e) =>
      console.error('[DB] Failed to save carryover:', e)
    );
  };

  return (
    <Card style={styles.container}>
      <Typography variant="body" style={styles.title}>
        {t('carryover.title')}
      </Typography>
      <Typography variant="body" color={colors.textSecondary}>
        {t(challenge.i18nKey)}
      </Typography>
      {completed ? (
        <Typography variant="body" color={colors.success} style={styles.done}>
          {t('carryover.completed')}
        </Typography>
      ) : (
        <Button
          title={t('carryover.markDone')}
          onPress={handleMarkDone}
          variant="outline"
          style={styles.button}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  title: {
    fontWeight: '600',
  },
  done: {
    fontWeight: '600',
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
});
