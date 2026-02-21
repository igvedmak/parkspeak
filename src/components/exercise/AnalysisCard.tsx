import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { useTranslation } from 'react-i18next';
import { type WordResult, getPronunciationTip } from '../../lib/scoring';
import React from 'react';

interface AnalysisCardProps {
  wordResults: WordResult[];
  recognizedText: string;
}

export function AnalysisCard({ wordResults, recognizedText }: AnalysisCardProps) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const missedResults = wordResults.filter((w) => !w.matched);
  if (missedResults.length === 0) return null;

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

      <View style={styles.wordGrid}>
        {wordResults.map((result, index) => (
          <View
            key={index}
            style={[
              styles.wordChip,
              { backgroundColor: result.matched ? colors.successLight : colors.errorLight },
            ]}
          >
            <Typography
              variant="body"
              color={result.matched ? colors.success : colors.error}
              style={{ fontWeight: '600' }}
            >
              {result.targetWord}
            </Typography>
          </View>
        ))}
      </View>

      {recognizedText.length > 0 && (
        <View>
          <Typography variant="caption" color={colors.textSecondary}>
            {i18n.language === 'he' ? ':שמענו' : 'We heard:'}
          </Typography>
          <Typography variant="body">"{recognizedText}"</Typography>
        </View>
      )}

      <View style={styles.tipsSection}>
        <Typography variant="caption" color={colors.textSecondary}>
          {t('exercise.tips')}
        </Typography>
        {missedResults.map((result, index) => (
          <View key={index} style={styles.tipRow}>
            <Typography variant="body">
              {getPronunciationTip(result.targetWord, i18n.language)}
            </Typography>
          </View>
        ))}
      </View>

      <Button
        title={t('exercise.hideAnalysis')}
        onPress={() => setExpanded(false)}
        variant="outline"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  wordChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  tipsSection: {
    gap: spacing.sm,
  },
  tipRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
