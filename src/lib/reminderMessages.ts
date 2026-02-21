import type { TFunction } from 'i18next';
import { getCurrentStreak } from './database';

export async function getSmartReminderMessage(t: TFunction): Promise<string> {
  try {
    const streak = await getCurrentStreak();
    if (streak >= 3) {
      return t('reminders.streak', { days: streak });
    }
  } catch {}

  return t('reminders.default');
}
