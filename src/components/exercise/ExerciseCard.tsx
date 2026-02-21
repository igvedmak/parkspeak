import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { colors, spacing, exerciseColors, exerciseColorsLight } from '../../constants/theme';
import { accessibility } from '../../constants/accessibility';
import React from 'react';

type ExerciseColorKey = keyof typeof exerciseColors;

interface ExerciseCardProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
  accentColor?: ExerciseColorKey;
  variant?: 'default' | 'hero';
}

export function ExerciseCard({
  title,
  description,
  icon,
  onPress,
  accentColor,
  variant = 'default',
}: ExerciseCardProps) {
  const color = accentColor ? exerciseColors[accentColor] : colors.accent;
  const colorLight = accentColor ? exerciseColorsLight[accentColor] : colors.accentLight;

  if (variant === 'hero') {
    return (
      <Pressable
        onPress={onPress}
        unstable_pressDelay={accessibility.pressDelay}
        style={({ pressed }) => [pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <Card variant="accent" style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.heroIconContainer}>
              <Typography variant="title">{icon}</Typography>
            </View>
            <View style={styles.heroTextContainer}>
              <Typography variant="subtitle" color={colors.surface}>
                {title}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.8)">
                {description}
              </Typography>
            </View>
            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
          </View>
        </Card>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      unstable_pressDelay={accessibility.pressDelay}
      style={({ pressed }) => [pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Card style={styles.card}>
        <View style={[styles.stripe, { backgroundColor: color }] as ViewStyle[]} />
        <View style={[styles.iconContainer, { backgroundColor: colorLight }]}>
          <Typography variant="title">{icon}</Typography>
        </View>
        <View style={styles.textContainer}>
          <Typography variant="body" style={{ fontWeight: '600' }}>
            {title}
          </Typography>
          <Typography variant="caption">{description}</Typography>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.border} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    overflow: 'hidden',
  },
  heroCard: {
    overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
});
