import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  useSharedValue,
  cancelAnimation,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Typography } from '../ui/Typography';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { accessibility } from '../../constants/accessibility';
import { useTranslation } from 'react-i18next';

interface RecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
}

export function RecordButton({ isRecording, onPress }: RecordButtonProps) {
  const { t } = useTranslation();
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800 }),
          withTiming(1.0, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.pulseRing, isRecording && pulseStyle]}>
        <Pressable
          onPress={onPress}
          unstable_pressDelay={accessibility.pressDelay}
          style={({ pressed }) => [
            styles.button,
            isRecording ? styles.recording : styles.idle,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            isRecording ? t('exercise.tapToStop') : t('exercise.tapToStart')
          }
        >
          <View
            style={[
              styles.innerShape,
              isRecording ? styles.squareShape : styles.circleShape,
            ]}
          />
        </Pressable>
      </Animated.View>
      <Typography variant="caption" align="center" style={styles.label}>
        {isRecording ? t('exercise.recording') : t('exercise.tapToStart')}
      </Typography>
    </View>
  );
}

const BUTTON_SIZE = 80;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  pulseRing: {
    width: BUTTON_SIZE + 24,
    height: BUTTON_SIZE + 24,
    borderRadius: (BUTTON_SIZE + 24) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idle: {
    backgroundColor: colors.error,
  },
  recording: {
    backgroundColor: colors.error,
  },
  pressed: {
    opacity: 0.8,
  },
  innerShape: {
    backgroundColor: colors.surface,
  },
  circleShape: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  squareShape: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  label: {
    marginTop: spacing.xs,
  },
});
