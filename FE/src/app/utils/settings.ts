// Application Settings Utilities

export interface AppSettings {
  gamificationEnabled: boolean;
  notificationsEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  gamificationEnabled: true,
  notificationsEnabled: true,
};

export function getSettings(): AppSettings {
  const gamification = localStorage.getItem('settings.gamification');
  const notifications = localStorage.getItem('settings.notifications');

  return {
    gamificationEnabled: gamification !== null ? JSON.parse(gamification) : DEFAULT_SETTINGS.gamificationEnabled,
    notificationsEnabled: notifications !== null ? JSON.parse(notifications) : DEFAULT_SETTINGS.notificationsEnabled,
  };
}

export function isGamificationEnabled(): boolean {
  const saved = localStorage.getItem('settings.gamification');
  return saved !== null ? JSON.parse(saved) : DEFAULT_SETTINGS.gamificationEnabled;
}

export function isNotificationsEnabled(): boolean {
  const saved = localStorage.getItem('settings.notifications');
  return saved !== null ? JSON.parse(saved) : DEFAULT_SETTINGS.notificationsEnabled;
}
