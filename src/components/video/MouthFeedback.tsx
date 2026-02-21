import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
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
  const animatedWidth = useSharedValue(0);

  const zone = metrics.isTracking ? getMouthZone(metrics) : 'closed';
  const zoneColor = ZONE_COLORS[zone];
  const fillWidth = metrics.isTracking ? Math.min(metrics.mouthOpening / 0.10, 1) : 0;

  useEffect(() => {
    animatedWidth.value = withSpring(fillWidth, { damping: 15, stiffness: 120 });
  }, [fillWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.round(animatedWidth.value * 100)}%`,
  }));

  if (!metrics.isTracking) {
    return (
      <View style={styles.container}>
        <Typography variant="caption" color={colors.textSecondary}>
          {t('camera.noFace')}
        </Typography>
      </View>
    );
  }

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
        <Animated.View
          style={[
            styles.barFill,
            { backgroundColor: zoneColor },
            fillStyle,
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
    height: 10,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
});
