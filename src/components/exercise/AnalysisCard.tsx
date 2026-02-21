import { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { accessibility } from '../../constants/accessibility';
import { useTranslation } from 'react-i18next';
import { type WordResult, getPronunciationTip } from '../../lib/scoring';
import { speakWord, speakSentence, stopSpeech } from '../../lib/speech';
import React from 'react';

interface AnalysisCardProps {
  wordResults: WordResult[];
  recognizedText: string;
  targetText: string;
}

export function AnalysisCard({ wordResults, recognizedText, targetText }: AnalysisCardProps) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const missedResults = wordResults.filter((w) => !w.matched);
  if (missedResults.length === 0) return null;

  useEffect(() => {
    return () => { stopSpeech(); };
  }, []);

  const handleCollapse = () => {
    stopSpeech();
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <Button
        title={t('exercise.showAnalysis')}
        onPress={() => setExpanded(true)}
        variant="outline"
      />
    );
  }

  return (
    <Card style={styles.container}>
      <Typography variant="title" align="center">
        {t('exercise.analysisTitle')}
      </Typography>

      {targetText.length > 0 && (
        <Pressable
          style={styles.hearSentenceButton}
          onPress={() => speakSentence(targetText, i18n.language)}
          accessibilityRole="button"
          accessibilityLabel={t('exercise.hearSentence')}
        >
          <Ionicons name="volume-high-outline" size={20} color={colors.accent} />
          <Typography variant="body" color={colors.accent} style={styles.hearSentenceText}>
            {t('exercise.hearSentence')}
          </Typography>
        </Pressable>
      )}

      <View style={styles.wordGrid}>
        {wordResults.map((result, index) => (
          <Pressable
            key={index}
            style={[
              styles.wordChip,
              { backgroundColor: result.matched ? colors.successLight : colors.errorLight },
            ]}
            onPress={result.matched ? undefined : () => speakWord(result.targetWord, i18n.language)}
            disabled={result.matched}
            accessibilityRole={result.matched ? 'text' : 'button'}
            accessibilityLabel={
              result.matched
                ? result.targetWord
                : t('exercise.tapToHearWord', { word: result.targetWord })
            }
          >
            <Typography
              variant="body"
              color={result.matched ? colors.success : colors.error}
              style={styles.wordText}
            >
              {result.targetWord}
            </Typography>
            {!result.matched && (
              <Ionicons
                name="volume-medium-outline"
                size={18}
                color={colors.error}
                style={styles.wordIcon}
              />
            )}
          </Pressable>
        ))}
      </View>

      {recognizedText.length > 0 && (
        <View>
          <Typography variant="caption" color={colors.textSecondary}>
            {t('exercise.weHeard')}
          </Typography>
          <Typography variant="body">"{recognizedText}"</Typography>
        </View>
      )}

      <View style={styles.tipsSection}>
        <Typography variant="caption" color={colors.textSecondary}>
          {t('exercise.tips')}
        </Typography>
        {missedResults.map((result, index) => (
          <Pressable
            key={index}
            style={styles.tipRow}
            onPress={() => speakWord(result.targetWord, i18n.language)}
            accessibilityRole="button"
          >
            <View style={styles.tipContent}>
              <Typography variant="body" style={styles.tipText}>
                {getPronunciationTip(result.targetWord, i18n.language)}
              </Typography>
              <Ionicons name="volume-medium-outline" size={18} color={colors.accent} />
            </View>
          </Pressable>
        ))}
      </View>

      <Button
        title={t('exercise.hideAnalysis')}
        onPress={handleCollapse}
        variant="outline"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  hearSentenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accentLight,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accentLight,
    minHeight: accessibility.minTouchTarget,
  },
  hearSentenceText: {
    fontWeight: '600',
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minHeight: accessibility.minTouchTarget,
  },
  wordText: {
    fontWeight: '600',
  },
  wordIcon: {
    marginStart: spacing.xs,
  },
  tipsSection: {
    gap: spacing.sm,
  },
  tipRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: accessibility.minTouchTarget,
    justifyContent: 'center',
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipText: {
    flex: 1,
  },
});
