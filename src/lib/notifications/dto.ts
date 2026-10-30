export interface NotificationSettings {
  configured: boolean;
  publicKey: string | null;
  groupActivity: boolean;
  weeklyReminder: boolean;
  timeZone: string;
  subscribed: boolean;
}
