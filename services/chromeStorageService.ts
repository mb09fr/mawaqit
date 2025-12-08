// Service pour utiliser chrome.storage au lieu de localStorage

export const chromeStorageService = {
  // Sauvegarder des données
  async setItem(key: string, value: any): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ [key]: value });
    } else {
      // Fallback pour le développement local
      console.log(`[chromeStorageService] Saving to localStorage - Key: ${key}, Value:`, value);
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  // Récupérer des données
  async getItem(key: string): Promise<any> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(key);
      return result[key];
    } else {
      // Fallback pour le développement local
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
  },

  // Supprimer des données
  async removeItem(key: string): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.remove(key);
    } else {
      // Fallback pour le développement local
      localStorage.removeItem(key);
    }
  },

  // Effacer tout
  async clear(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.clear();
    } else {
      // Fallback pour le développement local
      localStorage.clear();
    }
  }
};