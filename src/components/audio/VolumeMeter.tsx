import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useDerivedValue,
} from 'react-native-reanimated';
import { Typography } from '../ui/Typography';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { loudnessRatio, loudnessToVisual, getVolumeZone, type VolumeZone } from '../../lib/audio';
import { useSessionStore } from '../../store/useSessionStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTranslation } from 'react-i18next';
import React from 'react';

const ZONE_COLORS: Record<VolumeZone, string> = {
  quiet: colors.error,
  good: colors.success,
  loud: colors.warning,
};

const BAR_HEIGHT = 32;
const TARGET_MIN = 1.5;
const TARGET_MAX = 3.0;
const MAX_RATIO = 4.0;

export function VolumeMeter() {
  const { t } = useTranslation();
  const currentRms = useSessionStore((s) => s.currentRms);
  const baselineRms = useSettingsStore((s) => s.baselineRms);

  const ratio = baselineRms ? loudnessRatio(currentRms, baselineRms) : 0;
  const fillPct = loudnessToVisual(ratio, MAX_RATIO);
  const zone = getVolumeZone(ratio, TARGET_MIN, TARGET_MAX);

  const fillWidth = useDerivedValue(() => fillPct * 100);

  const animatedFill = useAnimatedStyle(() => ({
    width: `${withSpring(fillWidth.value, { damping: 15, stiffness: 120 })}%`,
  }));

  const targetLeftPct = (TARGET_MIN / MAX_RATIO) * 100;
  const targetWidthPct = ((TARGET_MAX - TARGET_MIN) / MAX_RATIO) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Typography variant="caption">{t('exercise.volume')}</Typography>
        <Typography
          variant="caption"
          color={ZONE_COLORS[zone]}
          style={{ fontWeight: '600' }}
        >
          {zone === 'quiet'
            ? t('exercise.tooQuiet')
            : zone === 'good'
              ? t('exercise.goodVolume')
              : ''}
        </Typography>
      </View>

      <View style={styles.track}>
        {/* Target zone indicator */}
        <View
          style={[
            styles.targetZone,
            { left: `${targetLeftPct}%`, width: `${targetWidthPct}%` },
          ]}
        />
        {/* Fill bar */}
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: ZONE_COLORS[zone] },
            animatedFill,
          ]}
        />
      </View>

      <View style={styles.labelRow}>
        <Typography variant="caption">
          {ratio > 0 ? `${ratio.toFixed(1)}x` : '—'}
        </Typography>
        <Typography variant="caption">
          {t('exercise.target')}: {TARGET_MIN}x – {TARGET_MAX}x
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: BAR_HEIGHT,
    backgroundColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  targetZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.successLight,
    opacity: 0.5,
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: borderRadius.md,
  },
});
