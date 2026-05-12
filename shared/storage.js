// chrome.storage.local wrapper for settings persistence
export class StorageManager {
  static STORAGE_KEY = 'axiom_settings';

  static getDefaultSettings() {
    return {
      preset: 'Intermediate 12-16 Years Old',
      wpm: 40,
      accuracy: 88,
      correctionSpeed: 1.0,
      breakFrequency: 25,
      breakMin: 1.0,
      breakMax: 2.0,
      skipStartConfirmation: false,
    };
  }

  static async getSettings() {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      return result[this.STORAGE_KEY] || this.getDefaultSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      return this.getDefaultSettings();
    }
  }

  static async saveSettings(settings) {
    try {
      await chrome.storage.local.set({
        [this.STORAGE_KEY]: settings,
      });
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  static async clearSettings() {
    try {
      await chrome.storage.local.remove(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear settings:', error);
      return false;
    }
  }
}
