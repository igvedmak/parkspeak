import { Pressable, View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { colors, spacing } from '../../constants/theme';
import { accessibility } from '../../constants/accessibility';
import React from 'react';

interface ExerciseCardProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}

export function ExerciseCard({
  title,
  description,
  icon,
  onPress,
}: ExerciseCardProps) {
  return (
    <Pressable
      onPress={onPress}
      unstable_pressDelay={accessibility.pressDelay}
      style={({ pressed }) => [pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Card style={styles.card}>
        <View style={styles.iconContainer}>
          <Typography variant="title">{icon}</Typography>
        </View>
        <View style={styles.textContainer}>
          <Typography variant="body" style={{ fontWeight: '600' }}>
            {title}
          </Typography>
          <Typography variant="caption">{description}</Typography>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
});
