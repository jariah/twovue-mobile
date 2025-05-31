import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PLAYER_NAME: 'twovue_name',
  GAME_IDS: 'twovue_game_ids',
};

export class Storage {
  static async getPlayerName(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
    } catch (error) {
      console.error('Error getting player name:', error);
      return null;
    }
  }

  static async setPlayerName(name: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
    } catch (error) {
      console.error('Error setting player name:', error);
    }
  }

  static async getGameIds(): Promise<string[]> {
    try {
      const ids = await AsyncStorage.getItem(STORAGE_KEYS.GAME_IDS);
      return ids ? JSON.parse(ids) : [];
    } catch (error) {
      console.error('Error getting game IDs:', error);
      return [];
    }
  }

  static async addGameId(gameId: string): Promise<void> {
    try {
      const ids = await this.getGameIds();
      if (!ids.includes(gameId)) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.GAME_IDS,
          JSON.stringify([gameId, ...ids])
        );
      }
    } catch (error) {
      console.error('Error adding game ID:', error);
    }
  }
} 