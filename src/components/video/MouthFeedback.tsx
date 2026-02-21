import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { type MouthMetrics, getMouthZone, type MouthZone } from '../../lib/mouthMetrics';
import { useTranslation } from 'react-i18next';
import React from 'react';

interface MouthFeedbackProps {
  metrics: MouthMetrics;
}

const ZONE_COLORS: Record<MouthZone, string> = {
  closed: colors.error,
  good: colors.success,
  wide: colors.success,
};

const ZONE_KEYS: Record<MouthZone, string> = {
  closed: 'camera.openWider',
  good: 'camera.goodMovement',
  wide: 'camera.great',
};

export function MouthFeedback({ metrics }: MouthFeedbackProps) {
  const { t } = useTranslation();

  if (!metrics.isTracking) {
    return (
      <View style={styles.container}>
        <Typography variant="caption" color={colors.textSecondary}>
          {t('camera.noFace')}
        </Typography>
      </View>
    );
  }

  const zone = getMouthZone(metrics);
  const zoneColor = ZONE_COLORS[zone];
  const fillWidth = Math.min(metrics.mouthOpening / 0.10, 1); // normalize to 0-1 for display

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Typography variant="caption" color={colors.textSecondary}>
          {t('camera.mouth')}
        </Typography>
        <Typography variant="caption" color={zoneColor} style={styles.label}>
          {t(ZONE_KEYS[zone])}
        </Typography>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.round(fillWidth * 100)}%`,
              backgroundColor: zoneColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
  },
  barTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
});
