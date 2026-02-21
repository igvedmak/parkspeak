let Notifications: typeof import('expo-notifications') | null = null;

async function getNotifications() {
  if (!Notifications) {
    try {
      Notifications = await import('expo-notifications');
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch {
      console.warn('[Notifications] Native module not available');
      return null;
    }
  }
  return Notifications;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const N = await getNotifications();
  if (!N) return false;

  const { status: existing } = await N.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await N.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyReminder(time: string, message: string): Promise<void> {
  const N = await getNotifications();
  if (!N) return;

  await cancelReminders();

  const [hours, minutes] = time.split(':').map(Number);

  await N.scheduleNotificationAsync({
    content: {
      title: 'ParkSpeak',
      body: message,
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });
}

export async function cancelReminders(): Promise<void> {
  const N = await getNotifications();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();
}
